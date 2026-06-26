import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

/**
 * UI-only store. Role is intentionally NOT stored here — it is derived from
 * the URL via useCurrentRole(). Keeping role out of mutable state is what makes
 * the role/sidebar/active-tab desync bug structurally impossible.
 */
export const useRole = create<UIState>()(
  persist(
    (set) => ({
      theme: "light",
      toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
    }),
    { name: "wwems-role" }
  )
);
