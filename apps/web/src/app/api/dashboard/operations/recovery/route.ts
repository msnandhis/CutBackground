import { NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/server/api";
import { recoverStaleJobsAsOperator } from "@/features/dashboard/lib/server/operator-actions";

export async function POST() {
    try {
        const result = await recoverStaleJobsAsOperator();
        return NextResponse.json(result);
    } catch (error) {
        return toApiErrorResponse(error);
    }
}
