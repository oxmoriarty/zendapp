"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    number: "01",
    title: "Create your wallet",
    description:
      "Sign up with your email. Zendapp generates a private, non-custodial wallet on your device in seconds — no seed-phrase apps, no browser extensions.",
  },
  {
    number: "02",
    title: "Pick your username",
    description: "Choose a permanent @username. That's the only thing anyone needs to pay you.",
  },
  {
    number: "03",
    title: "Find your people",
    description: "Search for friends by username and add them to your contacts, just like a messaging app.",
  },
  {
    number: "04",
    title: "Send",
    description:
      "Enter an amount, confirm with your passcode or Face ID, done. The payment shows Complete, not \"pending.\"",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-surface-sunken">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            From sign-up to sent, in four steps.
          </h2>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative"
            >
              <span className="font-display text-4xl font-semibold text-primary/25">{step.number}</span>
              <h3 className="mt-3 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              {i < STEPS.length - 1 && (
                <div className="absolute right-[-1rem] top-4 hidden h-px w-8 bg-border lg:block" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
