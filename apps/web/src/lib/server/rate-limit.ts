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
        message:
          "Rate limiting is unavailable because Redis is not configured.",
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

export async function enforceToolRateLimit(params: {
  userId: string;
  toolName: string;
  limits: {
    maxRequestsPerHour: number;
    maxRequestsPerDay: number;
  };
}) {
  if (!isRedisConfigured()) {
    if (isProductionRuntime()) {
      throw apiRouteError({
        status: 503,
        code: "RATE_LIMITING_UNAVAILABLE",
        message:
          "Rate limiting is unavailable because Redis is not configured.",
      });
    }

    return;
  }

  const hourInSeconds = 3600;
  const dayInSeconds = 86400;

  const hourlyIdentifier = `tool:${params.toolName}:user:${params.userId}:hourly`;
  const dailyIdentifier = `tool:${params.toolName}:user:${params.userId}:daily`;

  const hourlyResult = await rateLimitUser(hourlyIdentifier, {
    maxRequests: params.limits.maxRequestsPerHour,
    windowSeconds: hourInSeconds,
  });

  if (!hourlyResult.allowed) {
    throw apiRouteError({
      status: 429,
      code: "RATE_LIMIT_EXCEEDED_HOURLY",
      message: `You have exceeded the hourly limit of ${params.limits.maxRequestsPerHour} requests for this tool. Please try again later.`,
      details: {
        remaining: hourlyResult.remaining,
        resetAt: hourlyResult.resetAt,
        limit: params.limits.maxRequestsPerHour,
        window: "hour",
      },
    });
  }

  const dailyResult = await rateLimitUser(dailyIdentifier, {
    maxRequests: params.limits.maxRequestsPerDay,
    windowSeconds: dayInSeconds,
  });

  if (!dailyResult.allowed) {
    throw apiRouteError({
      status: 429,
      code: "RATE_LIMIT_EXCEEDED_DAILY",
      message: `You have exceeded the daily limit of ${params.limits.maxRequestsPerDay} requests for this tool. Please try again tomorrow.`,
      details: {
        remaining: dailyResult.remaining,
        resetAt: dailyResult.resetAt,
        limit: params.limits.maxRequestsPerDay,
        window: "day",
      },
    });
  }
}
