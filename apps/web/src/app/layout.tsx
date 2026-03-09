import type { Metadata } from "next";
import { siteConfig } from "@config/site";
import "./globals.css";

export const metadata: Metadata = {
    metadataBase: new URL(siteConfig.domain),
    title: {
        default: siteConfig.name,
        template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: [...siteConfig.keywords],
    openGraph: {
        title: siteConfig.name,
        description: siteConfig.description,
        url: siteConfig.domain,
        siteName: siteConfig.name,
        images: [{ url: siteConfig.ogImage, width: 1200, height: 630 }],
        locale: siteConfig.defaultLocale,
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: siteConfig.name,
        description: siteConfig.description,
        images: [siteConfig.ogImage],
        creator: siteConfig.twitterHandle,
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang={siteConfig.defaultLocale}>
            <body className="min-h-screen bg-white font-body antialiased">
                {children}
            </body>
        </html>
    );
}
