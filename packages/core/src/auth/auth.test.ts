import { beforeEach, describe, expect, it, vi } from "vitest";

const betterAuthMock = vi.fn((config) => ({ config }));

vi.mock("@better-auth/drizzle-adapter", () => ({
    drizzleAdapter: vi.fn(() => "adapter"),
}));

vi.mock("better-auth", () => ({
    betterAuth: betterAuthMock,
}));

vi.mock("better-auth/plugins", () => ({
    magicLink: vi.fn((config) => ({ id: "magic-link", ...config })),
}));

vi.mock("@repo/database", () => ({
    db: {},
    schema: {},
}));

vi.mock("../env", () => ({
    getAuthSecret: vi.fn(() => "test-secret"),
    getServerAuthBaseUrl: vi.fn(() => "http://localhost:3000"),
    getSiteIdentity: vi.fn(() => ({
        toolName: "CutBackground",
        domain: "cutbackground.test",
    })),
}));

const sendTransactionalEmailMock = vi.fn();

vi.mock("../mail", () => ({
    sendTransactionalEmail: sendTransactionalEmailMock,
    buildTransactionalActionEmail: vi.fn(({ subject, actionUrl, headline, intro, actionLabel, outro }) => ({
        subject,
        text: `${headline}\n${intro}\n${actionLabel}: ${actionUrl}\n${outro}`,
        html: `<a href="${actionUrl}">${actionLabel}</a>`,
    })),
}));

describe("auth email handlers", () => {
    beforeEach(() => {
        vi.resetModules();
        sendTransactionalEmailMock.mockReset();
        betterAuthMock.mockClear();
    });

    it("wires verification email delivery through the transactional mail layer", async () => {
        const { auth } = await import("./auth");
        const config = (auth as unknown as { config: Record<string, any> }).config;

        await config.emailAndPassword.sendVerificationEmail({
            user: { email: "user@example.com" },
            url: "https://example.com/verify",
        });

        expect(sendTransactionalEmailMock).toHaveBeenCalledOnce();
        expect(sendTransactionalEmailMock).toHaveBeenCalledWith(
            expect.objectContaining({
                to: "user@example.com",
                subject: "Verify your CutBackground account",
            })
        );
    });
});
