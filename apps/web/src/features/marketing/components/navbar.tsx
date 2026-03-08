import Link from "next/link";
import { siteConfig } from "@config/site";

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 border-b border-neutral-100 bg-white/80 backdrop-blur-lg">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-magenta">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                    </div>
                    <span className="font-heading text-xl font-bold text-brand-dark">
                        {siteConfig.name}
                    </span>
                </Link>

                {/* Nav */}
                <nav className="hidden items-center gap-6 md:flex">
                    <Link href="#how-it-works" className="text-sm font-medium text-neutral-600 transition-colors hover:text-brand-dark">
                        How It Works
                    </Link>
                    <Link href="#use-cases" className="text-sm font-medium text-neutral-600 transition-colors hover:text-brand-dark">
                        Use Cases
                    </Link>
                    <Link href="#faq" className="text-sm font-medium text-neutral-600 transition-colors hover:text-brand-dark">
                        FAQ
                    </Link>
                </nav>

                {/* CTA */}
                <div className="flex items-center gap-3">
                    <Link href="/login" className="hidden text-sm font-medium text-neutral-600 transition-colors hover:text-brand-dark sm:inline-block">
                        Login
                    </Link>
                    <Link href="#tool" className="rounded-full bg-brand-magenta px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-magenta-hover hover:shadow-lg">
                        Try Free
                    </Link>
                </div>
            </div>
        </header>
    );
}
