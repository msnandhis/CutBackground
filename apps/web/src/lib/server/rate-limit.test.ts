import { beforeEach, describe, expect, it, vi } from "vitest";

const isRedisConfiguredMock = vi.fn();
const isProductionRuntimeMock = vi.fn();
const rateLimitUserMock = vi.fn();

vi.mock("server-only", () => ({}));

vi.mock("@repo/core/env", () => ({
    isRedisConfigured: isRedisConfiguredMock,
    isProductionRuntime: isProductionRuntimeMock,
}));

vi.mock("@repo/core/redis", () => ({
    rateLimitUser: rateLimitUserMock,
}));

describe("enforceRateLimit", () => {
    beforeEach(() => {
        isRedisConfiguredMock.mockReset();
        isProductionRuntimeMock.mockReset();
        rateLimitUserMock.mockReset();
    });

    it("fails closed in production when Redis is unavailable", async () => {
        isRedisConfiguredMock.mockReturnValue(false);
        isProductionRuntimeMock.mockReturnValue(true);

        const { enforceRateLimit } = await import("./rate-limit");

        await expect(
            enforceRateLimit({
                identifier: "user:123",
                maxRequests: 1,
                windowSeconds: 60,
                code: "RATE_LIMITED",
                message: "Too many requests.",
            })
        ).rejects.toMatchObject({
            status: 503,
            code: "RATE_LIMITING_UNAVAILABLE",
        });
    });

    it("skips rate limiting outside production when Redis is unavailable", async () => {
        isRedisConfiguredMock.mockReturnValue(false);
        isProductionRuntimeMock.mockReturnValue(false);

        const { enforceRateLimit } = await import("./rate-limit");

        await expect(
            enforceRateLimit({
                identifier: "user:123",
                maxRequests: 1,
                windowSeconds: 60,
                code: "RATE_LIMITED",
                message: "Too many requests.",
            })
        ).resolves.toBeUndefined();
    });
});
