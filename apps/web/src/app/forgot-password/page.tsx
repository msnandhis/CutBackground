import { AuthShell } from "@/components/site/auth-shell";
import { ForgotPasswordForm } from "@/features/auth";

export default function ForgotPasswordPage() {
    return (
        <AuthShell
            title="Reset your password"
            description="Request a reset link and move into the token-based reset flow without changing the page structure later."
        >
            <ForgotPasswordForm />
        </AuthShell>
    );
}
