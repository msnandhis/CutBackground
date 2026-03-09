import type { ReactNode } from "react";
import Link from "next/link";
import { dashboardNav, routes } from "@/lib/routes";
import { siteConfig } from "@config/site";

export function DashboardShell({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <div className="min-h-screen bg-neutral-50">
            <header className="border-b border-neutral-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
                    <div>
                        <Link href={routes.home} className="text-lg font-bold text-brand-dark">
                            {siteConfig.name}
                        </Link>
                        <p className="text-sm text-neutral-500">Mocked app workspace ready for backend wiring</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={routes.tool}
                            className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700"
                        >
                            Open tool
                        </Link>
                        <Link
                            href={routes.login}
                            className="rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold text-white"
                        >
                            Switch account
                        </Link>
                    </div>
                </div>
            </header>
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr]">
                <aside className="rounded-[2rem] border border-neutral-200 bg-white p-4 shadow-sm">
                    <p className="px-3 text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">
                        Workspace
                    </p>
                    <nav className="mt-4 space-y-1">
                        {dashboardNav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="block rounded-2xl px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </aside>
                <section>
                    <div className="max-w-3xl">
                        <h1 className="font-heading text-4xl font-bold text-brand-dark">{title}</h1>
                        <p className="mt-3 text-lg text-neutral-600">{description}</p>
                    </div>
                    <div className="mt-8">{children}</div>
                </section>
            </div>
        </div>
    );
}
