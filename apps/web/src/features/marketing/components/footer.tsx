import Link from "next/link";
import { footerColumns } from "@/lib/routes";
import { siteConfig } from "@config/site";

export function Footer() {
    return (
        <footer className="bg-black py-16">
            <div className="marketing-container">
                <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-magenta">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                </svg>
                            </div>
                            <span className="font-heading text-lg font-bold text-white">
                                {siteConfig.name}
                            </span>
                        </Link>
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
                            AI-powered background removal for creators, designers, and e-commerce sellers. Fast, free, and professional quality.
                        </p>
                        <div className="mt-6 flex gap-3">
                            {[
                                { label: "X", href: "#" },
                                { label: "Fb", href: "#" },
                                { label: "In", href: "#" },
                                { label: "Li", href: "#" },
                            ].map((s) => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white/60 transition-all hover:bg-white/20 hover:text-white"
                                >
                                    {s.label}
                                </a>
                            ))}
                        </div>
                    </div>

                    {footerColumns.map((column) => (
                        <div key={column.title}>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80">
                                {column.title}
                            </h3>
                            <ul className="mt-4 space-y-3">
                                {column.links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-white/60 transition-colors hover:text-white"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
                    <p className="text-xs text-white/40">
                        &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-xs text-white/40">
                        <Link href="/privacy" className="transition-colors hover:text-white/70">Privacy</Link>
                        <Link href="/terms" className="transition-colors hover:text-white/70">Terms</Link>
                        <Link href="/cookies" className="transition-colors hover:text-white/70">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
