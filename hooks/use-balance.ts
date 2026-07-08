"use client";

import { useQuery } from "@tanstack/react-query";
import { arcPublicClient } from "@/lib/arc/client";
import { formatUsdc } from "@/lib/arc/usdc";

/**
 * Reads the single unified USDC balance for a wallet address.
 * We intentionally only ever call eth_getBalance (native) — never the
 * ERC-20 balanceOf — because the native balance is the full-precision
 * source of truth (the ERC-20 view truncates below 1e-6 USDC per Arc docs).
 */
export function useBalance(address?: `0x${string}`) {
  return useQuery({
    queryKey: ["arc-balance", address],
    queryFn: async () => {
      if (!address) throw new Error("NO_ADDRESS");
      const weiBalance = await arcPublicClient.getBalance({ address });
      return {
        weiBalance,
        display: formatUsdc(weiBalance),
        compact: formatUsdc(weiBalance, { compact: true }),
      };
    },
    enabled: !!address,
    refetchInterval: 10_000, // Arc finalizes sub-second; poll frequently for a "live" feel
    retry: (failureCount, error) => {
      // Don't hammer a genuinely-down RPC endlessly
      return failureCount < 2;
    },
  });
}
