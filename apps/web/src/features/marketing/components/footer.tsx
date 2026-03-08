import Link from "next/link";
import { siteConfig } from "@config/site";

export function Footer() {
    return (
        <footer className="border-t border-neutral-800 bg-brand-dark px-4 py-16">
            <div className="mx-auto max-w-7xl">
                <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
                    {/* Brand column */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-magenta">
                                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                </svg>
                            </div>
                            <span className="font-heading text-lg font-bold text-white">
                                {siteConfig.name}
                            </span>
                        </Link>
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-400">
                            AI-powered background removal for creators, designers, and e-commerce sellers. Fast, free, and professional quality.
                        </p>
                        <div className="mt-6 flex gap-4">
                            {[
                                { label: "Tw", href: "https://twitter.com/cutbackground" },
                                { label: "Gh", href: "https://github.com/cutbackground" },
                                { label: "Li", href: "https://linkedin.com/company/cutbackground" },
                            ].map((s) => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-700 text-xs font-semibold uppercase text-neutral-400 transition-all hover:border-brand-magenta hover:text-brand-magenta"
                                >
                                    {s.label}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">Product</h3>
                        <ul className="mt-4 space-y-3">
                            <li><Link href="#tool" className="text-sm text-neutral-400 transition-colors hover:text-white">Background Remover</Link></li>
                            <li><Link href="#how-it-works" className="text-sm text-neutral-400 transition-colors hover:text-white">How It Works</Link></li>
                            <li><Link href="#use-cases" className="text-sm text-neutral-400 transition-colors hover:text-white">Use Cases</Link></li>
                            <li><Link href="/pricing" className="text-sm text-neutral-400 transition-colors hover:text-white">Pricing</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">Company</h3>
                        <ul className="mt-4 space-y-3">
                            <li><Link href="/about" className="text-sm text-neutral-400 transition-colors hover:text-white">About Us</Link></li>
                            <li><Link href="/blog" className="text-sm text-neutral-400 transition-colors hover:text-white">Blog</Link></li>
                            <li><Link href="/careers" className="text-sm text-neutral-400 transition-colors hover:text-white">Careers</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">Resources</h3>
                        <ul className="mt-4 space-y-3">
                            <li><Link href="/docs" className="text-sm text-neutral-400 transition-colors hover:text-white">Documentation</Link></li>
                            <li><Link href="/api" className="text-sm text-neutral-400 transition-colors hover:text-white">API Reference</Link></li>
                            <li><Link href="/support" className="text-sm text-neutral-400 transition-colors hover:text-white">Support</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-800 pt-8 sm:flex-row">
                    <p className="text-xs text-neutral-500">
                        &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-xs text-neutral-500">
                        <Link href="/privacy" className="hover:text-neutral-300">Privacy</Link>
                        <Link href="/terms" className="hover:text-neutral-300">Terms</Link>
                        <Link href="/cookies" className="hover:text-neutral-300">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
