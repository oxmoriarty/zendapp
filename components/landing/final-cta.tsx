"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center rounded-3xl border border-border bg-surface-sunken px-6 py-16 text-center"
      >
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Your first payment is 60 seconds away.
        </h2>
        <p className="mt-4 max-w-md text-muted-foreground">
          Sign up, pick a username, and start sending. It&apos;s free, and you&apos;re always in control of your funds.
        </p>
        <Button
          asChild
          variant="glow"
          size="lg"
          className="mt-8 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-8px_rgba(49,2,143,0.55)]"
        >
          <Link href="/signup">
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    </section>
  );
}
