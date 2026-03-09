import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("drizzle-orm", () => ({
    and: vi.fn(() => "and"),
    eq: vi.fn(() => "eq"),
    isNull: vi.fn(() => "is-null"),
}));

const findFirst = vi.fn();
const whereMock = vi.fn().mockResolvedValue(undefined);
const setMock = vi.fn().mockReturnThis();
const updateMock = vi.fn().mockReturnValue({
    set: setMock,
    where: whereMock,
});

vi.mock("@repo/database", () => ({
    db: {
        query: {
            apiKeys: {
                findFirst,
            },
        },
        update: updateMock,
    },
    apiKeys: {
        id: "id",
        revokedAt: "revoked_at",
    },
}));

vi.mock("@repo/core/env", () => ({
    isDatabaseConfigured: () => true,
}));

describe("requireApiKeyPrincipal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("accepts a bearer token and updates lastUsedAt", async () => {
        findFirst.mockResolvedValue({
            id: "key_1",
            userId: "user_1",
            name: "Production",
            keyPrefix: "cb_live_test...",
        });

        const { requireApiKeyPrincipal } = await import("./api-key-auth");
        const request = new Request("http://localhost/api", {
            headers: {
                Authorization: "Bearer cb_live_test_123",
            },
        });

        const principal = await requireApiKeyPrincipal(request);

        expect(principal.userId).toBe("user_1");
        expect(updateMock).toHaveBeenCalled();
        expect(setMock).toHaveBeenCalled();
        expect(whereMock).toHaveBeenCalled();
    });

    it("rejects missing API keys", async () => {
        const { requireApiKeyPrincipal } = await import("./api-key-auth");

        await expect(requireApiKeyPrincipal(new Request("http://localhost/api"))).rejects.toMatchObject({
            code: "API_KEY_REQUIRED",
            status: 401,
        });
    });
});
