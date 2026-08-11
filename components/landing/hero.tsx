"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-zen-mesh opacity-70 dark:opacity-40" />

      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 pb-20 pt-16 md:grid-cols-2 md:pb-32 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Built on Arc
          </div>

          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Send USDC to anyone —{" "}
            <span className="bg-zen-gradient bg-clip-text text-transparent">
              using just their username.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
            No wallet addresses. No gas fees to think about. No crypto jargon. Zendapp feels like
            texting money to a friend — and it settles instantly.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="glow" size="lg">
              <Link href="/signup">
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Free to sign up. No credit card, no wallet setup headaches.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="pointer-events-none absolute -right-10 -top-14 h-56 w-56 rounded-full bg-primary-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-primary-500/20 blur-3xl" />

          {/* Balance card mockup — mirrors the real in-app card so the hero shows the actual product */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative overflow-hidden rounded-3xl bg-zen-radial p-7 text-white shadow-glow"
          >
            <p className="text-sm font-medium text-white/70">Your balance</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-2xl font-medium text-white/70">$</span>
              <span className="font-display text-5xl font-semibold tracking-tight">2,480</span>
              <span className="font-display text-lg font-medium text-white/60">USDC</span>
            </div>
            <div className="mt-7 grid grid-cols-3 gap-2">
              {["Send", "Receive", "History"].map((label) => (
                <div key={label} className="rounded-2xl bg-white/10 py-3.5 text-center text-xs font-medium backdrop-blur-md">
                  {label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Overlapping "payment sent" toast — shows the send flow's real end state */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -12 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -bottom-8 -left-8 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-elevated sm:-left-12"
          >
            <Avatar name="Maya Chen" size={40} />
            <div className="pr-2">
              <p className="text-sm font-semibold">$42.00 sent</p>
              <p className="text-xs text-muted-foreground">to @mayachen</p>
            </div>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-white">
              <Check className="h-3.5 w-3.5" />
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="absolute -right-4 -top-4 flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium shadow-elevated sm:-right-8"
          >
            <ArrowUpRight className="h-3.5 w-3.5 text-success" />
            Complete
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
