"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { ZendTransactionRecord } from "@/types";

export function useTransactions() {
  return useQuery<ZendTransactionRecord[]>({
    queryKey: ["tx-history"],
    queryFn: async () => {
      const { transactions } = await api.history();
      return transactions;
    },
    refetchInterval: 8000,
  });
}
