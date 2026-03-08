import Link from "next/link";

export function CtaSection() {
    return (
        <section className="bg-sky-50 px-4 py-16 sm:py-20">
            <div className="mx-auto max-w-3xl text-center">
                <h2 className="font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
                    Ready to transform your creative process?
                </h2>
                <p className="mt-4 text-lg text-neutral-500">
                    Join thousands of creators who use CutBackground to bring their ideas to life.
                </p>
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <Link
                        href="#tool"
                        className="rounded-full bg-brand-magenta px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-magenta/20 transition-all hover:bg-brand-magenta-hover hover:shadow-xl"
                    >
                        Start Creating for Free
                    </Link>
                    <Link
                        href="#use-cases"
                        className="rounded-full border border-neutral-200 bg-white px-8 py-4 text-base font-semibold text-brand-dark transition-all hover:bg-neutral-50 hover:shadow-sm"
                    >
                        View All Features
                    </Link>
                </div>
            </div>
        </section>
    );
}
