import "server-only";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@repo/core/auth/server";
import { cancelBackgroundRemoval } from "@repo/core/ai-provider/replicate";
import { cancelQueuedToolJob, enqueueToolJob, processToolJobExecution, recoverStaleToolJobs } from "@repo/core/jobs";
import { db, jobs } from "@repo/database";
import { isAuthConfigured, isBackgroundQueueConfigured, isDatabaseConfigured, isOperatorEmail } from "@repo/core/env";
import { apiRouteError } from "@/lib/server/api";

function parseMetadata(value: string | null) {
    if (!value) {
        return {};
    }

    try {
        return JSON.parse(value) as Record<string, unknown>;
    } catch {
        return {};
    }
}

export async function requireOperatorSession() {
    if (!isDatabaseConfigured() || !isAuthConfigured()) {
        throw apiRouteError({
            status: 503,
            code: "SERVICE_UNAVAILABLE",
            message: "Operator actions are unavailable because auth or database configuration is missing.",
        });
    }

    const requestHeaders = await headers();
    const session = await auth.api.getSession({
        headers: requestHeaders,
    });

    if (!session) {
        throw apiRouteError({
            status: 401,
            code: "UNAUTHORIZED",
            message: "You must be signed in to use operator actions.",
        });
    }

    if (!isOperatorEmail(session.user.email)) {
        throw apiRouteError({
            status: 403,
            code: "FORBIDDEN",
            message: "This action is restricted to configured operator accounts.",
        });
    }

    return session;
}

export async function recoverStaleJobsAsOperator() {
    await requireOperatorSession();
    return recoverStaleToolJobs();
}

export async function retryJobAsOperator(jobId: string) {
    await requireOperatorSession();

    const row = await db.query.jobs.findFirst({
        where: (table, { eq: equals }) => equals(table.id, jobId),
    });

    if (!row) {
        throw apiRouteError({
            status: 404,
            code: "TOOL_JOB_NOT_FOUND",
            message: "Job not found.",
        });
    }

    if (row.status !== "failed" && row.status !== "canceled") {
        throw apiRouteError({
            status: 409,
            code: "INVALID_JOB_STATUS",
            message: "Only failed or canceled jobs can be retried.",
        });
    }

    const metadata = parseMetadata(row.metadata);

    await db
        .update(jobs)
        .set({
            status: "pending",
            errorMessage: null,
            providerJobId: null,
            outputUrl: null,
            completedAt: null,
            metadata: JSON.stringify({
                ...metadata,
                retriedAt: new Date().toISOString(),
                retryCount: Number(metadata.retryCount || 0) + 1,
                operatorRetriedAt: new Date().toISOString(),
            }),
        })
        .where(eq(jobs.id, jobId));

    if (isBackgroundQueueConfigured()) {
        await enqueueToolJob({
            jobId,
            inputUrl: row.inputUrl,
            toolName: "background-remover",
            metadata: {
                filename: row.inputUrl.split("/").pop() || `${row.id}.png`,
                operatorTriggered: true,
            },
        });
    } else {
        await processToolJobExecution(jobId);
    }

    return { jobId };
}

export async function cancelJobAsOperator(jobId: string) {
    await requireOperatorSession();

    const row = await db.query.jobs.findFirst({
        where: (table, { eq: equals }) => equals(table.id, jobId),
    });

    if (!row) {
        throw apiRouteError({
            status: 404,
            code: "TOOL_JOB_NOT_FOUND",
            message: "Job not found.",
        });
    }

    const metadata = parseMetadata(row.metadata);

    if (row.status === "pending") {
        await cancelQueuedToolJob(jobId);
    } else if (row.status === "processing" && row.provider === "replicate" && row.providerJobId) {
        await cancelBackgroundRemoval(row.providerJobId);
    } else {
        throw apiRouteError({
            status: 409,
            code: "JOB_CANNOT_BE_CANCELED",
            message: "This job can no longer be canceled.",
        });
    }

    await db
        .update(jobs)
        .set({
            status: "canceled",
            completedAt: new Date(),
            errorMessage: "Canceled by operator.",
            metadata: JSON.stringify({
                ...metadata,
                canceledAt: new Date().toISOString(),
                operatorCanceledAt: new Date().toISOString(),
            }),
        })
        .where(eq(jobs.id, jobId));

    return { jobId };
}
