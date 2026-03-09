"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui";
import type { ApiErrorPayload } from "@/features/tool/lib/types";
import type { DashboardJobDetail } from "../lib/types";

export function JobDetailActions({ job }: { job: DashboardJobDetail }) {
    const router = useRouter();
    const [message, setMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const canRetry = job.status === "failed" || job.status === "canceled";
    const canCancel = job.status === "pending" || job.status === "processing";

    async function runAction(action: "retry" | "cancel") {
        setMessage(null);

        const response = await fetch(`/api/background-remover/jobs/${job.id}/${action}`, {
            method: "POST",
        });

        const payload = (await response.json()) as ApiErrorPayload;

        if (!response.ok) {
            setMessage(payload.error?.message || `Unable to ${action} this job.`);
            return;
        }

        setMessage(action === "retry" ? "Job retried successfully." : "Job canceled successfully.");
        router.refresh();
    }

    if (!canRetry && !canCancel) {
        return null;
    }

    return (
        <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="font-heading text-2xl font-bold text-brand-dark">Actions</h3>
            <div className="mt-6 flex flex-wrap gap-3">
                {canRetry ? (
                    <Button
                        onClick={() => {
                            startTransition(async () => {
                                await runAction("retry");
                            });
                        }}
                        disabled={isPending}
                    >
                        {isPending ? "Working..." : "Retry job"}
                    </Button>
                ) : null}
                {canCancel ? (
                    <Button
                        variant="outline"
                        onClick={() => {
                            startTransition(async () => {
                                await runAction("cancel");
                            });
                        }}
                        disabled={isPending}
                    >
                        {isPending ? "Working..." : "Cancel job"}
                    </Button>
                ) : null}
            </div>
            {message ? <p className="mt-4 text-sm text-neutral-600">{message}</p> : null}
        </div>
    );
}
