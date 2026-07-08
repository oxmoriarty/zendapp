"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { useSessionStore } from "@/store/session-store";
import { cn } from "@/lib/utils";

type CheckState = "idle" | "checking" | "available" | "unavailable";

export default function UsernamePage() {
  const router = useRouter();
  const setOnboardingStep = useSessionStore((s) => s.setOnboardingStep);
  const [value, setValue] = useState("");
  const [state, setState] = useState<CheckState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setState("idle");
      setMessage(null);
      return;
    }
    setState("checking");
    const t = setTimeout(async () => {
      try {
        const res = await api.checkUsername(value);
        if (res.available) {
          setState("available");
          setMessage(null);
        } else {
          setState("unavailable");
          setMessage(res.error ?? "Not available");
        }
      } catch {
        setState("unavailable");
        setMessage("Couldn't check availability. Try again.");
      }
    }, 350);
    return () => clearTimeout(t);
  }, [value]);

  function continueToProfile() {
    if (state !== "available") return;
    sessionStorage.setItem("zendapp:chosen-username", value.toLowerCase());
    setOnboardingStep("profile");
    router.push("/profile-setup");
  }

  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="font-display text-2xl font-semibold">Pick your username</h1>
        <p className="text-sm text-muted-foreground">
          This is how people find and pay you. Choose carefully — it&apos;s permanent.
        </p>
      </div>

      <div className="relative">
        <AtSign className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value.toLowerCase())}
          placeholder="username"
          className="pl-11 pr-11"
          autoFocus
          maxLength={20}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {state === "checking" && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          {state === "available" && <Check className="h-5 w-5 text-success" />}
          {state === "unavailable" && <X className="h-5 w-5 text-destructive" />}
        </div>
      </div>

      <div className="mt-2 min-h-[20px] px-1">
        {state === "available" && (
          <p className="text-sm text-success">@{value} is available</p>
        )}
        {state === "unavailable" && <p className="text-sm text-destructive">{message}</p>}
        {state === "idle" && (
          <p className="text-xs text-muted-foreground">
            3–20 characters. Letters, numbers, underscores, and periods.
          </p>
        )}
      </div>

      <Button
        variant="glow"
        size="lg"
        className="mt-8 w-full"
        disabled={state !== "available"}
        onClick={continueToProfile}
      >
        Continue
      </Button>
    </div>
  );
}
