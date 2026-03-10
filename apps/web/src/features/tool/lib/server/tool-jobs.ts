import "server-only";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { jobs, db } from "@repo/database";
import { auth } from "@repo/core/auth/server";
import { cancelQueuedToolJob, enqueueToolJob } from "@repo/core/jobs";
import { processToolJobExecution } from "@repo/core/jobs";
import { cancelBackgroundRemoval } from "@repo/core/ai-provider/replicate";
import {
    isAuthConfigured,
    isBackgroundQueueConfigured,
    isDatabaseConfigured,
} from "@repo/core/env";
import { createRequestLogger } from "@repo/core/logger";
import { getPresignedDownloadUrl } from "@repo/core/r2";
import { isLocalToolAsset, storeToolAsset } from "@repo/core/storage";
import { toolConfig } from "@config/tool";
import { apiRouteError } from "@/lib/server/api";
import type { JobStatus } from "@/lib/types";
import type { ToolCreateJobResponse, ToolJobDto } from "../types";

const queueEnabled = isBackgroundQueueConfigured();

function formatDate(value: Date) {
    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(value);
}

function sanitizeFilename(filename: string) {
    return filename.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

function inferStatus(status: string): JobStatus {
    switch (status) {
        case "uploading":
        case "processing":
        case "succeeded":
        case "failed":
        case "canceled":
            return status;
        default:
            return "pending";
    }
}

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

async function dispatchJob(jobId: string, inputUrl: string, filename: string) {
    if (queueEnabled) {
        await db
            .update(jobs)
            .set({
                status: "pending",
                provider: "replicate",
            })
            .where(eq(jobs.id, jobId));

        await enqueueToolJob({
            jobId,
            inputUrl,
            toolName: toolConfig.slug,
            metadata: {
                filename,
            },
        });

        return;
    }

    await processToolJobExecution(jobId);
}

function mapJob(row: typeof jobs.$inferSelect): ToolJobDto {
    return {
        id: row.id,
        status: inferStatus(row.status),
        filename: row.inputUrl.split("/").pop() || row.inputUrl,
        createdAt: formatDate(row.createdAt),
        provider: row.provider,
        errorMessage: row.errorMessage,
        outputUrl: null,
    };
}

export async function requireToolSession() {
    if (!isDatabaseConfigured() || !isAuthConfigured()) {
        return null;
    }

    const requestHeaders = await headers();

    let session = null;

    try {
        session = await auth.api.getSession({
            headers: requestHeaders,
        });
    } catch {
        return null;
    }

    if (!session) {
        return null;
    }

    return session;
}

export async function getToolJob(jobId: string, userId: string) {
    if (!isDatabaseConfigured()) {
        throw apiRouteError({
            status: 503,
            code: "SERVICE_UNAVAILABLE",
            message: "Tool jobs are unavailable because the database is not configured.",
        });
    }

    const row = await db.query.jobs.findFirst({
        where: (table, { and, eq: equals }) => and(equals(table.id, jobId), equals(table.userId, userId)),
    });

    if (!row) {
        throw apiRouteError({
            status: 404,
            code: "TOOL_JOB_NOT_FOUND",
            message: "Tool job not found.",
        });
    }

    const mappedJob = mapJob(row);

    if (!row.outputUrl) {
        return mappedJob;
    }

    if (isLocalToolAsset(row.outputUrl)) {
        return {
            ...mappedJob,
            outputUrl: `/api/background-remover/jobs/${row.id}/output`,
        };
    }

    return {
        ...mappedJob,
        outputUrl: await getPresignedDownloadUrl(row.outputUrl.split(":").slice(2).join(":")),
    };
}

export async function listToolJobsForUser(userId: string, limit = 20) {
    if (!isDatabaseConfigured()) {
        throw apiRouteError({
            status: 503,
            code: "SERVICE_UNAVAILABLE",
            message: "Tool jobs are unavailable because the database is not configured.",
        });
    }

    const rows = await db.query.jobs.findMany({
        where: (table, { eq: equals }) => equals(table.userId, userId),
        orderBy: (table, { desc }) => desc(table.createdAt),
        limit,
    });

    return Promise.all(rows.map((row) => getToolJob(row.id, userId)));
}

export async function getToolJobOutputRef(jobId: string, userId: string) {
    if (!isDatabaseConfigured()) {
        throw apiRouteError({
            status: 503,
            code: "SERVICE_UNAVAILABLE",
            message: "Tool jobs are unavailable because the database is not configured.",
        });
    }

    const row = await db.query.jobs.findFirst({
        where: (table, { and, eq: equals }) => and(equals(table.id, jobId), equals(table.userId, userId)),
    });

    if (!row?.outputUrl) {
        throw apiRouteError({
            status: 404,
            code: "OUTPUT_NOT_FOUND",
            message: "Output not found.",
        });
    }

    return row.outputUrl;
}

export async function createToolJob(input: {
    file: File;
    ip?: string;
}): Promise<ToolCreateJobResponse> {
    const session = await requireToolSession();

    if (!session) {
        throw apiRouteError({
            status: 401,
            code: "UNAUTHORIZED",
            message: "You must be signed in to run the background remover.",
        });
    }

    return createToolJobForUser({
        userId: session.user.id,
        file: input.file,
        ip: input.ip,
        requestIdPrefix: "session",
    });
}

export async function createToolJobForUser(input: {
    userId: string;
    file: File;
    ip?: string;
    requestIdPrefix?: string;
    completionWebhookUrl?: string | null;
    completionWebhookSecret?: string | null;
}): Promise<ToolCreateJobResponse> {
    if (!isDatabaseConfigured()) {
        throw apiRouteError({
            status: 503,
            code: "SERVICE_UNAVAILABLE",
            message: "Tool jobs are unavailable because the database is not configured.",
        });
    }

    const file = input.file;
    const maxFileSizeBytes = toolConfig.input.maxFileSizeMB * 1024 * 1024;

    if (!toolConfig.input.acceptedMimeTypes.includes(file.type as (typeof toolConfig.input.acceptedMimeTypes)[number])) {
        throw apiRouteError({
            status: 400,
            code: "UNSUPPORTED_FILE_TYPE",
            message: "Unsupported file type for this tool.",
        });
    }

    if (file.size > maxFileSizeBytes) {
        throw apiRouteError({
            status: 400,
            code: "FILE_TOO_LARGE",
            message: "The selected file is larger than the allowed limit.",
        });
    }

    if (input.completionWebhookUrl) {
        try {
            new URL(input.completionWebhookUrl);
        } catch {
            throw apiRouteError({
                status: 400,
                code: "INVALID_WEBHOOK_URL",
                message: "completionWebhookUrl must be a valid URL.",
            });
        }
    }

    if (input.completionWebhookSecret && input.completionWebhookSecret.length > 255) {
        throw apiRouteError({
            status: 400,
            code: "INVALID_WEBHOOK_SECRET",
            message: "completionWebhookSecret must be 255 characters or fewer.",
        });
    }

    const jobId = randomUUID();
    const sanitizedFilename = sanitizeFilename(file.name || `upload-${jobId}.png`);
    const requestLogger = createRequestLogger({
        requestId: `${input.requestIdPrefix ?? "job"}-${jobId}`,
        endpoint: `/api/${toolConfig.slug}/jobs`,
        ip: input.ip,
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const storedInputRef = await storeToolAsset({
        key: `${toolConfig.slug}/${input.userId}/${jobId}/${sanitizedFilename}`,
        body: buffer,
        contentType: file.type,
    });

    const baseRecord = {
        id: jobId,
        userId: input.userId,
        idempotencyKey: `${input.userId}:${jobId}`,
        inputType: "image",
        inputUrl: storedInputRef,
        status: "uploading",
        ipAddress: input.ip ?? null,
        metadata: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            size: file.size,
            clientWebhookUrl: input.completionWebhookUrl ?? null,
            clientWebhookSecret: input.completionWebhookSecret ?? null,
        }),
    } satisfies typeof jobs.$inferInsert;

    await db.insert(jobs).values(baseRecord);

    try {
        await dispatchJob(jobId, storedInputRef, file.name);
    } catch (error) {
        requestLogger.error(
            {
                error: error instanceof Error ? error.message : "Unknown upload error",
            },
            "Tool job creation failed."
        );

        await db
            .update(jobs)
            .set({
                status: "failed",
                errorMessage:
                    error instanceof Error
                        ? error.message
                        : "Unable to upload and start the tool job.",
                completedAt: new Date(),
            })
            .where(eq(jobs.id, jobId));
    }

    const createdJob = await getToolJob(jobId, input.userId);

    return {
        job: createdJob,
    };
}

export async function retryToolJob(jobId: string, userId: string) {
    if (!isDatabaseConfigured()) {
        throw apiRouteError({
            status: 503,
            code: "SERVICE_UNAVAILABLE",
            message: "Tool jobs are unavailable because the database is not configured.",
        });
    }

    const row = await db.query.jobs.findFirst({
        where: (table, { and, eq: equals }) => and(equals(table.id, jobId), equals(table.userId, userId)),
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
            }),
        })
        .where(eq(jobs.id, jobId));

    await dispatchJob(jobId, row.inputUrl, row.inputUrl.split("/").pop() || `${row.id}.png`);

    return getToolJob(jobId, userId);
}

export async function cancelToolJob(jobId: string, userId: string) {
    if (!isDatabaseConfigured()) {
        throw apiRouteError({
            status: 503,
            code: "SERVICE_UNAVAILABLE",
            message: "Tool jobs are unavailable because the database is not configured.",
        });
    }

    const row = await db.query.jobs.findFirst({
        where: (table, { and, eq: equals }) => and(equals(table.id, jobId), equals(table.userId, userId)),
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

        await db
            .update(jobs)
            .set({
                status: "canceled",
                completedAt: new Date(),
                errorMessage: "Canceled by user before processing started.",
                metadata: JSON.stringify({
                    ...metadata,
                    canceledAt: new Date().toISOString(),
                }),
            })
            .where(eq(jobs.id, jobId));

        return getToolJob(jobId, userId);
    }

    if (row.status === "processing" && row.provider === "replicate" && row.providerJobId) {
        await cancelBackgroundRemoval(row.providerJobId);

        await db
            .update(jobs)
            .set({
                status: "canceled",
                completedAt: new Date(),
                errorMessage: "Canceled by user during provider execution.",
                metadata: JSON.stringify({
                    ...metadata,
                    canceledAt: new Date().toISOString(),
                }),
            })
            .where(eq(jobs.id, jobId));

        return getToolJob(jobId, userId);
    }

    throw apiRouteError({
        status: 409,
        code: "JOB_CANNOT_BE_CANCELED",
        message: "This job can no longer be canceled.",
    });
}
