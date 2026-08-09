'use client';
import { useNotifStore } from '@/store/useNotifStore';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICONS = { success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle };
const COLORS = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
};

export function ToastContainer() {
  const { notifications, remove } = useNotifStore();
  return (
    <div className='fixed top-4 right-4 z-[100] space-y-2 max-w-sm'>
      {notifications.map((n) => {
        const Icon = ICONS[n.type];
        return (
          <div key={n.id} className={'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ' + COLORS[n.type]}>
            <Icon className='w-4 h-4 flex-shrink-0' />
            <p className='text-sm flex-1'>{n.message}</p>
            <button onClick={() => remove(n.id)} className='flex-shrink-0 hover:opacity-60'><X className='w-3 h-3' /></button>
          </div>
        );
      })}
    </div>
  );
}
