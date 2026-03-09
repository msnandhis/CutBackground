"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@repo/core/auth/client";
import { Button } from "@repo/ui";
import { routes } from "@/lib/routes";
import { AuthFeedback } from "./auth-feedback";
import { getAuthErrorMessage } from "../lib/get-auth-error-message";

export function ResetPasswordForm({ token }: { token?: string }) {
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
                const newPassword = String(formData.get("newPassword") ?? "");
                const confirmPassword = String(formData.get("confirmPassword") ?? "");

                setSuccessMessage("");
                setErrorMessage("");

                if (!token) {
                    setErrorMessage("Missing reset token. Open the password reset link from your email again.");
                    return;
                }

                if (newPassword !== confirmPassword) {
                    setErrorMessage("Passwords do not match.");
                    return;
                }

                startTransition(async () => {
                    const result = await authClient.resetPassword({
                        newPassword,
                        token,
                    });

                    if (result.error) {
                        setErrorMessage(
                            getAuthErrorMessage(
                                result.error,
                                "Unable to reset your password right now. Request a new reset link and try again."
                            )
                        );
                        return;
                    }

                    setSuccessMessage("Password updated. You can now sign in with your new password.");
                    router.push(routes.login);
                    router.refresh();
                });
            }}
        >
            {!token ? (
                <AuthFeedback
                    tone="error"
                    message="This page needs a valid reset token from the email link before a password can be updated."
                />
            ) : null}
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-700">New password</span>
                <input
                    type="password"
                    name="newPassword"
                    required
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none"
                    placeholder="Choose a new password"
                />
            </label>
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-700">Confirm new password</span>
                <input
                    type="password"
                    name="confirmPassword"
                    required
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none"
                    placeholder="Repeat your new password"
                />
            </label>
            {successMessage ? <AuthFeedback tone="success" message={successMessage} /> : null}
            {errorMessage ? <AuthFeedback tone="error" message={errorMessage} /> : null}
            <Button type="submit" className="w-full" disabled={isPending || !token}>
                {isPending ? "Updating password..." : "Update password"}
            </Button>
        </form>
    );
}
