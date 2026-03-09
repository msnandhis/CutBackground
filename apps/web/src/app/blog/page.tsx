import { MarketingLayout } from "@/components/site/marketing-layout";
import { PageIntro } from "@/components/site/page-intro";
import { blogPosts } from "@/lib/mocks";

export default function BlogPage() {
    return (
        <MarketingLayout>
            <section className="px-4 py-16 sm:py-20">
                <div className="mx-auto max-w-5xl">
                    <PageIntro
                        eyebrow="Blog"
                        title="Editorial and product content placeholder"
                        description="This route is intentionally present now so SEO, navigation, and content architecture are settled before the MDX/blog pipeline is wired."
                    />
                    <div className="mt-12 space-y-5">
                        {blogPosts.map((post) => (
                            <article key={post.title} className="rounded-[2rem] border border-neutral-200 bg-white p-8 shadow-sm">
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-magenta">
                                    {post.tag}
                                </p>
                                <h2 className="mt-3 font-heading text-2xl font-bold text-brand-dark">
                                    {post.title}
                                </h2>
                                <p className="mt-3 text-neutral-600">{post.excerpt}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
