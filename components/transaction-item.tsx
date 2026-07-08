"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/feedback";
import { cn, timeAgo } from "@/lib/utils";
import type { ZendTransactionRecord } from "@/types";

export function TransactionItem({ tx }: { tx: ZendTransactionRecord }) {
  const isSent = tx.direction === "sent";
  return (
    <Link
      href={`/history/${tx.id}`}
      className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-muted"
    >
      <div className="relative">
        <Avatar name={tx.counterparty.displayName} src={tx.counterparty.avatarUrl} size={46} />
        <span
          className={cn(
            "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background",
            isSent ? "bg-primary" : "bg-success",
          )}
        >
          {isSent ? (
            <ArrowUpRight className="h-2.5 w-2.5 text-white" />
          ) : (
            <ArrowDownLeft className="h-2.5 w-2.5 text-white" />
          )}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{tx.counterparty.displayName}</p>
        <p className="truncate text-xs text-muted-foreground">@{tx.counterparty.username}</p>
      </div>

      <div className="flex flex-col items-end gap-1">
        <p className={cn("text-sm font-semibold", isSent ? "text-foreground" : "text-success")}>
          {isSent ? "-" : "+"}${tx.amountUsdc}
        </p>
        <StatusBadge status={tx.status} />
      </div>
    </Link>
  );
}

export function StatusBadge({ status }: { status: ZendTransactionRecord["status"] }) {
  if (status === "pending") {
    return (
      <Badge variant="warning" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> Pending
      </Badge>
    );
  }
  if (status === "failed") {
    return <Badge variant="muted">Failed</Badge>;
  }
  return <Badge variant="success">Complete</Badge>;
}

export function TransactionTimestamp({ iso }: { iso: string }) {
  return <span className="text-xs text-muted-foreground">{timeAgo(iso)}</span>;
}
