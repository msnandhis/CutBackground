import Link from "next/link";
import { marketingPrimaryNav, routes } from "@/lib/routes";
import { siteConfig } from "@config/site";

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur-md">
            <div className="marketing-container flex items-center justify-between py-4">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-magenta shadow-sm">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                    </div>
                    <span className="font-heading text-xl font-bold text-black">
                        {siteConfig.name}
                    </span>
                </Link>

                <nav className="hidden items-center gap-6 md:flex">
                    {marketingPrimaryNav.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium text-neutral-500 transition-colors hover:text-black"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    <Link href={routes.login} className="hidden text-sm font-medium text-neutral-500 transition-colors hover:text-black sm:inline-block">
                        Login
                    </Link>
                    <Link href={routes.tool} className="marketing-button-primary px-5 py-2.5 text-sm">
                        Try Free
                    </Link>
                </div>
            </div>
        </header>
    );
}
