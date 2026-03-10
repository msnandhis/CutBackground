import { MarketingLayout } from "@/components/site/marketing-layout";
import { PageIntro } from "@/components/site/page-intro";

const cookieCategories = [
    {
        title: "Essential cookies",
        body: "These cookies are required for sign-in, session security, CSRF protection, and core dashboard behavior. The app cannot function correctly without them.",
    },
    {
        title: "Preference cookies",
        body: "We may use limited preference storage to remember interface choices or product settings that improve repeat visits.",
    },
    {
        title: "Analytics and diagnostics",
        body: "If analytics are enabled later, we may use cookies or similar storage to understand traffic patterns, feature usage, and operational failures. Those controls can be updated as tooling changes.",
    },
];

export default function CookiesPage() {
    return (
        <MarketingLayout>
            <section className="px-4 py-16 sm:py-20">
                <div className="mx-auto max-w-4xl space-y-10">
                    <PageIntro
                        eyebrow="Cookies"
                        title="Cookie policy"
                        description="CutBackground uses a small set of cookies and similar browser storage mechanisms to keep sessions secure and the application usable."
                    />

                    <div className="space-y-6">
                        {cookieCategories.map((category) => (
                            <article
                                key={category.title}
                                className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm"
                            >
                                <h2 className="text-xl font-semibold text-brand-dark">
                                    {category.title}
                                </h2>
                                <p className="mt-3 text-sm leading-7 text-neutral-600">
                                    {category.body}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
