import { Queue, Worker, type ConnectionOptions } from "bullmq";
import {
    assertRuntimeRequirements,
    getRedisConnectionOptions,
    isBackgroundQueueEnabled,
    isBackgroundQueueConfigured,
    isDatabaseConfigured,
} from "../env";
import { getStaleToolJobSummary, recoverStaleToolJobs } from "./recovery";

let toolQueue: Queue | null = null;
let logQueue: Queue | null = null;

function getConnection() {
    const connection = getRedisConnectionOptions();

    if (!connection) {
        throw new Error("Missing runtime configuration for redis: REDIS_URL");
    }

    return connection;
}

function getToolQueue() {
    if (toolQueue) {
        return toolQueue;
    }

    assertRuntimeRequirements("redis");
    toolQueue = new Queue("tool-processing", { connection: getConnection() });
    return toolQueue;
}

function getLogQueue() {
    if (logQueue) {
        return logQueue;
    }

    assertRuntimeRequirements("redis");
    logQueue = new Queue("log-batching", { connection: getConnection() });
    return logQueue;
}

// ── Tool Processing Queue ──────────────────────────────────
export interface ToolJobData {
    jobId: string;
    inputUrl: string;
    toolName: string;
    metadata?: Record<string, unknown>;
}

/**
 * Enqueue a new tool processing job.
 * Called from the `/api/tool/start` route.
 */
export async function enqueueToolJob(data: ToolJobData) {
    if (!isBackgroundQueueEnabled()) {
        throw new Error("Background queue is disabled for this environment.");
    }

    return getToolQueue().add("process", data, {
        jobId: data.jobId,
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
    });
}

export async function cancelQueuedToolJob(jobId: string) {
    const queuedJob = await getToolQueue().getJob(jobId);

    if (!queuedJob) {
        return false;
    }

    const state = await queuedJob.getState();

    if (
        state === "waiting" ||
        state === "delayed" ||
        state === "prioritized" ||
        state === "waiting-children"
    ) {
        await queuedJob.remove();
        return true;
    }

    return false;
}

// ── Log Batching Queue ─────────────────────────────────────
export interface LogEntry {
    level: string;
    message: string;
    domain: string;
    tool: string;
    endpoint?: string;
    requestId?: string;
    ip?: string;
    fingerprint?: string;
    error?: string;
    metadata?: Record<string, unknown>;
    timestamp: string;
}

/**
 * Push a structured log entry to the batch queue.
 * A scheduled worker can flush these to the configured database or log sink.
 */
export async function pushLogEntry(entry: LogEntry) {
    return getLogQueue().add("log", entry, {
        removeOnComplete: true,
        removeOnFail: 500,
    });
}

export function getQueueConnection(): ConnectionOptions {
    assertRuntimeRequirements("redis");
    return getConnection();
}

export async function getToolQueueHealth() {
    if (!isBackgroundQueueConfigured()) {
        return {
            configured: false,
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
        };
    }

    const queue = getToolQueue();
    const counts = await queue.getJobCounts("waiting", "active", "completed", "failed");

    return {
        configured: true,
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
    };
}

export async function recoverStaleJobsIfNeeded() {
    if (!isDatabaseConfigured()) {
        return {
            recoveredCount: 0,
            thresholdSeconds: 0,
        };
    }

    return recoverStaleToolJobs();
}

export { getStaleToolJobSummary };

export { Queue, Worker };
export { completeToolJobFromReplicateWebhook, processToolJobExecution } from "./process-tool-job";
