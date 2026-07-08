/**
 * Unified USDC balance helpers.
 *
 * Arc Builders Docs — "EVM differences": native USDC (18 decimals) and the
 * ERC-20 USDC interface (6 decimals) are two views of ONE underlying
 * balance, not two assets. Zendapp shows the user exactly one number:
 * their USDC balance. This file is the single place that ever touches the
 * 18 <-> 6 decimal conversion so the rest of the app can stay in plain
 * human-readable USDC strings/numbers.
 */

const NATIVE_DECIMALS = 18;
const DISPLAY_DECIMALS = 6;
const DECIMALS_OFFSET = 10n ** BigInt(NATIVE_DECIMALS - DISPLAY_DECIMALS); // 10^12

/** Convert a native 18-decimal wei balance (bigint) to a 6-decimal USDC bigint. */
export function nativeWeiToUsdcUnits(weiBalance: bigint): bigint {
  return weiBalance / DECIMALS_OFFSET;
}

/** Convert a human-readable USDC amount (e.g. "12.50") to native 18-decimal wei. */
export function usdcToNativeWei(amount: string | number): bigint {
  const [whole, frac = ""] = String(amount).split(".");
  const fracPadded = (frac + "0".repeat(NATIVE_DECIMALS)).slice(0, NATIVE_DECIMALS);
  const wholeBig = BigInt(whole || "0") * 10n ** BigInt(NATIVE_DECIMALS);
  const fracBig = BigInt(fracPadded || "0");
  return wholeBig + fracBig;
}

/** Format a native 18-decimal wei balance as a human-readable USDC string, e.g. "1,204.56". */
export function formatUsdc(weiBalance: bigint, opts?: { compact?: boolean }): string {
  const units = nativeWeiToUsdcUnits(weiBalance);
  const whole = units / 10n ** BigInt(DISPLAY_DECIMALS);
  const frac = units % 10n ** BigInt(DISPLAY_DECIMALS);
  const fracStr = frac.toString().padStart(DISPLAY_DECIMALS, "0").slice(0, 2); // cents
  const wholeFormatted = new Intl.NumberFormat("en-US").format(whole);
  if (opts?.compact) {
    const num = Number(whole) + Number(frac) / 10 ** DISPLAY_DECIMALS;
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(num);
  }
  return `${wholeFormatted}.${fracStr}`;
}

/** Format a fee (small amount) with more precision, e.g. "$0.0004". */
export function formatUsdcFee(weiBalance: bigint): string {
  const units = nativeWeiToUsdcUnits(weiBalance);
  const value = Number(units) / 10 ** DISPLAY_DECIMALS;
  if (value === 0) return "$0.00";
  if (value < 0.01) return `< $0.01`;
  return `$${value.toFixed(2)}`;
}

/** Validate a user-entered send amount against balance + estimated fee. */
export function canAfford(amountWei: bigint, feeWei: bigint, balanceWei: bigint): boolean {
  return amountWei + feeWei <= balanceWei;
}
