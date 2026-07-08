"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Copy, Check, Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createWallet, encryptAndStoreWallet } from "@/lib/wallet/wallet";
import { useSessionStore } from "@/store/session-store";

type Step = "generating" | "backup" | "confirm-backup" | "passcode";

export default function WalletSetupPage() {
  const router = useRouter();
  const setOnboardingStep = useSessionStore((s) => s.setOnboardingStep);
  const [step, setStep] = useState<Step>("generating");
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checkWords, setCheckWords] = useState<{ index: number; value: string }[]>([]);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [passcode, setPasscode] = useState("");
  const [passcodeConfirm, setPasscodeConfirm] = useState("");
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Generate the wallet client-side. Nothing here ever leaves the browser.
    const t = setTimeout(() => {
      const wallet = createWallet();
      setMnemonic(wallet.mnemonic.split(" "));
      setAddress(wallet.address);
      setStep("backup");
    }, 1400);
    return () => clearTimeout(t);
  }, []);

  function proceedToConfirm() {
    const indices = [2, 5, 8].filter((i) => i < mnemonic.length);
    setCheckWords(indices.map((index) => ({ index, value: "" })));
    setStep("confirm-backup");
  }

  function verifyBackup() {
    const correct = checkWords.every((c) => c.value.trim().toLowerCase() === mnemonic[c.index]);
    if (!correct) {
      setConfirmError("Those words don't match your recovery phrase. Please try again.");
      return;
    }
    setConfirmError(null);
    setStep("passcode");
  }

  async function finishSetup() {
    setPasscodeError(null);
    if (passcode.length < 6) {
      setPasscodeError("Use at least 6 characters.");
      return;
    }
    if (passcode !== passcodeConfirm) {
      setPasscodeError("Passcodes don't match.");
      return;
    }
    if (!address) return;
    setSaving(true);
    try {
      await encryptAndStoreWallet(mnemonic.join(" "), passcode, address);
      setOnboardingStep("username");
      router.push("/username");
    } catch {
      setPasscodeError("Couldn't secure your wallet. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center">
      <AnimatePresence mode="wait">
        {step === "generating" && (
          <motion.div
            key="gen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-zen-gradient shadow-glow">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute inset-1 rounded-3xl border-2 border-dashed border-white/30"
              />
              <ShieldCheck className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-1">
              <p className="font-display text-xl font-semibold">Securing your account</p>
              <p className="text-sm text-muted-foreground">Creating your personal Arc wallet…</p>
            </div>
          </motion.div>
        )}

        {step === "backup" && (
          <motion.div key="backup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-6 space-y-2 text-center">
              <h1 className="font-display text-2xl font-semibold">Save your recovery phrase</h1>
              <p className="text-sm text-muted-foreground">
                This is the only way to recover your money if you lose this device. Zendapp can never
                see or restore it for you.
              </p>
            </div>

            <div className="relative rounded-3xl border border-border bg-surface-sunken p-5">
              <div
                className={
                  revealed
                    ? "grid grid-cols-3 gap-2"
                    : "grid grid-cols-3 gap-2 blur-md select-none"
                }
              >
                {mnemonic.map((word, i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded-xl bg-surface-raised px-2.5 py-2 text-sm">
                    <span className="text-xs text-muted-foreground/60">{i + 1}</span>
                    <span className="font-medium">{word}</span>
                  </div>
                ))}
              </div>
              {!revealed && (
                <button
                  onClick={() => setRevealed(true)}
                  className="absolute inset-0 flex items-center justify-center gap-2 rounded-3xl bg-background/40 text-sm font-medium backdrop-blur-sm"
                >
                  <Eye className="h-4 w-4" /> Tap to reveal
                </button>
              )}
            </div>

            <div className="mt-3 flex justify-between">
              <button
                onClick={() => setRevealed((r) => !r)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {revealed ? "Hide" : "Show"}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(mnemonic.join(" "));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <Button variant="glow" size="lg" className="mt-8 w-full" onClick={proceedToConfirm} disabled={!revealed}>
              I&apos;ve saved it
            </Button>
          </motion.div>
        )}

        {step === "confirm-backup" && (
          <motion.div key="confirm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-6 space-y-2 text-center">
              <h1 className="font-display text-2xl font-semibold">Quick check</h1>
              <p className="text-sm text-muted-foreground">Fill in the missing words to confirm your backup.</p>
            </div>
            <div className="space-y-3">
              {checkWords.map((c, i) => (
                <div key={c.index} className="flex items-center gap-3">
                  <span className="w-8 text-sm text-muted-foreground">#{c.index + 1}</span>
                  <Input
                    value={c.value}
                    onChange={(e) => {
                      const next = [...checkWords];
                      next[i] = { ...c, value: e.target.value };
                      setCheckWords(next);
                    }}
                    placeholder="word"
                  />
                </div>
              ))}
            </div>
            {confirmError && <p className="mt-3 text-sm text-destructive">{confirmError}</p>}
            <Button variant="glow" size="lg" className="mt-6 w-full" onClick={verifyBackup}>
              Confirm
            </Button>
          </motion.div>
        )}

        {step === "passcode" && (
          <motion.div key="passcode" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-6 space-y-2 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
                <Lock className="h-5 w-5 text-accent-foreground" />
              </div>
              <h1 className="font-display text-2xl font-semibold">Set a device passcode</h1>
              <p className="text-sm text-muted-foreground">
                This locally encrypts your wallet on this device. You&apos;ll enter it to confirm payments.
              </p>
            </div>
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Confirm passcode"
                value={passcodeConfirm}
                onChange={(e) => setPasscodeConfirm(e.target.value)}
              />
            </div>
            {passcodeError && <p className="mt-2 text-sm text-destructive">{passcodeError}</p>}
            <Button variant="glow" size="lg" className="mt-6 w-full" onClick={finishSetup} loading={saving}>
              Continue
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
