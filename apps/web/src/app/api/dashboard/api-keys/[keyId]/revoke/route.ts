import { NextResponse } from "next/server";
import { parseRouteParams, toApiErrorResponse } from "@/lib/server/api";
import { apiKeyRouteParamsSchema } from "@/features/dashboard/lib/api-keys";
import {
    requireDashboardApiSession,
    revokeApiKey,
} from "@/features/dashboard/lib/server/api-keys";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ keyId: string }> }
) {
    try {
        const session = await requireDashboardApiSession(request);
        await enforceRateLimit({
            identifier: `user:${session.user.id}:api-keys:revoke`,
            maxRequests: 20,
            windowSeconds: 60,
            code: "RATE_LIMITED",
            message: "Too many API key revoke attempts in a short period.",
        });
        const { keyId } = parseRouteParams(await params, apiKeyRouteParamsSchema);
        const key = await revokeApiKey(session.user.id, keyId);

        return NextResponse.json({ key });
    } catch (error) {
        return toApiErrorResponse(error);
    }
}
