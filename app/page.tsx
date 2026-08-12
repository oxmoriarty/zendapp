import type { Metadata } from "next";
import { AuthRedirectGate } from "@/components/landing/auth-redirect-gate";
import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { SecuritySection } from "@/components/landing/security-section";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Zendapp: Send money like a text",
  description:
    "Pay anyone by username, in USDC, settled instantly on Arc. Zendapp never holds your funds or your keys.",
};

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <AuthRedirectGate />
      <LandingNav />
      <main>
        <Hero />
        <FeaturesSection />
        <HowItWorksSection />
        <SecuritySection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
