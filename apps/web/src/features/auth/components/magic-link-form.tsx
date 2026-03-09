"use client";

import { useState, useTransition } from "react";
import { authClient } from "@repo/core/auth/client";
import { Button } from "@repo/ui";
import { routes } from "@/lib/routes";
import { AuthFeedback } from "./auth-feedback";
import { getAuthErrorMessage } from "../lib/get-auth-error-message";

export function MagicLinkForm() {
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isPending, startTransition] = useTransition();

    return (
        <form
            className="space-y-4"
            onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const email = String(formData.get("email") ?? "");

                setSuccessMessage("");
                setErrorMessage("");

                startTransition(async () => {
                    const result = await authClient.signIn.magicLink({
                        email,
                        callbackURL: routes.dashboard,
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

                    setSuccessMessage(`Magic link sent to ${email}.`);
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
            {successMessage ? <AuthFeedback tone="success" message={successMessage} /> : null}
            {errorMessage ? <AuthFeedback tone="error" message={errorMessage} /> : null}
            <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Sending magic link..." : "Send magic link"}
            </Button>
        </form>
    );
}
