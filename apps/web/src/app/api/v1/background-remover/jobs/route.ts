import { NextResponse } from "next/server";
import { createToolJobForUser, listToolJobsForUser } from "@/features/tool/lib/server/tool-jobs";
import { apiRouteError, toApiErrorResponse } from "@/lib/server/api";
import { requireApiKeyPrincipal } from "@/lib/server/api-key-auth";
import { enforceRateLimit } from "@/lib/server/rate-limit";

function toApiJobOutput<T extends { id: string; outputUrl: string | null }>(job: T) {
    if (job.outputUrl === `/api/background-remover/jobs/${job.id}/output`) {
        return {
            ...job,
            outputUrl: `/api/v1/background-remover/jobs/${job.id}/output`,
        };
    }

    return job;
}

export async function GET(request: Request) {
    try {
        const principal = await requireApiKeyPrincipal(request);
        await enforceRateLimit({
            identifier: `api-key:${principal.apiKeyId}:list-jobs`,
            maxRequests: 120,
            windowSeconds: 60,
            code: "RATE_LIMITED",
            message: "Too many background-remover job list requests in a short period.",
        });

        const jobs = await listToolJobsForUser(principal.userId);
        return NextResponse.json({ jobs: jobs.map(toApiJobOutput) });
    } catch (error) {
        return toApiErrorResponse(error);
    }
}

export async function POST(request: Request) {
    try {
        const principal = await requireApiKeyPrincipal(request);
        await enforceRateLimit({
            identifier: `api-key:${principal.apiKeyId}:create-job`,
            maxRequests: 20,
            windowSeconds: 60,
            code: "RATE_LIMITED",
            message: "Too many background-remover jobs created in a short period.",
        });

        const formData = await request.formData();
        const file = formData.get("file");
        const webhookUrl = formData.get("webhookUrl");
        const webhookSecret = formData.get("webhookSecret");

        if (!(file instanceof File)) {
            throw apiRouteError({
                status: 400,
                code: "FILE_REQUIRED",
                message: "A file upload is required.",
            });
        }

        if (webhookUrl !== null && typeof webhookUrl !== "string") {
            throw apiRouteError({
                status: 400,
                code: "INVALID_WEBHOOK_URL",
                message: "webhookUrl must be a string when provided.",
            });
        }

        if (webhookSecret !== null && typeof webhookSecret !== "string") {
            throw apiRouteError({
                status: 400,
                code: "INVALID_WEBHOOK_SECRET",
                message: "webhookSecret must be a string when provided.",
            });
        }

        const response = await createToolJobForUser({
            userId: principal.userId,
            file,
            ip: request.headers.get("x-forwarded-for") ?? undefined,
            requestIdPrefix: "api",
            idempotencyKey: request.headers.get("idempotency-key"),
            completionWebhookUrl: webhookUrl || null,
            completionWebhookSecret: webhookSecret || null,
        });

        return NextResponse.json({ job: toApiJobOutput(response.job) }, {
            status: 201,
            headers: {
                "X-API-Key-Prefix": principal.prefix,
            },
        });
    } catch (error) {
        return toApiErrorResponse(error);
    }
}
