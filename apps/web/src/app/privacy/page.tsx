import { MarketingLayout } from "@/components/site/marketing-layout";
import { PageIntro } from "@/components/site/page-intro";

export default function PrivacyPage() {
    return (
        <MarketingLayout>
            <section className="px-4 py-16 sm:py-20">
                <div className="mx-auto max-w-4xl">
                    <PageIntro
                        eyebrow="Privacy"
                        title="Privacy policy placeholder"
                        description="This legal page is intentionally in place now so navigation, crawlability, and future compliance content all have a stable route."
                    />
                </div>
            </section>
        </MarketingLayout>
    );
}
