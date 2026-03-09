import { DashboardShell } from "@/components/site/dashboard-shell";
import { StatusBadge } from "@/components/site/status-badge";
import { mockJobs } from "@/lib/mocks";

export default function DashboardJobsPage() {
    return (
        <DashboardShell
            title="Job history"
            description="Mocked history table covering the states the real queue and webhook backend will eventually surface."
        >
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
                        {mockJobs.map((job) => (
                            <tr key={job.id}>
                                <td className="px-6 py-4">
                                    <p className="font-medium text-brand-dark">{job.name}</p>
                                    <p className="text-sm text-neutral-500">{job.createdAt}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={job.status} />
                                </td>
                                <td className="px-6 py-4 text-sm text-neutral-600">{job.provider}</td>
                                <td className="px-6 py-4 text-sm text-neutral-600">
                                    {job.processingSeconds ? `${job.processingSeconds}s` : "Queued"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DashboardShell>
    );
}
