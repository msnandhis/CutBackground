"use client";

import { useState } from "react";
import { Button } from "@repo/ui";

export function ForgotPasswordForm() {
    const [submitted, setSubmitted] = useState(false);

    return (
        <form
            className="space-y-4"
            onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(true);
            }}
        >
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-700">Email</span>
                <input
                    type="email"
                    required
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none"
                    placeholder="team@cutbackground.com"
                />
            </label>
            {submitted ? (
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    Mock reset link sent.
                </div>
            ) : null}
            <Button type="submit" className="w-full">
                Send reset link
            </Button>
        </form>
    );
}
