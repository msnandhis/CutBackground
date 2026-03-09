import { MarketingLayout } from "@/components/site/marketing-layout";
import { PageIntro } from "@/components/site/page-intro";

export default function CookiesPage() {
    return (
        <MarketingLayout>
            <section className="px-4 py-16 sm:py-20">
                <div className="mx-auto max-w-4xl">
                    <PageIntro
                        eyebrow="Cookies"
                        title="Cookie policy placeholder"
                        description="A lightweight legal route now prevents dead links and gives the eventual compliance layer a clear place to live."
                    />
                </div>
            </section>
        </MarketingLayout>
    );
}
