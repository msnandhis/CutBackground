import "server-only";

import { createHash } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { apiKeys, db } from "@repo/database";
import { isDatabaseConfigured } from "@repo/core/env";
import { apiRouteError } from "./api";

function hashApiKey(secret: string) {
    return createHash("sha256").update(secret).digest("hex");
}

function readBearerToken(request: Request) {
    const authorization = request.headers.get("authorization");

    if (authorization?.startsWith("Bearer ")) {
        return authorization.slice("Bearer ".length).trim();
    }

    return request.headers.get("x-api-key")?.trim() || null;
}

export interface ApiKeyPrincipal {
    apiKeyId: string;
    userId: string;
    name: string;
    prefix: string;
}

export async function requireApiKeyPrincipal(request: Request): Promise<ApiKeyPrincipal> {
    if (!isDatabaseConfigured()) {
        throw apiRouteError({
            status: 503,
            code: "SERVICE_UNAVAILABLE",
            message: "API key authentication is unavailable because the database is not configured.",
        });
    }

    const rawKey = readBearerToken(request);

    if (!rawKey) {
        throw apiRouteError({
            status: 401,
            code: "API_KEY_REQUIRED",
            message: "A valid API key is required for this endpoint.",
        });
    }

    const hashedKey = hashApiKey(rawKey);
    const key = await db.query.apiKeys.findFirst({
        where: (table, { and: andWhere, eq: equals, isNull: isNullWhere }) =>
            andWhere(
                equals(table.hashedKey, hashedKey),
                isNullWhere(table.revokedAt)
            ),
    });

    if (!key) {
        throw apiRouteError({
            status: 401,
            code: "INVALID_API_KEY",
            message: "The provided API key is invalid or has been revoked.",
        });
    }

    await db
        .update(apiKeys)
        .set({
            lastUsedAt: new Date(),
        })
        .where(and(eq(apiKeys.id, key.id), isNull(apiKeys.revokedAt)));

    return {
        apiKeyId: key.id,
        userId: key.userId,
        name: key.name,
        prefix: key.keyPrefix,
    };
}
