import "server-only";

import { isProductionRuntime, isRedisConfigured } from "@repo/core/env";
import { rateLimitUser } from "@repo/core/redis";
import { apiRouteError } from "./api";

export async function enforceRateLimit(params: {
    identifier: string;
    maxRequests: number;
    windowSeconds: number;
    code: string;
    message: string;
}) {
    if (!isRedisConfigured()) {
        if (isProductionRuntime()) {
            throw apiRouteError({
                status: 503,
                code: "RATE_LIMITING_UNAVAILABLE",
                message: "Rate limiting is unavailable because Redis is not configured.",
            });
        }

        return;
    }

    const result = await rateLimitUser(params.identifier, {
        maxRequests: params.maxRequests,
        windowSeconds: params.windowSeconds,
    });

    if (!result.allowed) {
        throw apiRouteError({
            status: 429,
            code: params.code,
            message: params.message,
            details: {
                remaining: result.remaining,
                resetAt: result.resetAt,
            },
        });
    }
}
