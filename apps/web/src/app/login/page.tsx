import { AuthShell } from "@/components/site/auth-shell";
import { LoginForm } from "@/features/auth";

export default function LoginPage() {
    return (
        <AuthShell
            title="Sign in to your workspace"
            description="Use the mocked login flow to review final page structure, transitions, and form states before BetterAuth wiring begins."
        >
            <LoginForm />
        </AuthShell>
    );
}
