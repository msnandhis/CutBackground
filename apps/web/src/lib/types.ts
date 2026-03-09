export type JobStatus =
    | "pending"
    | "uploading"
    | "processing"
    | "succeeded"
    | "failed"
    | "canceled";

export interface MockJob {
    id: string;
    name: string;
    createdAt: string;
    status: JobStatus;
    provider: string;
    inputType: "image" | "video";
    outputFormat: "png" | "webp";
    processingSeconds: number;
}

export interface MockApiKey {
    id: string;
    name: string;
    prefix: string;
    lastUsedAt: string | null;
    createdAt: string;
    status: "active" | "revoked";
}

export interface MockPlan {
    name: string;
    credits: string;
    price: string;
    description: string;
    features: string[];
    highlight?: boolean;
}
