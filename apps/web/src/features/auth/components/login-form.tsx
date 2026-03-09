"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@repo/ui";
import { routes } from "@/lib/routes";

export function LoginForm() {
    const [mode, setMode] = useState<"password" | "magic-link">("password");
    const [submitted, setSubmitted] = useState(false);

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
                {mode === "password" ? (
                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-neutral-700">Password</span>
                        <input
                            type="password"
                            required
                            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 outline-none"
                            placeholder="Enter your password"
                        />
                    </label>
                ) : null}

                {submitted ? (
                    <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {mode === "password"
                            ? "Mock login submitted successfully."
                            : "Mock magic link sent successfully."}
                    </div>
                ) : null}

                <Button type="submit" className="w-full">
                    {mode === "password" ? "Sign in" : "Send magic link"}
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
