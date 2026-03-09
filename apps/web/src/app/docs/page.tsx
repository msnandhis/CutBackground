import { MarketingLayout } from "@/components/site/marketing-layout";
import { PageIntro } from "@/components/site/page-intro";

const roadmap = [
    "Complete frontend routes, states, and shared components",
    "Wire BetterAuth pages to real server-side auth",
    "Add upload APIs, job creation, and worker-backed processing",
    "Connect dashboard, history, and API keys to database-backed data",
];

export default function DocsPage() {
    return (
        <MarketingLayout>
            <section className="px-4 py-16 sm:py-20">
                <div className="mx-auto max-w-5xl">
                    <PageIntro
                        eyebrow="Docs"
                        title="Frontend-first implementation guide"
                        description="The documentation route now reflects the current execution strategy: finish the full user-facing product shell with realistic mocks, then wire auth and backend behind already-stable interfaces."
                    />
                    <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                        <div className="rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm">
                            <h2 className="font-heading text-2xl font-bold text-brand-dark">Current working principle</h2>
                            <p className="mt-4 text-neutral-600">
                                Design the routes, forms, empty states, loading states, failure states,
                                and dashboard surfaces first. This reduces backend churn and makes API
                                contracts obvious.
                            </p>
                        </div>
                        <div className="rounded-[2rem] border border-neutral-200 bg-brand-dark p-8 shadow-sm">
                            <h2 className="font-heading text-2xl font-bold text-white">Frontend roadmap</h2>
                            <ul className="mt-5 space-y-3 text-sm text-white/80">
                                {roadmap.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
