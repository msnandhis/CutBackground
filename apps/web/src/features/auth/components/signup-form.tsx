"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@repo/ui";
import { routes } from "@/lib/routes";

export function SignupForm() {
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
                <span className="mb-2 block text-sm font-medium text-neutral-700">Work email</span>
                <input
                    type="email"
                    required
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none"
                    placeholder="you@company.com"
                />
            </label>
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-700">Password</span>
                <input
                    type="password"
                    required
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none"
                    placeholder="At least 8 characters"
                />
            </label>
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-700">Confirm password</span>
                <input
                    type="password"
                    required
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none"
                    placeholder="Repeat your password"
                />
            </label>
            {submitted ? (
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    Mock signup complete. In production this will trigger email verification.
                </div>
            ) : null}
            <Button type="submit" className="w-full">
                Create account
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
