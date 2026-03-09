import { Queue, Worker, type ConnectionOptions } from "bullmq";

const redisUrl = new URL(process.env.REDIS_URL || "redis://localhost:6379");

const connection: ConnectionOptions = {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || 6379),
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
    db: redisUrl.pathname ? Number(redisUrl.pathname.slice(1) || 0) : 0,
    maxRetriesPerRequest: null,
};

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
 * A scheduled worker can flush these to the configured database or log sink.
 */
export async function pushLogEntry(entry: LogEntry) {
    return logQueue.add("log", entry, {
        removeOnComplete: true,
        removeOnFail: 500,
    });
}

export { Queue, Worker, connection };
