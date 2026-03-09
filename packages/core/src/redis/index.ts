import Redis from "ioredis";
import { assertRuntimeRequirements, getRedisUrl } from "../env";

let redis: Redis | null = null;

export function getRedisClient() {
    if (redis) {
        return redis;
    }

    assertRuntimeRequirements("redis");

    redis = new Redis(getRedisUrl()!, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
    });

    return redis;
}

/**
 * Rate limit a user by IP + optional device fingerprint.
 * Uses a sliding window counter in Redis.
 *
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export async function rateLimitUser(
    identifier: string,
    opts: { maxRequests: number; windowSeconds: number }
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const redisClient = getRedisClient();
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowMs = opts.windowSeconds * 1000;

    const pipeline = redisClient.pipeline();
    pipeline.zremrangebyscore(key, 0, now - windowMs);
    pipeline.zadd(key, now.toString(), `${now}-${Math.random()}`);
    pipeline.zcard(key);
    pipeline.pexpire(key, opts.windowSeconds * 1000);

    const results = await pipeline.exec();
    const count = (results?.[2]?.[1] as number) || 0;

    return {
        allowed: count <= opts.maxRequests,
        remaining: Math.max(0, opts.maxRequests - count),
        resetAt: now + windowMs,
    };
}
