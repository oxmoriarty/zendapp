"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Fingerprint, Ban } from "lucide-react";

const POINTS = [
  {
    icon: ShieldCheck,
    title: "Your keys never touch our servers",
    description: "Generated and encrypted with AES on your device. We only ever store your public wallet address, never a private key.",
  },
  {
    icon: Fingerprint,
    title: "Face ID, not just a password",
    description: "Optional biometric confirmation on supported devices, backed by your device passcode.",
  },
  {
    icon: Ban,
    title: "Arc's blocklist, enforced automatically",
    description: "Every payment is screened at the protocol level before it settles, not after.",
  },
];

export function SecuritySection() {
  return (
    <section id="security" className="relative overflow-hidden bg-zen-gradient text-white">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-primary-500/30 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Built to be trusted with your money.
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {POINTS.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md transition-transform duration-300 group-hover:scale-110 group-hover:bg-white/15">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
