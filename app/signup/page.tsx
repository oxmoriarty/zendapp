"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Check, ArrowUpRight } from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { api, ApiRequestError } from "@/lib/api-client";
import { useSessionStore } from "@/store/session-store";

/**
 * The single entry point for both new signups and returning sign-ins (see
 * the /verify flow for the branch that happens after the code is
 * confirmed). Deliberately given its own full layout rather than the
 * shared narrow (auth) shell used by the deeper onboarding steps - as the
 * literal front door of the product, it earns a bit more visual presence.
 */
export default function SignupPage() {
  const router = useRouter();
  const setPendingEmail = useSessionStore((s) => s.setPendingEmail);
  const setOnboardingStep = useSessionStore((s) => s.setOnboardingStep);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.signup(email);
      setPendingEmail(email);
      setOnboardingStep("verify");
      router.push("/verify");
    } catch (err) {
      if (err instanceof ApiRequestError) setError(err.message);
      else setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Left: brand panel - hidden on mobile in favor of a compact header above the form */}
      <div className="relative hidden overflow-hidden bg-zen-radial px-14 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-16 h-96 w-96 rounded-full bg-primary-500/25 blur-3xl" />

        <Link href="/" className="relative w-fit">
          <LogoOnDark />
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-md"
        >
          <h2 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight">
            Your money, sent simply.
          </h2>
          <p className="mt-4 text-white/70">
            You&apos;re always in control of your funds. We never hold your money or your keys.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative w-full max-w-xs"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <Avatar name="Jordan Lee" size={36} />
              <div>
                <p className="text-sm font-semibold">$25.00 sent</p>
                <p className="text-xs text-white/60">to @jordanlee</p>
              </div>
              <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-success text-white">
                <Check className="h-3.5 w-3.5" />
              </span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-3 flex items-center gap-1.5 text-xs font-medium text-white/60"
          >
            <ArrowUpRight className="h-3.5 w-3.5 text-success" />
            Complete in under a second
          </motion.div>
        </motion.div>
      </div>

      {/* Right: the actual form */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mb-10 flex justify-center lg:hidden">
          <Logo size={24} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-sm"
        >
          <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome to Zendapp</h1>
          <p className="mt-2 text-muted-foreground">
            New here or coming back? Enter your email to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12"
                autoFocus
                error={error ?? undefined}
              />
            </div>

            <Button
              type="submit"
              variant="glow"
              size="lg"
              className="w-full transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-8px_rgba(49,2,143,0.55)]"
              loading={loading}
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to Zendapp&apos;s Terms and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// Small on-dark lockup for the brand panel, since the shared Logo
// component's badge is styled for light/dark surfaces, not this gradient.
function LogoOnDark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md">
        <LogoMark size={16} className="brightness-0 invert" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-white">Zendapp</span>
    </span>
  );
}
