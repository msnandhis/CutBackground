import { NextResponse } from "next/server";
import { apiRouteError, parseRouteParams, toApiErrorResponse } from "@/lib/server/api";
import { toolJobRouteParamsSchema } from "@/features/tool/lib/api";
import { getToolJob, requireToolSession } from "@/features/tool/lib/server/tool-jobs";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const session = await requireToolSession();

        if (!session) {
            throw apiRouteError({
                status: 401,
                code: "UNAUTHORIZED",
                message: "You must be signed in to view this tool job.",
            });
        }

        const { jobId } = parseRouteParams(await params, toolJobRouteParamsSchema);
        const job = await getToolJob(jobId, session.user.id);

        return NextResponse.json({ job });
    } catch (error) {
        return toApiErrorResponse(error);
    }
}
