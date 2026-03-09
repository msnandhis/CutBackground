const faqs = [
    {
        question: "Can I remove backgrounds right now?",
        answer:
            "Not yet. The repository currently includes the landing page, shared package scaffolding, and configuration needed for the full product, but the upload and AI processing flow is still being implemented.",
    },
    {
        question: "What parts of the product are already in place?",
        answer:
            "The monorepo structure, Next.js app shell, marketing site, Tailwind design system, and shared utilities for logging, Redis, BullMQ, R2, and database access are present.",
    },
    {
        question: "What comes next in the roadmap?",
        answer:
            "The next major phases are Drizzle schema and migrations, BetterAuth integration, upload APIs, background workers, Replicate processing, and the result UI.",
    },
];

export function Faq() {
    return (
        <section id="faq" className="bg-neutral-50 px-4 py-16 sm:py-20">
            <div className="mx-auto max-w-4xl">
                <h2 className="text-center font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
                    Frequently Asked Questions
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-center text-neutral-500">
                    The current repository is healthy and consistent, but it is still at the
                    scaffold-and-marketing stage.
                </p>

                <div className="mt-10 space-y-4">
                    {faqs.map((faq) => (
                        <div
                            key={faq.question}
                            className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
                        >
                            <h3 className="font-heading text-xl font-bold text-brand-dark">
                                {faq.question}
                            </h3>
                            <p className="mt-3 leading-relaxed text-neutral-600">
                                {faq.answer}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
