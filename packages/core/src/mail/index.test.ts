import { afterEach, describe, expect, it, vi } from "vitest";

describe("sendTransactionalEmail", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.resetModules();
        delete process.env.NODE_ENV;
        delete process.env.EMAIL_PROVIDER;
        delete process.env.RESEND_API_KEY;
        delete process.env.BREVO_API_KEY;
        delete process.env.EMAIL_FROM;
        delete process.env.EMAIL_REPLY_TO;
    });

    it("sends through Resend when selected", async () => {
        process.env.EMAIL_PROVIDER = "resend";
        process.env.RESEND_API_KEY = "re_test";
        process.env.EMAIL_FROM = "noreply@example.com";
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            text: vi.fn(),
        });
        vi.stubGlobal("fetch", fetchMock);

        const { sendTransactionalEmail } = await import("./index");

        await sendTransactionalEmail({
            to: "user@example.com",
            subject: "Verify",
            html: "<p>Hello</p>",
            text: "Hello",
        });

        expect(fetchMock).toHaveBeenCalledOnce();
        expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.resend.com/emails");
    });

    it("sends through Brevo when selected", async () => {
        process.env.EMAIL_PROVIDER = "brevo";
        process.env.BREVO_API_KEY = "xkeysib_test";
        process.env.EMAIL_FROM = "noreply@example.com";
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            text: vi.fn(),
        });
        vi.stubGlobal("fetch", fetchMock);

        const { sendTransactionalEmail } = await import("./index");

        await sendTransactionalEmail({
            to: "user@example.com",
            subject: "Verify",
            html: "<p>Hello</p>",
            text: "Hello",
        });

        expect(fetchMock).toHaveBeenCalledOnce();
        expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.brevo.com/v3/smtp/email");
    });

    it("throws in production when email config is missing", async () => {
        process.env.NODE_ENV = "production";
        const { sendTransactionalEmail } = await import("./index");

        await expect(
            sendTransactionalEmail({
                to: "user@example.com",
                subject: "Verify",
                html: "<p>Hello</p>",
                text: "Hello",
            })
        ).rejects.toThrow("Missing email provider configuration.");
    });
});
