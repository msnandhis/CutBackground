import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
    output: "standalone", // Required for Docker/Coolify deployments
    transpilePackages: ["@repo/ui", "@repo/core", "@repo/database"],
    turbopack: {
        root: path.join(__dirname, "../.."),
    },
    images: {
        formats: ["image/avif", "image/webp"],
    },
    experimental: {
        optimizePackageImports: ["@repo/ui"],
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: [
                            "default-src 'self'",
                            "img-src 'self' data: blob: https:",
                            "style-src 'self' 'unsafe-inline'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                            "font-src 'self' data: https:",
                            "connect-src 'self' https:",
                            "frame-ancestors 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                        ].join("; "),
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=(), payment=()",
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains; preload",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
