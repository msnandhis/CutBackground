import { NextResponse } from "next/server";
import { parseRouteParams, toApiErrorResponse } from "@/lib/server/api";
import { toolJobRouteParamsSchema } from "@/features/tool/lib/api";
import { cancelJobAsOperator } from "@/features/dashboard/lib/server/operator-actions";

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = parseRouteParams(await params, toolJobRouteParamsSchema);
        const result = await cancelJobAsOperator(jobId);
        return NextResponse.json(result);
    } catch (error) {
        return toApiErrorResponse(error);
    }
}
