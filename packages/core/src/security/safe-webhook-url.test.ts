import { describe, expect, it, vi } from "vitest";
import { assertSafeWebhookUrl } from "./safe-webhook-url";

describe("assertSafeWebhookUrl", () => {
    it("accepts a public https webhook", async () => {
        const dnsLookup = vi.fn().mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);

        await expect(
            assertSafeWebhookUrl("https://example.com/webhooks/cutbackground", {
                environment: "production",
                dnsLookup,
            })
        ).resolves.toBeInstanceOf(URL);
    });

    it("rejects localhost and private targets", async () => {
        await expect(
            assertSafeWebhookUrl("http://localhost:3000/hook", {
                environment: "development",
            })
        ).rejects.toThrow("public hostname");

        await expect(
            assertSafeWebhookUrl("https://127.0.0.1/hook", {
                environment: "production",
            })
        ).rejects.toThrow("private or reserved IP ranges");
    });

    it("rejects non-https production webhooks", async () => {
        const dnsLookup = vi.fn().mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);

        await expect(
            assertSafeWebhookUrl("http://example.com/hook", {
                environment: "production",
                dnsLookup,
            })
        ).rejects.toThrow("HTTPS");
    });

    it("rejects hostnames that resolve to private networks", async () => {
        const dnsLookup = vi.fn().mockResolvedValue([{ address: "10.0.0.25", family: 4 }]);

        await expect(
            assertSafeWebhookUrl("https://internal.example.com/hook", {
                environment: "production",
                dnsLookup,
            })
        ).rejects.toThrow("resolve to private or reserved IP ranges");
    });
});
