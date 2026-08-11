import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Privacy Policy — Zendapp" };

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Zendapp
        </Link>
        <Logo size={22} className="mb-10" />

        <h1 className="font-display text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: not yet published</p>

        <div className="mt-8 space-y-4 rounded-3xl border border-dashed border-border bg-surface-sunken p-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            Zendapp is currently in early development on Arc Testnet, and a full Privacy Policy
            hasn&apos;t been published yet. We&apos;d rather leave this page honest than fill it with
            placeholder legal text that doesn&apos;t reflect a real, reviewed policy.
          </p>
          <p>
            What&apos;s true today, by design: Zendapp never stores your private key or recovery
            phrase — they&apos;re generated and encrypted on your own device and never sent to our
            servers. We store your email, username, display name, and public wallet address to run
            your account. A complete Privacy Policy will be published here before Zendapp supports
            real funds.
          </p>
          <p>
            Questions in the meantime? Reach out at{" "}
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
