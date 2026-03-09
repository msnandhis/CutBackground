import { NextResponse } from "next/server";
import { apiRouteError, parseRouteParams, toApiErrorResponse } from "@/lib/server/api";
import { toolJobRouteParamsSchema } from "@/features/tool/lib/api";
import { cancelToolJob, requireToolSession } from "@/features/tool/lib/server/tool-jobs";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const session = await requireToolSession();

        if (!session) {
            throw apiRouteError({
                status: 401,
                code: "UNAUTHORIZED",
                message: "You must be signed in to cancel this job.",
            });
        }

        await enforceRateLimit({
            identifier: `user:${session.user.id}:tool-job:cancel`,
            maxRequests: 20,
            windowSeconds: 60,
            code: "RATE_LIMITED",
            message: "Too many cancel attempts in a short period.",
        });

        const { jobId } = parseRouteParams(await params, toolJobRouteParamsSchema);
        const job = await cancelToolJob(jobId, session.user.id);
        return NextResponse.json({ job });
    } catch (error) {
        return toApiErrorResponse(error);
    }
}
