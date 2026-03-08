import { Queue, Worker } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
});

// ── Tool Processing Queue ──────────────────────────────────
export const toolQueue = new Queue("tool-processing", { connection });

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
    return toolQueue.add("process", data, {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
    });
}

// ── Log Batching Queue ─────────────────────────────────────
export const logQueue = new Queue("log-batching", { connection });

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
 * A scheduled worker will flush these to Supabase periodically.
 */
export async function pushLogEntry(entry: LogEntry) {
    return logQueue.add("log", entry, {
        removeOnComplete: true,
        removeOnFail: 500,
    });
}

export { Queue, Worker, connection };
