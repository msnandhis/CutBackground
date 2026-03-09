export const routes = {
    home: "/",
    tool: "/background-remover",
    pricing: "/pricing",
    about: "/about",
    contact: "/contact",
    blog: "/blog",
    docs: "/docs",
    careers: "/careers",
    login: "/login",
    signup: "/signup",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
    verifyEmail: "/verify-email",
    dashboard: "/dashboard",
    dashboardJobs: "/dashboard/jobs",
    dashboardJob: (jobId: string) => `/dashboard/jobs/${jobId}`,
    dashboardApiKeys: "/dashboard/api-keys",
    dashboardOperations: "/dashboard/operations",
    dashboardSettings: "/dashboard/settings",
    privacy: "/privacy",
    terms: "/terms",
    cookies: "/cookies",
} as const;

export const marketingPrimaryNav = [
    { href: routes.tool, label: "Tool" },
    { href: routes.pricing, label: "Pricing" },
    { href: routes.docs, label: "Docs" },
    { href: routes.blog, label: "Blog" },
];

export const dashboardNav = [
    { href: routes.dashboard, label: "Overview" },
    { href: routes.dashboardJobs, label: "Jobs" },
    { href: routes.dashboardApiKeys, label: "API Keys" },
    { href: routes.dashboardOperations, label: "Operations" },
    { href: routes.dashboardSettings, label: "Settings" },
];

export const footerColumns = [
    {
        title: "Company",
        links: [
            { href: routes.about, label: "About" },
            { href: routes.contact, label: "Contact" },
            { href: routes.careers, label: "Careers" },
            { href: routes.blog, label: "Blog" },
        ],
    },
    {
        title: "Product",
        links: [
            { href: routes.tool, label: "Background Remover" },
            { href: routes.pricing, label: "Pricing" },
            { href: routes.dashboard, label: "Dashboard" },
            { href: routes.docs, label: "Documentation" },
        ],
    },
    {
        title: "Legal",
        links: [
            { href: routes.privacy, label: "Privacy" },
            { href: routes.terms, label: "Terms" },
            { href: routes.cookies, label: "Cookies" },
        ],
    },
];
