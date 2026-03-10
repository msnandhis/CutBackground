"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui";
import { authClient } from "@repo/core/auth/client";
import { routes } from "@/lib/routes";
import { AuthFeedback } from "./auth-feedback";
import { getAuthErrorMessage } from "../lib/get-auth-error-message";

export function SignupForm() {
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    return (
        <form
            className="space-y-4"
            onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const name = String(formData.get("name") ?? "");
                const email = String(formData.get("email") ?? "");
                const password = String(formData.get("password") ?? "");
                const confirmPassword = String(formData.get("confirmPassword") ?? "");

                setSuccessMessage("");
                setErrorMessage("");

                if (password !== confirmPassword) {
                    setErrorMessage("Passwords do not match.");
                    return;
                }

                startTransition(async () => {
                    const result = await authClient.signUp.email({
                        name,
                        email,
                        password,
                        callbackURL: `${routes.verifyEmail}?email=${encodeURIComponent(email)}`,
                    });

                    if (result.error) {
                        setErrorMessage(
                            getAuthErrorMessage(
                                result.error,
                                "Unable to create your account right now. Try again in a moment."
                            )
                        );
                        return;
                    }

                    setSuccessMessage(
                        "Account created. Check your inbox to verify your email before signing in."
                    );
                    router.push(`${routes.verifyEmail}?email=${encodeURIComponent(email)}`);
                    router.refresh();
                });
            }}
        >
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-700">Full name</span>
                <input
                    type="text"
                    name="name"
                    data-testid="signup-name"
                    required
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none"
                    placeholder="Ava Martin"
                />
            </label>
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-700">Work email</span>
                <input
                    type="email"
                    name="email"
                    data-testid="signup-email"
                    required
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none"
                    placeholder="you@company.com"
                />
            </label>
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-700">Password</span>
                <input
                    type="password"
                    name="password"
                    data-testid="signup-password"
                    required
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none"
                    placeholder="At least 8 characters"
                />
            </label>
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-700">Confirm password</span>
                <input
                    type="password"
                    name="confirmPassword"
                    data-testid="signup-confirm-password"
                    required
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none"
                    placeholder="Repeat your password"
                />
            </label>
            {successMessage ? <AuthFeedback tone="success" message={successMessage} /> : null}
            {errorMessage ? <AuthFeedback tone="error" message={errorMessage} /> : null}
            <Button type="submit" className="w-full" disabled={isPending} data-testid="signup-submit">
                {isPending ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-sm text-neutral-500">
                Already have an account?{" "}
                <Link href={routes.login} className="font-semibold text-brand-dark">
                    Sign in
                </Link>
            </p>
        </form>
    );
}
