import Link from "next/link";
import { routes } from "@/lib/routes";

export function CtaSection() {
    return (
        <section className="marketing-section bg-[var(--brand-aqua)]">
            <div className="marketing-container max-w-3xl text-center">
                <h2 className="font-heading text-3xl font-bold text-black sm:text-4xl">
                    Ready to transform your creative process?
                </h2>
                <p className="mt-4 text-lg text-neutral-700">
                    Join thousands of creators who use CutBackground to bring their ideas to life.
                </p>
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <Link
                        href={routes.tool}
                        className="marketing-button-primary px-8 py-4 text-base"
                    >
                        Start Creating for Free
                    </Link>
                    <Link
                        href={routes.pricing}
                        className="marketing-button-secondary px-8 py-4 text-base"
                    >
                        View Pricing
                    </Link>
                </div>
            </div>
        </section>
    );
}
