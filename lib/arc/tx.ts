import { decodeEventLog, isAddress, pad, parseAbi } from "viem";
import type { Hash } from "viem";
import { arcPublicClient } from "./client";
import { ARC_CONTRACTS, NATIVE_TRANSFER_TOPIC } from "./chain";

/**
 * Arc Builders Docs — "Transaction Lifecycle": Arc uses a TWO-STATE model.
 * A transaction is either `pending` (in the mempool) or `final` (included in
 * a committed block). There is no intermediate "confirming" state, no
 * confirmation counter, and no reorg risk. Zendapp mirrors this exactly:
 * we never show "x/12 confirmations" and we treat a receipt as immediately
 * authoritative.
 */
export type ZendTxStatus = "pending" | "complete" | "failed";

export interface ZendTransaction {
  hash: Hash;
  status: ZendTxStatus;
  /** Native 18-decimal USDC wei. */
  amountWei: bigint;
  feeWei: bigint;
  from: `0x${string}`;
  to: `0x${string}`;
  blockNumber?: bigint;
  timestamp?: number;
}

const usdcAbi = parseAbi(["function isBlacklisted(address) view returns (bool)"]);

/** Check Arc's protocol-level USDC blocklist before ever attempting a send. */
export async function isBlocklisted(address: `0x${string}`): Promise<boolean> {
  if (!isAddress(address)) return false;
  try {
    return await arcPublicClient.readContract({
      address: ARC_CONTRACTS.usdcErc20,
      abi: usdcAbi,
      functionName: "isBlacklisted",
      args: [address],
    });
  } catch {
    // If the RPC call itself fails, don't silently allow the send — surface
    // it as an RPC-unavailable error at the call site instead.
    throw new Error("ARC_RPC_UNAVAILABLE");
  }
}

/**
 * Wait for a transaction to reach Arc's single final state. Because Arc has
 * deterministic sub-second finality, one receipt is sufficient — no polling
 * for additional confirmations, ever.
 */
export async function waitForFinal(hash: Hash): Promise<ZendTransaction> {
  const receipt = await arcPublicClient.waitForTransactionReceipt({
    hash,
    confirmations: 1, // Arc: 1 confirmation = final. Never raise this.
  });

  const tx = await arcPublicClient.getTransaction({ hash });
  const block = await arcPublicClient.getBlock({ blockNumber: receipt.blockNumber });

  return {
    hash,
    status: receipt.status === "success" ? "complete" : "failed",
    amountWei: tx.value,
    feeWei: receipt.gasUsed * (receipt.effectiveGasPrice ?? 0n),
    from: tx.from,
    to: (tx.to ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
    blockNumber: receipt.blockNumber,
    timestamp: Number(block.timestamp) * 1000,
  };
}

/**
 * Fetch a user's USDC movement history by filtering the native system
 * emitter — per Arc docs this is the ONLY complete record (the ERC-20
 * contract misses plain native sends). Values from this emitter are
 * 18-decimal native wei, matching the rest of Zendapp's balance model.
 */
export async function getUsdcHistory(address: `0x${string}`, fromBlock: bigint = 0n) {
  const paddedAddress = pad(address, { size: 32 });

  const logs = await arcPublicClient.getLogs({
    address: ARC_CONTRACTS.nativeUsdcSystemEmitter,
    event: {
      type: "event",
      name: "Transfer",
      inputs: [
        { name: "from", type: "address", indexed: true },
        { name: "to", type: "address", indexed: true },
        { name: "value", type: "uint256", indexed: false },
      ],
    },
    args: { from: address }, // fetch sent
    fromBlock,
    toBlock: "latest",
  });

  const received = await arcPublicClient.getLogs({
    address: ARC_CONTRACTS.nativeUsdcSystemEmitter,
    event: {
      type: "event",
      name: "Transfer",
      inputs: [
        { name: "from", type: "address", indexed: true },
        { name: "to", type: "address", indexed: true },
        { name: "value", type: "uint256", indexed: false },
      ],
    },
    args: { to: address },
    fromBlock,
    toBlock: "latest",
  });

  return [...logs, ...received].sort((a, b) =>
    a.blockNumber === b.blockNumber ? 0 : (a.blockNumber ?? 0n) > (b.blockNumber ?? 0n) ? -1 : 1,
  );
}

export { NATIVE_TRANSFER_TOPIC };
