"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/site/status-badge";
import type { OperatorAttentionJob, OperatorFailureItem, OperatorStaleJobs } from "../lib/types";

interface ApiErrorPayload {
    error?: {
        message?: string;
    };
}

export function OperatorActionsPanel({
    staleJobs,
    recentFailures,
    attentionJobs,
}: {
    staleJobs: OperatorStaleJobs;
    recentFailures: OperatorFailureItem[];
    attentionJobs: OperatorAttentionJob[];
}) {
    const router = useRouter();
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isPending, startTransition] = useTransition();

    function runAction(action: () => Promise<Response>, successMessage: string) {
        setMessage("");
        setErrorMessage("");

        startTransition(async () => {
            const response = await action();

            if (!response.ok) {
                const payload = (await response.json()) as ApiErrorPayload;
                setErrorMessage(payload.error?.message || "Unable to complete the operator action.");
                return;
            }

            setMessage(successMessage);
            router.refresh();
        });
    }

    return (
        <div className="space-y-6">
            <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="font-heading text-2xl font-bold text-brand-dark">Operator controls</h2>
                        <p className="mt-2 text-sm text-neutral-500">
                            Trigger manual recovery and intervene on jobs that need attention.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() =>
                            runAction(
                                () =>
                                    fetch("/api/dashboard/operations/recovery", {
                                        method: "POST",
                                    }),
                                "Stale-job recovery completed."
                            )
                        }
                        disabled={isPending}
                        className="rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                        Recover stale jobs
                    </button>
                </div>
                <p className="mt-4 text-sm text-neutral-600">
                    Currently tracking {staleJobs.staleCount} stale jobs with a {staleJobs.thresholdSeconds}s timeout threshold.
                </p>
                {message ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {message}
                    </div>
                ) : null}
                {errorMessage ? (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {errorMessage}
                    </div>
                ) : null}
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                    <h3 className="font-heading text-xl font-bold text-brand-dark">Retry failed jobs</h3>
                    <div className="mt-4 space-y-4">
                        {recentFailures.length === 0 ? (
                            <p className="rounded-2xl bg-neutral-50 px-4 py-5 text-sm text-neutral-500">
                                No failed jobs currently need operator replay.
                            </p>
                        ) : (
                            recentFailures.map((job) => (
                                <div
                                    key={job.id}
                                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-brand-dark">{job.ownerEmail || "Unknown owner"}</p>
                                            <p className="text-sm text-neutral-500">{job.createdAtLabel}</p>
                                        </div>
                                        <StatusBadge status={job.status} />
                                    </div>
                                    <p className="mt-3 text-sm text-neutral-600">
                                        {job.errorMessage || "No provider error message recorded."}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            runAction(
                                                () =>
                                                    fetch(`/api/dashboard/operations/jobs/${job.id}/retry`, {
                                                        method: "POST",
                                                    }),
                                                "Job requeued successfully."
                                            )
                                        }
                                        disabled={isPending}
                                        className="mt-4 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 disabled:opacity-60"
                                    >
                                        Retry job
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                    <h3 className="font-heading text-xl font-bold text-brand-dark">Cancel active jobs</h3>
                    <div className="mt-4 space-y-4">
                        {attentionJobs.length === 0 ? (
                            <p className="rounded-2xl bg-neutral-50 px-4 py-5 text-sm text-neutral-500">
                                No pending or processing jobs currently require intervention.
                            </p>
                        ) : (
                            attentionJobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-brand-dark">{job.ownerEmail || "Unknown owner"}</p>
                                            <p className="text-sm text-neutral-500">{job.createdAtLabel}</p>
                                        </div>
                                        <StatusBadge status={job.status} />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            runAction(
                                                () =>
                                                    fetch(`/api/dashboard/operations/jobs/${job.id}/cancel`, {
                                                        method: "POST",
                                                    }),
                                                "Job canceled successfully."
                                            )
                                        }
                                        disabled={isPending}
                                        className="mt-4 rounded-full border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 disabled:opacity-60"
                                    >
                                        Cancel job
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
