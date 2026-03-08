"use client";

export function TrustedBy() {
    const brands = [
        { name: "Google", icon: "G" },
        { name: "TikTok", icon: "T" },
        { name: "Figma", icon: "F" },
        { name: "Netflix", icon: "N" },
        { name: "Medium", icon: "M" },
        { name: "Spotify", icon: "S" },
    ];

    return (
        <section className="border-b border-neutral-100 bg-white px-4 py-14">
            <div className="mx-auto max-w-5xl text-center">
                <h2 className="font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
                    Trusted by Creative Professionals Worldwide
                </h2>
                <p className="mt-3 text-neutral-500">
                    Join thousands of creators, designers, and professionals who rely on our AI tools
                </p>

                {/* Scrolling logo cloud */}
                <div className="relative mt-10 overflow-hidden">
                    {/* Fade edges */}
                    <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-white to-transparent" />
                    <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-white to-transparent" />

                    <div className="flex animate-scroll gap-12">
                        {/* Duplicate array for seamless loop */}
                        {[...brands, ...brands, ...brands].map((brand, i) => (
                            <div
                                key={`${brand.name}-${i}`}
                                className="flex flex-shrink-0 items-center gap-2 text-neutral-300 transition-colors hover:text-neutral-500"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-lg font-bold text-neutral-400">
                                    {brand.icon}
                                </div>
                                <span className="text-base font-semibold whitespace-nowrap">
                                    {brand.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
