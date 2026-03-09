import { DashboardShell } from "@/components/site/dashboard-shell";
import { StatusBadge } from "@/components/site/status-badge";
import { getDashboardData } from "@/features/dashboard/lib/server/dashboard-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const data = await getDashboardData();

    return (
        <DashboardShell
            title="Dashboard overview"
            description={`Authenticated workspace view for ${data.viewer.email}, backed by live session data and real database reads where records exist.`}
        >
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {data.stats.map((stat) => (
                    <div key={stat.label} className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                        <p className="text-sm text-neutral-500">{stat.label}</p>
                        <p className="mt-3 font-heading text-4xl font-bold text-brand-dark">{stat.value}</p>
                        <p className="mt-3 text-sm text-neutral-500">{stat.note}</p>
                    </div>
                ))}
            </div>
            <div className="mt-8 rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="font-heading text-2xl font-bold text-brand-dark">Recent jobs</h2>
                {data.jobs.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-500">
                        No jobs recorded yet. The first completed background removal run will appear here.
                    </div>
                ) : (
                    <div className="mt-6 space-y-4">
                        {data.jobs.slice(0, 3).map((job) => (
                            <div key={job.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-neutral-50 p-4">
                                <div>
                                    <p className="font-semibold text-brand-dark">{job.name}</p>
                                    <p className="text-sm text-neutral-500">{job.createdAtLabel}</p>
                                </div>
                                <StatusBadge status={job.status} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardShell>
    );
}
