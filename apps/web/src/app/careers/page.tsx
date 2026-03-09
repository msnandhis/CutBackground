import { MarketingLayout } from "@/components/site/marketing-layout";
import { PageIntro } from "@/components/site/page-intro";

export default function CareersPage() {
    return (
        <MarketingLayout>
            <section className="px-4 py-16 sm:py-20">
                <div className="mx-auto max-w-4xl">
                    <PageIntro
                        eyebrow="Careers"
                        title="No open roles right now"
                        description="The route is live so the footer and company navigation are complete. When hiring starts later, this page already has a home in the information architecture."
                    />
                </div>
            </section>
        </MarketingLayout>
    );
}
