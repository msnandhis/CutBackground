import Link from "next/link";
import { routes } from "@/lib/routes";

export function Hero() {
    return (
        <section className="relative overflow-hidden bg-brand-dark text-white">
            <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
            <div className="marketing-container grid items-center gap-12 py-20 md:py-24 lg:grid-cols-2 lg:gap-16 lg:py-32">
                <div className="text-center lg:text-left">
                    <h1 className="font-heading text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
                        Remove{" "}
                        <span className="text-brand-magenta">backgrounds</span>{" "}
                        in seconds
                    </h1>
                    <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/72 sm:text-xl lg:max-w-none">
                        Upload any image and our AI instantly removes the background with
                        pixel-perfect precision. Free, fast, and no signup required.
                    </p>
                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
                        <Link
                            href={routes.tool}
                            className="marketing-button-primary px-8 py-4 text-base"
                        >
                            Try for Free
                        </Link>
                        <Link
                            href={routes.pricing}
                            className="marketing-button-secondary border-white/15 bg-white/5 px-8 py-4 text-base text-white hover:bg-white/10"
                        >
                            View Pricing
                        </Link>
                    </div>
                </div>

                <div className="hidden lg:block">
                    <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/30">
                        <div className="grid grid-cols-2 gap-0.5">
                            <div className="relative aspect-[3/4] bg-gradient-to-br from-neutral-200 to-neutral-300">
                                <div className="flex h-full flex-col items-center justify-center gap-3">
                                    <svg className="h-16 w-16 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                                    </svg>
                                    <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-neutral-600">Before</span>
                                </div>
                            </div>
                            <div className="relative aspect-[3/4] bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]">
                                <div className="flex h-full flex-col items-center justify-center gap-3">
                                    <svg className="h-16 w-16 text-brand-magenta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="rounded-full bg-brand-magenta/10 px-3 py-1 text-xs font-semibold text-brand-magenta">Removed</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
