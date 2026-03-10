import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, jobs } from "@repo/database";
import { createBackgroundRemovalPrediction, downloadPredictionOutput, runBackgroundRemoval, type ReplicatePredictionPayload } from "../ai-provider/replicate";
import { getReplicateConfig, getServerAuthBaseUrl } from "../env";
import { logger } from "../logger";
import { assertSafeWebhookUrl } from "../security/safe-webhook-url";
import { readToolAsset, storeToolAsset } from "../storage";

const providerAttempts = getReplicateConfig()?.attempts ?? 3;
const providerRetryDelayMs = getReplicateConfig()?.retryDelayMs ?? 1500;

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJobMetadata(value: string | null) {
    if (!value) {
        return {};
    }

    try {
        return JSON.parse(value) as Record<string, unknown>;
    } catch {
        return {};
    }
}

async function executeWithRetry<T>(task: (attempt: number) => Promise<T>) {
    let lastError: unknown;

    for (let attempt = 1; attempt <= providerAttempts; attempt += 1) {
        try {
            return await task(attempt);
        } catch (error) {
            lastError = error;

            if (attempt === providerAttempts) {
                break;
            }

            await sleep(providerRetryDelayMs * attempt);
        }
    }

    throw lastError;
}

async function updateJobMetadata(jobId: string, metadata: Record<string, unknown>) {
    await db
        .update(jobs)
        .set({
            metadata: JSON.stringify(metadata),
        })
        .where(eq(jobs.id, jobId));
}

function buildClientWebhookHeaders(params: {
    event: string;
    payload: string;
    secret: string | null;
}) {
    const timestamp = new Date().toISOString();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "CutBackground-Webhooks/1.0",
        "X-CutBackground-Event": params.event,
        "X-CutBackground-Timestamp": timestamp,
    };

    if (params.secret) {
        const signature = createHmac("sha256", params.secret)
            .update(`${timestamp}.${params.payload}`)
            .digest("hex");

        headers["X-CutBackground-Signature"] = signature;
    }

    return headers;
}

async function deliverClientWebhook(job: typeof jobs.$inferSelect, params: { status: string; outputUrl: string | null; errorMessage: string | null }) {
    const metadata = parseJobMetadata(job.metadata);
    const webhookUrl = typeof metadata.clientWebhookUrl === "string" ? metadata.clientWebhookUrl : null;
    const webhookSecret =
        typeof metadata.clientWebhookSecret === "string" ? metadata.clientWebhookSecret : null;

    if (!webhookUrl) {
        return;
    }

    await assertSafeWebhookUrl(webhookUrl);

    const event = "background_remover.job.completed";
    const payload = {
        event: "background_remover.job.completed",
        job: {
            id: job.id,
            status: params.status,
            provider: job.provider,
            providerJobId: job.providerJobId,
            modelUsed: job.modelUsed,
            outputUrl: params.outputUrl
                ? `${getServerAuthBaseUrl().replace(/\/$/, "")}/api/v1/background-remover/jobs/${job.id}/output`
                : null,
            errorMessage: params.errorMessage,
            createdAt: job.createdAt.toISOString(),
            completedAt: new Date().toISOString(),
        },
    };
    const payloadText = JSON.stringify(payload);
    const maxAttempts = 3;
    const deliveryAttempts = Array.isArray(metadata.clientWebhookAttempts)
        ? [...metadata.clientWebhookAttempts]
        : [];

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: buildClientWebhookHeaders({
                    event,
                    payload: payloadText,
                    secret: webhookSecret,
                }),
                body: payloadText,
            });

            deliveryAttempts.push({
                attempt,
                status: response.status,
                deliveredAt: new Date().toISOString(),
            });

            if (!response.ok) {
                throw new Error(`Webhook delivery failed with status ${response.status}.`);
            }

            await updateJobMetadata(job.id, {
                ...metadata,
                clientWebhookDeliveredAt: new Date().toISOString(),
                clientWebhookStatus: response.status,
                clientWebhookAttempts: deliveryAttempts,
                clientWebhookLastEvent: event,
            });

            return;
        } catch (error) {
            deliveryAttempts.push({
                attempt,
                status: "failed",
                deliveredAt: new Date().toISOString(),
                error: error instanceof Error ? error.message : "Unknown webhook delivery error",
            });

            if (attempt < maxAttempts) {
                await sleep(500 * attempt);
                continue;
            }

            await updateJobMetadata(job.id, {
                ...metadata,
                clientWebhookFailedAt: new Date().toISOString(),
                clientWebhookError:
                    error instanceof Error ? error.message : "Unknown webhook delivery error",
                clientWebhookAttempts: deliveryAttempts,
                clientWebhookLastEvent: event,
            });
        }
    }
}

function getOutputStorageKey(job: typeof jobs.$inferSelect) {
    return `background-remover/${job.userId}/${job.id}/output.png`;
}

async function finalizeToolJobSuccess(
    job: typeof jobs.$inferSelect,
    params: {
        bytes: Buffer;
        contentType: string;
        providerJobId: string;
        providerStatus: string;
        providerVersion: string | null | undefined;
        provider: string;
        model: string;
        logs: string | null;
        metrics: Record<string, unknown> | null;
        startedAt: string | null;
        completedAt: string | null;
        outputSourceUrl?: string | null;
    }
) {
    const metadata = parseJobMetadata(job.metadata);
    const outputRef = await storeToolAsset({
        key: getOutputStorageKey(job),
        body: params.bytes,
        contentType: params.contentType,
    });

    const [updatedJob] = await db
        .update(jobs)
        .set({
            status: "succeeded",
            provider: params.provider,
            providerJobId: params.providerJobId,
            modelUsed: params.model,
            outputUrl: outputRef,
            completedAt: new Date(),
            errorMessage: null,
            metadata: JSON.stringify({
                ...metadata,
                workerStartedAt: metadata.workerStartedAt ?? new Date().toISOString(),
                providerAttempts:
                    typeof metadata.providerAttempt === "number"
                        ? metadata.providerAttempt
                        : providerAttempts,
                providerStatus: params.providerStatus,
                providerVersion: params.providerVersion ?? null,
                providerLogs: params.logs,
                providerMetrics: params.metrics,
                providerStartedAt: params.startedAt,
                providerCompletedAt: params.completedAt,
                providerOutputUrl: params.outputSourceUrl ?? null,
            }),
        })
        .where(eq(jobs.id, job.id))
        .returning();

    if (updatedJob) {
        await deliverClientWebhook(updatedJob, {
            status: "succeeded",
            outputUrl: outputRef,
            errorMessage: null,
        });
    }
}

async function finalizeToolJobFailure(
    job: typeof jobs.$inferSelect,
    params: {
        errorMessage: string;
        status?: "failed" | "canceled";
        providerStatus?: string | null;
        logs?: string | null;
        metrics?: Record<string, unknown> | null;
        completedAt?: string | null;
    }
) {
    const metadata = parseJobMetadata(job.metadata);
    const nextStatus = params.status ?? "failed";

    const [updatedJob] = await db
        .update(jobs)
        .set({
            status: nextStatus,
            errorMessage: params.errorMessage,
            completedAt: new Date(),
            metadata: JSON.stringify({
                ...metadata,
                workerStartedAt: metadata.workerStartedAt ?? new Date().toISOString(),
                providerAttempts:
                    typeof metadata.providerAttempt === "number"
                        ? metadata.providerAttempt
                        : providerAttempts,
                providerStatus: params.providerStatus ?? nextStatus,
                providerLogs: params.logs ?? null,
                providerMetrics: params.metrics ?? null,
                providerCompletedAt: params.completedAt ?? new Date().toISOString(),
                lastFailureAt: new Date().toISOString(),
            }),
        })
        .where(eq(jobs.id, job.id))
        .returning();

    if (updatedJob) {
        await deliverClientWebhook(updatedJob, {
            status: nextStatus,
            outputUrl: null,
            errorMessage: params.errorMessage,
        });
    }
}

function shouldUseWebhookFlow() {
    return Boolean(getReplicateConfig()?.webhookSecret);
}

export async function processToolJobExecution(jobId: string) {
    const job = await db.query.jobs.findFirst({
        where: (table, { eq: equals }) => equals(table.id, jobId),
    });

    if (!job) {
        throw new Error(`Tool job ${jobId} not found.`);
    }

    if (!job.userId) {
        throw new Error(`Tool job ${jobId} has no associated user.`);
    }

    if (job.status === "canceled") {
        logger.info({ jobId }, "Skipping canceled tool job.");
        return;
    }

    const metadata = parseJobMetadata(job.metadata);
    const workerMetadata: Record<string, unknown> = {
        ...metadata,
        workerStartedAt: new Date().toISOString(),
    };

    await db
        .update(jobs)
        .set({
            status: "processing",
            provider: "replicate",
            metadata: JSON.stringify(workerMetadata),
        })
        .where(eq(jobs.id, jobId));

    try {
        const inputAsset = await readToolAsset(job.inputUrl);
        const filename = job.inputUrl.split("/").pop() || `${job.id}.png`;

        if (shouldUseWebhookFlow()) {
            const prediction = await executeWithRetry(async (attempt) => {
                await updateJobMetadata(jobId, {
                    ...workerMetadata,
                    providerAttempt: attempt,
                });

                return createBackgroundRemovalPrediction({
                    image: inputAsset.body,
                    filename,
                    webhook: true,
                });
            });

            await db
                .update(jobs)
                .set({
                    status: "processing",
                    provider: "replicate",
                    providerJobId: prediction.id,
                    modelUsed: getReplicateConfig()?.model ?? null,
                    metadata: JSON.stringify({
                        ...workerMetadata,
                        providerAttempt:
                            typeof workerMetadata.providerAttempt === "number"
                                ? workerMetadata.providerAttempt
                                : 1,
                        providerStatus: prediction.status,
                        providerVersion: prediction.version ?? null,
                        providerRequestedAt: new Date().toISOString(),
                    }),
                })
                .where(eq(jobs.id, jobId));

            return;
        }

        const result = await executeWithRetry(async (attempt) => {
            await updateJobMetadata(jobId, {
                ...workerMetadata,
                providerAttempt: attempt,
            });

            return runBackgroundRemoval({
                image: inputAsset.body,
                filename,
            });
        });

        await finalizeToolJobSuccess(job, result);
    } catch (error) {
        logger.error(
            {
                jobId,
                error: error instanceof Error ? error.message : "Unknown tool worker failure",
            },
            "Tool worker failed to process job."
        );

        await finalizeToolJobFailure(job, {
            errorMessage:
                error instanceof Error
                    ? error.message
                    : "Provider execution failed for this job.",
        });

        throw error;
    }
}

export async function completeToolJobFromReplicateWebhook(prediction: ReplicatePredictionPayload) {
    const job = await db.query.jobs.findFirst({
        where: (table, { eq: equals }) => equals(table.providerJobId, prediction.id),
    });

    if (!job) {
        return false;
    }

    if (job.status === "succeeded" || job.status === "failed" || job.status === "canceled") {
        return true;
    }

    if (prediction.status === "succeeded") {
        const output = await downloadPredictionOutput(prediction.output);

        await finalizeToolJobSuccess(job, {
            provider: "replicate",
            model: job.modelUsed || getReplicateConfig()?.model || "replicate",
            providerJobId: prediction.id,
            providerStatus: prediction.status,
            providerVersion: prediction.version,
            logs: prediction.logs || null,
            metrics: prediction.metrics || null,
            startedAt: prediction.started_at || null,
            completedAt: prediction.completed_at || null,
            outputSourceUrl: output.outputUrl,
            bytes: output.bytes,
            contentType: output.contentType,
        });

        return true;
    }

    await finalizeToolJobFailure(job, {
        status: prediction.status === "canceled" ? "canceled" : "failed",
        errorMessage: prediction.error || `Replicate prediction ended with status ${prediction.status}.`,
        providerStatus: prediction.status,
        logs: prediction.logs || null,
        metrics: prediction.metrics || null,
        completedAt: prediction.completed_at || null,
    });

    return true;
}
