import { AuthShell } from "@/components/site/auth-shell";
import { ResetPasswordForm } from "@/features/auth";

export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
    const { token } = await searchParams;

    return (
        <AuthShell
            title="Choose a new password"
            description="This page consumes the reset token from email and handles real password update states."
        >
            <ResetPasswordForm token={token} />
        </AuthShell>
    );
}
