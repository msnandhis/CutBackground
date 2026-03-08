"use client";

import { useState } from "react";

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

    const [active, setActive] = useState(0);

    const goNext = () => setActive((prev) => (prev + 1) % testimonials.length);
    const goPrev = () =>
        setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);

    return (
        <section className="bg-white px-4 py-16 sm:py-20">
            <div className="mx-auto max-w-6xl">
                <h2 className="text-center font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
                    What Our Users Say
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-500">
                    Loved by freelancers, e-commerce sellers, and creative teams worldwide.
                </p>

                {/* Cards */}
                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {testimonials.map((t, i) => (
                        <div
                            key={t.name}
                            className={`rounded-3xl ${t.bg} p-8 transition-all hover:-translate-y-1 hover:shadow-xl`}
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

                {/* Navigation dots */}
                <div className="mt-8 flex items-center justify-center gap-4">
                    <button
                        onClick={goPrev}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-400 transition-colors hover:border-neutral-400 hover:text-neutral-600"
                        aria-label="Previous testimonial"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <div className="flex gap-2">
                        {testimonials.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActive(i)}
                                className={`h-2 rounded-full transition-all ${active === i ? "w-6 bg-brand-magenta" : "w-2 bg-neutral-200"
                                    }`}
                                aria-label={`Go to testimonial ${i + 1}`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={goNext}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-400 transition-colors hover:border-neutral-400 hover:text-neutral-600"
                        aria-label="Next testimonial"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    );
}
