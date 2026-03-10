import { NextResponse } from "next/server";
import {
    getStaleToolJobSummary,
    getToolQueueHealth,
} from "@repo/core/jobs";

export async function GET() {
    const [queue, staleJobs] = await Promise.all([
        getToolQueueHealth(),
        getStaleToolJobSummary(),
    ]);

    const healthy = queue.configured && staleJobs.oldestStaleJobAgeSeconds < staleJobs.thresholdSeconds;

    return NextResponse.json(
        {
            healthy,
            checkedAt: new Date().toISOString(),
        },
        { status: healthy ? 200 : 503 }
    );
}
