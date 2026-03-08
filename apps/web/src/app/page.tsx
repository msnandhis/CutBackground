import { Navbar } from "@/features/marketing/components/navbar";
import { Hero } from "@/features/marketing/components/hero";
import { TrustedBy } from "@/features/marketing/components/trusted-by";
import { FeaturedTools } from "@/features/marketing/components/featured-tools";
import { Solutions } from "@/features/marketing/components/solutions";
import { Testimonials } from "@/features/marketing/components/testimonials";
import { CtaSection } from "@/features/marketing/components/cta-section";
import { Footer } from "@/features/marketing/components/footer";

export default function HomePage() {
    return (
        <>
            <Navbar />
            <main>
                <Hero />
                <TrustedBy />
                <FeaturedTools />
                <Solutions />
                <Testimonials />
                <CtaSection />
            </main>
            <Footer />
        </>
    );
}
