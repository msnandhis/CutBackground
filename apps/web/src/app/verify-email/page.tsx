import { AuthFeedback } from "@/features/auth/components/auth-feedback";
import Link from "next/link";
import { Button } from "@repo/ui";
import { AuthShell } from "@/components/site/auth-shell";
import { routes } from "@/lib/routes";

export default async function VerifyEmailPage({
    searchParams,
}: {
    searchParams: Promise<{ email?: string }>;
}) {
    const { email } = await searchParams;

    return (
        <AuthShell
            title="Verify your email"
            description="Email verification is the final gate before the workspace opens. This page handles the waiting state and resend destination."
        >
            <div className="space-y-5">
                <AuthFeedback
                    tone="success"
                    message={`Verification link sent${email ? ` to ${email}` : ""}.`}
                />
                <p className="text-sm leading-relaxed text-neutral-600">
                    Open the message from your inbox and use the verification link to complete setup. If
                    the link expires, request a new one from the sign-in flow.
                </p>
                <Link href={routes.login}>
                    <Button className="w-full">Return to sign in</Button>
                </Link>
            </div>
        </AuthShell>
    );
}
