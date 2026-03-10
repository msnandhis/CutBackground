import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ConnectionOptions } from "bullmq";
import { z } from "zod";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const defaultToolStorageRoot = path.resolve(moduleDir, "../../../../.runtime/tool-assets");
const localDevelopmentAuthSecret =
    "8n4E3pQ1x7Lm2Vz9Kc5Tw0Ba6Yh8Rs4Df1Ju7Np3Xe9Gm2Qk6Hv0La5Zs8Wd1Cr";
const localDevelopmentAppUrl = "http://localhost:3000";

const optionalString = z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(1).optional()
);
const optionalUrl = z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().url().optional()
);

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    DATABASE_URL: optionalString,
    BETTER_AUTH_SECRET: optionalString,
    BETTER_AUTH_URL: optionalUrl,
    NEXT_PUBLIC_BETTER_AUTH_URL: optionalUrl,
    REDIS_URL: optionalUrl,
    ENABLE_BACKGROUND_QUEUE: z.string().optional(),
    R2_ENDPOINT: optionalUrl,
    R2_ACCESS_KEY_ID: optionalString,
    R2_SECRET_ACCESS_KEY: optionalString,
    R2_BUCKET_NAME: optionalString,
    REPLICATE_API_TOKEN: optionalString,
    REPLICATE_BACKGROUND_REMOVER_MODEL: optionalString,
    REPLICATE_WEBHOOK_SECRET: optionalString,
    REPLICATE_WEBHOOK_TOLERANCE_SECONDS: z.coerce.number().int().positive().optional(),
    TOOL_EXECUTION_MODE: z.enum(["replicate", "mock"]).optional(),
    TOOL_MOCK_DELAY_MS: z.coerce.number().int().min(0).optional(),
    EMAIL_PROVIDER: z.enum(["auto", "resend", "brevo"]).optional(),
    RESEND_API_KEY: optionalString,
    BREVO_API_KEY: optionalString,
    EMAIL_FROM: optionalString,
    EMAIL_REPLY_TO: optionalString,
    ADMIN_EMAILS: z.string().optional(),
    TOOL_STORAGE_DIR: optionalString,
    TOOL_PROVIDER_ATTEMPTS: z.coerce.number().int().positive().optional(),
    TOOL_PROVIDER_RETRY_DELAY_MS: z.coerce.number().int().positive().optional(),
    TOOL_STALE_JOB_THRESHOLD_SECONDS: z.coerce.number().int().positive().optional(),
    NEXT_PUBLIC_SITE_DOMAIN: optionalString,
    NEXT_PUBLIC_TOOL_NAME: optionalString,
});

const env = envSchema.parse(process.env);

export type RuntimeDependency =
    | "database"
    | "auth"
    | "redis"
    | "background-queue"
    | "r2"
    | "replicate"
    | "email";

export interface RuntimeDependencyStatus {
    name: RuntimeDependency;
    configured: boolean;
    requiredEnv: string[];
    missingEnv: string[];
    note?: string;
}

function isProductionEnvironment() {
    return env.NODE_ENV === "production";
}

export function isProductionRuntime() {
    return isProductionEnvironment();
}

function parseQueueEnabledFlag(value: string | undefined) {
    return value === "true";
}

function requireDependencyStatus(
    name: RuntimeDependency,
    requiredEnv: string[],
    note?: string
): RuntimeDependencyStatus {
    const missingEnv = requiredEnv.filter((key) => !process.env[key]);
    return {
        name,
        configured: missingEnv.length === 0,
        requiredEnv,
        missingEnv,
        note,
    };
}

export function getDatabaseUrl() {
    return env.DATABASE_URL ?? null;
}

export function isDatabaseConfigured() {
    return Boolean(getDatabaseUrl());
}

export function getDatabaseDependencyStatus(): RuntimeDependencyStatus {
    return requireDependencyStatus("database", ["DATABASE_URL"]);
}

export function getServerAuthBaseUrl() {
    return env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_BETTER_AUTH_URL ?? localDevelopmentAppUrl;
}

export function getPublicAuthBaseUrl() {
    return env.NEXT_PUBLIC_BETTER_AUTH_URL ?? env.BETTER_AUTH_URL ?? localDevelopmentAppUrl;
}

export function getAuthSecret() {
    if (env.BETTER_AUTH_SECRET) {
        return env.BETTER_AUTH_SECRET;
    }

    return isProductionEnvironment() ? null : localDevelopmentAuthSecret;
}

export function isAuthConfigured() {
    return Boolean(getAuthSecret() && getServerAuthBaseUrl() && getDatabaseUrl());
}

export function getAuthDependencyStatus(): RuntimeDependencyStatus {
    const requiredEnv = ["DATABASE_URL", "BETTER_AUTH_URL", "BETTER_AUTH_SECRET"];
    const missingEnv = requiredEnv.filter((key) => {
        if (key === "BETTER_AUTH_URL") {
            return !env.BETTER_AUTH_URL && !env.NEXT_PUBLIC_BETTER_AUTH_URL;
        }

        if (key === "BETTER_AUTH_SECRET") {
            return !env.BETTER_AUTH_SECRET;
        }

        return !process.env[key];
    });

    return {
        name: "auth",
        configured: missingEnv.length === 0,
        requiredEnv,
        missingEnv,
        note: "NEXT_PUBLIC_BETTER_AUTH_URL is accepted as the server base URL fallback outside dedicated auth runtime config.",
    };
}

export function getRedisUrl() {
    return env.REDIS_URL ?? null;
}

export function isRedisConfigured() {
    return Boolean(getRedisUrl());
}

export function getRedisConnectionOptions(): ConnectionOptions | null {
    const redisUrl = getRedisUrl();

    if (!redisUrl) {
        return null;
    }

    const parsed = new URL(redisUrl);

    return {
        host: parsed.hostname,
        port: Number(parsed.port || 6379),
        username: parsed.username || undefined,
        password: parsed.password || undefined,
        db: parsed.pathname ? Number(parsed.pathname.slice(1) || 0) : 0,
        maxRetriesPerRequest: null,
    };
}

export function getRedisDependencyStatus(): RuntimeDependencyStatus {
    return requireDependencyStatus("redis", ["REDIS_URL"]);
}

export function isBackgroundQueueEnabled() {
    return parseQueueEnabledFlag(env.ENABLE_BACKGROUND_QUEUE);
}

export function isBackgroundQueueConfigured() {
    return isBackgroundQueueEnabled() && isRedisConfigured();
}

export function getBackgroundQueueDependencyStatus(): RuntimeDependencyStatus {
    const requiredEnv = ["ENABLE_BACKGROUND_QUEUE", "REDIS_URL"];
    const missingEnv = [
        ...(parseQueueEnabledFlag(env.ENABLE_BACKGROUND_QUEUE) ? [] : ["ENABLE_BACKGROUND_QUEUE=true"]),
        ...(env.REDIS_URL ? [] : ["REDIS_URL"]),
    ];

    return {
        name: "background-queue",
        configured: missingEnv.length === 0,
        requiredEnv,
        missingEnv,
        note: "Queue execution is optional in development, but required before production worker rollout.",
    };
}

export function getR2Config() {
    if (!env.R2_ENDPOINT || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME) {
        return null;
    }

    return {
        endpoint: env.R2_ENDPOINT,
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        bucketName: env.R2_BUCKET_NAME,
    };
}

export function isR2Configured() {
    return Boolean(getR2Config());
}

export function getR2DependencyStatus(): RuntimeDependencyStatus {
    return requireDependencyStatus("r2", [
        "R2_ENDPOINT",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET_NAME",
    ]);
}

export function getReplicateConfig() {
    if (env.TOOL_EXECUTION_MODE === "mock") {
        return {
            apiToken: env.REPLICATE_API_TOKEN ?? "mock",
            model: "mock/background-remover",
            attempts: 1,
            retryDelayMs: 0,
            webhookSecret: env.REPLICATE_WEBHOOK_SECRET ?? null,
            webhookToleranceSeconds: env.REPLICATE_WEBHOOK_TOLERANCE_SECONDS ?? 300,
        };
    }

    if (!env.REPLICATE_API_TOKEN) {
        return null;
    }

    return {
        apiToken: env.REPLICATE_API_TOKEN,
        model: env.REPLICATE_BACKGROUND_REMOVER_MODEL || "851-labs/background-remover",
        attempts: env.TOOL_PROVIDER_ATTEMPTS ?? 3,
        retryDelayMs: env.TOOL_PROVIDER_RETRY_DELAY_MS ?? 1500,
        webhookSecret: env.REPLICATE_WEBHOOK_SECRET ?? null,
        webhookToleranceSeconds: env.REPLICATE_WEBHOOK_TOLERANCE_SECONDS ?? 300,
    };
}

export function isReplicateConfigured() {
    return env.TOOL_EXECUTION_MODE === "mock" || Boolean(getReplicateConfig());
}

export function getReplicateDependencyStatus(): RuntimeDependencyStatus {
    if (env.TOOL_EXECUTION_MODE === "mock") {
        return {
            name: "replicate",
            configured: true,
            requiredEnv: [],
            missingEnv: [],
            note: "Mock execution mode is enabled for local development or end-to-end testing.",
        };
    }

    return {
        ...requireDependencyStatus("replicate", ["REPLICATE_API_TOKEN"]),
        note: "Required for real background-removal execution.",
    };
}

export function getToolExecutionMode() {
    return env.TOOL_EXECUTION_MODE ?? "replicate";
}

export function isMockToolExecutionEnabled() {
    return getToolExecutionMode() === "mock";
}

export function getToolMockDelayMs() {
    return env.TOOL_MOCK_DELAY_MS ?? 0;
}

export type EmailProvider = "resend" | "brevo";

export function getEmailConfig():
    | {
          provider: EmailProvider;
          apiKey: string;
          from: string;
          replyTo: string | null;
      }
    | null {
    if (!env.EMAIL_FROM) {
        return null;
    }

    const selectedProvider = env.EMAIL_PROVIDER ?? "auto";

    if ((selectedProvider === "auto" || selectedProvider === "resend") && env.RESEND_API_KEY) {
        return {
            provider: "resend",
            apiKey: env.RESEND_API_KEY,
            from: env.EMAIL_FROM,
            replyTo: env.EMAIL_REPLY_TO ?? null,
        };
    }

    if ((selectedProvider === "auto" || selectedProvider === "brevo") && env.BREVO_API_KEY) {
        return {
            provider: "brevo",
            apiKey: env.BREVO_API_KEY,
            from: env.EMAIL_FROM,
            replyTo: env.EMAIL_REPLY_TO ?? null,
        };
    }

    return null;
}

export function isEmailConfigured() {
    return Boolean(getEmailConfig());
}

export function getEmailDependencyStatus(): RuntimeDependencyStatus {
    const provider = env.EMAIL_PROVIDER ?? "auto";
    const requiredEnv =
        provider === "brevo"
            ? ["EMAIL_PROVIDER=brevo", "BREVO_API_KEY", "EMAIL_FROM"]
            : provider === "resend"
              ? ["EMAIL_PROVIDER=resend", "RESEND_API_KEY", "EMAIL_FROM"]
              : ["EMAIL_FROM", "RESEND_API_KEY or BREVO_API_KEY"];

    const missingEnv: string[] = [];

    if (!env.EMAIL_FROM) {
        missingEnv.push("EMAIL_FROM");
    }

    if (provider === "resend" && !env.RESEND_API_KEY) {
        missingEnv.push("RESEND_API_KEY");
    }

    if (provider === "brevo" && !env.BREVO_API_KEY) {
        missingEnv.push("BREVO_API_KEY");
    }

    if (provider === "auto" && !env.RESEND_API_KEY && !env.BREVO_API_KEY) {
        missingEnv.push("RESEND_API_KEY or BREVO_API_KEY");
    }

    return {
        name: "email",
        configured: missingEnv.length === 0,
        requiredEnv,
        missingEnv,
        note: "Required for verification, password reset, and magic-link email delivery. EMAIL_PROVIDER defaults to auto and prefers Resend before Brevo when both are present.",
    };
}

export function getAdminEmails() {
    return (env.ADMIN_EMAILS || "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
}

export function isOperatorEmail(email: string) {
    const adminEmails = getAdminEmails();

    if (adminEmails.length === 0) {
        return !isProductionEnvironment();
    }

    return adminEmails.includes(email.trim().toLowerCase());
}

export function getToolStorageRoot() {
    return env.TOOL_STORAGE_DIR || defaultToolStorageRoot;
}

export function getSiteIdentity() {
    return {
        domain: env.NEXT_PUBLIC_SITE_DOMAIN || "unknown",
        toolName: env.NEXT_PUBLIC_TOOL_NAME || "unknown",
    };
}

export function getRuntimeDependencyStatuses(): RuntimeDependencyStatus[] {
    return [
        getDatabaseDependencyStatus(),
        getAuthDependencyStatus(),
        getRedisDependencyStatus(),
        getBackgroundQueueDependencyStatus(),
        getR2DependencyStatus(),
        getReplicateDependencyStatus(),
        getEmailDependencyStatus(),
    ];
}

export function assertRuntimeRequirements(target: RuntimeDependency) {
    const status = getRuntimeDependencyStatuses().find((entry) => entry.name === target);

    if (!status || status.configured) {
        return;
    }

    throw new Error(
        `Missing runtime configuration for ${target}: ${status.missingEnv.join(", ")}`
    );
}

export function getProductionReadinessSummary() {
    return {
        environment: env.NODE_ENV ?? "development",
        databaseConfigured: isDatabaseConfigured(),
        authConfigured: getAuthDependencyStatus().configured,
        redisConfigured: isRedisConfigured(),
        backgroundQueueConfigured: getBackgroundQueueDependencyStatus().configured,
        r2Configured: isR2Configured(),
        replicateConfigured: isReplicateConfigured(),
        emailConfigured: isEmailConfigured(),
        toolStorageRoot: getToolStorageRoot(),
        dependencyStatuses: getRuntimeDependencyStatuses(),
    };
}
