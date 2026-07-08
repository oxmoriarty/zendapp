import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  favoriteUsernames: string[];
  toggle: (username: string) => void;
  isFavorite: (username: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteUsernames: [],
      toggle: (username) =>
        set((s) => ({
          favoriteUsernames: s.favoriteUsernames.includes(username)
            ? s.favoriteUsernames.filter((u) => u !== username)
            : [...s.favoriteUsernames, username],
        })),
      isFavorite: (username) => get().favoriteUsernames.includes(username),
    }),
    { name: "zendapp:favorites:v1" },
  ),
);
