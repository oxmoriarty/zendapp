"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/transaction-item";
import { useTransactions } from "@/hooks/use-transactions";
import { Skeleton } from "@/components/ui/feedback";

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useTransactions();
  const tx = data?.find((t) => t.id === id);

  return (
    <div className="mx-auto max-w-md">
      <header className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-xl font-semibold">Transaction</h1>
      </header>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
        </div>
      )}

      {!isLoading && !tx && (
        <p className="text-center text-sm text-muted-foreground">Transaction not found.</p>
      )}

      {tx && (
        <>
          <div className="flex flex-col items-center rounded-3xl border border-border bg-card py-8 text-center">
            <Avatar name={tx.counterparty.displayName} src={tx.counterparty.avatarUrl} size={64} className="mb-3" />
            <p className="font-medium">{tx.counterparty.displayName}</p>
            <p className="mb-4 text-sm text-muted-foreground">@{tx.counterparty.username}</p>
            <p className="font-display text-4xl font-semibold">
              {tx.direction === "sent" ? "-" : "+"}${tx.amountUsdc}
            </p>
            <div className="mt-3">
              <StatusBadge status={tx.status} />
            </div>
          </div>

          <div className="mt-4 divide-y divide-border rounded-3xl border border-border bg-card px-5">
            <DetailRow label="Type" value={tx.direction === "sent" ? "Sent" : "Received"} />
            <DetailRow label="Date" value={new Date(tx.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} />
            <DetailRow label="Network fee" value={`$${tx.feeUsdc}`} />
            {tx.note && <DetailRow label="Note" value={tx.note} />}
            {tx.hash && (
              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-muted-foreground">Transaction ID</span>
                <a
                  href={`https://testnet.arcscan.app/tx/${tx.hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-sm font-medium text-primary"
                >
                  View <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </div>

          <Button variant="secondary" size="lg" className="mt-6 w-full" onClick={() => router.push("/history")}>
            Back to activity
          </Button>
        </>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
