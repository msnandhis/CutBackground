import { NextResponse } from "next/server";
import { parseJsonBody, toApiErrorResponse } from "@/lib/server/api";
import { createApiKeyRequestSchema } from "@/features/dashboard/lib/api-keys";
import {
    issueApiKey,
    listDashboardApiKeys,
    requireDashboardApiSession,
} from "@/features/dashboard/lib/server/api-keys";

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
        const input = await parseJsonBody(request, createApiKeyRequestSchema);
        const result = await issueApiKey(session.user.id, input.name);

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return toApiErrorResponse(error);
    }
}
