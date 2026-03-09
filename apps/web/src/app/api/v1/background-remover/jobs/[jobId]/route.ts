import { NextResponse } from "next/server";
import { getToolJob } from "@/features/tool/lib/server/tool-jobs";
import { toolJobRouteParamsSchema } from "@/features/tool/lib/api";
import { parseRouteParams, toApiErrorResponse } from "@/lib/server/api";
import { requireApiKeyPrincipal } from "@/lib/server/api-key-auth";
import { enforceRateLimit } from "@/lib/server/rate-limit";

function toApiJobOutput(job: Awaited<ReturnType<typeof getToolJob>>) {
    if (job.outputUrl === `/api/background-remover/jobs/${job.id}/output`) {
        return {
            ...job,
            outputUrl: `/api/v1/background-remover/jobs/${job.id}/output`,
        };
    }

    return job;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const principal = await requireApiKeyPrincipal(request);
        await enforceRateLimit({
            identifier: `api-key:${principal.apiKeyId}:job-status`,
            maxRequests: 120,
            windowSeconds: 60,
            code: "RATE_LIMITED",
            message: "Too many job status requests in a short period.",
        });

        const { jobId } = parseRouteParams(await params, toolJobRouteParamsSchema);
        const job = toApiJobOutput(await getToolJob(jobId, principal.userId));
        return NextResponse.json({ job });
    } catch (error) {
        return toApiErrorResponse(error);
    }
}
