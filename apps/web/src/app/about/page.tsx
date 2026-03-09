import { MarketingLayout } from "@/components/site/marketing-layout";
import { PageIntro } from "@/components/site/page-intro";

const pillars = [
    "Reusable AI-tool architecture instead of one-off page builds",
    "Clear separation between marketing, tool UX, auth, and operations",
    "Frontend contracts defined before backend integration to reduce churn",
];

export default function AboutPage() {
    return (
        <MarketingLayout>
            <section className="px-4 py-16 sm:py-20">
                <div className="mx-auto max-w-6xl">
                    <PageIntro
                        eyebrow="About"
                        title="A production-shaped scaffold for launching AI tool websites"
                        description="CutBackground is being built as both a user-facing tool and a repeatable monorepo foundation. The goal is not just one feature, but a structure that can scale cleanly across product pages, auth, jobs, and API surfaces."
                    />
                    <div className="mt-12 grid gap-6 lg:grid-cols-3">
                        {pillars.map((pillar) => (
                            <div key={pillar} className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
                                <h2 className="font-heading text-2xl font-bold text-brand-dark">{pillar}</h2>
                                <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                                    Each frontend surface is being completed first so backend work later
                                    can follow stable UI contracts instead of moving targets.
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
