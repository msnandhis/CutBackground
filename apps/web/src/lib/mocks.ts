import type { MockApiKey, MockJob, MockPlan } from "./types";

export const pricingPlans: MockPlan[] = [
    {
        name: "Starter",
        credits: "100 credits",
        price: "$0",
        description: "For testing the product and validating quality before integrating.",
        features: [
            "Single image uploads",
            "Basic dashboard access",
            "Rate-limited usage",
            "Community support",
        ],
    },
    {
        name: "Pro",
        credits: "2,500 credits",
        price: "$29",
        description: "For freelancers, storefront teams, and creators with recurring usage.",
        highlight: true,
        features: [
            "Priority processing queue",
            "Developer API access",
            "Webhook support",
            "Usage analytics and API keys",
        ],
    },
    {
        name: "Scale",
        credits: "Custom",
        price: "Custom",
        description: "For agencies and product teams shipping background removal into production.",
        features: [
            "Volume pricing",
            "Dedicated throughput planning",
            "Higher rate limits",
            "Support for custom workflows",
        ],
    },
];

export const mockJobs: MockJob[] = [
    {
        id: "job_01HQ72KSM4",
        name: "product-shot-white-chair.png",
        createdAt: "March 9, 2026 at 09:10",
        status: "succeeded",
        provider: "replicate",
        inputType: "image",
        outputFormat: "png",
        processingSeconds: 4,
    },
    {
        id: "job_01HQ72PV4A",
        name: "founder-headshot.jpg",
        createdAt: "March 9, 2026 at 08:52",
        status: "processing",
        provider: "replicate",
        inputType: "image",
        outputFormat: "png",
        processingSeconds: 12,
    },
    {
        id: "job_01HQ72Y3MY",
        name: "pet-photo.webp",
        createdAt: "March 8, 2026 at 18:36",
        status: "failed",
        provider: "fallback-model",
        inputType: "image",
        outputFormat: "png",
        processingSeconds: 30,
    },
    {
        id: "job_01HQ7315EK",
        name: "shoe-catalog-hero.jpg",
        createdAt: "March 8, 2026 at 15:17",
        status: "pending",
        provider: "replicate",
        inputType: "image",
        outputFormat: "png",
        processingSeconds: 0,
    },
];

export const mockApiKeys: MockApiKey[] = [
    {
        id: "key_01",
        name: "Production key",
        prefix: "cut_live_8f21",
        lastUsedAt: "2 hours ago",
        createdAt: "February 21, 2026",
        status: "active",
    },
    {
        id: "key_02",
        name: "Staging key",
        prefix: "cut_test_3b91",
        lastUsedAt: null,
        createdAt: "February 17, 2026",
        status: "revoked",
    },
];

export const dashboardStats = [
    { label: "Credits remaining", value: "1,824", note: "Resets with the next billing cycle" },
    { label: "Successful jobs", value: "642", note: "Across web UI and API traffic" },
    { label: "Average runtime", value: "4.8s", note: "Median image background removal time" },
    { label: "Success rate", value: "98.2%", note: "Including fallback provider recovery" },
];

export const blogPosts = [
    {
        title: "How to prepare product photos for clean background removal",
        excerpt: "A practical workflow for e-commerce teams that need predictable cutouts.",
        tag: "Guides",
    },
    {
        title: "Designing a reusable AI tool monorepo without frontend churn",
        excerpt: "Why feature ownership and stable contracts matter before backend integration.",
        tag: "Engineering",
    },
    {
        title: "Shipping mock-first dashboards that stay useful after backend wiring",
        excerpt: "Use realistic state models now so auth and jobs can slot in later.",
        tag: "Product",
    },
];
