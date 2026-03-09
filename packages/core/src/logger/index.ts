import pino from "pino";
import { getSiteIdentity } from "../env";

const siteIdentity = getSiteIdentity();

export const logger = pino({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    formatters: {
        level(label) {
            return { level: label };
        },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
        domain: siteIdentity.domain,
        tool: siteIdentity.toolName,
    },
});

/**
 * Creates a child logger with request-specific metadata.
 * Use this in API routes and middleware to automatically
 * attach requestId, endpoint, and IP to every log line.
 */
export function createRequestLogger(meta: {
    requestId: string;
    endpoint: string;
    ip?: string;
    fingerprint?: string;
}) {
    return logger.child(meta);
}

export type { Logger } from "pino";
