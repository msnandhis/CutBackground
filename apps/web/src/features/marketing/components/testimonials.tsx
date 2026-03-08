export function Testimonials() {
    const testimonials = [
        {
            name: "Sarah Johnson",
            role: "Shopify Store Owner",
            quote:
                "CutBackground saved me hours every week. I used to spend 20 minutes per product photo in Photoshop — now it takes 5 seconds. My listings look incredibly professional.",
        },
        {
            name: "Michael Chen",
            role: "Freelance Graphic Designer",
            quote:
                "The edge detection is insanely good — even on complex hair and fur. I use it for client projects daily and the quality rivals expensive desktop software.",
        },
        {
            name: "Priya Sharma",
            role: "Social Media Manager",
            quote:
                "I create 50+ social graphics a week. CutBackground lets me isolate subjects in seconds and place them on branded backgrounds. It is a game changer for our content pipeline.",
        },
    ];

    return (
        <section className="bg-white px-4 py-16 sm:py-20">
            <div className="mx-auto max-w-6xl">
                <h2 className="text-center font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
                    What Our Users Say
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-500">
                    Loved by freelancers, e-commerce sellers, and creative teams worldwide.
                </p>
                <div className="mt-12 grid gap-8 sm:grid-cols-3">
                    {testimonials.map((t) => (
                        <div
                            key={t.name}
                            className="relative rounded-2xl border border-neutral-100 bg-gradient-to-br from-brand-magenta/5 to-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                        >
                            {/* Quote mark */}
                            <div className="absolute -top-3 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-brand-magenta text-sm font-bold text-white">
                                &ldquo;
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-neutral-600 italic">
                                &ldquo;{t.quote}&rdquo;
                            </p>
                            <div className="mt-6 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-magenta/10 font-heading text-sm font-bold text-brand-magenta">
                                    {t.name.split(" ").map((n) => n[0]).join("")}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-brand-dark">{t.name}</p>
                                    <p className="text-xs text-neutral-500">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
