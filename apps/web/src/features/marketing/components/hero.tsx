import Link from "next/link";

export function Hero() {
    return (
        <section className="relative overflow-hidden bg-brand-dark px-4 py-16 sm:py-24">
            {/* Background gradient orbs */}
            <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-magenta/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-brand-magenta/10 blur-3xl" />

            <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
                {/* Left — Text */}
                <div className="text-center lg:text-left">
                    <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
                        Remove{" "}
                        <span className="bg-gradient-to-r from-brand-magenta to-pink-400 bg-clip-text text-transparent">
                            backgrounds
                        </span>{" "}
                        in seconds
                    </h1>
                    <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-300 sm:text-xl lg:max-w-none">
                        Upload any image and our AI instantly removes the background with
                        pixel-perfect precision. Free, fast, and no signup required.
                    </p>
                    <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                        <Link
                            href="#tool"
                            className="inline-block rounded-full bg-brand-magenta px-8 py-4 text-center text-base font-semibold text-white shadow-lg shadow-brand-magenta/25 transition-all hover:bg-brand-magenta-hover hover:shadow-xl hover:shadow-brand-magenta/30"
                        >
                            Remove Background — Free
                        </Link>
                        <span className="text-sm text-neutral-500">
                            No signup · No watermark · Instant result
                        </span>
                    </div>
                </div>

                {/* Right — Before/After Visual */}
                <div className="relative hidden lg:block">
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-sm">
                        <div className="grid grid-cols-2 gap-2">
                            {/* Before */}
                            <div className="relative aspect-[3/4] rounded-xl bg-gradient-to-br from-neutral-700 to-neutral-800">
                                <div className="flex h-full flex-col items-center justify-center gap-2">
                                    <svg className="h-12 w-12 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                                    </svg>
                                    <span className="text-xs text-neutral-500">Before</span>
                                </div>
                            </div>
                            {/* After */}
                            <div className="relative aspect-[3/4] rounded-xl bg-[repeating-conic-gradient(#1a1a2e_0%_25%,#16162a_0%_50%)] bg-[length:20px_20px]">
                                <div className="flex h-full flex-col items-center justify-center gap-2">
                                    <svg className="h-12 w-12 text-brand-magenta/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-xs text-brand-magenta/60">Removed</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
