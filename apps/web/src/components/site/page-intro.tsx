import type { ReactNode } from "react";

interface PageIntroProps {
    eyebrow?: string;
    title: string;
    description: string;
    actions?: ReactNode;
    align?: "left" | "center";
}

export function PageIntro({
    eyebrow,
    title,
    description,
    actions,
    align = "left",
}: PageIntroProps) {
    const textAlign = align === "center" ? "text-center" : "text-left";
    const contentWidth = align === "center" ? "mx-auto max-w-3xl" : "max-w-3xl";
    const actionAlign = align === "center" ? "justify-center" : "justify-start";

    return (
        <div className={`${contentWidth} ${textAlign}`}>
            {eyebrow ? (
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-magenta">
                    {eyebrow}
                </p>
            ) : null}
            <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight text-brand-dark sm:text-5xl">
                {title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-neutral-600">{description}</p>
            {actions ? <div className={`mt-8 flex flex-wrap gap-4 ${actionAlign}`}>{actions}</div> : null}
        </div>
    );
}
