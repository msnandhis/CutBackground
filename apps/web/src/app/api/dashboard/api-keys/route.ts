import { NextResponse } from "next/server";
import { parseJsonBody, toApiErrorResponse } from "@/lib/server/api";
import { createApiKeyRequestSchema } from "@/features/dashboard/lib/api-keys";
import {
    issueApiKey,
    listDashboardApiKeys,
    requireDashboardApiSession,
} from "@/features/dashboard/lib/server/api-keys";
import { enforceRateLimit } from "@/lib/server/rate-limit";

export async function GET(request: Request) {
    try {
        const session = await requireDashboardApiSession(request);
        const keys = await listDashboardApiKeys(session.user.id);

        return NextResponse.json({ keys });
    } catch (error) {
        return toApiErrorResponse(error);
    }
}

export async function POST(request: Request) {
    try {
        const session = await requireDashboardApiSession(request);
        await enforceRateLimit({
            identifier: `user:${session.user.id}:api-keys:create`,
            maxRequests: 10,
            windowSeconds: 60,
            code: "RATE_LIMITED",
            message: "Too many API key creation attempts in a short period.",
        });
        const input = await parseJsonBody(request, createApiKeyRequestSchema);
        const result = await issueApiKey(session.user.id, input.name);

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return toApiErrorResponse(error);
    }
}
