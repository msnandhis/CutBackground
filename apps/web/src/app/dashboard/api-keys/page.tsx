import { DashboardShell } from "@/components/site/dashboard-shell";
import { ApiKeysManager } from "@/features/dashboard/components/api-keys-manager";

export default function DashboardApiKeysPage() {
    return (
        <DashboardShell
            title="API keys"
            description="Frontend-complete developer access management, ready to wire to the future `api_keys` table and create/revoke endpoints."
        >
            <ApiKeysManager />
        </DashboardShell>
    );
}
