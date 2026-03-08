"use client";

import { useState } from "react";

const useCases = [
    {
        id: "ecommerce",
        tab: "E-Commerce",
        title: "E-Commerce Product Photos",
        description:
            "Remove cluttered backgrounds from product images instantly. Get clean, white or transparent backgrounds that make your listings stand out on Shopify, Amazon, Etsy, and any marketplace. No more spending hours in Photoshop. Upload and download in seconds.",
        features: [
            "Batch process multiple product images",
            "White or transparent background output",
            "Perfect for Amazon, Shopify, Etsy listings",
            "Pixel-perfect edge detection on complex shapes",
        ],
        gradient: "from-orange-500/20 to-rose-500/20",
        iconColor: "text-orange-500",
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
        ),
    },
    {
        id: "headshots",
        tab: "Headshots",
        title: "Professional Headshots & Portraits",
        description:
            "Create studio-quality headshots without the studio. Remove messy backgrounds from selfies, team photos, or LinkedIn portraits and replace them with clean, professional backdrops. Our AI handles even intricate hair detail with precision.",
        features: [
            "Handles complex hair and fur edges",
            "Perfect for LinkedIn, resumes, ID photos",
            "Studio-quality results from phone photos",
            "Replace with solid colors or custom scenes",
        ],
        gradient: "from-blue-500/20 to-indigo-500/20",
        iconColor: "text-blue-500",
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"
            />
        ),
    },
    {
        id: "social",
        tab: "Social Media",
        title: "Scroll-Stopping Social Graphics",
        description:
            "Isolate subjects from any photo and place them on eye-catching, branded backgrounds. Create thumbnails, Instagram posts, TikTok covers, and ad creatives that pop. Cut processing time from hours to seconds for your entire content pipeline.",
        features: [
            "Perfect for Instagram, TikTok, YouTube thumbnails",
            "Create layered compositions easily",
            "Consistent branded content at scale",
            "Export as transparent PNG for design tools",
        ],
        gradient: "from-pink-500/20 to-purple-500/20",
        iconColor: "text-pink-500",
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.3 48.3 0 005.007-.47c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            />
        ),
    },
    {
        id: "design",
        tab: "Design & Marketing",
        title: "Design Mockups & Marketing Assets",
        description:
            "Quickly isolate objects, logos, or product shots for design mockups, pitch decks, and marketing campaigns. Drop subjects onto any scene, create composites, or generate transparent assets for your design toolkit, all without touching Photoshop.",
        features: [
            "Create mockups and pitch deck visuals",
            "Isolate logos and brand assets",
            "Generate transparent PNGs for Figma / Canva",
            "Speed up creative agency workflows 10x",
        ],
        gradient: "from-emerald-500/20 to-teal-500/20",
        iconColor: "text-emerald-500",
        icon: (
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
            />
        ),
    },
];

export function FeaturedTools() {
    const [active, setActive] = useState(0);
    const current = useCases[active];

    return (
        <section id="use-cases" className="bg-white px-4 py-16 sm:py-20">
            <div className="mx-auto max-w-6xl">
                <h2 className="text-center font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
                    Use Cases
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-500">
                    See how creators, sellers, and teams use AI background removal every day.
                </p>

                {/* Tabs */}
                <div className="mt-10 flex flex-wrap justify-center gap-2 sm:gap-3">
                    {useCases.map((uc, i) => (
                        <button
                            key={uc.id}
                            onClick={() => setActive(i)}
                            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${active === i
                                ? "bg-brand-magenta text-white shadow-lg shadow-brand-magenta/20"
                                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                }`}
                        >
                            {uc.tab}
                        </button>
                    ))}
                </div>

                {/* Content — Image (left) + Explanation (right) */}
                <div
                    key={current.id}
                    className="mt-10 grid items-center gap-10 rounded-3xl border border-neutral-100 bg-neutral-50 p-6 shadow-sm sm:p-10 lg:grid-cols-2"
                >
                    {/* Left — Visual */}
                    <div
                        className={`flex aspect-[4/3] items-center justify-center rounded-2xl bg-gradient-to-br ${current.gradient}`}
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/80 shadow-sm backdrop-blur-sm">
                                <svg
                                    className={`h-10 w-10 ${current.iconColor}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                >
                                    {current.icon}
                                </svg>
                            </div>
                            <div className="flex items-center gap-3 rounded-full bg-white/60 px-4 py-2 backdrop-blur-sm">
                                <div className="h-3 w-3 rounded-full bg-brand-magenta animate-pulse" />
                                <span className="text-xs font-medium text-neutral-600">
                                    Background removed
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right — Explanation */}
                    <div>
                        <h3 className="font-heading text-2xl font-bold text-brand-dark">
                            {current.title}
                        </h3>
                        <p className="mt-4 leading-relaxed text-neutral-600">
                            {current.description}
                        </p>
                        <ul className="mt-6 space-y-3">
                            {current.features.map((feat) => (
                                <li key={feat} className="flex items-start gap-3">
                                    <svg
                                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-success"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 12.75L11.25 15 15 9.75"
                                        />
                                    </svg>
                                    <span className="text-sm text-neutral-600">{feat}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
