import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ZendUser } from "@/types";

interface SessionState {
  user: ZendUser | null;
  isAuthenticated: boolean;
  onboardingStep:
    | "signup"
    | "verify"
    | "wallet"
    | "username"
    | "profile"
    | "done";
  pendingEmail: string | null;
  setPendingEmail: (email: string) => void;
  setOnboardingStep: (step: SessionState["onboardingStep"]) => void;
  setUser: (user: ZendUser) => void;
  logout: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      onboardingStep: "signup",
      pendingEmail: null,
      setPendingEmail: (email) => set({ pendingEmail: email }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      setUser: (user) => set({ user, isAuthenticated: true, onboardingStep: "done" }),
      logout: () =>
        set({ user: null, isAuthenticated: false, onboardingStep: "signup", pendingEmail: null }),
    }),
    { name: "zendapp:session:v1" },
  ),
);
