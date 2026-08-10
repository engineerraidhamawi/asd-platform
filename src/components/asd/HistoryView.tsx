'use client';
import { apiFetch } from "@/lib/api";

import { useAppStore } from '@/store/useAppStore';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Activity, BarChart3, Calendar } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const RISK_LABELS: Record<string, { ar: string; en: string; color: string; bg: string }> = {
  low:      { ar: '\u0645\u0646\u062e\u0641\u0636', en: 'Low',      color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  moderate: { ar: '\u0645\u062a\u0648\u0633\u0637', en: 'Moderate',  color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
  high:     { ar: '\u0645\u0631\u062a\u0641\u0639', en: 'High',      color: 'text-orange-600',  bg: 'bg-orange-50 border-orange-200' },
  critical: { ar: '\u062d\u0627\u062f',    en: 'Critical', color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
};

const AXIS_LABELS: Record<string, Record<string, string>> = { social: { ar: '\u0627\u062c\u062a\u0645\u0627\u0639\u064a', en: 'Social' }, nonverbal: { ar: '\u063a\u064a\u0631 \u0644\u0641\u0638\u064a', en: 'Nonverbal' }, repetitive: { ar: '\u0646\u0645\u0637\u064a', en: 'Repetitive' }, sensory: { ar: '\u062d\u0633\u064a', en: 'Sensory' }, motor: { ar: '\u062d\u0631\u0643\u064a', en: 'Motor' }, executive: { ar: '\u062a\u0646\u0641\u064a\u0630\u064a', en: 'Executive' } };

interface HistoryResult {
  id: string; sessionId: string; riskLevel: string; riskScore: number; riskPercent?: number;
  adosScore: number; adosConfidence: number; subtype: string;
  radarScores: string; xaiReport: string; createdAt: string;
  session: { createdAt: string } | null;
}

export function HistoryView() {
  const { patientId, patientName, navigate } = useAppStore();
  const { lang, dir } = useLanguage();
  const [results, setResults] = useState<HistoryResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    apiFetch('/api/results?patientId=' + patientId).then(r => r.json()).then(setResults).catch(() => {}).finally(() => setLoading(false));
  }, [patientId]);

  const drawMiniRadar = useCallback((canvas: HTMLCanvasElement, scoresStr: string) => {
    const scores = JSON.parse(scoresStr || '{}');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2, R = Math.min(W,H)*0.38;
    const axes = Object.keys(AXIS_LABELS);
    const vals = axes.map(a => scores[a] || 50);
    ctx.clearRect(0, 0, W, H);
    for (let ring = 3; ring >= 1; ring--) {
      ctx.beginPath();
      for (let i = 0; i <= axes.length; i++) {
        const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        const x = cx + Math.cos(angle) * (R * ring / 3);
        const y = cy + Math.sin(angle) * (R * ring / 3);
        if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
      }
      ctx.closePath(); ctx.strokeStyle = ring === 3 ? '#E5E7EB' : '#F3F4F6'; ctx.lineWidth = 0.5; ctx.stroke();
    }
    ctx.beginPath();
    axes.forEach((_, i) => {
      const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
      const v = vals[i] / 100;
      ctx.lineTo(cx + Math.cos(angle) * R * v, cy + Math.sin(angle) * R * v);
    });
    ctx.closePath(); ctx.fillStyle = 'rgba(16,185,129,0.15)'; ctx.fill(); ctx.strokeStyle = '#10B981'; ctx.lineWidth = 1.5; ctx.stroke();
  }, []);

  if (loading) return <div className='flex items-center justify-center py-20'><div className='w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin' /></div>;

  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className='view-transition space-y-6 max-w-5xl mx-auto' dir={dir}>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-bold text-gray-900 flex items-center gap-2'>
            <Activity className='w-5 h-5 text-teal-600' />
            {lang === 'ar' ? '\u0627\u0644\u062a\u062a\u0628\u0639 \u0627\u0644\u0632\u0645\u0646\u064a' : 'Progress Tracking'}
          </h1>
          <p className='text-xs text-gray-500 mt-0.5'>
            {patientName} - {lang === 'ar' ? '\u062a\u0637\u0648\u0631 \u0627\u0644\u062d\u0627\u0644\u0629 \u0639\u0628\u0631 \u0627\u0644\u062c\u0644\u0633\u0627\u062a' : 'Progress across sessions'}
          </p>
        </div>
        <Button variant='outline' size='sm' onClick={() => navigate('patients')} className='gap-1'>
          <BackArrow className='w-3 h-3' />
          {lang === 'ar' ? '\u0627\u0644\u0645\u0631\u0636\u0649' : 'Patients'}
        </Button>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className='p-8 text-center'>
            <BarChart3 className='w-10 h-10 text-gray-300 mx-auto mb-2' />
            <p className='text-gray-500'>{lang === 'ar' ? '\u0644\u0627 \u062a\u0648\u062c\u062f \u062c\u0644\u0633\u0627\u062a \u0633\u0627\u0628\u0642\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u0645\u0631\u064a\u0636' : 'No previous sessions for this patient'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-4'>
          {results.map((r, idx) => {
            const risk = RISK_LABELS[r.riskLevel] || RISK_LABELS.low;
            const prev = idx < results.length - 1 ? results[idx + 1] : null;
            const improved = prev ? r.riskScore < prev.riskScore : null;
            const worsened = prev ? r.riskScore > prev.riskScore : null;
            return (
              <Card key={r.id}>
                <CardContent className='p-4 flex gap-4 items-center flex-wrap'>
                  <canvas ref={c => { if (c) drawMiniRadar(c, r.radarScores); }} width={80} height={80} className='flex-shrink-0' />
                  <div className='flex-1 min-w-[200px]'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className={'text-xs px-2 py-0.5 rounded-full border ' + risk.bg + ' ' + risk.color}>{risk[lang]}</span>
                      <span className='text-xs text-gray-400'>{new Date(r.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                      {improved && <span className='text-xs text-emerald-600'>{lang === 'ar' ? '\u2193 \u062a\u062d\u0633\u0646' : '\u2193 Improved'}</span>}
                      {worsened && <span className='text-xs text-red-600'>{lang === 'ar' ? '\u2191 \u062a\u062f\u0647\u0648\u0631' : '\u2191 Worsened'}</span>}
                    </div>
                    <p className='text-sm font-medium'>
                      {lang === 'ar' ? '\u062f\u0631\u062c\u0629 \u0627\u0644\u062e\u0637\u0631' : 'Risk Score'}: <span className='tabular-nums'>{r.riskScore}</span>/100
                    </p>
                    <p className='text-xs text-gray-500'>
                      ADOS: {r.adosScore?.toFixed(1)} \u00b7 {lang === 'ar' ? '\u062b\u0642\u0629' : 'Confidence'}: {Math.round((r.adosConfidence || 0) * 100)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
