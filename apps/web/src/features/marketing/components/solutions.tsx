export function Solutions() {
    const steps = [
        {
            step: "1",
            title: "Upload Your Image",
            desc: "Drag & drop or browse to upload any image. Supports PNG, JPG, and WebP up to 10MB.",
        },
        {
            step: "2",
            title: "AI Removes Background",
            desc: "Our AI detects the subject and removes the background in under 5 seconds with pixel-perfect edges.",
        },
        {
            step: "3",
            title: "Download Result",
            desc: "Get your transparent PNG instantly. No watermark, no signup, no limits on quality.",
        },
    ];

    return (
        <section id="how-it-works" className="bg-neutral-50 px-4 py-16 sm:py-20">
            <div className="mx-auto max-w-5xl">
                <h2 className="text-center font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
                    How It Works
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-500">
                    Remove image backgrounds in three simple steps. No design skills needed.
                </p>
                <div className="mt-12 grid gap-8 sm:grid-cols-3">
                    {steps.map((item) => (
                        <div
                            key={item.step}
                            className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                        >
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-magenta text-xl font-bold text-white shadow-lg shadow-brand-magenta/20">
                                {item.step}
                            </div>
                            <h3 className="mt-5 font-heading text-lg font-bold text-brand-dark">
                                {item.title}
                            </h3>
                            <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
