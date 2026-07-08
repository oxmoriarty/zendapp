"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { api, ApiRequestError } from "@/lib/api-client";
import { useSessionStore } from "@/store/session-store";
import { getStoredWalletAddress } from "@/lib/wallet/wallet";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { pendingEmail, setUser } = useSessionStore();
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function finish(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const username = sessionStorage.getItem("zendapp:chosen-username");
    const walletAddress = await getStoredWalletAddress();

    if (!username || !walletAddress) {
      setError("Something's missing from setup. Please restart onboarding.");
      return;
    }
    if (displayName.trim().length === 0) {
      setError("Enter your name so people recognize you.");
      return;
    }

    setLoading(true);
    try {
      const { user } = await api.completeOnboarding({
        walletAddress,
        username,
        displayName: displayName.trim(),
      });
      setUser(user);
      router.push("/home");
    } catch (err) {
      if (err instanceof ApiRequestError) setError(err.message);
      else setError("Couldn't finish setting up your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="font-display text-2xl font-semibold">Complete your profile</h1>
        <p className="text-sm text-muted-foreground">One last step before you start sending.</p>
      </div>

      <form onSubmit={finish} className="space-y-6">
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            className="group relative"
            aria-label="Add profile photo"
          >
            <Avatar name={displayName || "?"} size={88} />
            <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-soft transition-transform group-hover:scale-105">
              <Camera className="h-4 w-4" />
            </span>
          </button>
          <p className="text-xs text-muted-foreground">Optional — add later anytime</p>
        </div>

        <Input
          placeholder="Full name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoFocus
          error={error ?? undefined}
        />
        <Input value={pendingEmail ?? ""} disabled className="opacity-60" />

        <Button type="submit" variant="glow" size="lg" className="w-full" loading={loading}>
          Start using Zendapp
        </Button>
      </form>
    </div>
  );
}
