import { MarketingLayout } from "@/components/site/marketing-layout";
import { PageIntro } from "@/components/site/page-intro";

export default function TermsPage() {
    return (
        <MarketingLayout>
            <section className="px-4 py-16 sm:py-20">
                <div className="mx-auto max-w-4xl">
                    <PageIntro
                        eyebrow="Terms"
                        title="Terms of service placeholder"
                        description="The frontend route is ready. Later this page can be replaced with finalized policy copy without changing the route map."
                    />
                </div>
            </section>
        </MarketingLayout>
    );
}
