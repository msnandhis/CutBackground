export function Testimonials() {
    const testimonials = [
        {
            name: "Sarah Johnson",
            role: "Shopify Store Owner",
            quote:
                "CutBackground saved me hours every week. I used to spend 20 minutes per product photo in Photoshop. Now it takes 5 seconds. My listings look incredibly professional.",
            bg: "bg-amber-400",
            textColor: "text-amber-950",
            subtextColor: "text-amber-800",
        },
        {
            name: "Michael Chen",
            role: "Senior Product Designer",
            quote:
                "The edge detection is insanely good, even on complex hair and fur. I use it for client projects daily and the quality rivals expensive desktop software.",
            bg: "bg-sky-500",
            textColor: "text-white",
            subtextColor: "text-sky-100",
        },
        {
            name: "Priya Sharma",
            role: "Social Media Manager",
            quote:
                "I create 50+ social graphics a week. CutBackground lets me isolate subjects in seconds and place them on branded backgrounds. A total game changer for our content pipeline.",
            bg: "bg-brand-magenta",
            textColor: "text-white",
            subtextColor: "text-pink-100",
        },
    ];

    return (
        <section className="marketing-section bg-white">
            <div className="marketing-container">
                <h2 className="text-center font-heading text-2xl font-bold text-black sm:text-3xl">
                    What Our Users Say
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-500">
                    Loved by freelancers, e-commerce sellers, and creative teams worldwide.
                </p>

                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {testimonials.map((t) => (
                        <div
                            key={t.name}
                            className={`marketing-card ${t.bg} border-none p-8`}
                        >
                            <p className={`text-base leading-relaxed ${t.textColor}`}>
                                &ldquo;{t.quote}&rdquo;
                            </p>
                            <div className="mt-8 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                                    {t.name.split(" ").map((n) => n[0]).join("")}
                                </div>
                                <div>
                                    <p className={`text-sm font-semibold ${t.textColor}`}>
                                        {t.name}
                                    </p>
                                    <p className={`text-xs ${t.subtextColor}`}>{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
