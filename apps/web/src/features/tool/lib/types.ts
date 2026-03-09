import type { JobStatus } from "@/lib/types";

export interface ToolJobDto {
    id: string;
    status: JobStatus;
    filename: string;
    createdAt: string;
    provider: string | null;
    errorMessage: string | null;
    outputUrl: string | null;
}

export interface ToolCreateJobResponse {
    job: ToolJobDto;
}

export interface ApiErrorPayload {
    error?: {
        code?: string;
        message?: string;
        details?: unknown;
    };
}
