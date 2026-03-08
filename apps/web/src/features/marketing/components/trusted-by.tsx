export function TrustedBy() {
    return (
        <section className="border-b border-neutral-100 bg-white px-4 py-14">
            <div className="mx-auto max-w-5xl text-center">
                <h2 className="font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
                    Trusted by Creative Professionals Worldwide
                </h2>
                <p className="mt-3 text-neutral-500">
                    Join thousands of designers, marketers, and e-commerce sellers who use our AI background remover daily.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-8 sm:gap-14">
                    {["Shopify Sellers", "Etsy Creators", "Photographers", "Marketers", "Designers", "Agencies"].map((name) => (
                        <span
                            key={name}
                            className="text-base font-semibold text-neutral-300 transition-colors hover:text-neutral-500"
                        >
                            {name}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
}
