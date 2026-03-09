import { NextResponse } from "next/server";
import { apiRouteError, toApiErrorResponse } from "@/lib/server/api";
import { createToolJob, requireToolSession } from "@/features/tool/lib/server/tool-jobs";

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
        });

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        return toApiErrorResponse(error);
    }
}
