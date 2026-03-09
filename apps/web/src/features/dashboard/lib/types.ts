import type { JobStatus } from "@/lib/types";

export interface DashboardViewer {
    id: string;
    name: string;
    email: string;
}

export interface DashboardJob {
    id: string;
    name: string;
    createdAtLabel: string;
    status: JobStatus;
    provider: string;
    runtimeLabel: string;
}

export interface DashboardJobDetail extends DashboardJob {
    providerJobId: string | null;
    modelUsed: string | null;
    errorMessage: string | null;
    outputUrl: string | null;
    inputRef: string;
    metadata: Record<string, unknown>;
    completedAtLabel: string | null;
}

export interface DashboardApiKey {
    id: string;
    name: string;
    prefix: string;
    createdAtLabel: string;
    lastUsedAtLabel: string | null;
    status: "active" | "revoked";
}

export interface IssuedDashboardApiKey {
    key: DashboardApiKey;
    plainTextKey: string;
}

export interface DashboardStat {
    label: string;
    value: string;
    note: string;
}

export interface DashboardData {
    viewer: DashboardViewer;
    stats: DashboardStat[];
    jobs: DashboardJob[];
    apiKeys: DashboardApiKey[];
}

export interface OperatorQueueHealth {
    configured: boolean;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
}

export interface OperatorStaleJobs {
    staleCount: number;
    oldestStaleJobAgeSeconds: number;
    thresholdSeconds: number;
}

export interface OperatorFailureItem {
    id: string;
    status: JobStatus;
    errorMessage: string | null;
    createdAtLabel: string;
    ownerEmail: string | null;
}

export interface OperatorDashboardData {
    authorized: boolean;
    viewer: DashboardViewer;
    queue: OperatorQueueHealth;
    staleJobs: OperatorStaleJobs;
    recentFailures: OperatorFailureItem[];
}
