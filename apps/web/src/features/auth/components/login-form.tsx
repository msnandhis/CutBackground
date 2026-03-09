"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui";
import { authClient } from "@repo/core/auth/client";
import { routes } from "@/lib/routes";
import { AuthFeedback } from "./auth-feedback";
import { getAuthErrorMessage } from "../lib/get-auth-error-message";

export function LoginForm({ redirectTo = routes.dashboard }: { redirectTo?: string }) {
    const [mode, setMode] = useState<"password" | "magic-link">("password");
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    return (
        <div>
            <div className="flex gap-2 rounded-full bg-neutral-100 p-1">
                <button
                    type="button"
                    onClick={() => setMode("password")}
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${
                        mode === "password" ? "bg-white text-brand-dark shadow-sm" : "text-neutral-500"
                    }`}
                >
                    Password
                </button>
                <button
                    type="button"
                    onClick={() => setMode("magic-link")}
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${
                        mode === "magic-link" ? "bg-white text-brand-dark shadow-sm" : "text-neutral-500"
                    }`}
                >
                    Magic link
                </button>
            </div>

            <form
                className="mt-6 space-y-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    const email = String(formData.get("email") ?? "");
                    const password = String(formData.get("password") ?? "");

                    setSuccessMessage("");
                    setErrorMessage("");

                    startTransition(async () => {
                        if (mode === "password") {
                            const result = await authClient.signIn.email({
                                email,
                                password,
                                callbackURL: redirectTo,
                            });

                            if (result.error) {
                                setErrorMessage(
                                    getAuthErrorMessage(
                                        result.error,
                                        "Unable to sign in. Check your email and password, then try again."
                                    )
                                );
                                return;
                            }

                            router.push(redirectTo);
                            router.refresh();
                            return;
                        }

                        const result = await authClient.signIn.magicLink({
                            email,
                            callbackURL: redirectTo,
                        });

                        if (result.error) {
                            setErrorMessage(
                                getAuthErrorMessage(
                                    result.error,
                                    "Unable to send the magic link right now. Try again in a moment."
                                )
                            );
                            return;
                        }

                        setSuccessMessage(`Magic link sent to ${email}. Check your inbox to continue.`);
                    });
                }}
            >
                <label className="block">
                    <span className="mb-2 block text-sm font-medium text-neutral-700">Email</span>
                    <input
                        type="email"
                        name="email"
                        required
                        className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none"
                        placeholder="team@cutbackground.com"
                    />
                </label>
                {mode === "password" ? (
                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-neutral-700">Password</span>
                        <input
                            type="password"
                            name="password"
                            required
                            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none"
                            placeholder="Enter your password"
                        />
                    </label>
                ) : null}

                {successMessage ? <AuthFeedback tone="success" message={successMessage} /> : null}
                {errorMessage ? <AuthFeedback tone="error" message={errorMessage} /> : null}

                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending
                        ? mode === "password"
                            ? "Signing in..."
                            : "Sending magic link..."
                        : mode === "password"
                          ? "Sign in"
                          : "Send magic link"}
                </Button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm text-neutral-500">
                <Link href={routes.forgotPassword} className="hover:text-brand-dark">
                    Forgot password?
                </Link>
                <Link href={routes.signup} className="hover:text-brand-dark">
                    Create account
                </Link>
            </div>
        </div>
    );
}
