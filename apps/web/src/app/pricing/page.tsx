import { MarketingLayout } from "@/components/site/marketing-layout";
import { PageIntro } from "@/components/site/page-intro";
import { pricingPlans } from "@/lib/mocks";

export default function PricingPage() {
    return (
        <MarketingLayout>
            <section className="px-4 py-16 sm:py-20">
                <div className="mx-auto max-w-6xl">
                    <PageIntro
                        eyebrow="Pricing"
                        title="Simple credit-based pricing for web and API usage"
                        description="Choose a plan based on monthly volume, team workflows, and API usage. Every tier uses the same core background-removal pipeline and dashboard controls."
                        align="center"
                    />
                    <div className="mt-12 grid gap-6 lg:grid-cols-3">
                        {pricingPlans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`rounded-[2rem] border p-8 shadow-sm ${
                                    plan.highlight
                                        ? "border-brand-magenta bg-brand-dark text-white"
                                        : "border-neutral-200 bg-white"
                                }`}
                            >
                                <p className={`text-sm font-semibold ${plan.highlight ? "text-pink-200" : "text-neutral-500"}`}>
                                    {plan.name}
                                </p>
                                <div className="mt-4 flex items-end gap-2">
                                    <span className="font-heading text-4xl font-bold">{plan.price}</span>
                                    <span className={plan.highlight ? "text-white/60" : "text-neutral-500"}>/ month</span>
                                </div>
                                <p className={`mt-2 text-sm ${plan.highlight ? "text-white/70" : "text-neutral-500"}`}>
                                    {plan.credits}
                                </p>
                                <p className={`mt-5 text-sm leading-relaxed ${plan.highlight ? "text-white/75" : "text-neutral-600"}`}>
                                    {plan.description}
                                </p>
                                <ul className="mt-6 space-y-3">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className={`text-sm ${plan.highlight ? "text-white/85" : "text-neutral-700"}`}>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
