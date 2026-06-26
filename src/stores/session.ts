import { create } from "zustand";
import type { AppRole, AuthSessionUser, AuthUser, UserProfile } from "@/types/auth";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface SessionState {
  status: SessionStatus;
  user: AuthUser | null;
  profile: UserProfile | null;
  role: AppRole | null;
  error: string | null;
  setLoading: () => void;
  setAuthenticated: (sessionUser: AuthSessionUser) => void;
  setUnauthenticated: () => void;
  setError: (error: string) => void;
}

export const useSession = create<SessionState>((set) => ({
  status: "loading",
  user: null,
  profile: null,
  role: null,
  error: null,
  setLoading: () => set({ status: "loading", error: null }),
  setAuthenticated: ({ user, profile, role }) =>
    set({
      status: "authenticated",
      user,
      profile,
      role,
      error: null,
    }),
  setUnauthenticated: () =>
    set({
      status: "unauthenticated",
      user: null,
      profile: null,
      role: null,
      error: null,
    }),
  setError: (error) => set({ status: "unauthenticated", user: null, profile: null, role: null, error }),
}));
