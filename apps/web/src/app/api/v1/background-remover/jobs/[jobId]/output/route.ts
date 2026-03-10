import { NextResponse } from "next/server";
import { readToolAsset } from "@repo/core/storage";
import { getToolJobOutputRef } from "@/features/tool/lib/server/tool-jobs";
import { toolJobRouteParamsSchema } from "@/features/tool/lib/api";
import { parseRouteParams, toApiErrorResponse } from "@/lib/server/api";
import { requireApiKeyPrincipal } from "@/lib/server/api-key-auth";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const principal = await requireApiKeyPrincipal(request);
        await enforceRateLimit({
            identifier: `api-key:${principal.apiKeyId}:job-output`,
            maxRequests: 120,
            windowSeconds: 60,
            code: "RATE_LIMITED",
            message: "Too many output download requests in a short period.",
        });

        const { jobId } = parseRouteParams(await params, toolJobRouteParamsSchema);
        const outputRef = await getToolJobOutputRef(jobId, principal.userId);
        const output = await readToolAsset(outputRef);

        return new NextResponse(output.body, {
            headers: {
                "Content-Type": output.contentType,
                "Cache-Control": "private, no-store",
                "Content-Disposition": 'attachment; filename="background-removed.png"',
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (error) {
        return toApiErrorResponse(error);
    }
}
