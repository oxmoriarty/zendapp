import { defineChain } from "viem";

/**
 * Arc Testnet chain definition.
 *
 * Source: Arc Builders Docs — "Connect to Arc" / "EVM compatibility".
 *
 * Important Arc-specific facts encoded here (do not "fix" these to look
 * more like Ethereum — they are intentional protocol differences):
 *
 * 1. USDC is the native gas token. The chain's nativeCurrency is USDC.
 * 2. The native balance uses 18 decimals internally (like ETH/Wei), while
 *    the ERC-20 USDC interface at 0x3600...0000 uses 6 decimals. Both
 *    views represent the SAME underlying balance. See lib/arc/usdc.ts for
 *    the conversion helpers — never hardcode a conversion inline.
 * 3. Finality is deterministic and sub-second. There is no confirmation
 *    counter. See lib/arc/tx.ts for the two-state (pending/final) model.
 */
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    // Display decimals for wallet UIs per Arc docs (wallet integration guide).
    // Zendapp does its own conversion in lib/arc/usdc.ts and never relies on
    // a wallet library's default formatting for balances shown to users.
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
      webSocket: ["wss://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Explorer",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

/** Well-known Arc Testnet system contracts (Arc Builders Docs — Contract addresses). */
export const ARC_CONTRACTS = {
  /** ERC-20 interface for USDC. 6 decimals. Same underlying balance as native. */
  usdcErc20: "0x3600000000000000000000000000000000000000" as const,
  /**
   * System emitter that logs a standard ERC-20 Transfer event (EIP-7708)
   * for every native USDC movement: sends, endowments, self-destructs,
   * and precompile mint/burn/transfer. 18 decimals. This is the single
   * source of truth Zendapp indexes for a user's transaction history —
   * NOT the ERC-20 contract, which misses plain native sends.
   */
  nativeUsdcSystemEmitter: "0xfffffffffffffffffffffffffffffffffffffffe" as const,
  /** Attaches compliance/reference metadata to a USDC transfer in one tx. */
  memo: "0x5294E9927c3306DcBaDb03fe70b92e01cCede505" as const,
  cctpTokenMessengerV2: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA" as const,
  cctpMessageTransmitterV2: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as const,
} as const;

export const ARC_CCTP_DOMAIN = 26;

/** Minimum base fee per Arc Builders Docs — "Custody Platform Integration". */
export const ARC_MIN_BASE_FEE_GWEI = 20n;

/** Native USDC Transfer event topic (EIP-7708 / standard ERC-20 Transfer signature). */
export const NATIVE_TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" as const;
