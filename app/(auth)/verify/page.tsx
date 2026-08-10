"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api, ApiRequestError } from "@/lib/api-client";
import { useSessionStore } from "@/store/session-store";
import { getStoredWalletAddress } from "@/lib/wallet/wallet";
import { cn } from "@/lib/utils";

export default function VerifyPage() {
  const router = useRouter();
  const { pendingEmail, setOnboardingStep, setUser, setPendingRestoreUser } = useSessionStore();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  function updateDigit(i: number, value: string) {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...digits];
    next[i] = value;
    setDigits(next);
    if (value && i < 5) inputs.current[i + 1]?.focus();
    if (next.every((d) => d !== "") && next.join("").length === 6) {
      void submit(next.join(""));
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  async function submit(code: string) {
    if (!pendingEmail) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.verify(pendingEmail, code);

      if (res.existingAccount && res.user) {
        // Signing in to an existing account — possibly on a brand-new
        // device. The account itself (username, email, wallet address) is
        // verified server-side; whether *this device* can actually sign
        // payments depends on whether it already holds the matching
        // encrypted wallet locally.
        const localAddress = await getStoredWalletAddress();
        const matches = !!localAddress && localAddress.toLowerCase() === res.user.walletAddress.toLowerCase();

        if (matches) {
          setUser(res.user);
          router.push("/home");
        } else {
          // New device (or a mismatched local wallet) — this device needs
          // the recovery phrase before it can send anything.
          setPendingRestoreUser(res.user);
          router.push("/restore-wallet");
        }
        return;
      }

      // Brand-new account — continue the normal onboarding flow.
      setOnboardingStep("wallet");
      router.push("/wallet");
    } catch (err) {
      setDigits(Array(6).fill(""));
      inputs.current[0]?.focus();
      if (err instanceof ApiRequestError) setError(err.message);
      else setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!pendingEmail) return;
    await api.signup(pendingEmail).catch(() => {});
    setResent(true);
    setTimeout(() => setResent(false), 3000);
  }

  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="text-muted-foreground">
          We sent a 6-digit code to <span className="font-medium text-foreground">{pendingEmail}</span>
        </p>
      </div>

      <div className="flex justify-center gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            value={d}
            onChange={(e) => updateDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            inputMode="numeric"
            maxLength={1}
            className={cn(
              "h-14 w-12 rounded-2xl border border-input bg-surface-raised text-center text-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              error && "border-destructive",
            )}
            autoFocus={i === 0}
          />
        ))}
      </div>
      {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}

      <Button
        variant="glow"
        size="lg"
        className="mt-8 w-full"
        loading={loading}
        onClick={() => submit(digits.join(""))}
        disabled={digits.some((d) => !d)}
      >
        Verify
      </Button>

      <button
        onClick={resend}
        className="mt-6 text-center text-sm text-muted-foreground hover:text-foreground"
      >
        {resent ? "New code sent ✓" : "Didn't get a code? Resend"}
      </button>
    </div>
  );
}
