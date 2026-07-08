import { createPublicClient, http, fallback } from "viem";
import { arcTestnet } from "./chain";

/**
 * Shared read-only Arc client. Falls back across the primary RPC — additional
 * endpoints (Blockdaemon / dRPC / QuickNode, per Arc docs) can be appended to
 * the transport list here without touching call sites.
 */
export const arcPublicClient = createPublicClient({
  chain: arcTestnet,
  transport: fallback([
    http("https://rpc.testnet.arc.network"),
  ]),
});

/** True if we can currently reach an Arc RPC endpoint. Used for the offline/RPC-down error state. */
export async function isArcReachable(): Promise<boolean> {
  try {
    await arcPublicClient.getBlockNumber();
    return true;
  } catch {
    return false;
  }
}
