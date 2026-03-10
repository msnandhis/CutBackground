import { MarketingLayout } from "@/components/site/marketing-layout";
import { PageIntro } from "@/components/site/page-intro";

const sections = [
    {
        title: "Use of the service",
        body: "You may use CutBackground only for lawful purposes and only for content you have the right to upload, process, and distribute. You must not use the service to violate intellectual-property, privacy, or other third-party rights.",
    },
    {
        title: "Accounts and API keys",
        body: "You are responsible for activity performed through your account, workspace sessions, and API keys. Keep credentials private and revoke them immediately if you suspect exposure.",
    },
    {
        title: "Generated output",
        body: "AI output quality can vary based on the source image and provider behavior. We do not guarantee that every job will succeed or that generated assets will be error-free, fit for a specific purpose, or continuously available.",
    },
    {
        title: "Availability and changes",
        body: "We may change, suspend, rate-limit, or discontinue features to protect the service, respond to abuse, or maintain reliability. Planned commercial features, quotas, and storage-retention rules may change over time.",
    },
    {
        title: "Liability",
        body: "To the maximum extent allowed by law, the service is provided on an as-is and as-available basis. We are not liable for indirect, incidental, special, consequential, or punitive damages arising from use of the product.",
    },
];

export default function TermsPage() {
    return (
        <MarketingLayout>
            <section className="px-4 py-16 sm:py-20">
                <div className="mx-auto max-w-4xl space-y-10">
                    <PageIntro
                        eyebrow="Terms"
                        title="Terms of service"
                        description="These terms govern use of the CutBackground website, dashboard, API, and background-processing workflows."
                    />

                    <div className="space-y-6">
                        {sections.map((section) => (
                            <article
                                key={section.title}
                                className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm"
                            >
                                <h2 className="text-xl font-semibold text-brand-dark">
                                    {section.title}
                                </h2>
                                <p className="mt-3 text-sm leading-7 text-neutral-600">
                                    {section.body}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
