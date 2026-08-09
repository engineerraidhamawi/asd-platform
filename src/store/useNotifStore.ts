import { create } from "zustand";

export interface Notification {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

interface NotifState {
  notifications: Notification[];
  add: (n: Omit<Notification, "id">) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useNotifStore = create<NotifState>((set) => ({
  notifications: [],
  add: (n) => {
    const id = Math.random().toString(36).slice(2, 8);
    set((s) => ({ notifications: [...s.notifications, { ...n, id }] }));
    const duration = n.duration ?? 4000;
    if (duration > 0) setTimeout(() => {
      set((s) => ({ notifications: s.notifications.filter((x) => x.id !== id) }));
    }, duration);
  },
  remove: (id) => set((s) => ({ notifications: s.notifications.filter((x) => x.id !== id) })),
  clear: () => set({ notifications: [] }),
}));