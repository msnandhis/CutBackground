import { NextResponse } from "next/server";
import { retryToolJob } from "@/features/tool/lib/server/tool-jobs";
import { toolJobRouteParamsSchema } from "@/features/tool/lib/api";
import { parseRouteParams, toApiErrorResponse } from "@/lib/server/api";
import { requireApiKeyPrincipal } from "@/lib/server/api-key-auth";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const principal = await requireApiKeyPrincipal(request);
        await enforceRateLimit({
            identifier: `api-key:${principal.apiKeyId}:retry-job`,
            maxRequests: 30,
            windowSeconds: 60,
            code: "RATE_LIMITED",
            message: "Too many retry requests in a short period.",
        });

        const { jobId } = parseRouteParams(await params, toolJobRouteParamsSchema);
        const job = await retryToolJob(jobId, principal.userId);
        return NextResponse.json({ job });
    } catch (error) {
        return toApiErrorResponse(error);
    }
}
