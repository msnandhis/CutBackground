import { beforeEach, describe, expect, it, vi } from "vitest";

const requireApiKeyPrincipalMock = vi.fn();
const enforceRateLimitMock = vi.fn();
const listToolJobsForUserMock = vi.fn();
const createToolJobForUserMock = vi.fn();

vi.mock("@/lib/server/api-key-auth", () => ({
    requireApiKeyPrincipal: requireApiKeyPrincipalMock,
}));

vi.mock("@/lib/server/rate-limit", () => ({
    enforceRateLimit: enforceRateLimitMock,
}));

vi.mock("@/lib/server/api", () => ({
    apiRouteError: vi.fn(({ status, code, message, details }) => {
        const error = new Error(message) as Error & {
            status: number;
            code: string;
            details?: Record<string, unknown>;
        };
        error.status = status;
        error.code = code;
        error.details = details;
        return error;
    }),
    toApiErrorResponse: vi.fn((error) =>
        Response.json(
            {
                error: {
                    code: (error as { code?: string }).code || "INTERNAL_SERVER_ERROR",
                    message: error instanceof Error ? error.message : "Unknown error",
                },
            },
            { status: (error as { status?: number }).status || 500 }
        )
    ),
}));

vi.mock("@/features/tool/lib/server/tool-jobs", () => ({
    listToolJobsForUser: listToolJobsForUserMock,
    createToolJobForUser: createToolJobForUserMock,
}));

describe("/api/v1/background-remover/jobs", () => {
    beforeEach(() => {
        vi.resetModules();
        requireApiKeyPrincipalMock.mockReset();
        enforceRateLimitMock.mockReset();
        listToolJobsForUserMock.mockReset();
        createToolJobForUserMock.mockReset();
    });

    it("lists jobs for an API key principal", async () => {
        requireApiKeyPrincipalMock.mockResolvedValue({
            apiKeyId: "key_123",
            userId: "user_123",
            prefix: "cb_live_123...",
        });
        listToolJobsForUserMock.mockResolvedValue([
            {
                id: "job_123",
                outputUrl: "/api/background-remover/jobs/job_123/output",
            },
        ]);

        const { GET } = await import("./route");
        const response = await GET(new Request("http://localhost:3000/api/v1/background-remover/jobs"));
        const payload = await response.json();

        expect(response.status).toBe(200);
        expect(payload.jobs[0].outputUrl).toBe("/api/v1/background-remover/jobs/job_123/output");
    });

    it("creates a job and forwards webhookUrl when provided", async () => {
        requireApiKeyPrincipalMock.mockResolvedValue({
            apiKeyId: "key_123",
            userId: "user_123",
            prefix: "cb_live_123...",
        });
        createToolJobForUserMock.mockResolvedValue({
            job: {
                id: "job_123",
                outputUrl: null,
            },
        });

        const { POST } = await import("./route");
        const formData = new FormData();
        formData.set("file", new File(["image"], "avatar.png", { type: "image/png" }));
        formData.set("webhookUrl", "https://example.com/hooks/jobs");

        const response = await POST(
            new Request("http://localhost:3000/api/v1/background-remover/jobs", {
                method: "POST",
                body: formData,
            })
        );

        expect(response.status).toBe(201);
        expect(createToolJobForUserMock).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: "user_123",
                completionWebhookUrl: "https://example.com/hooks/jobs",
            })
        );
    });
});
