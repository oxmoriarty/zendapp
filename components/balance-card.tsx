"use client";

import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

export function BalanceCard({
  display,
  isLoading,
  isError,
}: {
  display?: string;
  isLoading: boolean;
  isError: boolean;
}) {
  const [hidden, setHidden] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl bg-zen-radial p-7 text-white shadow-glow"
    >
      <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-primary-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-primary-500/30 blur-3xl" />

      <div className="relative flex items-center justify-between">
        <p className="text-sm font-medium text-white/70">Your balance</p>
        <button
          onClick={() => setHidden((h) => !h)}
          className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          aria-label={hidden ? "Show balance" : "Hide balance"}
        >
          {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <div className="relative mt-3 flex items-baseline gap-2">
        {isLoading ? (
          <Skeleton className="h-11 w-40 bg-white/15" />
        ) : isError ? (
          <p className="font-display text-2xl font-semibold text-white/80">Balance unavailable</p>
        ) : (
          <>
            <span className="font-display text-2xl font-medium text-white/70">$</span>
            <span className={cn("font-display text-5xl font-semibold tracking-tight", hidden && "blur-lg select-none")}>
              {display}
            </span>
            <span className="font-display text-lg font-medium text-white/60">USDC</span>
          </>
        )}
      </div>

      <div className="relative mt-7 grid grid-cols-3 gap-2">
        <QuickAction href="/send" icon={<ArrowUpRight className="h-5 w-5" />} label="Send" />
        <QuickAction href="/receive" icon={<ArrowDownLeft className="h-5 w-5" />} label="Receive" />
        <QuickAction href="/history" icon={<Clock className="h-5 w-5" />} label="History" />
      </div>
    </motion.div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-2xl bg-white/10 py-3.5 backdrop-blur-md transition-all hover:bg-white/15 active:scale-95"
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}
