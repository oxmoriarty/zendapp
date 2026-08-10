"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionStore } from "@/store/session-store";
import { deriveAddressFromMnemonic, encryptAndStoreWallet } from "@/lib/wallet/wallet";

type Step = "phrase" | "passcode";

/**
 * Reached from /verify when someone signs in to an existing account on a
 * device that doesn't already hold the matching encrypted wallet locally
 * (a brand-new device, a cleared browser, etc). The account itself is
 * already verified server-side by this point — this page's only job is
 * to get a *matching* wallet onto *this* device, from the user's own
 * recovery phrase, and lock it with a passcode chosen for this device.
 *
 * The derived address is checked against the account's registered wallet
 * address before anything is stored, so a wrong or mistyped phrase can
 * never get silently attached to the wrong account.
 */
export default function RestoreWalletPage() {
  const router = useRouter();
  const { pendingRestoreUser, setUser } = useSessionStore();

  const [step, setStep] = useState<Step>("phrase");
  const [phrase, setPhrase] = useState("");
  const [phraseError, setPhraseError] = useState<string | null>(null);
  const [verifiedMnemonic, setVerifiedMnemonic] = useState<string | null>(null);

  const [passcode, setPasscode] = useState("");
  const [passcodeConfirm, setPasscodeConfirm] = useState("");
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Reached directly without going through /verify first (or after a
    // hard refresh lost the in-memory hand-off) — nothing to restore
    // against, so send back to start properly. Done in an effect, not
    // during render, so this is safe under static prerendering and
    // doesn't run twice on the server.
    if (!pendingRestoreUser) router.replace("/signup");
  }, [pendingRestoreUser, router]);

  if (!pendingRestoreUser) return null;

  function checkPhrase() {
    setPhraseError(null);
    const normalized = phrase.trim().toLowerCase().split(/\s+/).filter(Boolean).join(" ");
    const address = deriveAddressFromMnemonic(normalized);

    if (!address) {
      setPhraseError("That doesn't look like a complete, valid recovery phrase. Check for typos and try again.");
      return;
    }
    if (address.toLowerCase() !== pendingRestoreUser!.walletAddress.toLowerCase()) {
      setPhraseError("This recovery phrase doesn't match the wallet on this Zendapp account.");
      return;
    }

    setVerifiedMnemonic(normalized);
    setStep("passcode");
  }

  async function finishRestore() {
    setPasscodeError(null);
    if (passcode.length < 6) {
      setPasscodeError("Use at least 6 characters.");
      return;
    }
    if (passcode !== passcodeConfirm) {
      setPasscodeError("Passcodes don't match.");
      return;
    }
    if (!verifiedMnemonic || !pendingRestoreUser) return;

    setSaving(true);
    try {
      await encryptAndStoreWallet(verifiedMnemonic, passcode, pendingRestoreUser.walletAddress);
      setUser(pendingRestoreUser);
      router.push("/home");
    } catch {
      setPasscodeError("Couldn't secure your wallet on this device. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center">
      <AnimatePresence mode="wait">
        {step === "phrase" && (
          <motion.div key="phrase" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-6 space-y-2 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
                <KeyRound className="h-5 w-5 text-accent-foreground" />
              </div>
              <h1 className="font-display text-2xl font-semibold">Set up this device</h1>
              <p className="text-sm text-muted-foreground">
                You&apos;re signing in as <span className="font-medium text-foreground">@{pendingRestoreUser.username}</span>.
                Enter your 12-word recovery phrase to enable sending on this device.
              </p>
            </div>

            <textarea
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="word1 word2 word3 ..."
              rows={4}
              autoFocus
              className="w-full resize-none rounded-2xl border border-input bg-surface-raised p-4 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {phraseError && <p className="mt-3 text-sm text-destructive">{phraseError}</p>}

            <Button variant="glow" size="lg" className="mt-6 w-full" onClick={checkPhrase} disabled={!phrase.trim()}>
              Continue
            </Button>

            <div className="mt-6 flex gap-2.5 rounded-2xl bg-warning-soft p-3.5 text-warning">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
              <p className="text-xs leading-relaxed">
                Without this phrase, this account&apos;s money can&apos;t be recovered on a new device — there&apos;s
                no other way in. That&apos;s the tradeoff of Zendapp never holding your keys for you.
              </p>
            </div>

            <button
              onClick={() => router.push("/signup")}
              className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Use a different email
            </button>
          </motion.div>
        )}

        {step === "passcode" && (
          <motion.div key="passcode" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-6 space-y-2 text-center">
              <h1 className="font-display text-2xl font-semibold">Set a passcode for this device</h1>
              <p className="text-sm text-muted-foreground">
                Your phrase matched — this locks the encrypted copy stored on this device only.
              </p>
            </div>
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
              />
              <Input
                type="password"
                placeholder="Confirm passcode"
                value={passcodeConfirm}
                onChange={(e) => setPasscodeConfirm(e.target.value)}
              />
            </div>
            {passcodeError && <p className="mt-2 text-sm text-destructive">{passcodeError}</p>}
            <Button variant="glow" size="lg" className="mt-6 w-full" onClick={finishRestore} loading={saving}>
              Finish setup
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
