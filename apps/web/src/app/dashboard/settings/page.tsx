import { DashboardShell } from "@/components/site/dashboard-shell";

export default function DashboardSettingsPage() {
    return (
        <DashboardShell
            title="Workspace settings"
            description="Profile, notification, and integration settings are mocked here so the backend implementation later has stable targets."
        >
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                    <h2 className="font-heading text-2xl font-bold text-brand-dark">Profile</h2>
                    <div className="mt-6 space-y-4">
                        <input className="w-full rounded-2xl border border-neutral-200 px-4 py-3" defaultValue="Nandhis" />
                        <input className="w-full rounded-2xl border border-neutral-200 px-4 py-3" defaultValue="team@cutbackground.com" />
                    </div>
                </div>
                <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                    <h2 className="font-heading text-2xl font-bold text-brand-dark">Webhooks and alerts</h2>
                    <div className="mt-6 space-y-4">
                        <input
                            className="w-full rounded-2xl border border-neutral-200 px-4 py-3"
                            defaultValue="https://example.com/webhooks/cutbackground"
                        />
                        <div className="rounded-2xl bg-neutral-50 px-4 py-4 text-sm text-neutral-600">
                            Mock toggle surfaces for webhook delivery, failure alerts, and account email updates belong here.
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
