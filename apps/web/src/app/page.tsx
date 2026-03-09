import { Navbar } from "@/features/marketing/components/navbar";
import { Hero } from "@/features/marketing/components/hero";
import { ToolPreview } from "@/features/marketing/components/tool-preview";
import { TrustedBy } from "@/features/marketing/components/trusted-by";
import { FeaturedTools } from "@/features/marketing/components/featured-tools";
import { Solutions } from "@/features/marketing/components/solutions";
import { Testimonials } from "@/features/marketing/components/testimonials";
import { Faq } from "@/features/marketing/components/faq";
import { CtaSection } from "@/features/marketing/components/cta-section";
import { Footer } from "@/features/marketing/components/footer";

export default function HomePage() {
    return (
        <>
            <Navbar />
            <main>
                <Hero />
                <ToolPreview />
                <TrustedBy />
                <FeaturedTools />
                <Solutions />
                <Testimonials />
                <Faq />
                <CtaSection />
            </main>
            <Footer />
        </>
    );
}
