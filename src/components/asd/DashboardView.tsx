'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, Activity, ClipboardCheck, Shield, Brain,
  UserPlus, BarChart3, ArrowUpRight, TrendingUp
} from 'lucide-react';

interface Stats {
  userCount: number;
  patientCount: number;
  sessionCount: number;
  completedSessions: number;
  riskDist: Record<string, number>;
  subtypeDist: Record<string, number>;
  assessByType: Record<string, number>;
  recentResults: any[];
  recentLogs: any[];
}

const RISK_CONFIG: Record<string, { color: string; bg: string; ar: string; en: string }> = {
  low:      { color: 'text-emerald-600', bg: 'bg-emerald-400', ar: '\u0645\u0646\u062e\u0641\u0636', en: 'Low' },
  moderate: { color: 'text-amber-600',   bg: 'bg-amber-400',   ar: '\u0645\u062a\u0648\u0633\u0637', en: 'Moderate' },
  high:     { color: 'text-orange-600',  bg: 'bg-orange-400',  ar: '\u0645\u0631\u062a\u0641\u0639', en: 'High' },
  critical: { color: 'text-red-600',     bg: 'bg-red-400',     ar: '\u062d\u0627\u062f',    en: 'Critical' },
};

export function DashboardView() {
  const { user, navigate, startSession } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/seed', { method: 'POST' }).then(() =>
      fetch('/api/stats')
        .then(r => r.json())
        .then(setStats)
        .catch(() => {})
        .finally(() => setLoading(false))
    );
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  const role = user?.role || 'doctor';
  const isDoctor = role === 'doctor';
  const isAdmin = role === 'admin';
  const isMonitor = role === 'monitor';

  return (
    <div className="space-y-6" dir={dir}>
      {/* Welcome Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {lang === 'ar' ? `\u0645\u0631\u062d\u0628\u0627\u064b\u060c ${user?.name}` : `Welcome, ${user?.name}`}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{t('platformSubtitle')}</p>
        </div>
        {isDoctor && (
          <Button onClick={() => navigate('new-assessment')} className="gap-2 h-10 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-md shadow-sky-500/20 rounded-xl text-sm">
            <UserPlus className="w-4 h-4" />
            {t('startNew')}
          </Button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(isAdmin ? [
          { icon: Users, label: t('totalUsers'), value: stats?.userCount || 0, gradient: 'from-sky-400 to-blue-500', shadow: 'shadow-sky-500/15' },
          { icon: Activity, label: t('totalPatients'), value: stats?.patientCount || 0, gradient: 'from-teal-400 to-emerald-500', shadow: 'shadow-teal-500/15' },
          { icon: ClipboardCheck, label: t('totalAssessments'), value: stats?.sessionCount || 0, gradient: 'from-amber-400 to-orange-400', shadow: 'shadow-amber-500/15' },
          { icon: Shield, label: t('completedAssessments'), value: stats?.completedSessions || 0, gradient: 'from-violet-400 to-purple-500', shadow: 'shadow-violet-500/15' },
        ] : isDoctor ? [
          { icon: Users, label: t('totalPatients'), value: stats?.patientCount || 0, gradient: 'from-teal-400 to-emerald-500', shadow: 'shadow-teal-500/15' },
          { icon: ClipboardCheck, label: t('totalAssessments'), value: stats?.sessionCount || 0, gradient: 'from-amber-400 to-orange-400', shadow: 'shadow-amber-500/15' },
          { icon: Activity, label: t('completedAssessments'), value: stats?.completedSessions || 0, gradient: 'from-sky-400 to-cyan-500', shadow: 'shadow-sky-500/15' },
          { icon: Brain, label: t('questionnaires'), value: stats?.assessByType?.questionnaire || 0, gradient: 'from-violet-400 to-purple-500', shadow: 'shadow-violet-500/15' },
        ] : [
          { icon: Users, label: t('totalPatients'), value: stats?.patientCount || 0, gradient: 'from-teal-400 to-emerald-500', shadow: 'shadow-teal-500/15' },
          { icon: ClipboardCheck, label: t('completedAssessments'), value: stats?.completedSessions || 0, gradient: 'from-amber-400 to-orange-400', shadow: 'shadow-amber-500/15' },
          { icon: Activity, label: t('totalAssessments'), value: stats?.sessionCount || 0, gradient: 'from-sky-400 to-cyan-500', shadow: 'shadow-sky-500/15' },
          { icon: BarChart3, label: t('avgRiskScore'), value: stats?.completedSessions ? Math.round((stats.recentResults.reduce((a: number, r: any) => a + (r.riskScore || 0), 0) / Math.max(stats.completedSessions, 1))) : 0, gradient: 'from-rose-400 to-pink-500', shadow: 'shadow-rose-500/15' },
        ]).map(card => (
          <Card key={card.label} className="glass-card rounded-2xl border-0 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 group">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} ${card.shadow} shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
              </div>
              <p className="text-3xl font-bold text-slate-800 mt-4 tabular-nums tracking-tight">{card.value}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two column: Risk Distribution + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Risk Distribution */}
        <Card className="glass-card rounded-2xl border-0 shadow-lg shadow-slate-200/40">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-sky-600" />
              </div>
              {t('riskDistribution')}
            </h2>
            <div className="space-y-4">
              {Object.entries(RISK_CONFIG).map(([key, cfg]) => {
                const count = stats?.riskDist?.[key] || 0;
                const total = Object.values(stats?.riskDist || {}).reduce((a: number, b: number) => a + b, 0) || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className={`text-xs font-semibold w-16 ${cfg.color}`}>{cfg[lang]}</span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${cfg.bg} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums w-16 text-right font-medium">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-card rounded-2xl border-0 shadow-lg shadow-slate-200/40">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-5">{t('recentActivity')}</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {(!stats?.recentLogs || stats.recentLogs.length === 0) ? (
                <p className="text-sm text-slate-400 text-center py-8">{lang === 'ar' ? '\u0644\u0627 \u064a\u0648\u062c\u062f \u0646\u0634\u0627\u0637 \u0628\u0639\u062f' : 'No activity yet'}</p>
              ) : (
                stats.recentLogs.slice(0, 8).map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-600 truncate text-[13px]">{log.details || log.action}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {log.user?.name || 'System'} · {new Date(log.createdAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions for doctor */}
      {isDoctor && (
        <Card className="glass-card rounded-2xl border-0 shadow-lg shadow-slate-200/40">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-4">{t('quickActions')}</h2>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 rounded-xl border-slate-200 text-slate-600 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200" onClick={() => navigate('new-assessment')}>
                <UserPlus className="w-3.5 h-3.5" /> {t('createPatient')}
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 rounded-xl border-slate-200 text-slate-600 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200" onClick={() => navigate('patients')}>
                <Users className="w-3.5 h-3.5" /> {t('patients')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
