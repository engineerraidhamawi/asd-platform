'use client';

import { useAppStore } from '@/store/useAppStore';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Activity, BarChart3, GitCompareArrows } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { RadarChart } from '@/components/asd/RadarChart';

const RISK_LABELS: Record<string, { ar: string; en: string; color: string; bg: string }> = {
  low:      { ar: 'منخفض', en: 'Low',      color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  moderate: { ar: 'متوسط', en: 'Moderate',  color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
  high:     { ar: 'مرتفع', en: 'High',      color: 'text-orange-600',  bg: 'bg-orange-50 border-orange-200' },
  critical: { ar: 'حاد',    en: 'Critical', color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
};

interface HistoryResult {
  id: string; sessionId: string; riskLevel: string; riskScore: number; riskPercent?: number;
  adosScore: number; adosConfidence: number; subtype: string;
  radarScores: string; xaiReport: string; createdAt: string;
  session: { createdAt: string } | null;
}

export function HistoryView() {
  const { patientId, patientName, navigate } = useAppStore();
  const { lang, dir, t } = useLanguage();
  const [results, setResults] = useState<HistoryResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!patientId) return;
    fetch(/api/results?patientId={patientId}).then(r => r.json()).then(setResults).catch(() => {}).finally(() => setLoading(false));
  }, [patientId]);

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else if (next.size < 3) next.add(id);
      return next;
    });
  };

  const radarLabels = [t('socialComm'), t('nonVerbal'), t('repetitive'), t('sensory'), t('motor'), t('executive')];

  if (loading) return <div className='flex items-center justify-center py-20'><div className='w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin' /></div>;

  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const sortedResults = [...results].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Build comparison data
  const comparisonResults = sortedResults.filter(r => compareIds.has(r.id));
  const COLORS = ['rgba(16,185,129,0.2)', 'rgba(59,130,246,0.2)', 'rgba(245,158,11,0.2)'];
  const STROKES = ['#10B981', '#3B82F6', '#F59E0B'];

  return (
    <div className='view-transition space-y-6 max-w-5xl mx-auto' dir={dir}>
      <div className='flex items-center justify-between flex-wrap gap-2'>
        <div>
          <h1 className='text-xl font-bold text-gray-900 flex items-center gap-2'>
            <Activity className='w-5 h-5 text-teal-600' />
            {lang === 'ar' ? 'التتبع الزمني' : 'Progress Tracking'}
          </h1>
          <p className='text-xs text-gray-500 mt-0.5'>{patientName}</p>
        </div>
        <div className='flex gap-2'>
          {compareIds.size >= 2 && (
            <div className='flex items-center gap-1 text-xs text-emerald-600'>
              <GitCompareArrows className='w-3 h-3' />
              {compareIds.size} {lang === 'ar' ? 'جلسات مختارة للمقارنة' : 'sessions selected'}
            </div>
          )}
          <Button variant='outline' size='sm' onClick={() => navigate('patients')} className='gap-1'>
            <BackArrow className='w-3 h-3' />
            {t('patients')}
          </Button>
        </div>
      </div>

      {/* Comparison Radar Chart */}
      {comparisonResults.length >= 2 && (
        <Card>
          <CardContent className='p-5'>
            <h2 className='text-sm font-bold text-gray-900 mb-4'>
              {lang === 'ar' ? 'مقارنة الجلسات' : 'Session Comparison'}
            </h2>
            <div className={grid gap-6 }>
              {comparisonResults.map((r, idx) => {
                const rs = typeof r.radarScores === 'string' ? JSON.parse(r.radarScores) : (r.radarScores || {});
                const scores = [rs.social||0, rs.nonverbal||0, rs.repetitive||0, rs.sensory||0, rs.motor||0, rs.executive||0];
                const risk = RISK_LABELS[r.riskLevel] || RISK_LABELS.low;
                return (
                  <div key={r.id} className='text-center'>
                    <p className='text-xs text-gray-500 mb-1'>{new Date(r.createdAt).toLocaleDateString(lang==='ar'?'ar-SA':'en-US')}</p>
                    <RadarChart scores={scores} labels={radarLabels} lang={lang} fill={COLORS[idx]} stroke={STROKES[idx]} />
                    <div className='mt-2 flex justify-center gap-2 text-xs'>
                      <span className={px-2 py-0.5 rounded-full border  }>{risk[lang]}</span>
                      <span className='text-gray-500'>{r.riskScore}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session List */}
      {sortedResults.length === 0 ? (
        <Card>
          <CardContent className='p-8 text-center'>
            <BarChart3 className='w-10 h-10 text-gray-300 mx-auto mb-2' />
            <p className='text-gray-500'>{lang === 'ar' ? 'لا توجد جلسات سابقة لهذا المريض' : 'No previous sessions for this patient'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-4'>
          {sortedResults.map((r, idx) => {
            const risk = RISK_LABELS[r.riskLevel] || RISK_LABELS.low;
            const prev = idx < sortedResults.length - 1 ? sortedResults[idx + 1] : null;
            const improved = prev ? r.riskScore < prev.riskScore : null;
            const worsened = prev ? r.riskScore > prev.riskScore : null;
            const isSelected = compareIds.has(r.id);
            const rs = typeof r.radarScores === 'string' ? JSON.parse(r.radarScores) : (r.radarScores || {});
            const scores = [rs.social||0, rs.nonverbal||0, rs.repetitive||0, rs.sensory||0, rs.motor||0, rs.executive||0];

            return (
              <Card key={r.id} className={isSelected ? 'border-emerald-300 bg-emerald-50/30' : ''}>
                <CardContent className='p-4 flex gap-4 items-start flex-wrap'>
                  <div className='flex-shrink-0 hidden sm:block'>
                    <RadarChart scores={scores} labels={radarLabels} lang={lang} size={80} />
                  </div>
                  <div className='flex-1 min-w-[200px]'>
                    <div className='flex items-center gap-2 mb-1 flex-wrap'>
                      <span className={	ext-xs px-2 py-0.5 rounded-full border  }>{risk[lang]}</span>
                      <span className='text-xs text-gray-400'>{new Date(r.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                      {improved && <span className='text-xs text-emerald-600 font-medium'>{lang === 'ar' ? '↓ تحسن' : '↓ Improved'}</span>}
                      {worsened && <span className='text-xs text-red-600 font-medium'>{lang === 'ar' ? '↑ تدهور' : '↑ Worsened'}</span>}
                    </div>
                    <p className='text-sm font-medium'>
                      {t('riskScore')}: <span className='tabular-nums'>{r.riskPercent || r.riskScore}</span>/100
                    </p>
                    <p className='text-xs text-gray-500'>
                      ADOS: {r.adosScore?.toFixed(1)} · {t('confidence')}: {Math.round((r.adosConfidence || 0) * 100)}%
                    </p>
                  </div>
                  <label className='flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none'>
                    <input type='checkbox' checked={isSelected} onChange={() => toggleCompare(r.id)} className='rounded border-gray-300 text-emerald-600 focus:ring-emerald-500' />
                    {lang === 'ar' ? 'قارن' : 'Compare'}
                  </label>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}