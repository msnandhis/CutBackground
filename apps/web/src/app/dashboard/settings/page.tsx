import { DashboardShell } from "@/components/site/dashboard-shell";
import { getDashboardData } from "@/features/dashboard/lib/server/dashboard-data";

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
    const data = await getDashboardData();

    return (
        <DashboardShell
            title="Workspace settings"
            description="Authenticated profile and integration settings, using real session identity as the source of truth."
        >
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                    <h2 className="font-heading text-2xl font-bold text-brand-dark">Profile</h2>
                    <div className="mt-6 space-y-4">
                        <input
                            className="w-full rounded-2xl border border-neutral-200 px-4 py-3"
                            defaultValue={data.viewer.name}
                            readOnly
                        />
                        <input
                            className="w-full rounded-2xl border border-neutral-200 px-4 py-3"
                            defaultValue={data.viewer.email}
                            readOnly
                        />
                        <div className="rounded-2xl bg-neutral-50 px-4 py-4 text-sm text-neutral-600">
                            Profile mutation endpoints are not wired yet, so these fields are currently
                            read-only reflections of the authenticated session.
                        </div>
                    </div>
                </div>
                <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                    <h2 className="font-heading text-2xl font-bold text-brand-dark">Webhooks and alerts</h2>
                    <div className="mt-6 space-y-4">
                        <input
                            className="w-full rounded-2xl border border-neutral-200 px-4 py-3"
                            defaultValue="https://example.com/webhooks/cutbackground"
                            readOnly
                        />
                        <div className="rounded-2xl bg-neutral-50 px-4 py-4 text-sm text-neutral-600">
                            Webhook delivery settings and alert toggles will be connected once the
                            background job pipeline is active.
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
