"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, ArrowRight } from "lucide-react";
import { useSessionStore } from "@/store/session-store";
import { useBalance } from "@/hooks/use-balance";
import { useTransactions } from "@/hooks/use-transactions";
import { BalanceCard } from "@/components/balance-card";
import { Avatar } from "@/components/ui/avatar";
import { TransactionItem } from "@/components/transaction-item";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { Clock } from "lucide-react";

export default function HomePage() {
  const user = useSessionStore((s) => s.user);
  const balance = useBalance(user?.walletAddress);
  const { data: transactions, isLoading: txLoading } = useTransactions();

  const firstName = user?.displayName?.split(" ")[0] ?? "there";
  const recent = (transactions ?? []).slice(0, 5);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{firstName} 👋</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>
          <Link href="/profile">
            <Avatar name={user?.displayName ?? "?"} src={user?.avatarUrl} size={40} />
          </Link>
        </div>
      </header>

      <BalanceCard
        display={balance.data?.display}
        isLoading={balance.isLoading}
        isError={balance.isError}
      />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent activity</h2>
          <Link href="/history" className="flex items-center gap-1 text-sm font-medium text-primary">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {txLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-6 w-6" />}
            title="No activity yet"
            description="Once you send or receive USDC, it'll show up here."
          />
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            className="rounded-3xl border border-border/60 bg-card p-1.5"
          >
            {recent.map((tx) => (
              <motion.div key={tx.id} variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}>
                <TransactionItem tx={tx} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}
