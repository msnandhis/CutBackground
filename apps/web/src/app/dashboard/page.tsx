import { DashboardShell } from "@/components/site/dashboard-shell";
import { StatusBadge } from "@/components/site/status-badge";
import { dashboardStats, mockJobs } from "@/lib/mocks";

export default function DashboardPage() {
    return (
        <DashboardShell
            title="Dashboard overview"
            description="A mocked operations view for credits, throughput, recent jobs, and the product surface that later auth and backend data will populate."
        >
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {dashboardStats.map((stat) => (
                    <div key={stat.label} className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                        <p className="text-sm text-neutral-500">{stat.label}</p>
                        <p className="mt-3 font-heading text-4xl font-bold text-brand-dark">{stat.value}</p>
                        <p className="mt-3 text-sm text-neutral-500">{stat.note}</p>
                    </div>
                ))}
            </div>
            <div className="mt-8 rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="font-heading text-2xl font-bold text-brand-dark">Recent jobs</h2>
                <div className="mt-6 space-y-4">
                    {mockJobs.slice(0, 3).map((job) => (
                        <div key={job.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-neutral-50 p-4">
                            <div>
                                <p className="font-semibold text-brand-dark">{job.name}</p>
                                <p className="text-sm text-neutral-500">{job.createdAt}</p>
                            </div>
                            <StatusBadge status={job.status} />
                        </div>
                    ))}
                </div>
            </div>
        </DashboardShell>
    );
}
