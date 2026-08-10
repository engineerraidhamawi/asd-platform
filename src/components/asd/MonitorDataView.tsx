'use client';
import { apiFetch } from "@/lib/api";

import { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Users, ClipboardCheck, TrendingUp, PieChart } from 'lucide-react';

interface Stats {
  patientCount: number;
  sessionCount: number;
  completedSessions: number;
  riskDist: Record<string, number>;
  subtypeDist: Record<string, number>;
  assessByType: Record<string, number>;
  recentResults: any[];
}

const RISK_COLORS: Record<string, { bg: string; ar: string; en: string }> = {
  low:      { bg: 'bg-emerald-500', ar: 'منخفض', en: 'Low' },
  moderate: { bg: 'bg-amber-500',   ar: 'متوسط', en: 'Moderate' },
  high:     { bg: 'bg-orange-500',  ar: 'مرتفع', en: 'High' },
  critical: { bg: 'bg-red-500',     ar: 'حاد',    en: 'Critical' },
};

const SUBTYPE_COLORS: Record<string, { bg: string; ar: string; en: string }> = {
  withdrawn:  { bg: 'bg-blue-500',   ar: 'المنعزل',     en: 'Withdrawn' },
  'active-odd': { bg: 'bg-amber-500', ar: 'النشط-الغريب', en: 'Active-odd' },
  shy:        { bg: 'bg-violet-500', ar: 'الخجول',      en: 'Shy' },
  motor:      { bg: 'bg-rose-500',   ar: 'الحركي',      en: 'Motor' },
};

export function MonitorDataView() {
  const { lang, t, dir } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin" /></div>;

  const totalRisk = Object.values(stats?.riskDist ?? {}).reduce((a, b) => a + b, 0) || 1;
  const avgRisk = stats?.recentResults?.length
    ? Math.round(stats.recentResults?.reduce((a, r) => a + (r.riskScore || 0), 0) / stats.recentResults.length)
    : 0;

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          {t('aggregatedData')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t('dataInsights')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: t('totalPatients'), value: stats?.patientCount || 0, color: 'text-emerald-600 bg-emerald-50' },
          { icon: ClipboardCheck, label: t('completedAssessments'), value: stats?.completedSessions || 0, color: 'text-amber-600 bg-amber-50' },
          { icon: TrendingUp, label: t('avgRiskScore'), value: avgRisk, color: 'text-orange-600 bg-orange-50' },
          { icon: PieChart, label: t('assessmentTypes'), value: Object.keys(stats?.assessByType || {}).length, color: 'text-violet-600 bg-violet-50' },
        ].map(card => (
          <Card key={card.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                <card.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3 tabular-nums">{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">{t('riskDistribution')}</h2>
            <div className="space-y-3">
              {Object.entries(RISK_COLORS).map(([key, cfg]) => {
                const count = stats?.riskDist?.[key] || 0;
                const pct = Math.round((count / totalRisk) * 100);
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-16 text-gray-600">{cfg[lang]}</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${cfg.bg} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 tabular-nums w-20 text-right">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Subtype Distribution */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">{t('subtypingTitle')}</h2>
            {Object.keys(stats?.subtypeDist || {}).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">{lang === 'ar' ? 'لا توجد بيانات كافية' : 'Insufficient data'}</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(SUBTYPE_COLORS).map(([key, cfg]) => {
                  const count = stats?.subtypeDist?.[key] || 0;
                  const totalSub = Object.values(stats?.subtypeDist || {}).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / totalSub) * 100);
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-24 text-gray-600">{cfg[lang]}</span>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${cfg.bg} transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums w-16 text-right">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assessment Types */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">{t('assessmentTypes')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(stats?.assessByType || {}).map(([type, count]) => (
              <div key={type} className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{count as number}</p>
                <p className="text-xs text-gray-500 mt-1 capitalize">{type}</p>
              </div>
            ))}
            {Object.keys(stats?.assessByType || {}).length === 0 && (
              <p className="col-span-4 text-sm text-gray-400 text-center py-4">{lang === 'ar' ? 'لا توجد تقييمات بعد' : 'No assessments yet'}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}