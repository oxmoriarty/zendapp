import type { PublicClient } from "viem";
import { formatUsdcFee } from "./usdc";

/**
 * Fee estimation per Arc Builders Docs — "How to: Display Transaction Fees".
 *
 * Arc uses an EWMA-smoothed EIP-1559 base fee with a 20 Gwei minimum, paid
 * entirely in USDC (18-decimal native wei). Zendapp never surfaces "Gwei"
 * or "ETH" — only a USDC dollar amount, using "~$X.XX" for estimates and
 * "< $0.01" for dust-level fees, matching the docs' recommended display.
 */

/** Typical gas units for a native USDC send vs. an ERC-20 transfer, per docs. */
export const GAS_UNITS = {
  nativeSend: 21_000n,
  erc20Transfer: 65_000n,
} as const;

export interface FeeEstimate {
  /** Fee amount in native 18-decimal USDC wei. */
  feeWei: bigint;
  /** Human-friendly display string, e.g. "~$0.01" or "< $0.01". */
  display: string;
  gasLimit: bigint;
  maxFeePerGas: bigint;
}

/**
 * Estimate the fee for sending a native USDC transfer (the recommended path
 * for Zendapp sends — cheaper gas, and works for any recipient address).
 */
export async function estimateSendFee(client: PublicClient): Promise<FeeEstimate> {
  const block = await client.getBlock({ blockTag: "latest" });
  const baseFee = block.baseFeePerGas ?? 20_000_000_000n; // 20 Gwei floor per docs
  // 2x base fee is generous headroom; Arc's EWMA smoothing keeps fees stable,
  // so this rarely matters — the user is only ever charged gasUsed * effectiveGasPrice.
  const maxFeePerGas = baseFee * 2n;
  const gasLimit = GAS_UNITS.nativeSend;
  const feeWei = gasLimit * maxFeePerGas;
  return {
    feeWei,
    display: formatUsdcFee(feeWei),
    gasLimit,
    maxFeePerGas,
  };
}
