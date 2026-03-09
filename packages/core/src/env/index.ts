import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ConnectionOptions } from "bullmq";
import { z } from "zod";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const defaultToolStorageRoot = path.resolve(moduleDir, "../../../../.runtime/tool-assets");
const localDevelopmentAuthSecret =
    "8n4E3pQ1x7Lm2Vz9Kc5Tw0Ba6Yh8Rs4Df1Ju7Np3Xe9Gm2Qk6Hv0La5Zs8Wd1Cr";
const localDevelopmentAppUrl = "http://localhost:3000";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    DATABASE_URL: z.string().min(1).optional(),
    BETTER_AUTH_SECRET: z.string().min(1).optional(),
    BETTER_AUTH_URL: z.string().url().optional(),
    NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url().optional(),
    REDIS_URL: z.string().url().optional(),
    ENABLE_BACKGROUND_QUEUE: z.string().optional(),
    R2_ENDPOINT: z.string().url().optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_BUCKET_NAME: z.string().min(1).optional(),
    REPLICATE_API_TOKEN: z.string().min(1).optional(),
    REPLICATE_BACKGROUND_REMOVER_MODEL: z.string().min(1).optional(),
    TOOL_STORAGE_DIR: z.string().min(1).optional(),
    TOOL_PROVIDER_ATTEMPTS: z.coerce.number().int().positive().optional(),
    TOOL_PROVIDER_RETRY_DELAY_MS: z.coerce.number().int().positive().optional(),
    NEXT_PUBLIC_SITE_DOMAIN: z.string().min(1).optional(),
    NEXT_PUBLIC_TOOL_NAME: z.string().min(1).optional(),
});

const env = envSchema.parse(process.env);

export type RuntimeDependency =
    | "database"
    | "auth"
    | "redis"
    | "background-queue"
    | "r2"
    | "replicate";

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
    if (!env.REPLICATE_API_TOKEN) {
        return null;
    }

    return {
        apiToken: env.REPLICATE_API_TOKEN,
        model: env.REPLICATE_BACKGROUND_REMOVER_MODEL || "851-labs/background-remover",
        attempts: env.TOOL_PROVIDER_ATTEMPTS ?? 3,
        retryDelayMs: env.TOOL_PROVIDER_RETRY_DELAY_MS ?? 1500,
    };
}

export function isReplicateConfigured() {
    return Boolean(getReplicateConfig());
}

export function getReplicateDependencyStatus(): RuntimeDependencyStatus {
    return {
        ...requireDependencyStatus("replicate", ["REPLICATE_API_TOKEN"]),
        note: "Required for real background-removal execution.",
    };
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
        toolStorageRoot: getToolStorageRoot(),
        dependencyStatuses: getRuntimeDependencyStatuses(),
    };
}
