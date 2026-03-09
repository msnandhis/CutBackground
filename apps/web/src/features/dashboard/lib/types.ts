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
