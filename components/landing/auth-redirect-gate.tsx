"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/session-store";

/**
 * Mounted invisibly at the top of the public landing page. Preserves the
 * app's previous behavior for two cases where "/" shouldn't show marketing
 * copy at all:
 *   - Already signed in -> straight to /home.
 *   - Mid-onboarding (verified email but haven't finished setup) -> back
 *     to wherever they left off.
 *
 * Everyone else — the actual audience for a landing page — falls through
 * and sees the page render normally. This is the one behavior change from
 * the old root gate, which sent every unauthenticated visitor straight to
 * /signup with no marketing page at all.
 */
export function AuthRedirectGate() {
  const router = useRouter();
  const { isAuthenticated, onboardingStep } = useSessionStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/home");
      return;
    }
    if (onboardingStep && onboardingStep !== "signup" && onboardingStep !== "done") {
      router.replace(`/${onboardingStep}`);
    }
  }, [isAuthenticated, onboardingStep, router]);

  return null;
}
