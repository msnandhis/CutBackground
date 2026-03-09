import Link from "next/link";
import { Button } from "@repo/ui";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { StatusBadge } from "@/components/site/status-badge";
import { JobDetailActions } from "@/features/dashboard/components/job-detail-actions";
import { getDashboardJobDetail } from "@/features/dashboard/lib/server/dashboard-data";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";

function renderMetadataValue(value: unknown) {
    if (value == null) {
        return "n/a";
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }

    return JSON.stringify(value);
}

export default async function DashboardJobDetailPage({
    params,
}: {
    params: Promise<{ jobId: string }>;
}) {
    const { jobId } = await params;
    const job = await getDashboardJobDetail(jobId);

    return (
        <DashboardShell
            title="Job detail"
            description="Provider execution detail, retries, timings, and output access for a single processed job."
        >
            {!job ? (
                <div className="rounded-[2rem] border border-dashed border-neutral-300 bg-white p-10 text-center shadow-sm">
                    <h2 className="text-xl font-semibold text-brand-dark">Job not found</h2>
                    <p className="mt-3 text-sm text-neutral-500">
                        The requested job does not exist for this workspace or is no longer available.
                    </p>
                    <div className="mt-6">
                        <Link href={routes.dashboardJobs}>
                            <Button>Back to job history</Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-sm text-neutral-500">{job.id}</p>
                                <h2 className="mt-2 font-heading text-3xl font-bold text-brand-dark">
                                    {job.name}
                                </h2>
                                <p className="mt-3 text-sm text-neutral-500">
                                    Created {job.createdAtLabel}
                                    {job.completedAtLabel ? ` • Completed ${job.completedAtLabel}` : ""}
                                </p>
                            </div>
                            <StatusBadge status={job.status} />
                        </div>
                    </div>

                    <JobDetailActions job={job} />

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                            <h3 className="font-heading text-2xl font-bold text-brand-dark">
                                Execution summary
                            </h3>
                            <dl className="mt-6 space-y-4 text-sm">
                                <div className="flex justify-between gap-4">
                                    <dt className="text-neutral-500">Provider</dt>
                                    <dd className="text-brand-dark">{job.provider}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-neutral-500">Provider job ID</dt>
                                    <dd className="font-mono text-brand-dark">
                                        {job.providerJobId || "n/a"}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-neutral-500">Model</dt>
                                    <dd className="text-brand-dark">{job.modelUsed || "n/a"}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-neutral-500">Runtime</dt>
                                    <dd className="text-brand-dark">{job.runtimeLabel}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-neutral-500">Input reference</dt>
                                    <dd className="max-w-[60%] truncate font-mono text-brand-dark">
                                        {job.inputRef}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                            <h3 className="font-heading text-2xl font-bold text-brand-dark">
                                Output and recovery
                            </h3>
                            <div className="mt-6 space-y-4 text-sm text-neutral-600">
                                {job.outputUrl ? (
                                    <Link href={job.outputUrl} target="_blank" className="inline-flex">
                                        <Button>Open output asset</Button>
                                    </Link>
                                ) : (
                                    <p>No output asset is available for this run.</p>
                                )}
                                {job.errorMessage ? (
                                    <div className="rounded-2xl bg-rose-50 px-4 py-4 text-rose-800">
                                        {job.errorMessage}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-emerald-800">
                                        No terminal error message recorded.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                        <h3 className="font-heading text-2xl font-bold text-brand-dark">
                            Metadata
                        </h3>
                        {Object.keys(job.metadata).length === 0 ? (
                            <p className="mt-6 text-sm text-neutral-500">
                                No metadata has been recorded for this job yet.
                            </p>
                        ) : (
                            <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200">
                                <table className="min-w-full divide-y divide-neutral-200">
                                    <tbody className="divide-y divide-neutral-100 text-sm">
                                        {Object.entries(job.metadata).map(([key, value]) => (
                                            <tr key={key}>
                                                <td className="w-1/3 bg-neutral-50 px-4 py-3 font-medium text-neutral-600">
                                                    {key}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-brand-dark">
                                                    {renderMetadataValue(value)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </DashboardShell>
    );
}
