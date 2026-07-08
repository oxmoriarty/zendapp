"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiRequestError } from "@/lib/api-client";
import { useSessionStore } from "@/store/session-store";

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
    <div className="flex flex-1 flex-col justify-center">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Send money like a text message
        </h1>
        <p className="text-muted-foreground">
          Zendapp lets you pay anyone by username. Fast, simple, and always in USDC.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <Button type="submit" variant="glow" size="lg" className="w-full" loading={loading}>
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By continuing you agree to Zendapp&apos;s Terms and Privacy Policy.
      </p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="mt-auto pt-10 text-center text-xs text-muted-foreground/70"
      >
        Built on Arc · Non-custodial · Instant finality
      </motion.div>
    </div>
  );
}
