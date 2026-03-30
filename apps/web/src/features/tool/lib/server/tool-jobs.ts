import "server-only";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { jobs, db } from "@repo/database";
import { auth } from "@repo/core/auth/server";
import { cancelQueuedToolJob, enqueueToolJob } from "@repo/core/jobs";
import { processToolJobExecution } from "@repo/core/jobs";
import { cancelBackgroundRemoval } from "@repo/core/ai-provider/replicate";
import { assertSafeWebhookUrl } from "@repo/core/security/safe-webhook-url";
import {
  isAuthConfigured,
  isBackgroundQueueConfigured,
  isDatabaseConfigured,
  isRedisConfigured,
  isProductionRuntime,
} from "@repo/core/env";
import { createRequestLogger } from "@repo/core/logger";
import { getPresignedDownloadUrl } from "@repo/core/r2";
import { isLocalToolAsset, storeToolAsset } from "@repo/core/storage";
import { rateLimitUser } from "@repo/core/redis";
import { logToolUsage } from "@repo/core";
import { toolConfig } from "@config/tool";
import { apiRouteError } from "@/lib/server/api";
import type { JobStatus } from "@/lib/types";
import type { ToolCreateJobResponse, ToolJobDto } from "../types";
import { validateImageUpload } from "./upload-validation";

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

function isUniqueConstraintViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

function normalizeIdempotencyKey(
  userId: string,
  value: string | null | undefined,
) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed.length > 120 || /[^\w.:-]/.test(trimmed)) {
    throw apiRouteError({
      status: 400,
      code: "INVALID_IDEMPOTENCY_KEY",
      message:
        "Idempotency-Key must be 1 to 120 characters and use only letters, numbers, dot, colon, underscore, or dash.",
    });
  }

  return `${userId}:${trimmed}`;
}

async function getExistingIdempotentJob(params: {
  userId: string;
  normalizedIdempotencyKey: string | null;
  inputSha256: string;
}) {
  const normalizedIdempotencyKey = params.normalizedIdempotencyKey;

  if (!normalizedIdempotencyKey) {
    return null;
  }

  const existing = await db.query.jobs.findFirst({
    where: (table, { and, eq: equals }) =>
      and(
        equals(table.userId, params.userId),
        equals(table.idempotencyKey, normalizedIdempotencyKey),
      ),
  });

  if (!existing) {
    return null;
  }

  const existingMetadata = parseMetadata(existing.metadata);

  if (
    typeof existingMetadata.inputSha256 === "string" &&
    existingMetadata.inputSha256 !== params.inputSha256
  ) {
    throw apiRouteError({
      status: 409,
      code: "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_INPUT",
      message:
        "This Idempotency-Key has already been used for a different file.",
    });
  }

  return getToolJob(existing.id, params.userId);
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
      message:
        "Tool jobs are unavailable because the database is not configured.",
    });
  }

  const row = await db.query.jobs.findFirst({
    where: (table, { and, eq: equals }) =>
      and(equals(table.id, jobId), equals(table.userId, userId)),
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
    outputUrl: await getPresignedDownloadUrl(
      row.outputUrl.split(":").slice(2).join(":"),
    ),
  };
}

export async function listToolJobsForUser(userId: string, limit = 20) {
  if (!isDatabaseConfigured()) {
    throw apiRouteError({
      status: 503,
      code: "SERVICE_UNAVAILABLE",
      message:
        "Tool jobs are unavailable because the database is not configured.",
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
      message:
        "Tool jobs are unavailable because the database is not configured.",
    });
  }

  const row = await db.query.jobs.findFirst({
    where: (table, { and, eq: equals }) =>
      and(equals(table.id, jobId), equals(table.userId, userId)),
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
  idempotencyKey?: string | null;
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
    idempotencyKey: input.idempotencyKey,
    requestIdPrefix: "session",
  });
}

export async function createToolJobForUser(input: {
  userId: string;
  file: File;
  ip?: string;
  requestIdPrefix?: string;
  idempotencyKey?: string | null;
  completionWebhookUrl?: string | null;
  completionWebhookSecret?: string | null;
}): Promise<ToolCreateJobResponse> {
  if (!isDatabaseConfigured()) {
    throw apiRouteError({
      status: 503,
      code: "SERVICE_UNAVAILABLE",
      message:
        "Tool jobs are unavailable because the database is not configured.",
    });
  }

  if (isRedisConfigured()) {
    const hourInSeconds = 3600;
    const dayInSeconds = 86400;

    const hourlyIdentifier = `tool:${toolConfig.slug}:user:${input.userId}:hourly`;
    const hourlyResult = await rateLimitUser(hourlyIdentifier, {
      maxRequests: toolConfig.rateLimit.maxRequestsPerHour,
      windowSeconds: hourInSeconds,
    });

    if (!hourlyResult.allowed) {
      throw apiRouteError({
        status: 429,
        code: "RATE_LIMIT_EXCEEDED_HOURLY",
        message: `You have exceeded the hourly limit of ${toolConfig.rateLimit.maxRequestsPerHour} requests for this tool. Please try again later.`,
        details: {
          remaining: hourlyResult.remaining,
          resetAt: hourlyResult.resetAt,
          limit: toolConfig.rateLimit.maxRequestsPerHour,
          window: "hour",
        },
      });
    }

    const dailyIdentifier = `tool:${toolConfig.slug}:user:${input.userId}:daily`;
    const dailyResult = await rateLimitUser(dailyIdentifier, {
      maxRequests: toolConfig.rateLimit.maxRequestsPerDay,
      windowSeconds: dayInSeconds,
    });

    if (!dailyResult.allowed) {
      throw apiRouteError({
        status: 429,
        code: "RATE_LIMIT_EXCEEDED_DAILY",
        message: `You have exceeded the daily limit of ${toolConfig.rateLimit.maxRequestsPerDay} requests for this tool. Please try again tomorrow.`,
        details: {
          remaining: dailyResult.remaining,
          resetAt: dailyResult.resetAt,
          limit: toolConfig.rateLimit.maxRequestsPerDay,
          window: "day",
        },
      });
    }
  } else if (isProductionRuntime()) {
    throw apiRouteError({
      status: 503,
      code: "RATE_LIMITING_UNAVAILABLE",
      message: "Rate limiting is unavailable because Redis is not configured.",
    });
  }

  const file = input.file;
  const maxFileSizeBytes = toolConfig.input.maxFileSizeMB * 1024 * 1024;

  if (file.size > maxFileSizeBytes) {
    throw apiRouteError({
      status: 400,
      code: "FILE_TOO_LARGE",
      message: "The selected file is larger than the allowed limit.",
    });
  }

  if (input.completionWebhookUrl) {
    try {
      await assertSafeWebhookUrl(input.completionWebhookUrl);
    } catch {
      throw apiRouteError({
        status: 400,
        code: "INVALID_WEBHOOK_URL",
        message: "completionWebhookUrl must be a valid URL.",
      });
    }
  }

  if (
    input.completionWebhookSecret &&
    input.completionWebhookSecret.length > 255
  ) {
    throw apiRouteError({
      status: 400,
      code: "INVALID_WEBHOOK_SECRET",
      message: "completionWebhookSecret must be 255 characters or fewer.",
    });
  }

  const validatedUpload = await validateImageUpload(file);

  if (
    !toolConfig.input.acceptedMimeTypes.includes(
      validatedUpload.detectedMimeType as (typeof toolConfig.input.acceptedMimeTypes)[number],
    )
  ) {
    throw apiRouteError({
      status: 400,
      code: "UNSUPPORTED_FILE_TYPE",
      message: "Unsupported file type for this tool.",
    });
  }

  const normalizedIdempotencyKey = normalizeIdempotencyKey(
    input.userId,
    input.idempotencyKey,
  );
  const existingJob = await getExistingIdempotentJob({
    userId: input.userId,
    normalizedIdempotencyKey,
    inputSha256: validatedUpload.sha256,
  });

  if (existingJob) {
    return {
      job: existingJob,
    };
  }

  const jobId = randomUUID();
  const sanitizedFilename = sanitizeFilename(
    file.name || `upload-${jobId}.png`,
  );
  const persistedIdempotencyKey =
    normalizedIdempotencyKey ?? `${input.userId}:${jobId}`;
  const requestLogger = createRequestLogger({
    requestId: `${input.requestIdPrefix ?? "job"}-${jobId}`,
    endpoint: `/api/${toolConfig.slug}/jobs`,
    ip: input.ip,
  });

  const storedInputRef = await storeToolAsset({
    key: `${toolConfig.slug}/${input.userId}/${jobId}/${sanitizedFilename}`,
    body: validatedUpload.buffer,
    contentType: validatedUpload.detectedMimeType,
  });

  const baseRecord = {
    id: jobId,
    userId: input.userId,
    idempotencyKey: persistedIdempotencyKey,
    inputType: "image",
    inputUrl: storedInputRef,
    status: "uploading",
    ipAddress: input.ip ?? null,
    metadata: JSON.stringify({
      filename: file.name,
      contentType: validatedUpload.detectedMimeType,
      clientContentType: file.type || null,
      size: file.size,
      inputSha256: validatedUpload.sha256,
      clientWebhookUrl: input.completionWebhookUrl ?? null,
      clientWebhookSecret: input.completionWebhookSecret ?? null,
    }),
  } satisfies typeof jobs.$inferInsert;

  try {
    await db.insert(jobs).values(baseRecord);
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      const raceRecoveredJob = await getExistingIdempotentJob({
        userId: input.userId,
        normalizedIdempotencyKey: persistedIdempotencyKey,
        inputSha256: validatedUpload.sha256,
      });

      if (raceRecoveredJob) {
        return {
          job: raceRecoveredJob,
        };
      }
    }

    throw error;
  }

  await logToolUsage({
    userId: input.userId,
    toolName: toolConfig.slug,
    action: "job_created",
    ipAddress: input.ip,
    metadata: {
      jobId,
      fileSize: file.size,
      contentType: validatedUpload.detectedMimeType,
    },
  });

  try {
    await dispatchJob(jobId, storedInputRef, file.name);
  } catch (error) {
    requestLogger.error(
      {
        error: error instanceof Error ? error.message : "Unknown upload error",
      },
      "Tool job creation failed.",
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
      message:
        "Tool jobs are unavailable because the database is not configured.",
    });
  }

  const row = await db.query.jobs.findFirst({
    where: (table, { and, eq: equals }) =>
      and(equals(table.id, jobId), equals(table.userId, userId)),
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
  const retryCount = Number(metadata.retryCount || 0);
  const maxRetries = toolConfig.processing.retries;

  if (retryCount >= maxRetries) {
    throw apiRouteError({
      status: 429,
      code: "MAX_RETRIES_EXCEEDED",
      message: `This job has exceeded the maximum retry limit of ${maxRetries} attempts.`,
    });
  }

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
        retryCount: retryCount + 1,
      }),
    })
    .where(eq(jobs.id, jobId));

  await dispatchJob(
    jobId,
    row.inputUrl,
    row.inputUrl.split("/").pop() || `${row.id}.png`,
  );

  return getToolJob(jobId, userId);
}

export async function cancelToolJob(jobId: string, userId: string) {
  if (!isDatabaseConfigured()) {
    throw apiRouteError({
      status: 503,
      code: "SERVICE_UNAVAILABLE",
      message:
        "Tool jobs are unavailable because the database is not configured.",
    });
  }

  const row = await db.query.jobs.findFirst({
    where: (table, { and, eq: equals }) =>
      and(equals(table.id, jobId), equals(table.userId, userId)),
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

  if (
    row.status === "processing" &&
    row.provider === "replicate" &&
    row.providerJobId
  ) {
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
