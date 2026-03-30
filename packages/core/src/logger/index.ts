import pino from "pino";
import { getSiteIdentity } from "../env";

const siteIdentity = getSiteIdentity();

const sensitiveFields = [
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "idToken",
  "secret",
  "apiKey",
  "api_key",
  "apiKeyId",
  "api_key_id",
  "apiSecret",
  "api_secret",
  "secretKey",
  "secret_key",
  "privateKey",
  "private_key",
  "credential",
  "authorization",
  "cookie",
  "session",
  "webhookSecret",
  "webhook_secret",
  "hashedKey",
  "hashed_key",
];

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
  redact: {
    paths: sensitiveFields.flatMap((field) => [`*.${field}`, `${field}`]),
    censor: "[REDACTED]",
  },
});

export function createRequestLogger(meta: {
  requestId: string;
  endpoint: string;
  ip?: string;
  fingerprint?: string;
}) {
  return logger.child(meta);
}

export type { Logger } from "pino";
