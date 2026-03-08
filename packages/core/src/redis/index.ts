import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
});

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
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const windowMs = opts.windowSeconds * 1000;

    const pipeline = redis.pipeline();
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
