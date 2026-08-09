import { create } from 'zustand';

export type NotifType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotifType;
  message_ar: string;
  message_en: string;
}

interface NotifStore {
  notifications: Notification[];
  add: (type: NotifType, ar: string, en: string, duration?: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useNotifStore = create<NotifStore>((set) => ({
  notifications: [],
  add: (type, ar, en, duration = 4000) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    set((s) => ({ notifications: [...s.notifications, { id, type, message_ar: ar, message_en: en }] }));
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
      }, duration);
    }
  },
  remove: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  clear: () => set({ notifications: [] }),
}));