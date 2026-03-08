import Link from "next/link";

export function CtaSection() {
    return (
        <section className="bg-brand-dark px-4 py-16 sm:py-20">
            <div className="mx-auto max-w-3xl text-center">
                <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
                    Ready to transform your images?
                </h2>
                <p className="mt-4 text-lg text-neutral-400">
                    Join thousands of creators who remove backgrounds instantly with CutBackground.
                </p>
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <Link
                        href="#tool"
                        className="rounded-full bg-brand-magenta px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-magenta/25 transition-all hover:bg-brand-magenta-hover hover:shadow-xl"
                    >
                        Start Removing Backgrounds — Free
                    </Link>
                    <Link
                        href="#use-cases"
                        className="rounded-full border-2 border-white/20 px-8 py-4 text-base font-semibold text-white transition-all hover:border-white/40 hover:bg-white/5"
                    >
                        See Use Cases
                    </Link>
                </div>
            </div>
        </section>
    );
}
