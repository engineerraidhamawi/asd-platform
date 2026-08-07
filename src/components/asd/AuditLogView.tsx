'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, RefreshCw, Filter } from 'lucide-react';

interface AuditEntry {
  id: string;
  userId: string | null;
  action: string;
  target: string | null;
  details: string | null;
  createdAt: string;
  user?: { name: string; email: string; role: string } | null;
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN_SUCCESS: 'bg-emerald-100 text-emerald-700',
  LOGIN_FAILED: 'bg-red-100 text-red-700',
  USER_CREATED: 'bg-blue-100 text-blue-700',
  USER_UPDATED: 'bg-amber-100 text-amber-700',
  USER_DELETED: 'bg-red-100 text-red-700',
  PATIENT_CREATED: 'bg-emerald-100 text-emerald-700',
  PATIENT_DELETED: 'bg-red-100 text-red-700',
  SESSION_CREATED: 'bg-violet-100 text-violet-700',
  SESSION_UPDATED: 'bg-blue-100 text-blue-700',
  RESULT_CREATED: 'bg-teal-100 text-teal-700',
};

export function AuditLogView() {
  const { lang, t, dir } = useLanguage();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 50;

  const loadLogs = () => {
    setLoading(true);
    let url = `/api/audit?limit=${limit}&offset=${page * limit}`;
    if (search) url += `&action=${encodeURIComponent(search)}`;
    fetch(url)
      .then(r => r.json())
      .then(data => { setLogs(data.logs || []); setTotal(data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    const doLoad = async () => {
      setLoading(true);
      let url = `/api/audit?limit=${limit}&offset=${page * limit}`;
      if (search) url += `&action=${encodeURIComponent(search)}`;
      try {
        const r = await fetch(url);
        const data = await r.json();
        if (!cancelled) { setLogs(data.logs || []); setTotal(data.total || 0); }
      } catch {}
      if (!cancelled) setLoading(false);
    };
    doLoad();
    return () => { cancelled = true; };
  }, [page, search]);

  const filtered = search
    ? logs.filter(l => l.action.includes(search.toUpperCase()) || l.details?.toLowerCase().includes(search.toLowerCase()))
    : logs;

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          {t('auditLog')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t('auditLogDesc')} · {total} {lang === 'ar' ? 'سجل' : 'entries'}</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${dir === 'rtl' ? 'right-3' : 'left-3'}`} />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder={lang === 'ar' ? 'تصفية حسب الإجراء...' : 'Filter by action...'}
            className={`${dir === 'rtl' ? 'pr-9' : 'pl-9'}`}
          />
        </div>
        <Button variant="outline" size="sm" className="gap-1" onClick={loadLogs}>
          <RefreshCw className="w-3 h-3" /> {lang === 'ar' ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {/* Logs */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t('noAuditLogs')}</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className={`${dir === 'rtl' ? 'text-right' : 'text-left'} p-3 text-xs font-medium text-gray-500`}>{t('timestamp')}</th>
                    <th className={`${dir === 'rtl' ? 'text-right' : 'text-left'} p-3 text-xs font-medium text-gray-500`}>{t('user')}</th>
                    <th className={`${dir === 'rtl' ? 'text-right' : 'text-left'} p-3 text-xs font-medium text-gray-500`}>{t('action')}</th>
                    <th className={`${dir === 'rtl' ? 'text-right' : 'text-left'} p-3 text-xs font-medium text-gray-500`}>{t('details')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(log => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-3 text-xs text-gray-400 tabular-nums whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                      </td>
                      <td className="p-3 text-gray-700">
                        <div>
                          <p className="font-medium text-gray-900 text-xs">{log.user?.name || (lang === 'ar' ? 'النظام' : 'System')}</p>
                          <p className="text-[10px] text-gray-400">{log.user?.role || ''}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-gray-500 max-w-xs truncate" title={log.details || ''}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>{t('prev')}</Button>
          <span className="text-sm text-gray-500">{page + 1} / {Math.ceil(total / limit)}</span>
          <Button variant="outline" size="sm" disabled={(page + 1) * limit >= total} onClick={() => setPage(page + 1)}>{t('next')}</Button>
        </div>
      )}
    </div>
  );
}