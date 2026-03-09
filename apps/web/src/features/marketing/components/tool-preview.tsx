import Link from "next/link";
import { toolConfig } from "@config/tool";

export function ToolPreview() {
    return (
        <section id="tool" className="bg-white px-4 py-16 sm:py-20">
            <div className="mx-auto max-w-6xl rounded-[2rem] border border-neutral-200 bg-neutral-50 p-6 shadow-sm sm:p-10">
                <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-magenta">
                            Product Preview
                        </p>
                        <h2 className="mt-4 font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
                            {toolConfig.name}
                        </h2>
                        <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
                            The processing pipeline is not wired yet, but the product contract is in
                            place: single-image uploads, PNG output, strict validation, and
                            background jobs for async processing.
                        </p>

                        <div className="mt-8 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl bg-white p-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                                    Accepted
                                </p>
                                <p className="mt-2 text-sm text-neutral-700">
                                    {toolConfig.input.acceptedFormats.join(", ")}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white p-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                                    Max file size
                                </p>
                                <p className="mt-2 text-sm text-neutral-700">
                                    {toolConfig.input.maxFileSizeMB} MB
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white p-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                                    Output
                                </p>
                                <p className="mt-2 text-sm text-neutral-700">
                                    Transparent {toolConfig.output.format.toUpperCase()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[1.75rem] bg-brand-dark p-6 text-white">
                        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                            <div className="flex items-center justify-between text-sm text-white/70">
                                <span>Upload queue</span>
                                <span>Coming next</span>
                            </div>
                            <div className="mt-6 rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
                                <p className="text-base font-semibold">Drag and drop an image</p>
                                <p className="mt-2 text-sm text-white/60">
                                    API routes, workers, and storage integration are the next build step.
                                </p>
                                <div className="mt-6 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white/75">
                                    Status: scaffolded
                                </div>
                            </div>
                            <Link
                                href="#faq"
                                className="mt-6 inline-flex rounded-full bg-brand-magenta px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-magenta-hover"
                            >
                                See current limitations
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
