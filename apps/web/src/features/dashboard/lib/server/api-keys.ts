import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { apiKeys, db } from "@repo/database";
import { auth } from "@repo/core/auth/server";
import { isAuthConfigured, isDatabaseConfigured } from "@repo/core/env";
import { apiRouteError } from "@/lib/server/api";
import type { DashboardApiKey } from "../types";

const apiKeyPrefix = "cb_live_";
const maxActiveKeysPerUser = 10;

function formatDate(value: Date) {
    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(value);
}

function toDashboardApiKey(row: typeof apiKeys.$inferSelect): DashboardApiKey {
    return {
        id: row.id,
        name: row.name,
        prefix: row.keyPrefix,
        createdAtLabel: formatDate(row.createdAt),
        lastUsedAtLabel: row.lastUsedAt ? formatDate(row.lastUsedAt) : null,
        status: row.revokedAt ? "revoked" : "active",
    };
}

function hashApiKey(secret: string) {
    return createHash("sha256").update(secret).digest("hex");
}

function buildApiKeySecret() {
    return `${apiKeyPrefix}${randomBytes(24).toString("base64url")}`;
}

function buildApiKeyPrefix(secret: string) {
    return `${secret.slice(0, 16)}...`;
}

export async function requireDashboardApiSession(request: Request) {
    if (!isDatabaseConfigured() || !isAuthConfigured()) {
        throw apiRouteError({
            status: 503,
            code: "SERVICE_UNAVAILABLE",
            message: "Authentication and database services are not configured.",
        });
    }

    let session = null;

    try {
        session = await auth.api.getSession({
            headers: request.headers,
        });
    } catch {
        session = null;
    }

    if (!session) {
        throw apiRouteError({
            status: 401,
            code: "UNAUTHORIZED",
            message: "You must be signed in to manage API keys.",
        });
    }

    return session;
}

export async function listDashboardApiKeys(userId: string) {
    const rows = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.userId, userId))
        .orderBy(desc(apiKeys.createdAt))
        .limit(20);

    return rows.map(toDashboardApiKey);
}

export async function issueApiKey(userId: string, name: string) {
    const activeKeyCount = await db.$count(
        apiKeys,
        and(eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt))
    );

    if (activeKeyCount >= maxActiveKeysPerUser) {
        throw apiRouteError({
            status: 409,
            code: "ACTIVE_KEY_LIMIT_REACHED",
            message: `You can only keep ${maxActiveKeysPerUser} active API keys at a time.`,
        });
    }

    const secret = buildApiKeySecret();
    const insertedKey = {
        id: randomUUID(),
        userId,
        name,
        hashedKey: hashApiKey(secret),
        keyPrefix: buildApiKeyPrefix(secret),
    } satisfies typeof apiKeys.$inferInsert;

    const [row] = await db.insert(apiKeys).values(insertedKey).returning();

    if (!row) {
        throw apiRouteError({
            status: 500,
            code: "API_KEY_CREATION_FAILED",
            message: "Unable to create an API key right now.",
        });
    }

    return {
        key: toDashboardApiKey(row),
        plainTextKey: secret,
    };
}

export async function revokeApiKey(userId: string, keyId: string) {
    const [row] = await db
        .update(apiKeys)
        .set({
            revokedAt: new Date(),
        })
        .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)))
        .returning();

    if (!row) {
        const existing = await db.query.apiKeys.findFirst({
            where: (table, { and: andWhere, eq: equals }) =>
                andWhere(equals(table.id, keyId), equals(table.userId, userId)),
        });

        if (!existing) {
            throw apiRouteError({
                status: 404,
                code: "API_KEY_NOT_FOUND",
                message: "API key not found.",
            });
        }

        throw apiRouteError({
            status: 409,
            code: "API_KEY_ALREADY_REVOKED",
            message: "This API key has already been revoked.",
        });
    }

    return toDashboardApiKey(row);
}
