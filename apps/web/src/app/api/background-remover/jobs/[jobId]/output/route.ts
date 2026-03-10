import { NextResponse } from "next/server";
import { db } from "@repo/database";
import { readToolAsset } from "@repo/core/storage";
import { apiRouteError, parseRouteParams, toApiErrorResponse } from "@/lib/server/api";
import { toolJobRouteParamsSchema } from "@/features/tool/lib/api";
import { requireToolSession } from "@/features/tool/lib/server/tool-jobs";

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
                message: "You must be signed in to access this output.",
            });
        }

        const { jobId } = parseRouteParams(await params, toolJobRouteParamsSchema);
        const job = await db.query.jobs.findFirst({
            where: (table, { and, eq }) =>
                and(eq(table.id, jobId), eq(table.userId, session.user.id)),
        });

        if (!job?.outputUrl) {
            throw apiRouteError({
                status: 404,
                code: "OUTPUT_NOT_FOUND",
                message: "Output not found.",
            });
        }

        const output = await readToolAsset(job.outputUrl);

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
