"use client";

import { useState } from "react";
import { Button } from "@repo/ui";

export function ResetPasswordForm() {
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
                <span className="mb-2 block text-sm font-medium text-neutral-700">New password</span>
                <input
                    type="password"
                    required
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none"
                    placeholder="Choose a new password"
                />
            </label>
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-700">Confirm new password</span>
                <input
                    type="password"
                    required
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none"
                    placeholder="Repeat your new password"
                />
            </label>
            {submitted ? (
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    Mock password reset complete.
                </div>
            ) : null}
            <Button type="submit" className="w-full">
                Update password
            </Button>
        </form>
    );
}
