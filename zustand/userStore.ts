import { create } from "zustand";

export interface User {
  uid: string;
  username: string;
  role: string;
  is_verified: boolean;
  sessionId: string;
  needs_refresh?: boolean;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));