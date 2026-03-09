import { MarketingLayout } from "@/components/site/marketing-layout";
import { PageIntro } from "@/components/site/page-intro";

export default function ContactPage() {
    return (
        <MarketingLayout>
            <section className="px-4 py-16 sm:py-20">
                <div className="mx-auto max-w-5xl">
                    <PageIntro
                        eyebrow="Contact"
                        title="Talk to us about integrations, launch plans, or feedback"
                        description="This contact route is frontend-only for now, but it already reflects the support paths the backend and operations layer will need to back later."
                    />
                    <div className="mt-12 grid gap-6 md:grid-cols-2">
                        <div className="rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm">
                            <h2 className="font-heading text-2xl font-bold text-brand-dark">Product and support</h2>
                            <p className="mt-4 text-neutral-600">support@cutbackground.com</p>
                            <p className="mt-2 text-sm text-neutral-500">Response target: within 1 business day</p>
                        </div>
                        <div className="rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm">
                            <h2 className="font-heading text-2xl font-bold text-brand-dark">Partnerships and API</h2>
                            <p className="mt-4 text-neutral-600">hello@cutbackground.com</p>
                            <p className="mt-2 text-sm text-neutral-500">For agencies, embedded usage, and volume plans</p>
                        </div>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
