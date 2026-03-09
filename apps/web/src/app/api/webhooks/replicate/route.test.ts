import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyReplicateWebhookMock = vi.fn();
const completeToolJobFromReplicateWebhookMock = vi.fn();

vi.mock("@repo/core/ai-provider/replicate", () => ({
    verifyReplicateWebhook: verifyReplicateWebhookMock,
}));

vi.mock("@repo/core/jobs", () => ({
    completeToolJobFromReplicateWebhook: completeToolJobFromReplicateWebhookMock,
}));

describe("POST /api/webhooks/replicate", () => {
    beforeEach(() => {
        vi.resetModules();
        verifyReplicateWebhookMock.mockReset();
        completeToolJobFromReplicateWebhookMock.mockReset();
    });

    it("rejects invalid webhook signatures", async () => {
        verifyReplicateWebhookMock.mockReturnValue(false);
        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost:3000/api/webhooks/replicate", {
                method: "POST",
                body: JSON.stringify({ id: "pred_123", status: "succeeded" }),
                headers: {
                    "Content-Type": "application/json",
                },
            })
        );

        expect(response.status).toBe(401);
        expect(completeToolJobFromReplicateWebhookMock).not.toHaveBeenCalled();
    });

    it("processes verified webhooks", async () => {
        verifyReplicateWebhookMock.mockReturnValue(true);
        const { POST } = await import("./route");

        const response = await POST(
            new Request("http://localhost:3000/api/webhooks/replicate", {
                method: "POST",
                body: JSON.stringify({ id: "pred_123", status: "succeeded" }),
                headers: {
                    "Content-Type": "application/json",
                },
            })
        );

        expect(response.status).toBe(204);
        expect(completeToolJobFromReplicateWebhookMock).toHaveBeenCalledWith({
            id: "pred_123",
            status: "succeeded",
        });
    });
});
