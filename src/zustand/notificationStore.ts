import { create } from "zustand";

interface NotificationState {
  userUnreadCount: number;
  shopUnreadCount: number;
  unreadMessagesCount: number;

  setUserUnreadCount: (count: number) => void;
  setShopUnreadCount: (count: number) => void;
  setUnreadMessagesCount: (count: number) => void;
  
  incrementUserUnread: (amount?: number) => void;
  incrementShopUnread: (amount?: number) => void;

  resetUserNotifications: () => void;
  resetShopNotifications: () => void;
  resetAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  userUnreadCount: 0,
  shopUnreadCount: 0,
  unreadMessagesCount: 0,

  setUserUnreadCount: (count) => set({ userUnreadCount: count }),
  setShopUnreadCount: (count) => set({ shopUnreadCount: count }),
  setUnreadMessagesCount: (count) => set({ unreadMessagesCount: count }),

  incrementUserUnread: (amount = 1) => set((state) => ({ userUnreadCount: state.userUnreadCount + amount })),
  incrementShopUnread: (amount = 1) => set((state) => ({ shopUnreadCount: state.shopUnreadCount + amount })),

  resetUserNotifications: () => set({ userUnreadCount: 0 }),
  resetShopNotifications: () => set({ shopUnreadCount: 0 }),
  
  resetAll: () => set({ userUnreadCount: 0, shopUnreadCount: 0, unreadMessagesCount: 0 }),
}));
