import { eq } from "drizzle-orm";
import { db, jobs } from "@repo/database";
import { getReplicateConfig } from "../env";
import { logger } from "../logger";
import { runBackgroundRemoval } from "../ai-provider/replicate";
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

    await db
        .update(jobs)
        .set({
            status: "processing",
            provider: "replicate",
            metadata: JSON.stringify({
                ...metadata,
                workerStartedAt: new Date().toISOString(),
            }),
        })
        .where(eq(jobs.id, jobId));

    try {
        const inputAsset = await readToolAsset(job.inputUrl);
        const filename = job.inputUrl.split("/").pop() || `${job.id}.png`;
        const result = await executeWithRetry(async (attempt) => {
            await db
                .update(jobs)
                .set({
                    metadata: JSON.stringify({
                        ...metadata,
                        workerStartedAt: metadata.workerStartedAt ?? new Date().toISOString(),
                        providerAttempt: attempt,
                    }),
                })
                .where(eq(jobs.id, jobId));

            return runBackgroundRemoval({
                image: inputAsset.body,
                filename,
            });
        });

        const outputRef = await storeToolAsset({
            key: `background-remover/${job.userId}/${job.id}/output.png`,
            body: result.bytes,
            contentType: result.contentType,
        });

        await db
            .update(jobs)
            .set({
                status: "succeeded",
                provider: result.provider,
                providerJobId: result.providerJobId,
                modelUsed: result.model,
                outputUrl: outputRef,
                completedAt: new Date(),
                errorMessage: null,
                metadata: JSON.stringify({
                    ...metadata,
                    workerStartedAt: metadata.workerStartedAt ?? new Date().toISOString(),
                    providerAttempt: providerAttempts,
                    providerStatus: result.providerStatus,
                    providerVersion: result.providerVersion,
                    providerLogs: result.logs,
                    providerMetrics: result.metrics,
                    providerStartedAt: result.startedAt,
                    providerCompletedAt: result.completedAt,
                }),
            })
            .where(eq(jobs.id, jobId));
    } catch (error) {
        logger.error(
            {
                jobId,
                error: error instanceof Error ? error.message : "Unknown tool worker failure",
            },
            "Tool worker failed to process job."
        );

        await db
            .update(jobs)
            .set({
                status: "failed",
                errorMessage:
                    error instanceof Error
                        ? error.message
                        : "Provider execution failed for this job.",
                completedAt: new Date(),
                metadata: JSON.stringify({
                    ...metadata,
                    workerStartedAt: metadata.workerStartedAt ?? new Date().toISOString(),
                    providerAttempts,
                    lastFailureAt: new Date().toISOString(),
                }),
            })
            .where(eq(jobs.id, jobId));

        throw error;
    }
}
