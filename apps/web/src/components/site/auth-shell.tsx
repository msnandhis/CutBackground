import type { ReactNode } from "react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { siteConfig } from "@config/site";

export function AuthShell({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ffe4f1_0%,#ffffff_45%)] px-4 py-12">
            <div className="mx-auto max-w-5xl">
                <Link href={routes.home} className="text-sm font-semibold text-brand-dark">
                    {siteConfig.name}
                </Link>
                <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_440px]">
                    <div className="max-w-xl">
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-magenta">
                            Authentication
                        </p>
                        <h1 className="mt-4 font-heading text-4xl font-bold text-brand-dark sm:text-5xl">
                            {title}
                        </h1>
                        <p className="mt-4 text-lg leading-relaxed text-neutral-600">
                            {description}
                        </p>
                        <div className="mt-8 rounded-3xl border border-neutral-200 bg-white/70 p-6 shadow-sm">
                            <p className="text-sm font-semibold text-brand-dark">Production-shaped auth UX</p>
                            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                                These flows now talk to the auth client directly, with loading, success,
                                and failure states designed to survive the backend rollout without a UI
                                rewrite.
                            </p>
                        </div>
                    </div>
                    <div className="rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-xl shadow-neutral-200/70">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
