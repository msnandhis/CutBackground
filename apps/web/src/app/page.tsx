import Link from "next/link";
import { MarketingLayout } from "@/components/site/marketing-layout";
import { Hero } from "@/features/marketing/components/hero";
import { ToolPreview } from "@/features/marketing/components/tool-preview";
import { TrustedBy } from "@/features/marketing/components/trusted-by";
import { FeaturedTools } from "@/features/marketing/components/featured-tools";
import { Solutions } from "@/features/marketing/components/solutions";
import { Testimonials } from "@/features/marketing/components/testimonials";
import { Faq } from "@/features/marketing/components/faq";
import { CtaSection } from "@/features/marketing/components/cta-section";
import { routes } from "@/lib/routes";

export default function HomePage() {
    return (
        <MarketingLayout>
            <Hero />
            <ToolPreview />
            <TrustedBy />
            <FeaturedTools />
            <Solutions />
            <Testimonials />
            <Faq />
            <CtaSection />
            <section className="bg-white px-4 pb-20">
                <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-6 rounded-[2rem] border border-neutral-200 bg-neutral-50 p-8">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-magenta">
                            Frontend phase
                        </p>
                        <h2 className="mt-3 font-heading text-3xl font-bold text-brand-dark">
                            The full route surface is now the next priority
                        </h2>
                        <p className="mt-3 max-w-2xl text-neutral-600">
                            Marketing, auth, dashboard, and tool pages should all exist before auth
                            and backend wiring begins.
                        </p>
                    </div>
                    <Link
                        href={routes.docs}
                        className="rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold text-white"
                    >
                        View implementation guide
                    </Link>
                </div>
            </section>
        </MarketingLayout>
    );
}
