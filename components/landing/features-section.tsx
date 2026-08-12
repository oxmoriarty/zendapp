"use client";

import { motion } from "framer-motion";
import { AtSign, Timer, KeyRound } from "lucide-react";
import { Card } from "@/components/ui/card";

const FEATURES = [
  {
    icon: AtSign,
    title: "Pay by username",
    description: "Search a friend's username and send. No copying long wallet addresses, ever.",
  },
  {
    icon: Timer,
    title: "Done in under a second",
    description: "Arc settles every payment with deterministic finality. No waiting, no confirmations to count.",
  },
  {
    icon: KeyRound,
    title: "You hold the keys",
    description:
      "Your wallet is generated and encrypted on your own device. Zendapp never can, and never will, hold your funds.",
  },
];

export function FeaturesSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto mb-14 max-w-2xl text-center"
      >
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Simple by design.
        </h2>
      </motion.div>

      <div className="grid gap-5 md:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <Card className="group h-full p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/20 hover:shadow-elevated">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
