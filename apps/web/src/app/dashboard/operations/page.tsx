import Link from "next/link";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { StatusBadge } from "@/components/site/status-badge";
import { getOperatorDashboardData } from "@/features/dashboard/lib/server/dashboard-data";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function DashboardOperationsPage() {
    const data = await getOperatorDashboardData();

    return (
        <DashboardShell
            title="Operations"
            description="Queue health, stale-job recovery, and recent worker failures for operator use."
        >
            {!data.authorized ? (
                <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
                    This view is restricted to operator accounts. Add your email to <code>ADMIN_EMAILS</code> to
                    unlock the queue and worker surfaces.
                </div>
            ) : (
                <>
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                            <p className="text-sm text-neutral-500">Queue configured</p>
                            <p className="mt-3 font-heading text-4xl font-bold text-brand-dark">
                                {data.queue.configured ? "Yes" : "No"}
                            </p>
                            <p className="mt-3 text-sm text-neutral-500">
                                Redis-backed worker execution and enqueue processing status.
                            </p>
                        </div>
                        <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                            <p className="text-sm text-neutral-500">Waiting jobs</p>
                            <p className="mt-3 font-heading text-4xl font-bold text-brand-dark">{data.queue.waiting}</p>
                            <p className="mt-3 text-sm text-neutral-500">Jobs waiting to be picked up by BullMQ workers.</p>
                        </div>
                        <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                            <p className="text-sm text-neutral-500">Active jobs</p>
                            <p className="mt-3 font-heading text-4xl font-bold text-brand-dark">{data.queue.active}</p>
                            <p className="mt-3 text-sm text-neutral-500">Predictions currently in flight or being dispatched.</p>
                        </div>
                        <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                            <p className="text-sm text-neutral-500">Stale jobs</p>
                            <p className="mt-3 font-heading text-4xl font-bold text-brand-dark">{data.staleJobs.staleCount}</p>
                            <p className="mt-3 text-sm text-neutral-500">
                                Oldest stale job: {data.staleJobs.oldestStaleJobAgeSeconds}s. Threshold:{" "}
                                {data.staleJobs.thresholdSeconds}s.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="font-heading text-2xl font-bold text-brand-dark">Recent failures</h2>
                                <p className="mt-2 text-sm text-neutral-500">
                                    Failed jobs across the workspace so operators can inspect and replay them quickly.
                                </p>
                            </div>
                            <Link
                                href={routes.dashboardJobs}
                                className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700"
                            >
                                View all jobs
                            </Link>
                        </div>

                        {data.recentFailures.length === 0 ? (
                            <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-500">
                                No failed jobs recorded. Queue recovery and provider execution are currently healthy.
                            </div>
                        ) : (
                            <div className="mt-6 space-y-4">
                                {data.recentFailures.map((failure) => (
                                    <div
                                        key={failure.id}
                                        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-neutral-50 p-4"
                                    >
                                        <div>
                                            <p className="font-semibold text-brand-dark">{failure.ownerEmail || "Unknown owner"}</p>
                                            <p className="text-sm text-neutral-500">{failure.createdAtLabel}</p>
                                            <p className="mt-2 text-sm text-neutral-600">
                                                {failure.errorMessage || "No provider error message recorded."}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <StatusBadge status={failure.status} />
                                            <Link
                                                href={routes.dashboardJob(failure.id)}
                                                className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700"
                                            >
                                                Inspect job
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </DashboardShell>
    );
}
