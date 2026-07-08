"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Search, X, AlertTriangle, Check, Lock, Fingerprint } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { useUserSearch } from "@/hooks/use-user-search";
import { useSessionStore } from "@/store/session-store";
import { useSendFlowStore } from "@/store/send-flow-store";
import { useBalance } from "@/hooks/use-balance";
import { arcPublicClient } from "@/lib/arc/client";
import { estimateSendFee } from "@/lib/arc/fees";
import { canAfford, formatUsdc, usdcToNativeWei } from "@/lib/arc/usdc";
import { isBlocklisted, waitForFinal } from "@/lib/arc/tx";
import { decryptStoredWallet, accountFromMnemonic, hasBiometricUnlock, unlockWalletWithBiometrics } from "@/lib/wallet/wallet";
import { api, ApiRequestError } from "@/lib/api-client";
import type { ZendUser } from "@/types";
import { cn } from "@/lib/utils";

type Step = "search" | "amount" | "review" | "authenticate" | "sending" | "complete" | "error";

export default function SendPage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const balance = useBalance(user?.walletAddress);
  const { recipient, amount, note, setRecipient, setAmount, setNote, reset } = useSendFlowStore();

  const [step, setStep] = useState<Step>(recipient ? "amount" : "search");
  const [query, setQuery] = useState("");
  const { results, status } = useUserSearch(query);

  const [feeWei, setFeeWei] = useState<bigint | null>(null);
  const [feeDisplay, setFeeDisplay] = useState<string>("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricTrying, setBiometricTrying] = useState(false);
  const [flowError, setFlowError] = useState<{ title: string; message: string } | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  function pickRecipient(u: ZendUser) {
    setRecipient(u);
    setStep("amount");
  }

  async function proceedToReview() {
    setAmountError(null);
    const parsed = Number(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setAmountError("Enter an amount greater than $0.");
      return;
    }
    try {
      const fee = await estimateSendFee(arcPublicClient);
      setFeeWei(fee.feeWei);
      setFeeDisplay(fee.display);

      const amountWei = usdcToNativeWei(amount);
      if (balance.data && !canAfford(amountWei, fee.feeWei, balance.data.weiBalance)) {
        setAmountError("You don't have enough USDC to cover this amount plus the network fee.");
        return;
      }
      setStep("review");
    } catch {
      setAmountError("Couldn't reach the Arc network. Check your connection and try again.");
    }
  }

  useEffect(() => {
    if (step !== "authenticate") return;
    hasBiometricUnlock().then(setBiometricAvailable);
  }, [step]);

  async function attemptBiometric() {
    setAuthError(null);
    setBiometricTrying(true);
    try {
      const mnemonic = await unlockWalletWithBiometrics();
      await sendWithMnemonic(mnemonic);
    } catch {
      // A cancelled or failed biometric prompt just returns the user to the
      // passcode field — it's never treated as a fatal error.
      setAuthError("Biometric unlock didn't work. Enter your passcode instead.");
    } finally {
      setBiometricTrying(false);
    }
  }

  async function confirmAndSend() {
    setAuthError(null);
    if (!recipient || !user || feeWei === null) return;
    try {
      const mnemonic = await decryptStoredWallet(passcode);
      await sendWithMnemonic(mnemonic);
    } catch (err) {
      if (err instanceof Error && err.message === "INVALID_PASSPHRASE") {
        setAuthError("Incorrect passcode. Try again.");
        return;
      }
      setFlowError({
        title: "Couldn't unlock your wallet",
        message: "Something went wrong reading your wallet on this device. Please try again.",
      });
      setStep("error");
    }
  }

  async function sendWithMnemonic(mnemonic: string) {
    if (!recipient || !user || feeWei === null) return;

    setStep("sending");
    try {
      const account = accountFromMnemonic(mnemonic);

      // 2. Arc protocol-level blocklist checks — never attempt a doomed send.
      const [senderBlocked, recipientBlocked] = await Promise.all([
        isBlocklisted(account.address),
        isBlocklisted(recipient.walletAddress),
      ]);
      if (senderBlocked) throw new FlowError("Account restricted", "Your account can't send payments right now. Contact support.");
      if (recipientBlocked) throw new FlowError("Can't send to this user", "This recipient can't receive payments right now.");

      // 3. Build + sign a native USDC transfer locally (cheapest path, works
      //    for any recipient address), then broadcast it to Arc directly.
      //    The private key never leaves this function's scope.
      const { createWalletClient, http } = await import("viem");
      const { arcTestnet } = await import("@/lib/arc/chain");
      const walletClient = createWalletClient({
        account,
        chain: arcTestnet,
        transport: http("https://rpc.testnet.arc.network"),
      });
      const amountWei = usdcToNativeWei(amount);
      const hash = await walletClient.sendTransaction({
        to: recipient.walletAddress,
        value: amountWei,
      });

      setTxHash(hash);

      // 4. Arc has deterministic sub-second finality — one receipt is final.
      const final = await waitForFinal(hash);

      // 5. Record off-chain context (note, recipient) for the history feed.
      await api.recordTx({
        hash,
        toAddress: recipient.walletAddress,
        amountUsdc: amount,
        feeUsdc: formatUsdc(feeWei),
        note: note || undefined,
        status: final.status === "complete" ? "complete" : "failed",
      });

      setStep(final.status === "complete" ? "complete" : "error");
      if (final.status !== "complete") {
        setFlowError({ title: "Transaction failed", message: "The network rejected this transaction." });
      }
    } catch (err) {
      if (err instanceof FlowError) {
        setFlowError({ title: err.title, message: err.message });
        setStep("error");
        return;
      }
      setFlowError({
        title: "Couldn't complete this payment",
        message: "The transaction may have been dropped by the network. No funds were lost if it wasn't included in a block.",
      });
      setStep("error");
    }
  }

  function startOver() {
    reset();
    setQuery("");
    setPasscode("");
    setAuthError(null);
    setFlowError(null);
    setTxHash(null);
    setStep("search");
  }

  return (
    <div className="mx-auto max-w-md">
      <header className="mb-6 flex items-center gap-3">
        {step !== "complete" && (
          <button
            onClick={() => {
              if (step === "search") router.push("/home");
              else if (step === "amount") setStep("search");
              else if (step === "review") setStep("amount");
              else if (step === "authenticate") setStep("review");
              else router.push("/home");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="font-display text-xl font-semibold">
          {step === "search" && "Send to"}
          {step === "amount" && `Send to ${recipient?.displayName}`}
          {step === "review" && "Review payment"}
          {(step === "authenticate" || step === "sending") && "Confirm payment"}
          {step === "complete" && "All set"}
          {step === "error" && "Payment issue"}
        </h1>
      </header>

      <AnimatePresence mode="wait">
        {step === "search" && (
          <motion.div key="search" {...fade}>
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by username"
                className="pl-11 pr-10"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {status === "loading" && (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {status === "error" && (
              <p className="px-3 text-sm text-destructive">
                Search isn&apos;t working right now. Please try again.
              </p>
            )}

            {status === "success" && results.length === 0 && (
              <EmptyState icon={<Search className="h-5 w-5" />} title="No one found" description={`No users match "${query}"`} />
            )}

            {status === "idle" && !query && (
              <p className="px-3 text-sm text-muted-foreground">
                Search for a friend by their Zendapp username.
              </p>
            )}

            <div className="space-y-1">
              {results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => pickRecipient(u)}
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
          </motion.div>
        )}

        {step === "amount" && recipient && (
          <motion.div key="amount" {...fade} className="flex flex-col items-center">
            <Avatar name={recipient.displayName} src={recipient.avatarUrl} size={64} className="mb-3" />
            <p className="font-medium">{recipient.displayName}</p>
            <p className="mb-8 text-sm text-muted-foreground">@{recipient.username}</p>

            <div className="flex items-baseline gap-1">
              <span className="font-display text-4xl font-semibold text-muted-foreground">$</span>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0"
                autoFocus
                className="w-40 bg-transparent text-center font-display text-6xl font-semibold outline-none"
              />
            </div>
            {amountError && <p className="mt-3 text-sm text-destructive">{amountError}</p>}
            {balance.data && (
              <p className="mt-2 text-xs text-muted-foreground">
                Balance: ${balance.data.display} USDC
              </p>
            )}

            <Input
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 140))}
              placeholder="Add a note (optional)"
              className="mt-8"
            />

            <Button variant="glow" size="lg" className="mt-8 w-full" onClick={proceedToReview}>
              Review
            </Button>
          </motion.div>
        )}

        {step === "review" && recipient && (
          <motion.div key="review" {...fade}>
            <div className="rounded-3xl border border-border bg-card p-6">
              <div className="flex flex-col items-center border-b border-border pb-6">
                <Avatar name={recipient.displayName} src={recipient.avatarUrl} size={56} className="mb-2" />
                <p className="font-medium">{recipient.displayName}</p>
                <p className="text-sm text-muted-foreground">@{recipient.username}</p>
              </div>
              <dl className="space-y-3 pt-5 text-sm">
                <Row label="Amount" value={`$${amount}`} />
                <Row label="Network fee" value={feeDisplay} muted />
                {note && <Row label="Note" value={note} muted />}
                <div className="!mt-4 flex items-center justify-between border-t border-border pt-4">
                  <dt className="font-medium">Total</dt>
                  <dd className="font-display text-lg font-semibold">
                    ${(Number(amount) + Number(feeDisplay.replace(/[^0-9.]/g, "") || 0)).toFixed(2)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-4 flex gap-2.5 rounded-2xl bg-warning-soft p-3.5 text-warning">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
              <p className="text-xs leading-relaxed">
                Payments on Zendapp are final and cannot be reversed. Double-check the recipient before sending.
              </p>
            </div>

            <Button variant="glow" size="lg" className="mt-6 w-full" onClick={() => setStep("authenticate")}>
              Send ${amount}
            </Button>
          </motion.div>
        )}

        {(step === "authenticate" || step === "sending") && (
          <motion.div key="auth" {...fade} className="flex flex-col items-center">
            {step === "authenticate" ? (
              <>
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
                  <Lock className="h-6 w-6 text-accent-foreground" />
                </div>
                {biometricAvailable && (
                  <>
                    <Button
                      variant="glow"
                      size="lg"
                      className="mb-4 w-full"
                      onClick={attemptBiometric}
                      loading={biometricTrying}
                    >
                      <Fingerprint className="h-4 w-4" /> Use Face ID / Touch ID
                    </Button>
                    <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="h-px flex-1 bg-border" /> or enter passcode <div className="h-px flex-1 bg-border" />
                    </div>
                  </>
                )}
                <p className="mb-6 text-center text-sm text-muted-foreground">
                  Enter your passcode to confirm this payment.
                </p>
                <Input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Passcode"
                  autoFocus
                  className="text-center"
                  error={authError ?? undefined}
                />
                <Button variant="default" size="lg" className="mt-6 w-full" onClick={confirmAndSend} disabled={!passcode}>
                  Confirm & send
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
                  className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent"
                />
                <p className="text-sm text-muted-foreground">Sending payment…</p>
              </div>
            )}
          </motion.div>
        )}

        {step === "complete" && recipient && (
          <motion.div key="complete" {...fade} className="flex flex-col items-center py-6 text-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-success-soft"
            >
              <Check className="h-10 w-10 text-success" />
            </motion.div>
            <h2 className="font-display text-2xl font-semibold">${amount} sent</h2>
            <p className="mt-1 text-muted-foreground">to {recipient.displayName}</p>
            <Button
              variant="glow"
              size="lg"
              className="mt-8 w-full"
              onClick={() => {
                reset();
                router.push("/home");
              }}
            >
              Done
            </Button>
          </motion.div>
        )}

        {step === "error" && flowError && (
          <motion.div key="err" {...fade} className="flex flex-col items-center py-6 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-9 w-9 text-destructive" />
            </div>
            <h2 className="font-display text-xl font-semibold">{flowError.title}</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">{flowError.message}</p>
            <div className="mt-8 flex w-full gap-3">
              <Button variant="secondary" size="lg" className="flex-1" onClick={() => router.push("/home")}>
                Go home
              </Button>
              <Button variant="glow" size="lg" className="flex-1" onClick={() => setStep("review")}>
                Try again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn(muted && "text-muted-foreground")}>{value}</dd>
    </div>
  );
}

class FlowError extends Error {
  constructor(public title: string, message: string) {
    super(message);
  }
}

const fade = {
  initial: { opacity: 0, x: 8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
};
