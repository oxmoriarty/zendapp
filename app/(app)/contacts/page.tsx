"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Star, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { useTransactions } from "@/hooks/use-transactions";
import { useUserSearch } from "@/hooks/use-user-search";
import { useFavoritesStore } from "@/store/favorites-store";
import { useSendFlowStore } from "@/store/send-flow-store";
import { api } from "@/lib/api-client";
import type { ZendUser } from "@/types";

export default function ContactsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [resolving, setResolving] = useState<string | null>(null);
  const { data: transactions, isLoading } = useTransactions();
  const { results: searchResults, status: searchStatus } = useUserSearch(query);
  const { favoriteUsernames, toggle, isFavorite } = useFavoritesStore();
  const setRecipient = useSendFlowStore((s) => s.setRecipient);

  const recent = useMemo(() => {
    if (!transactions) return [];
    const seen = new Map<string, (typeof transactions)[number]>();
    for (const tx of transactions) {
      if (!seen.has(tx.counterparty.username)) seen.set(tx.counterparty.username, tx);
    }
    return Array.from(seen.values()).slice(0, 12);
  }, [transactions]);

  /**
   * Contact tiles only carry a username + display name locally — the
   * wallet address is always re-resolved from the backend right before
   * starting a send, so we never carry a stale or placeholder address
   * into the payment flow.
   */
  async function payContact(u: { username: string; displayName: string; avatarUrl?: string }) {
    setResolving(u.username);
    try {
      const { users } = await api.searchUsers(u.username);
      const match = users.find((r) => r.username === u.username);
      if (!match) {
        setResolving(null);
        return;
      }
      setRecipient(match as ZendUser);
      router.push("/send");
    } finally {
      setResolving(null);
    }
  }

  const isSearching = query.trim().length > 0;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 font-display text-2xl font-semibold">Contacts</h1>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people"
          className="pl-11"
        />
      </div>

      {isSearching ? (
        <SearchResults status={searchStatus} results={searchResults} query={query} onPay={payContact} />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <Star className="h-3.5 w-3.5" /> Favorites
            </h2>
            {favoriteUsernames.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
                Star a contact to pin them here.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                {favoriteUsernames.map((username) => {
                  const match = recent.find((r) => r.counterparty.username === username);
                  const name = match?.counterparty.displayName ?? username;
                  return (
                    <button
                      key={username}
                      onClick={() => payContact({ username, displayName: name, avatarUrl: match?.counterparty.avatarUrl })}
                      disabled={resolving === username}
                      className="flex flex-col items-center gap-1.5 disabled:opacity-50"
                    >
                      <Avatar name={name} src={match?.counterparty.avatarUrl} size={56} />
                      <span className="truncate text-xs">{name.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Recently paid</h2>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <Skeleton className="h-3.5 w-32" />
                  </div>
                ))}
              </div>
            ) : recent.length === 0 ? (
              <EmptyState
                icon={<Users className="h-5 w-5" />}
                title="No contacts yet"
                description="People you've sent or received money from will show up here."
              />
            ) : (
              <div className="rounded-3xl border border-border/60 bg-card p-1.5">
                {recent.map((tx) => (
                  <div
                    key={tx.counterparty.username}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-muted"
                  >
                    <button
                      className="flex flex-1 items-center gap-3 text-left disabled:opacity-50"
                      disabled={resolving === tx.counterparty.username}
                      onClick={() => payContact(tx.counterparty)}
                    >
                      <Avatar name={tx.counterparty.displayName} src={tx.counterparty.avatarUrl} size={44} />
                      <div>
                        <p className="text-sm font-medium">{tx.counterparty.displayName}</p>
                        <p className="text-xs text-muted-foreground">@{tx.counterparty.username}</p>
                      </div>
                    </button>
                    <button
                      onClick={() => toggle(tx.counterparty.username)}
                      className="rounded-full p-2 hover:bg-background"
                      aria-label="Toggle favorite"
                    >
                      <Star
                        className="h-4 w-4"
                        fill={isFavorite(tx.counterparty.username) ? "currentColor" : "none"}
                        color={isFavorite(tx.counterparty.username) ? "hsl(var(--primary))" : "currentColor"}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function SearchResults({
  status,
  results,
  query,
  onPay,
}: {
  status: "idle" | "loading" | "success" | "error";
  results: ZendUser[];
  query: string;
  onPay: (u: ZendUser) => void;
}) {
  if (status === "loading") {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="h-11 w-11 rounded-full" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        ))}
      </div>
    );
  }
  if (status === "error") {
    return <p className="px-3 text-sm text-destructive">Search isn&apos;t working right now.</p>;
  }
  if (results.length === 0) {
    return (
      <EmptyState icon={<Search className="h-5 w-5" />} title="No one found" description={`No users match "${query}"`} />
    );
  }
  return (
    <div className="space-y-1">
      {results.map((u) => (
        <button
          key={u.id}
          onClick={() => onPay(u)}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-muted"
        >
          <Avatar name={u.displayName} src={u.avatarUrl} size={44} />
          <div>
            <p className="text-sm font-medium">{u.displayName}</p>
            <p className="text-xs text-muted-foreground">@{u.username}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
