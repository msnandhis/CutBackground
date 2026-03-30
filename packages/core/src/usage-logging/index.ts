import "server-only";

import { db, usageLogs } from "@repo/database";

export type ToolUsageAction =
  | "job_created"
  | "job_completed"
  | "job_failed"
  | "job_canceled"
  | "job_retried";

export async function logToolUsage(params: {
  userId: string | null;
  toolName: string;
  action: ToolUsageAction;
  ipAddress?: string | null;
  fingerprint?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(usageLogs).values({
      userId: params.userId,
      toolName: params.toolName,
      action: params.action,
      ipAddress: params.ipAddress ?? null,
      fingerprint: params.fingerprint ?? null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    });
  } catch (error) {
    console.error("Failed to log tool usage:", error);
  }
}
