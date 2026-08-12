'use client';

import { useEffect } from 'react';

interface ConfirmDialogProps {
  open: boolean; title: string; message: string;
  onConfirm: () => void; onCancel: () => void;
  confirmText?: string; cancelText?: string; variant?: 'danger' | 'default';
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmText, cancelText, variant = 'default' }: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className='fixed inset-0 z-[200] flex items-center justify-center'>
      <div className='absolute inset-0 bg-black/40' onClick={onCancel} />
      <div className='relative bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4' style={{animation:'fadeIn 0.15s ease-out'}}>
        <h3 className='text-base font-bold text-gray-900 dark:text-white'>{title}</h3>
        <p className='text-sm text-gray-600 dark:text-gray-300 mt-2'>{message}</p>
        <div className='flex justify-end gap-2 mt-5'>
          <button onClick={onCancel} className='px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'>{cancelText || 'Cancel'}</button>
          <button onClick={onConfirm} className={'px-4 py-2 text-sm rounded-lg text-white '+(variant==='danger'?'bg-red-600 hover:bg-red-700':'bg-emerald-600 hover:bg-emerald-700')}>{confirmText || 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}