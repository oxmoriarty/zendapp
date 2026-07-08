"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/session-store";
import { Logo } from "@/components/logo";

export default function RootGate() {
  const router = useRouter();
  const { isAuthenticated, onboardingStep } = useSessionStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/home");
      return;
    }
    if (onboardingStep && onboardingStep !== "signup" && onboardingStep !== "done") {
      router.replace(`/${onboardingStep}`);
      return;
    }
    router.replace("/signup");
  }, [isAuthenticated, onboardingStep, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zen-radial">
      <div className="animate-fade-in">
        <Logo size={36} className="scale-125" />
      </div>
    </div>
  );
}
