import { DashboardShell } from "@/components/site/dashboard-shell";
import { StatusBadge } from "@/components/site/status-badge";
import { getDashboardData } from "@/features/dashboard/lib/server/dashboard-data";
import { routes } from "@/lib/routes";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardJobsPage() {
    const data = await getDashboardData();

    return (
        <DashboardShell
            title="Job history"
            description="Recorded job history for the authenticated workspace, ready for queue and webhook lifecycle wiring."
        >
            {data.jobs.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-neutral-300 bg-white p-10 text-center shadow-sm">
                    <h2 className="text-xl font-semibold text-brand-dark">No job history yet</h2>
                    <p className="mt-3 text-sm text-neutral-500">
                        Once uploads begin creating records, full provider and runtime history will appear
                        here automatically.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-neutral-200">
                        <thead className="bg-neutral-50">
                            <tr className="text-left text-sm text-neutral-500">
                                <th className="px-6 py-4">File</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Provider</th>
                                <th className="px-6 py-4">Runtime</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {data.jobs.map((job) => (
                                <tr key={job.id}>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={routes.dashboardJob(job.id)}
                                            className="font-medium text-brand-dark underline-offset-4 hover:underline"
                                        >
                                            {job.name}
                                        </Link>
                                        <p className="text-sm text-neutral-500">{job.createdAtLabel}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={job.status} />
                                    </td>
                                    <td className="px-6 py-4 text-sm text-neutral-600">{job.provider}</td>
                                    <td className="px-6 py-4 text-sm text-neutral-600">
                                        {job.runtimeLabel}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </DashboardShell>
    );
}
