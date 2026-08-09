'use client';

import { useNotifStore, NotifType } from '@/store/useNotifStore';
import { useLanguage } from '@/hooks/useLanguage';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICONS: Record<NotifType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS: Record<NotifType, string> = {
  success: 'bg-emerald-50 border-emerald-300 text-emerald-800',
  error: 'bg-red-50 border-red-300 text-red-800',
  info: 'bg-sky-50 border-sky-300 text-sky-800',
  warning: 'bg-amber-50 border-amber-300 text-amber-800',
};

const ICON_COLORS: Record<NotifType, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-sky-500',
  warning: 'text-amber-500',
};

export function ToastContainer() {
  const { notifications, remove } = useNotifStore();
  const { lang } = useLanguage();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => {
        const Icon = ICONS[n.type];
        return (
          <div
            key={n.id}
            className={
              'pointer-events-auto flex items-start gap-3 p-3 rounded-xl border shadow-lg backdrop-blur-sm animate-in slide-in-from-top-2 fade-in duration-300 ' +
              COLORS[n.type]
            }
          >
            <Icon className={"w-5 h-5 mt-0.5 flex-shrink-0 " + ICON_COLORS[n.type]} />
            <p className="flex-1 text-sm font-medium">
              {lang === 'ar' ? n.message_ar : n.message_en}
            </p>
            <button
              onClick={() => remove(n.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}