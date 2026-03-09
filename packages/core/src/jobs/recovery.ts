import { and, eq } from "drizzle-orm";
import { db, jobs } from "@repo/database";

const defaultStaleThresholdSeconds = 15 * 60;

function parseMetadata(value: string | null) {
    if (!value) {
        return {};
    }

    try {
        return JSON.parse(value) as Record<string, unknown>;
    } catch {
        return {};
    }
}

function getStaleThresholdSeconds() {
    const configured = Number(process.env.TOOL_STALE_JOB_THRESHOLD_SECONDS || defaultStaleThresholdSeconds);
    return Number.isFinite(configured) && configured > 0 ? configured : defaultStaleThresholdSeconds;
}

function getProcessingStartedAt(metadata: Record<string, unknown>) {
    const value =
        typeof metadata.providerRequestedAt === "string"
            ? metadata.providerRequestedAt
            : metadata.workerStartedAt;

    if (typeof value !== "string") {
        return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getStaleJobAgeSeconds(
    metadata: Record<string, unknown>,
    now = Date.now()
) {
    const startedAt = getProcessingStartedAt(metadata);

    if (!startedAt) {
        return null;
    }

    return Math.floor((now - startedAt.getTime()) / 1000);
}

export async function recoverStaleToolJobs() {
    const thresholdSeconds = getStaleThresholdSeconds();
    const thresholdMs = thresholdSeconds * 1000;
    const processingJobs = await db
        .select()
        .from(jobs)
        .where(eq(jobs.status, "processing"));

    const now = Date.now();
    let recoveredCount = 0;

    for (const job of processingJobs) {
        const metadata = parseMetadata(job.metadata);
        const ageSeconds = getStaleJobAgeSeconds(metadata, now);

        if (ageSeconds === null || ageSeconds * 1000 < thresholdMs) {
            continue;
        }

        await db
            .update(jobs)
            .set({
                status: "failed",
                errorMessage: "Recovered stale processing job after worker timeout.",
                completedAt: new Date(),
                metadata: JSON.stringify({
                    ...metadata,
                    recoveredAt: new Date().toISOString(),
                    staleThresholdSeconds: thresholdSeconds,
                }),
            })
            .where(and(eq(jobs.id, job.id), eq(jobs.status, "processing")));

        recoveredCount += 1;
    }

    return {
        recoveredCount,
        thresholdSeconds,
    };
}

export async function getStaleToolJobSummary() {
    const thresholdSeconds = getStaleThresholdSeconds();
    const processingJobs = await db
        .select()
        .from(jobs)
        .where(eq(jobs.status, "processing"));

    const now = Date.now();
    let staleCount = 0;
    let oldestStaleJobAgeSeconds = 0;

    for (const job of processingJobs) {
        const metadata = parseMetadata(job.metadata);
        const ageSeconds = getStaleJobAgeSeconds(metadata, now);

        if (ageSeconds === null || ageSeconds < thresholdSeconds) {
            continue;
        }

        staleCount += 1;
        oldestStaleJobAgeSeconds = Math.max(oldestStaleJobAgeSeconds, ageSeconds);
    }

    return {
        staleCount,
        oldestStaleJobAgeSeconds,
        thresholdSeconds,
    };
}
