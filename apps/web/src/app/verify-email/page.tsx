import Link from "next/link";
import { Button } from "@repo/ui";
import { AuthShell } from "@/components/site/auth-shell";
import { routes } from "@/lib/routes";

export default function VerifyEmailPage() {
    return (
        <AuthShell
            title="Verify your email"
            description="Email verification is mocked for now, but this page already exists as the final confirmation and resend destination for the auth flow."
        >
            <div className="space-y-5">
                <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                    Verification link sent to team@cutbackground.com
                </div>
                <p className="text-sm leading-relaxed text-neutral-600">
                    In production this page will handle success, expired token, and resend states.
                </p>
                <Link href={routes.login}>
                    <Button className="w-full">Return to sign in</Button>
                </Link>
            </div>
        </AuthShell>
    );
}
