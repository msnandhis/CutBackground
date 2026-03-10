import { MarketingLayout } from "@/components/site/marketing-layout";
import { PageIntro } from "@/components/site/page-intro";

const sections = [
    {
        title: "Information we collect",
        body: "We collect account details you provide directly, such as name, email address, and authentication data. We also store uploaded files, generated outputs, API keys, billing-related metadata if enabled later, and basic operational logs such as IP address, request timestamps, and job status events.",
    },
    {
        title: "How we use it",
        body: "We use this information to authenticate users, process background-removal jobs, return generated outputs, prevent abuse, troubleshoot failures, and improve the service. We do not sell personal information.",
    },
    {
        title: "Processors and infrastructure",
        body: "Uploaded files and account data may be processed by infrastructure providers that operate our database, storage, email delivery, queueing, and AI execution stack. Those providers process data only to deliver the service on our behalf.",
    },
    {
        title: "Retention",
        body: "We retain account records, job history, and related logs for as long as needed to operate the product, meet legal obligations, and investigate abuse. Files and outputs may be deleted earlier according to storage-retention policy updates.",
    },
    {
        title: "Your choices",
        body: "You can request account deletion or ask questions about privacy practices by contacting support. If you revoke an API key or delete uploaded content from your workspace, future access is removed, but backups and logs may persist for a limited period.",
    },
];

export default function PrivacyPage() {
    return (
        <MarketingLayout>
            <section className="px-4 py-16 sm:py-20">
                <div className="mx-auto max-w-4xl space-y-10">
                    <PageIntro
                        eyebrow="Privacy"
                        title="Privacy policy"
                        description="This page explains what data CutBackground stores, why it is processed, and how it is handled across the app, API, and background job system."
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
