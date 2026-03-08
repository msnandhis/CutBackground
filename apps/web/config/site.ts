/**
 * Site Configuration — Technical identity only.
 * Marketing content lives directly in page components.
 */
export const siteConfig = {
    name: "CutBackground",
    domain: "https://cutbackground.com",
    description:
        "Remove image backgrounds instantly with AI. Free, fast, and professional quality.",
    keywords: [
        "background remover",
        "remove background",
        "ai background remover",
        "free background remover",
        "cut background",
        "transparent background",
    ],
    ogImage: "/og-image.png",
    twitterHandle: "@cutbackground",
    mainProductUrl: "https://cutbackground.com",

    /** Ad placements */
    ads: {
        enabled: false,
        provider: "adsense" as "adsense" | "carbon" | "custom",
        slots: { belowTool: "", sidebar: "" },
    },

    /** Analytics */
    analytics: { gaId: "" },

    /** i18n */
    defaultLocale: "en",
    locales: ["en"] as string[],
} as const;

export type SiteConfig = typeof siteConfig;
