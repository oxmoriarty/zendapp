"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Search } from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { TransactionItem } from "@/components/transaction-item";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { Input } from "@/components/ui/input";
import { timeAgo } from "@/lib/utils";

export default function HistoryPage() {
  const { data, isLoading, isError } = useTransactions();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!query) return data;
    const q = query.toLowerCase();
    return data.filter(
      (t) => t.counterparty.username.includes(q) || t.counterparty.displayName.toLowerCase().includes(q),
    );
  }, [data, query]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 font-display text-2xl font-semibold">Activity</h1>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transactions"
          className="pl-11"
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
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
      )}

      {isError && (
        <EmptyState
          icon={<Clock className="h-5 w-5" />}
          title="Couldn't load activity"
          description="Check your connection and try again."
        />
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={<Clock className="h-5 w-5" />}
          title={query ? "No matching transactions" : "No activity yet"}
          description={query ? `Nothing matches "${query}"` : "Your sent and received payments will show up here."}
        />
      )}

      <div className="space-y-6">
        {groups.map(([label, txs]) => (
          <div key={label}>
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
              className="rounded-3xl border border-border/60 bg-card p-1.5"
            >
              {txs.map((tx) => (
                <motion.div key={tx.id} variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}>
                  <TransactionItem tx={tx} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}

function groupByDay(items: ReturnType<typeof useTransactions>["data"] extends infer T ? NonNullable<T> : never) {
  const groups = new Map<string, typeof items>();
  for (const tx of items ?? []) {
    const label = dayLabel(tx.createdAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(tx);
  }
  return Array.from(groups.entries());
}

function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}
