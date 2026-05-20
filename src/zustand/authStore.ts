import { create } from "zustand";

export interface Shop {
  shop_uid: string;
  shop_name: string;
  status?: string;
}

export interface User {
  uid: string;
  sessionId: string;
  username: string;
  role: string;
  is_verified: boolean;
  owned_shops: Shop[]; 
  need_refresh?: boolean;
}

interface AuthState {
  user: User | null;
  activeShop: Shop | null; 
  isAuthenticated: boolean;

  setUser: (user: User | null, activeShopUid?: string | null) => void;
  setActiveShop: (shop: Shop | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  activeShop: null,
  isAuthenticated: false,

  setUser: (user, activeShopUid) => {
    const activeShop = user?.owned_shops.find(s => s.shop_uid === activeShopUid) || null;
    
    set({ 
      user, 
      activeShop,
      isAuthenticated: !!user 
    });
  },

  setActiveShop: (shop) => set({ activeShop: shop }),

  clearUser: () => set({ 
    user: null, 
    activeShop: null, 
    isAuthenticated: false 
  }),
}));
