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
        <section className="marketing-section border-b border-neutral-200 bg-white">
            <div className="marketing-container text-center">
                <h2 className="font-heading text-2xl font-bold text-black sm:text-3xl">
                    Trusted by Creative Professionals Worldwide
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-neutral-500">
                    Join thousands of creators, designers, and professionals who rely on our AI tools
                </p>

                <div className="relative mt-10 overflow-hidden">
                    <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-white to-transparent" />
                    <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-white to-transparent" />

                    <div className="flex animate-scroll gap-12">
                        {[...brands, ...brands, ...brands].map((brand, i) => (
                            <div
                                key={`${brand.name}-${i}`}
                                className="flex flex-shrink-0 items-center gap-3 text-neutral-300 transition-colors hover:text-neutral-500"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-lg font-bold text-neutral-400">
                                    {brand.icon}
                                </div>
                                <span className="whitespace-nowrap text-base font-semibold">
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
