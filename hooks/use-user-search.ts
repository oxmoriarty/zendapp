"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { ZendUser } from "@/types";

export function useUserSearch(query: string) {
  const [results, setResults] = useState<ZendUser[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const t = setTimeout(async () => {
      try {
        const { users } = await api.searchUsers(query);
        setResults(users);
        setStatus("success");
      } catch {
        setStatus("error");
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return { results, status };
}
