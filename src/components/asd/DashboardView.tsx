'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, Activity, ClipboardCheck, Shield, Brain,
  UserPlus, BarChart3, ArrowUpRight, TrendingUp,
  AlertTriangle, Calendar, UserCog, Clock, Printer, Moon, Sun
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
  riskAlerts: {
    patientId: string;
    patientName: string;
    previousRisk: string;
    currentRisk: string;
    date: string;
  }[];
  assessmentTrend: { week: string; count: number }[];
  ageDistribution: { range: string; count: number }[];
  incompleteSessions: { id: string; status: string; createdAt: string; patient: { id: string; name: string } }[];
  doctorPerformance: {
    doctorId: string; doctorName: string;
    patientCount: number; totalSessions: number;
    completedSessions: number; avgRiskScore: number;
  }[];
}

const RISK_CONFIG: Record<string, { color: string; bg: string; ar: string; en: string }> = {
  low:      { color: 'text-emerald-600', bg: 'bg-emerald-400', ar: 'منخفض', en: 'Low' },
  moderate: { color: 'text-amber-600',   bg: 'bg-amber-400',   ar: 'متوسط', en: 'Moderate' },
  high:     { color: 'text-orange-600',  bg: 'bg-orange-400',  ar: 'مرتفع', en: 'High' },
  critical: { color: 'text-red-600',     bg: 'bg-red-400',     ar: 'حاد',    en: 'Critical' },
};

const AGE_LABELS: Record<string, { ar: string; en: string }> = {
  '0-2':  { ar: '0-2 سنوات', en: '0-2 years' },
  '3-5':  { ar: '3-5 سنوات', en: '3-5 years' },
  '6-11': { ar: '6-11 سنة', en: '6-11 years' },
  '12-17':{ ar: '12-17 سنة', en: '12-17 years' },
  '18+':  { ar: '18+ سنة', en: '18+ years' },
};

const AGE_COLORS = ['bg-emerald-400', 'bg-sky-400', 'bg-violet-400', 'bg-amber-400', 'bg-rose-400'];

const SUBTYPE_CONFIG: Record<string, { ar: string; en: string; color: string }> = {
  withdrawn:  { ar: 'المنعزل',   en: 'Withdrawn',   color: '#8b5cf6' },
  activeOdd:  { ar: 'النشط-الغريب', en: 'Active-odd', color: '#f59e0b' },
  shy:        { ar: 'الخجول',   en: 'Shy',         color: '#3b82f6' },
  motorSub:   { ar: 'الحركي',   en: 'Motor',       color: '#10b981' },
};

export function DashboardView() {
  const { user, navigate, startSession } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('all');
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('darkMode', String(next));
  };

  const loadStats = (fromDate?: string) => {
    setLoading(true);
    const params = fromDate ? `?fromDate=${fromDate}` : '';
    fetch('/api/seed', { method: 'POST' }).then(() =>
      fetch(`/api/stats${params}`)
        .then(r => r.json())
        .then(setStats)
        .catch(() => {})
        .finally(() => setLoading(false))
    );
  };

  useEffect(() => { loadStats(); }, []);

  const handleRange = (r: string) => {
    setRange(r);
    if (r === 'all') { loadStats(); return; }
    const days = r === '7d' ? 7 : r === '30d' ? 30 : 90;
    const d = new Date();
    d.setDate(d.getDate() - days);
    loadStats(d.toISOString());
  };

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
  const trendData = stats?.assessmentTrend || [];
  const maxTrend = Math.max(...trendData.map(d => d.count), 1);
  const ageData = stats?.ageDistribution || [];
  const maxAge = Math.max(...ageData.map(d => d.count), 1);
  const highRiskResults = (stats?.recentResults || []).filter((r: any) => r.riskLevel === 'high' || r.riskLevel === 'critical');

  return (
    <div className="space-y-6" dir={dir}>
      {/* Welcome Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {lang === 'ar' ? `مرحباً، ${user?.name}` : `Welcome, ${user?.name}`}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{t('platformSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {isDoctor && (
            <Button onClick={() => navigate('new-assessment')} className="gap-2 h-10 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-md shadow-sky-500/20 rounded-xl text-sm">
              <UserPlus className="w-4 h-4" />
              {t('startNew')}
            </Button>
          )}
          <Button onClick={() => window.print()} variant="outline" className="gap-2 h-10 rounded-xl text-sm border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 print:hidden">
            <Printer className="w-4 h-4" />
            {lang === 'ar' ? 'تصدير PDF' : 'Export PDF'}
          </Button>
          <button onClick={toggleDark} className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors print:hidden">
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Date Range Filter (Feature #7) */}
      {!isAdmin && (
        <div className="flex items-center gap-2 flex-wrap print:hidden">
          <span className="text-xs text-slate-500 font-medium">{lang === 'ar' ? 'الفترة:' : 'Range:'}</span>
          {['all', '7d', '30d', '90d'].map((r) => (
            <button
              key={r}
              onClick={() => handleRange(r)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${range === r ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {r === 'all' ? (lang === 'ar' ? 'الكل' : 'All') : r}
            </button>
          ))}
        </div>
      )}

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
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-4 tabular-nums tracking-tight">{card.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Alert Panel */}
      {!isAdmin && stats?.riskAlerts && stats.riskAlerts.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-lg shadow-red-100/50 bg-gradient-to-r from-red-50 to-orange-50">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold text-red-700 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {lang === 'ar' ? 'تنبيهات ارتفاع الخطورة' : 'Risk Escalation Alerts'}
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{stats.riskAlerts.length}</Badge>
            </h2>
            <div className="space-y-2">
              {stats.riskAlerts.slice(0, 5).map((alert, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/70 rounded-xl px-4 py-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{alert.patientName}</p>
                    <p className="text-xs text-slate-500">{new Date(alert.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">{RISK_CONFIG[alert.previousRisk]?.[lang] || alert.previousRisk}</span>
                    <span className="text-slate-400">→</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RISK_CONFIG[alert.currentRisk]?.bg} text-white`}>{RISK_CONFIG[alert.currentRisk]?.[lang] || alert.currentRisk}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assessment Trend Chart */}
      {!isAdmin && (
        <Card className="glass-card rounded-2xl border-0 shadow-lg shadow-slate-200/40">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              {lang === 'ar' ? 'اتجاه التقييمات (8 أسابيع)' : 'Assessment Trend (8 Weeks)'}
            </h2>
            {trendData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">{lang === 'ar' ? 'لا توجد بيانات بعد' : 'No data yet'}</p>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {trendData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[11px] font-semibold text-slate-700 tabular-nums">{d.count}</span>
                    <div
                      className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-indigo-500 to-indigo-400 hover:from-indigo-600 hover:to-indigo-500 transition-all duration-300 min-h-[4px]"
                      style={{ height: `${Math.max((d.count / maxTrend) * 100, 4)}%` }}
                      title={`${d.week}: ${d.count}`}
                    />
                    <span className="text-[10px] text-slate-400 tabular-nums mt-1">{d.week}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Doctor Performance Comparison (Feature #5 - Monitor only) */}
      {isMonitor && stats?.doctorPerformance && stats.doctorPerformance.length > 0 && (
        <Card className="glass-card rounded-2xl border-0 shadow-lg shadow-slate-200/40">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
              {lang === 'ar' ? 'أداء الأطباء' : 'Doctor Performance'}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">{lang === 'ar' ? 'الطبيب' : 'Doctor'}</th>
                    <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500">{lang === 'ar' ? 'المرضى' : 'Patients'}</th>
                    <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500">{lang === 'ar' ? 'مكتمل' : 'Completed'}</th>
                    <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500">{lang === 'ar' ? 'متوسط الخطورة' : 'Avg Risk'}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.doctorPerformance.map((d) => (
                    <tr key={d.doctorId} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-3 px-2 font-medium text-slate-800">{d.doctorName}</td>
                      <td className="py-3 px-2 text-center tabular-nums text-slate-600">{d.patientCount}</td>
                      <td className="py-3 px-2 text-center tabular-nums text-slate-600">{d.completedSessions}/{d.totalSessions}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`font-bold tabular-nums ${d.avgRiskScore >= 70 ? 'text-red-600' : d.avgRiskScore >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>{d.avgRiskScore}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent High-Risk Results (Feature #8) */}
      {!isAdmin && highRiskResults.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-lg shadow-red-100/40 bg-gradient-to-r from-rose-50 to-fuchsia-50">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold text-rose-700 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {lang === 'ar' ? 'نتائج عالية الخطورة الأخيرة' : 'Recent High-Risk Results'}
            </h2>
            <div className="space-y-2">
              {highRiskResults.slice(0, 5).map((r: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-white/70 rounded-xl px-4 py-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${r.riskLevel === 'critical' ? 'bg-red-500' : 'bg-orange-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{r.session?.patient?.name || '—'}</p>
                      <p className="text-[11px] text-slate-500">
                        {r.subtype ? `${SUBTYPE_CONFIG[r.subtype]?.[lang] || r.subtype} · ` : ''}
                        {new Date(r.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold tabular-nums ${r.riskLevel === 'critical' ? 'text-red-600' : 'text-orange-600'}`}>{r.riskScore || 0}</span>
                      <p className="text-[10px] text-slate-400">{RISK_CONFIG[r.riskLevel]?.[lang] || r.riskLevel}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incomplete Assessments (Feature #4) */}
      {!isAdmin && stats?.incompleteSessions && stats.incompleteSessions.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-lg shadow-amber-100/50 bg-gradient-to-r from-amber-50 to-yellow-50">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold text-amber-700 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {lang === 'ar' ? 'تقييمات غير مكتملة' : 'Incomplete Assessments'}
              <Badge className="text-[10px] px-1.5 py-0 bg-amber-500 text-white hover:bg-amber-600">{stats.incompleteSessions.length}</Badge>
            </h2>
            <div className="space-y-2">
              {stats.incompleteSessions.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center gap-3 bg-white/70 rounded-xl px-4 py-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{s.patient?.name || '—'}</p>
                    <p className="text-xs text-slate-500">{new Date(s.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">{s.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Three column: Risk Distribution + Age Distribution + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Risk Distribution */}
        <Card className="glass-card rounded-2xl border-0 shadow-lg shadow-slate-200/40">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
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

        {/* Age Distribution (Feature #3) */}
        <Card className="glass-card rounded-2xl border-0 shadow-lg shadow-slate-200/40">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                <UserCog className="w-4 h-4 text-teal-600" />
              </div>
              {lang === 'ar' ? 'توزيع الأعمار' : 'Age Distribution'}
            </h2>
            {ageData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">{lang === 'ar' ? 'لا توجد بيانات' : 'No data yet'}</p>
            ) : (
              <div className="space-y-3">
                {ageData.map((d, i) => {
                  const pct = Math.round((d.count / maxAge) * 100);
                  return (
                    <div key={d.range} className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-600 w-16">{AGE_LABELS[d.range]?.[lang] || d.range}</span>
                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${AGE_COLORS[i] || 'bg-slate-400'} transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 tabular-nums w-8 text-right font-medium">{d.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-card rounded-2xl border-0 shadow-lg shadow-slate-200/40">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-5">{t('recentActivity')}</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {(!stats?.recentLogs || stats.recentLogs.length === 0) ? (
                <p className="text-sm text-slate-400 text-center py-8">{lang === 'ar' ? 'لا يوجد نشاط بعد' : 'No activity yet'}</p>
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

      {/* Subtype Distribution Pie (Feature #6) */}
      {!isAdmin && stats?.subtypeDist && Object.keys(stats.subtypeDist).length > 0 && (
        <Card className="glass-card rounded-2xl border-0 shadow-lg shadow-slate-200/40">
          <CardContent className="p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-fuchsia-50 flex items-center justify-center">
                <Brain className="w-4 h-4 text-fuchsia-600" />
              </div>
              {lang === 'ar' ? 'توزيع الأنماط الفرعية' : 'Subtype Distribution'}
            </h2>
            <div className="flex items-center gap-8">
              <div
                className="w-32 h-32 rounded-full flex-shrink-0"
                style={{
                  background: (() => {
                    const entries = Object.entries(stats.subtypeDist);
                    const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
                    let deg = 0;
                    const stops: string[] = [];
                    for (const [key, val] of entries) {
                      const pct = (val / total) * 360;
                      const c = SUBTYPE_CONFIG[key]?.color || '#94a3b8';
                      stops.push(`${c} ${deg}deg ${deg + pct}deg`);
                      deg += pct;
                    }
                    return `conic-gradient(${stops.join(', ')})`;
                  })(),
                }}
              />
              <div className="space-y-2 flex-1">
                {Object.entries(stats.subtypeDist).map(([key, count]) => {
                  const total = Object.values(stats.subtypeDist).reduce((a: number, b: number) => a + b, 0) || 1;
                  const pct = Math.round((count / total) * 100);
                  const cfg = SUBTYPE_CONFIG[key];
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cfg?.color || '#94a3b8' }} />
                      <span className="text-xs text-slate-600 flex-1">{cfg?.[lang] || key}</span>
                      <span className="text-xs font-semibold text-slate-800 tabular-nums">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
