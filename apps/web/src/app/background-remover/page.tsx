import { MarketingLayout } from "@/components/site/marketing-layout";
import { PageIntro } from "@/components/site/page-intro";
import { ToolStudio } from "@/features/tool";

export default function BackgroundRemoverPage() {
    return (
        <MarketingLayout>
            <section className="px-4 py-16 sm:py-20">
                <div className="mx-auto max-w-6xl">
                    <PageIntro
                        eyebrow="Tool"
                        title="Background remover studio"
                        description="This page now contains the full frontend tool surface with realistic empty, upload, processing, success, and failure states. It is designed to be wired directly to upload and job APIs later."
                    />
                    <div className="mt-12">
                        <ToolStudio />
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
