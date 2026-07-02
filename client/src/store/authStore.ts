import { create } from "zustand";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: "USER" | "STAFF" | "ADMIN";
  avatarUrl?: string | null;
};

type AuthState = {
  user: AuthUser | null;
  loaded: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoaded: (loaded: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loaded: false,
  setUser: (user) => set({ user }),
  setLoaded: (loaded) => set({ loaded }),
}));
