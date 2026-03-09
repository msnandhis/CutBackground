import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { apiKeys, db, jobs, users } from "@repo/database";
import { getPresignedDownloadUrl } from "@repo/core/r2";
import { isLocalToolAsset } from "@repo/core/storage";
import { auth } from "@repo/core/auth/server";
import { getStaleToolJobSummary, getToolQueueHealth } from "@repo/core/jobs";
import { isAuthConfigured, isDatabaseConfigured, isOperatorEmail } from "@repo/core/env";
import { routes } from "@/lib/routes";
import type { JobStatus } from "@/lib/types";
import type {
    DashboardApiKey,
    DashboardData,
    DashboardJob,
    DashboardJobDetail,
    OperatorDashboardData,
    OperatorFailureItem,
    DashboardStat,
    DashboardViewer,
} from "../types";

const jobStatuses: JobStatus[] = [
    "pending",
    "uploading",
    "processing",
    "succeeded",
    "failed",
    "canceled",
];

function formatDate(value: Date) {
    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(value);
}

function formatRuntime(createdAt: Date, completedAt: Date | null) {
    if (!completedAt) {
        return "Queued";
    }

    const seconds = Math.max(
        1,
        Math.round((completedAt.getTime() - createdAt.getTime()) / 1000)
    );

    return `${seconds}s`;
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

async function resolveOutputUrl(jobId: string, outputUrl: string | null) {
    if (!outputUrl) {
        return null;
    }

    if (isLocalToolAsset(outputUrl)) {
        return `/api/background-remover/jobs/${jobId}/output`;
    }

    if (outputUrl.startsWith("r2:")) {
        return getPresignedDownloadUrl(outputUrl.split(":").slice(2).join(":"));
    }

    return outputUrl;
}

function toDashboardJob(row: typeof jobs.$inferSelect): DashboardJob {
    const status = jobStatuses.includes(row.status as JobStatus)
        ? (row.status as JobStatus)
        : "pending";

    return {
        id: row.id,
        name: row.inputUrl.split("/").pop() || row.inputUrl,
        createdAtLabel: formatDate(row.createdAt),
        status,
        provider: row.provider || "unassigned",
        runtimeLabel: formatRuntime(row.createdAt, row.completedAt ?? null),
    };
}

async function toDashboardJobDetail(row: typeof jobs.$inferSelect): Promise<DashboardJobDetail> {
    const summary = toDashboardJob(row);

    return {
        ...summary,
        providerJobId: row.providerJobId,
        modelUsed: row.modelUsed,
        errorMessage: row.errorMessage,
        outputUrl: await resolveOutputUrl(row.id, row.outputUrl),
        inputRef: row.inputUrl,
        metadata: parseMetadata(row.metadata),
        completedAtLabel: row.completedAt ? formatDate(row.completedAt) : null,
    };
}

function toDashboardApiKey(row: typeof apiKeys.$inferSelect): DashboardApiKey {
    return {
        id: row.id,
        name: row.name,
        prefix: row.keyPrefix,
        createdAtLabel: formatDate(row.createdAt),
        lastUsedAtLabel: row.lastUsedAt ? formatDate(row.lastUsedAt) : null,
        status: row.revokedAt ? "revoked" : "active",
    };
}

function toOperatorFailureItem(row: typeof jobs.$inferSelect & { ownerEmail: string | null }): OperatorFailureItem {
    return {
        id: row.id,
        status: row.status as JobStatus,
        errorMessage: row.errorMessage,
        createdAtLabel: formatDate(row.createdAt),
        ownerEmail: row.ownerEmail,
    };
}

function buildStats(jobsData: DashboardJob[], apiKeysData: DashboardApiKey[]): DashboardStat[] {
    const totalJobs = jobsData.length;
    const completedJobs = jobsData.filter((job) => job.status === "succeeded").length;
    const failedJobs = jobsData.filter((job) => job.status === "failed").length;
    const activeApiKeys = apiKeysData.filter((key) => key.status === "active").length;
    const successRate = totalJobs === 0 ? 0 : Math.round((completedJobs / totalJobs) * 1000) / 10;

    return [
        {
            label: "Total jobs",
            value: totalJobs.toString(),
            note: "Tracked for the authenticated workspace",
        },
        {
            label: "Completed jobs",
            value: completedJobs.toString(),
            note: failedJobs > 0 ? `${failedJobs} failed jobs need review` : "No failed jobs recorded",
        },
        {
            label: "Success rate",
            value: `${successRate}%`,
            note: totalJobs > 0 ? "Based on current recorded job history" : "Will update after the first run",
        },
        {
            label: "Active API keys",
            value: activeApiKeys.toString(),
            note:
                activeApiKeys > 0
                    ? "Keys currently available for automation and API use"
                    : "Create keys once the management endpoint is added",
        },
    ];
}

export const getDashboardData = cache(async (): Promise<DashboardData> => {
    if (!isDatabaseConfigured() || !isAuthConfigured()) {
        redirect(`${routes.login}?redirectTo=${encodeURIComponent(routes.dashboard)}`);
    }

    const requestHeaders = await headers();
    let session = null;

    try {
        session = await auth.api.getSession({
            headers: requestHeaders,
        });
    } catch {
        redirect(`${routes.login}?redirectTo=${encodeURIComponent(routes.dashboard)}`);
    }

    if (!session) {
        redirect(`${routes.login}?redirectTo=${encodeURIComponent(routes.dashboard)}`);
    }

    const viewer: DashboardViewer = {
        id: session.user.id,
        name: session.user.name || "Workspace user",
        email: session.user.email,
    };

    let jobsData: DashboardJob[] = [];
    let apiKeysData: DashboardApiKey[] = [];

    try {
        const [jobRows, apiKeyRows] = await Promise.all([
            db
                .select()
                .from(jobs)
                .where(eq(jobs.userId, viewer.id))
                .orderBy(desc(jobs.createdAt))
                .limit(12),
            db
                .select()
                .from(apiKeys)
                .where(eq(apiKeys.userId, viewer.id))
                .orderBy(desc(apiKeys.createdAt))
                .limit(12),
        ]);

        jobsData = jobRows.map(toDashboardJob);
        apiKeysData = apiKeyRows.map(toDashboardApiKey);
    } catch {
        jobsData = [];
        apiKeysData = [];
    }

    return {
        viewer,
        jobs: jobsData,
        apiKeys: apiKeysData,
        stats: buildStats(jobsData, apiKeysData),
    };
});

export async function getDashboardJobDetail(jobId: string) {
    if (!isDatabaseConfigured() || !isAuthConfigured()) {
        redirect(`${routes.login}?redirectTo=${encodeURIComponent(routes.dashboardJob(jobId))}`);
    }

    const requestHeaders = await headers();
    let session = null;

    try {
        session = await auth.api.getSession({
            headers: requestHeaders,
        });
    } catch {
        redirect(`${routes.login}?redirectTo=${encodeURIComponent(routes.dashboardJob(jobId))}`);
    }

    if (!session) {
        redirect(`${routes.login}?redirectTo=${encodeURIComponent(routes.dashboardJob(jobId))}`);
    }

    const row = await db.query.jobs.findFirst({
        where: (table, { and, eq: equals }) =>
            and(equals(table.id, jobId), equals(table.userId, session.user.id)),
    });

    if (!row) {
        return null;
    }

    return toDashboardJobDetail(row);
}

export async function getOperatorDashboardData(): Promise<OperatorDashboardData> {
    if (!isDatabaseConfigured() || !isAuthConfigured()) {
        redirect(`${routes.login}?redirectTo=${encodeURIComponent(routes.dashboardOperations)}`);
    }

    const requestHeaders = await headers();
    let session = null;

    try {
        session = await auth.api.getSession({
            headers: requestHeaders,
        });
    } catch {
        redirect(`${routes.login}?redirectTo=${encodeURIComponent(routes.dashboardOperations)}`);
    }

    if (!session) {
        redirect(`${routes.login}?redirectTo=${encodeURIComponent(routes.dashboardOperations)}`);
    }

    const viewer: DashboardViewer = {
        id: session.user.id,
        name: session.user.name || "Workspace user",
        email: session.user.email,
    };

    const authorized = isOperatorEmail(viewer.email);

    if (!authorized) {
        return {
            authorized: false,
            viewer,
            queue: {
                configured: false,
                waiting: 0,
                active: 0,
                completed: 0,
                failed: 0,
            },
            staleJobs: {
                staleCount: 0,
                oldestStaleJobAgeSeconds: 0,
                thresholdSeconds: 0,
            },
            recentFailures: [],
        };
    }

    const [queue, staleJobs, failureRows] = await Promise.all([
        getToolQueueHealth(),
        getStaleToolJobSummary(),
        db
            .select({
                id: jobs.id,
                userId: jobs.userId,
                idempotencyKey: jobs.idempotencyKey,
                inputType: jobs.inputType,
                inputUrl: jobs.inputUrl,
                outputUrl: jobs.outputUrl,
                status: jobs.status,
                provider: jobs.provider,
                providerJobId: jobs.providerJobId,
                modelUsed: jobs.modelUsed,
                errorMessage: jobs.errorMessage,
                metadata: jobs.metadata,
                ipAddress: jobs.ipAddress,
                fingerprint: jobs.fingerprint,
                createdAt: jobs.createdAt,
                completedAt: jobs.completedAt,
                ownerEmail: users.email,
            })
            .from(jobs)
            .leftJoin(users, eq(users.id, jobs.userId))
            .where(eq(jobs.status, "failed"))
            .orderBy(desc(jobs.createdAt))
            .limit(8),
    ]);

    return {
        authorized: true,
        viewer,
        queue,
        staleJobs,
        recentFailures: failureRows.map(toOperatorFailureItem),
    };
}
