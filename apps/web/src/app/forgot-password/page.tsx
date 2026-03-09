import { AuthShell } from "@/components/site/auth-shell";
import { ForgotPasswordForm } from "@/features/auth";

export default function ForgotPasswordPage() {
    return (
        <AuthShell
            title="Reset your password"
            description="The request state, success state, and supporting content are already modeled here so backend token flows later remain a wiring task."
        >
            <ForgotPasswordForm />
        </AuthShell>
    );
}
