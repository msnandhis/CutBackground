import { eq } from "drizzle-orm";
import { db, jobs } from "@repo/database";
import { createBackgroundRemovalPrediction, downloadPredictionOutput, runBackgroundRemoval, type ReplicatePredictionPayload } from "../ai-provider/replicate";
import { getReplicateConfig, getServerAuthBaseUrl } from "../env";
import { logger } from "../logger";
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

async function deliverClientWebhook(job: typeof jobs.$inferSelect, params: { status: string; outputUrl: string | null; errorMessage: string | null }) {
    const metadata = parseJobMetadata(job.metadata);
    const webhookUrl = typeof metadata.clientWebhookUrl === "string" ? metadata.clientWebhookUrl : null;

    if (!webhookUrl) {
        return;
    }

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

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const nextMetadata = {
            ...metadata,
            clientWebhookDeliveredAt: new Date().toISOString(),
            clientWebhookStatus: response.status,
        };

        await updateJobMetadata(job.id, nextMetadata);
    } catch (error) {
        const nextMetadata = {
            ...metadata,
            clientWebhookFailedAt: new Date().toISOString(),
            clientWebhookError:
                error instanceof Error ? error.message : "Unknown webhook delivery error",
        };

        await updateJobMetadata(job.id, nextMetadata);
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
