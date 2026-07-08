import { create } from "zustand";
import type { ZendUser } from "@/types";

interface SendFlowState {
  recipient: ZendUser | null;
  amount: string;
  note: string;
  setRecipient: (u: ZendUser | null) => void;
  setAmount: (a: string) => void;
  setNote: (n: string) => void;
  reset: () => void;
}

export const useSendFlowStore = create<SendFlowState>((set) => ({
  recipient: null,
  amount: "",
  note: "",
  setRecipient: (recipient) => set({ recipient }),
  setAmount: (amount) => set({ amount }),
  setNote: (note) => set({ note }),
  reset: () => set({ recipient: null, amount: "", note: "" }),
}));
