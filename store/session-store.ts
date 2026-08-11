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
  /**
   * Set right after a successful sign-in (not signup) when this device
   * doesn't yet have a matching local wallet — carries the account's
   * details from /verify to /restore-wallet so that page can validate
   * the entered recovery phrase against the correct wallet address.
   */
  pendingRestoreUser: ZendUser | null;
  setPendingEmail: (email: string) => void;
  setPendingRestoreUser: (user: ZendUser | null) => void;
  setOnboardingStep: (step: SessionState["onboardingStep"]) => void;
  setUser: (user: ZendUser) => void;
  updateAvatarUrl: (avatarUrl: string) => void;
  logout: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      onboardingStep: "signup",
      pendingEmail: null,
      pendingRestoreUser: null,
      setPendingEmail: (email) => set({ pendingEmail: email }),
      setPendingRestoreUser: (user) => set({ pendingRestoreUser: user }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      setUser: (user) => set({ user, isAuthenticated: true, onboardingStep: "done", pendingRestoreUser: null }),
      updateAvatarUrl: (avatarUrl) =>
        set((s) => (s.user ? { user: { ...s.user, avatarUrl } } : s)),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          onboardingStep: "signup",
          pendingEmail: null,
          pendingRestoreUser: null,
        }),
    }),
    { name: "zendapp:session:v1" },
  ),
);
