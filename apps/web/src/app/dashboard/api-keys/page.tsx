import { DashboardShell } from "@/components/site/dashboard-shell";
import { ApiKeysManager } from "@/features/dashboard/components/api-keys-manager";
import { getDashboardData } from "@/features/dashboard/lib/server/dashboard-data";

export const dynamic = "force-dynamic";

export default async function DashboardApiKeysPage() {
    const data = await getDashboardData();

    return (
        <DashboardShell
            title="API keys"
            description="Issue and revoke workspace API credentials with one-time secret reveal."
        >
            <ApiKeysManager keys={data.apiKeys} />
        </DashboardShell>
    );
}
