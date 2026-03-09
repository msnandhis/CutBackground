import { AuthShell } from "@/components/site/auth-shell";
import { ResetPasswordForm } from "@/features/auth";

export default function ResetPasswordPage() {
    return (
        <AuthShell
            title="Choose a new password"
            description="This mocked page is the final destination for password-reset tokens and already reflects the final UI contract."
        >
            <ResetPasswordForm />
        </AuthShell>
    );
}
