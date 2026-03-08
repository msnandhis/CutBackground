export function FeaturedTools() {
    const useCases = [
        {
            title: "E-Commerce Product Photos",
            desc: "Remove backgrounds from product images for Shopify, Amazon, Etsy listings.",
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            ),
        },
        {
            title: "Profile Photos & Headshots",
            desc: "Clean, professional headshots with transparent or customized backgrounds.",
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
            ),
        },
        {
            title: "Social Media Graphics",
            desc: "Create scroll-stopping graphics by placing subjects on vibrant backgrounds.",
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.3 48.3 0 005.007-.47c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            ),
        },
        {
            title: "Design & Marketing Assets",
            desc: "Quickly isolate objects, logos, or subjects for design mockups and campaigns.",
            icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
            ),
        },
    ];

    return (
        <section id="use-cases" className="bg-white px-4 py-16 sm:py-20">
            <div className="mx-auto max-w-7xl">
                <h2 className="text-center font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
                    What You Can Do
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-500">
                    Remove backgrounds from any image for e-commerce, design, marketing, and more.
                </p>
                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {useCases.map((item) => (
                        <div
                            key={item.title}
                            className="group rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                        >
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-magenta/10 transition-colors group-hover:bg-brand-magenta/20">
                                <svg className="h-6 w-6 text-brand-magenta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    {item.icon}
                                </svg>
                            </div>
                            <h3 className="font-heading text-base font-semibold text-brand-dark">
                                {item.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
