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
};

export default nextConfig;
