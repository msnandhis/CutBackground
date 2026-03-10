import { NextResponse } from "next/server";
import { apiRouteError, toApiErrorResponse } from "@/lib/server/api";
import { createToolJob, requireToolSession } from "@/features/tool/lib/server/tool-jobs";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
    try {
        const session = await requireToolSession();

        if (!session) {
            throw apiRouteError({
                status: 401,
                code: "UNAUTHORIZED",
                message: "You must be signed in to run the background remover.",
            });
        }

        await enforceRateLimit({
            identifier: `user:${session.user.id}:tool-job:create`,
            maxRequests: 20,
            windowSeconds: 60,
            code: "RATE_LIMITED",
            message: "Too many tool job creation attempts in a short period.",
        });

        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            throw apiRouteError({
                status: 400,
                code: "FILE_REQUIRED",
                message: "A file upload is required.",
            });
        }

        const response = await createToolJob({
            file,
            ip: request.headers.get("x-forwarded-for") ?? undefined,
            idempotencyKey: request.headers.get("idempotency-key"),
        });

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        return toApiErrorResponse(error);
    }
}
