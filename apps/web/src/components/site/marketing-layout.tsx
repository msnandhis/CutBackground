import type { ReactNode } from "react";
import { Navbar } from "@/features/marketing/components/navbar";
import { Footer } from "@/features/marketing/components/footer";

export function MarketingLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <Navbar />
            <main>{children}</main>
            <Footer />
        </>
    );
}
