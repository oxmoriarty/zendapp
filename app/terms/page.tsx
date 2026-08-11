import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Terms of Service — Zendapp" };

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Zendapp
        </Link>
        <Logo size={22} className="mb-10" />

        <h1 className="font-display text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: not yet published</p>

        <div className="mt-8 space-y-4 rounded-3xl border border-dashed border-border bg-surface-sunken p-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            Zendapp is currently in early development on Arc Testnet, and full Terms of Service
            haven&apos;t been published yet. We&apos;d rather leave this page honest than fill it with
            placeholder legal text that doesn&apos;t reflect a real, reviewed agreement.
          </p>
          <p>
            A complete Terms of Service will be published here before Zendapp supports real funds.
            In the meantime, if you have questions about how the app works or how your data is
            handled, reach out at{" "}
            <a href="mailto:support@zendapp.app" className="font-medium text-primary hover:underline">
              support@zendapp.app
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
