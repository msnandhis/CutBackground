import { AuthShell } from "@/components/site/auth-shell";
import { SignupForm } from "@/features/auth";

export default function SignupPage() {
    return (
        <AuthShell
            title="Create your account"
            description="This signup route is built to map cleanly onto email verification and session creation once auth is connected."
        >
            <SignupForm />
        </AuthShell>
    );
}
