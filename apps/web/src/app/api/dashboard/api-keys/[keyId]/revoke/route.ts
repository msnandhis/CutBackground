import { NextResponse } from "next/server";
import { parseRouteParams, toApiErrorResponse } from "@/lib/server/api";
import { apiKeyRouteParamsSchema } from "@/features/dashboard/lib/api-keys";
import {
    requireDashboardApiSession,
    revokeApiKey,
} from "@/features/dashboard/lib/server/api-keys";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ keyId: string }> }
) {
    try {
        const session = await requireDashboardApiSession(request);
        const { keyId } = parseRouteParams(await params, apiKeyRouteParamsSchema);
        const key = await revokeApiKey(session.user.id, keyId);

        return NextResponse.json({ key });
    } catch (error) {
        return toApiErrorResponse(error);
    }
}
