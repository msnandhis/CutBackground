import { AuthShell } from "@/components/site/auth-shell";
import { LoginForm } from "@/features/auth";
import { routes } from "@/lib/routes";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ redirectTo?: string }>;
}) {
    const { redirectTo } = await searchParams;

    return (
        <AuthShell
            title="Sign in to your workspace"
            description="Use password or magic-link sign-in. The page is wired for real auth responses, redirects, and error states."
        >
            <LoginForm redirectTo={redirectTo || routes.dashboard} />
        </AuthShell>
    );
}
