"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Check, Eye, EyeOff, Lock, AlertTriangle, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useSessionStore } from "@/store/session-store";
import {
  decryptStoredWallet,
  hasBiometricUnlock,
  enableBiometricUnlock,
  disableBiometricUnlock,
} from "@/lib/wallet/wallet";
import { isPlatformAuthenticatorAvailable } from "@/lib/wallet/webauthn";

export default function WalletSettingsPage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);

  const [platformAuthAvailable, setPlatformAuthAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricPasscode, setBiometricPasscode] = useState("");
  const [biometricPrompt, setBiometricPrompt] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);

  useEffect(() => {
    isPlatformAuthenticatorAvailable().then(setPlatformAuthAvailable);
    hasBiometricUnlock().then(setBiometricEnabled);
  }, []);

  async function reveal() {
    setError(null);
    setLoading(true);
    try {
      const m = await decryptStoredWallet(passcode);
      setMnemonic(m);
      setRevealed(false);
    } catch (err) {
      setError(
        err instanceof Error && err.message === "INVALID_PASSPHRASE"
          ? "Incorrect passcode."
          : "Couldn't unlock your wallet on this device.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function confirmEnableBiometric() {
    if (!user) return;
    setBiometricError(null);
    setBiometricBusy(true);
    try {
      await enableBiometricUnlock(biometricPasscode, user.username, user.id);
      setBiometricEnabled(true);
      setBiometricPrompt(false);
      setBiometricPasscode("");
    } catch (err) {
      if (err instanceof Error && err.message === "PRF_UNSUPPORTED") {
        setBiometricError("This device or browser doesn't support biometric unlock yet.");
      } else if (err instanceof Error && err.message === "INVALID_PASSPHRASE") {
        setBiometricError("Incorrect passcode.");
      } else {
        setBiometricError("Couldn't enable biometric unlock. Please try again.");
      }
    } finally {
      setBiometricBusy(false);
    }
  }

  async function turnOffBiometric() {
    setBiometricBusy(true);
    try {
      await disableBiometricUnlock();
      setBiometricEnabled(false);
    } finally {
      setBiometricBusy(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-md">
      <header className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-xl font-semibold">Wallet & recovery</h1>
      </header>

      <Card className="p-5">
        <p className="mb-1.5 text-sm text-muted-foreground">Wallet address</p>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-sunken p-3">
          <code className="flex-1 truncate text-xs">{user.walletAddress}</code>
          <button onClick={() => copy(user.walletAddress)} className="shrink-0 rounded-lg p-1.5 hover:bg-muted">
            {copiedAddress ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          This is your account&apos;s underlying Arc address. You&apos;ll rarely need it — most people just use your username.
        </p>
      </Card>

      {platformAuthAvailable && (
        <Card className="mt-4 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Fingerprint className="h-4.5 w-4.5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">Face ID / Touch ID unlock</p>
              <p className="text-xs text-muted-foreground">
                {biometricEnabled ? "Enabled for confirming payments" : "Skip typing your passcode for each payment"}
              </p>
            </div>
            <Button
              variant={biometricEnabled ? "secondary" : "glow"}
              size="sm"
              loading={biometricBusy}
              onClick={() => (biometricEnabled ? turnOffBiometric() : setBiometricPrompt(true))}
            >
              {biometricEnabled ? "Turn off" : "Enable"}
            </Button>
          </div>

          {biometricPrompt && !biometricEnabled && (
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Enter your passcode once to link Face ID / Touch ID to this wallet on this device.
              </p>
              <Input
                type="password"
                placeholder="Passcode"
                value={biometricPasscode}
                onChange={(e) => setBiometricPasscode(e.target.value)}
                error={biometricError ?? undefined}
              />
              <Button variant="glow" size="lg" className="w-full" onClick={confirmEnableBiometric} loading={biometricBusy}>
                Continue
              </Button>
            </div>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            Your recovery phrase stays protected by your passcode either way — biometrics are only a
            faster way to confirm a payment on this device.
          </p>
        </Card>
      )}

      <Card className="mt-4 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Recovery phrase</p>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Your recovery phrase is the only way to restore your wallet on a new device. Zendapp never
          stores it and can never recover it for you.
        </p>

        {!exportOpen && (
          <Button variant="secondary" size="lg" className="w-full" onClick={() => setExportOpen(true)}>
            Export recovery phrase
          </Button>
        )}

        {exportOpen && !mnemonic && (
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Enter your passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              error={error ?? undefined}
            />
            <Button variant="glow" size="lg" className="w-full" onClick={reveal} loading={loading}>
              Unlock
            </Button>
          </div>
        )}

        {mnemonic && (
          <div>
            <div className="relative mb-3 rounded-2xl border border-border bg-surface-sunken p-4">
              <div className={revealed ? "grid grid-cols-3 gap-2" : "grid grid-cols-3 gap-2 blur-md select-none"}>
                {mnemonic.split(" ").map((word, i) => (
                  <div key={i} className="rounded-xl bg-surface-raised px-2 py-1.5 text-center text-xs font-medium">
                    {word}
                  </div>
                ))}
              </div>
              {!revealed && (
                <button
                  onClick={() => setRevealed(true)}
                  className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-background/40 text-sm font-medium backdrop-blur-sm"
                >
                  <Eye className="h-4 w-4" /> Tap to reveal
                </button>
              )}
            </div>
            <div className="mb-3 flex gap-2 rounded-2xl bg-warning-soft p-3 text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-xs">Never share this with anyone, including Zendapp support.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setRevealed((r) => !r)}
              >
                {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {revealed ? "Hide" : "Show"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => copy(mnemonic)}>
                <Copy className="h-4 w-4" /> Copy
              </Button>
            </div>
            <button
              className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setMnemonic(null);
                setExportOpen(false);
                setPasscode("");
              }}
            >
              Done — hide this
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
