import { create } from "zustand";


interface ToastStore {
  activeToast: Toast | null;
  addToast: (message: string, type: ToastType) => void;
  removeToast: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  activeToast: null,

  addToast: (message, type) => {
    const id = crypto.randomUUID();

    set({ activeToast: { id, message, type } });

    setTimeout(() => {
      set((state) => 
        state.activeToast?.id === id ? { activeToast: null } : state
      );
    }, 5000);
  },

  removeToast: () => set({ activeToast: null }),
}));
