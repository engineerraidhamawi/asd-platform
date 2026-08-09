'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RotateCcw, FileText, Stethoscope, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { RadarChart } from '@/components/asd/RadarChart';

interface RadarScores {
  social: number;
  nonverbal: number;
  repetitive: number;
  sensory: number;
  motor: number;
  executive: number;
}

interface XAIItem {
  feature_ar: string;
  feature_en: string;
  severity_ar: string;
  severity_en: string;
  impact: string;
  score: number;
}

interface ResultData {
  id: string;
  sessionId: string;
  riskLevel: string;
  riskScore: number;
  adosScore: number;
  adosConfidence: number;
  subtype: string | null;
  radarScores: RadarScores;
  xaiReport: XAIItem[];
  riskPercent?: number;
}

interface AssessmentRaw {
  type: string;
  rawData: string;
  score: number;
  maxScore: number;
  completed: boolean;
}

const RISK_STYLES: Record<string, { color: string; bg: string; gradient: string }> = {
  low:      { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', gradient: 'from-emerald-400 to-teal-400' },
  moderate: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', gradient: 'from-amber-400 to-orange-400' },
  high:     { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', gradient: 'from-orange-400 to-red-400' },
  critical: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', gradient: 'from-red-400 to-rose-500' },
};

const SUBTYPE_STYLES: Record<string, { color: string; bg: string }> = {
  withdrawn: { color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
  'active-odd': { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  shy: { color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
  motor: { color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

const MCHAT_LABELS_EN = ['No', 'Sometimes', 'Yes'];
const MCHAT_LABELS_AR = ['لا', 'أحياناً', 'نعم'];
const SRS_LABELS_EN = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];
const SRS_LABELS_AR = ['أبداً', 'نادراً', 'أحياناً', 'غالباً', 'دائماً'];
const RBSR_LABELS_EN = ['Never', 'Rarely', 'Sometimes', 'Often'];
const RBSR_LABELS_AR = ['أبداً', 'نادراً', 'أحياناً', 'غالباً'];

export function ResultsView() {
  const { sessionId, navigate, user } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [result, setResult] = useState<ResultData | null>(null);
  const [assessments, setAssessments] = useState<AssessmentRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    Promise.all([
      fetch('/api/results?sessionId=' + sessionId).then(r => r.json()),
      fetch('/api/assessments?sessionId=' + sessionId).then(r => r.json()),
    ]).then(([resultData, assessData]) => {
      let parsed = resultData;
      if (typeof resultData.radarScores === 'string') {
        parsed = { ...parsed, radarScores: JSON.parse(resultData.radarScores) };
      }
      if (typeof resultData.xaiReport === 'string') {
        parsed = { ...parsed, xaiReport: JSON.parse(resultData.xaiReport) };
      }
      setResult(parsed);
      setAssessments(assessData || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='w-8 h-8 border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin' />
      </div>
    );
  }

  if (!result) {
    return (
      <div className='text-center py-20'>
        <p className='text-slate-500'>{t('noResults')}</p>
      </div>
    );
  }

  const risk = RISK_STYLES[result.riskLevel] || RISK_STYLES.low;
  const riskPercent = result.riskPercent || result.riskScore;
  const subtype = SUBTYPE_STYLES[result.subtype || ''] || SUBTYPE_STYLES.withdrawn;
  const backView = user?.role === 'patient' ? 'my-assessments' : 'patients';

  const radarLabels = [
    t('socialComm'),
    t('nonVerbal'),
    t('repetitive'),
    t('sensory'),
    t('motor'),
    t('executive'),
  ];

  const radarScores = [
    result.radarScores?.social || 0,
    result.radarScores?.nonverbal || 0,
    result.radarScores?.repetitive || 0,
    result.radarScores?.sensory || 0,
    result.radarScores?.motor || 0,
    result.radarScores?.executive || 0,
  ];

  const impactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      default: return 'bg-emerald-100 text-emerald-700';
    }
  };

  const impactBarColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-gradient-to-r from-red-400 to-rose-400';
      case 'medium': return 'bg-gradient-to-r from-amber-400 to-orange-400';
      default: return 'bg-gradient-to-r from-emerald-400 to-teal-400';
    }
  };

  // Parse questionnaire raw data for breakdown
  const questAssessment = assessments.find(a => a.type === 'questionnaire');
  let questData: Record<string, number> = {};
  if (questAssessment?.rawData) {
    try { questData = JSON.parse(typeof questAssessment.rawData === 'string' ? questAssessment.rawData : JSON.stringify(questAssessment.rawData)); } catch {}
  }

  const getMchatRows = () => {
    const rows = [];
    for (let i = 0; i < 20; i++) {
      const val = questData['mchat_' + i];
      const label = val !== undefined ? (lang === 'ar' ? MCHAT_LABELS_AR[val] : MCHAT_LABELS_EN[val]) : '-';
      const isConcern = val === 2;
      rows.push({ num: i + 1, answer: label, isConcern });
    }
    return rows;
  };

  const getSrsRows = () => {
    const rows = [];
    for (let i = 0; i < 10; i++) {
      const val = questData['srs_' + i];
      const idx = val !== undefined ? val - 1 : -1;
      const label = idx >= 0 ? (lang === 'ar' ? SRS_LABELS_AR[idx] : SRS_LABELS_EN[idx]) : '-';
      const isConcern = val !== undefined && val >= 4;
      rows.push({ num: i + 1, answer: label, isConcern });
    }
    return rows;
  };

  const getRbsrRows = () => {
    const rows = [];
    for (let i = 0; i < 10; i++) {
      const val = questData['rbsr_' + i];
      const label = val !== undefined ? (lang === 'ar' ? RBSR_LABELS_AR[val] : RBSR_LABELS_EN[val]) : '-';
      const isConcern = val !== undefined && val >= 2;
      rows.push({ num: i + 1, answer: label, isConcern });
    }
    return rows;
  };

  const breakdownTable = (rows: { num: number; answer: string; isConcern: boolean }[]) => (
    <div className='overflow-x-auto'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b border-slate-200'>
            <th className='text-left py-2 px-3 text-xs text-slate-500 font-medium w-12'>#</th>
            <th className='text-left py-2 px-3 text-xs text-slate-500 font-medium'>{t('answerLabel' as any)}</th>
            <th className='text-left py-2 px-3 text-xs text-slate-500 font-medium w-24'>{t('scoreLabel' as any)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.num} className={'border-b border-slate-50 ' + (r.isConcern ? 'bg-red-50/50' : '')}>
              <td className='py-2 px-3 text-slate-500'>{r.num}</td>
              <td className='py-2 px-3 font-medium text-slate-700'>{r.answer}</td>
              <td className='py-2 px-3'>
                {r.isConcern ? (
                  <span className='text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium'>{t('concernFlag' as any)}</span>
                ) : (
                  <span className='text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium'>{t('normalFlag' as any)}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className='space-y-6 max-w-5xl mx-auto' dir={dir}>
      {/* Risk Header */}
      <Card className={'rounded-2xl border shadow-lg ' + risk.bg}>
        <CardContent className='p-6 flex items-center justify-between flex-wrap gap-4'>
          <div className='flex items-center gap-4'>
            <div className={'w-14 h-14 rounded-2xl bg-gradient-to-br ' + risk.gradient + ' flex items-center justify-center shadow-lg'}>
              <AlertTriangle className='w-7 h-7 text-white' />
            </div>
            <div>
              <h1 className={'text-xl font-bold ' + risk.color}>
                {t('riskLevel')}: {t('risk' + result.riskLevel.charAt(0).toUpperCase() + result.riskLevel.slice(1) as any)}
              </h1>
              <p className='text-sm text-slate-500 mt-0.5'>{t('risk' + result.riskLevel.charAt(0).toUpperCase() + result.riskLevel.slice(1) + 'Desc' as any)}</p>
            </div>
          </div>
          <div className='text-left space-y-1'>
            <p className='text-4xl font-bold tabular-nums tracking-tight'>
              {riskPercent}
              <span className='text-lg text-slate-400'>/100</span>
            </p>
            <p className='text-xs text-slate-400 font-medium'>{t('overallRiskScore')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
        <Card className='glass-card rounded-2xl border-0 shadow-md shadow-slate-200/30'>
          <CardContent className='p-4 text-center'>
            <p className='text-3xl font-bold tabular-nums text-sky-600 tracking-tight'>
              {typeof result.adosScore === 'number' ? result.adosScore.toFixed(1) : '—'}
            </p>
            <p className='text-xs text-slate-500 mt-1 font-medium'>{t('adosPrediction')}</p>
          </CardContent>
        </Card>
        <Card className='glass-card rounded-2xl border-0 shadow-md shadow-slate-200/30'>
          <CardContent className='p-4 text-center'>
            <p className='text-3xl font-bold tabular-nums text-sky-600 tracking-tight'>
              {typeof result.adosConfidence === 'number' ? Math.round(result.adosConfidence * 100) + '%' : '—'}
            </p>
            <p className='text-xs text-slate-500 mt-1 font-medium'>{t('confidence')}</p>
          </CardContent>
        </Card>
        <Card className='glass-card rounded-2xl border-0 shadow-md shadow-slate-200/30'>
          <CardContent className='p-4 text-center'>
            <Badge variant='outline' className={subtype.bg + ' ' + subtype.color + ' text-sm font-bold rounded-xl'}>
              {result.subtype ? t((result.subtype === 'active-odd' ? 'activeOdd' : result.subtype === 'motor' ? 'motorSub' : result.subtype) as any) : '—'}
            </Badge>
            <p className='text-xs text-slate-500 mt-1.5 font-medium'>{t('behavioralSubtype')}</p>
          </CardContent>
        </Card>
        <Card className='glass-card rounded-2xl border-0 shadow-md shadow-slate-200/30'>
          <CardContent className='p-4 text-center'>
            <p className='text-3xl font-bold tabular-nums text-sky-600 tracking-tight'>6</p>
            <p className='text-xs text-slate-500 mt-1 font-medium'>{t('assessmentAxes')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart */}
      <Card className='glass-card rounded-2xl border-0 shadow-lg shadow-slate-200/40'>
        <CardContent className='p-6'>
          <h2 className='text-base font-bold text-slate-800 mb-4'>{t('radarOverview')}</h2>
          <RadarChart scores={radarScores} labels={radarLabels} lang={lang} />
        </CardContent>
      </Card>

      {/* Question Breakdown */}
      {questAssessment && (
        <Card className='glass-card rounded-2xl border-0 shadow-lg shadow-slate-200/40'>
          <CardContent className='p-6'>
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className='w-full flex items-center justify-between'
            >
              <div>
                <h2 className='text-base font-bold text-slate-800'>{t('questionBreakdown' as any)}</h2>
                <p className='text-xs text-slate-500 mt-1'>{t('questionBreakdownDesc' as any)}</p>
              </div>
              {showBreakdown ? <ChevronUp className='w-5 h-5 text-slate-400' /> : <ChevronDown className='w-5 h-5 text-slate-400' />}
            </button>

            {showBreakdown && (
              <div className='mt-4 space-y-5'>
                <div>
                  <h3 className='text-sm font-semibold text-slate-700 mb-2'>{t('mchatBreakdown' as any)}</h3>
                  {breakdownTable(getMchatRows())}
                </div>
                <div>
                  <h3 className='text-sm font-semibold text-slate-700 mb-2'>{t('srsBreakdown' as any)}</h3>
                  {breakdownTable(getSrsRows())}
                </div>
                <div>
                  <h3 className='text-sm font-semibold text-slate-700 mb-2'>{t('rbsrBreakdown' as any)}</h3>
                  {breakdownTable(getRbsrRows())}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subtype Detail */}
      {result.subtype && (
        <Card className='glass-card rounded-2xl border-0 shadow-lg shadow-slate-200/40'>
          <CardContent className='p-6'>
            <h2 className='text-base font-bold text-slate-800 mb-3'>{t('subtypingTitle')}</h2>
            <div className={subtype.bg + ' rounded-2xl p-4 border'}>
              <div className='flex items-center gap-2'>
                <Badge className={subtype.color + ' ' + subtype.bg + ' rounded-xl'}>
                  {t((result.subtype === 'active-odd' ? 'activeOdd' : result.subtype === 'motor' ? 'motorSub' : result.subtype) as any)}
                </Badge>
              </div>
              <p className='text-sm text-slate-600 mt-2'>
                {t((result.subtype === 'active-odd' ? 'activeOdd' : result.subtype === 'motor' ? 'motorSub' : result.subtype) + 'Desc' as any)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* XAI Report */}
      <Card className='glass-card rounded-2xl border-0 shadow-lg shadow-slate-200/40'>
        <CardContent className='p-6 space-y-4'>
          <div>
            <h2 className='text-base font-bold text-slate-800'>{t('xaiFeatures')}</h2>
            <p className='text-xs text-slate-500 mt-1'>{t('xaiDesc')}</p>
          </div>
          <div className='space-y-2.5'>
            {(result.xaiReport || []).map((item, i) => {
              const isHigh = item.impact === 'high';
              const impactKey = item.impact === 'high' ? 'high' : item.impact === 'medium' ? 'medium' : 'low';
              return (
                <div key={i} className='flex gap-3 p-3.5 rounded-xl border border-slate-100 bg-white/60 hover:border-slate-200 transition-colors'>
                  <div className={'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ' + (isHigh ? 'bg-red-50 text-red-600' : 'bg-sky-50 text-sky-600')}>
                    {Math.round(item.score)}%
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between gap-2'>
                      <p className='text-sm font-semibold text-slate-800'>
                        {lang === 'ar' ? item.feature_ar : item.feature_en}
                      </p>
                      <span className={'text-[10px] px-2 py-0.5 rounded-full font-medium ' + impactColor(item.impact)}>
                        {t('impact')}: {t(impactKey as any)}
                      </span>
                    </div>
                    <p className='text-xs text-slate-500 mt-0.5'>
                      {lang === 'ar' ? item.severity_ar : item.severity_en}
                    </p>
                    <div className='mt-2 h-2 bg-slate-100 rounded-full overflow-hidden'>
                      <div
                        className={'h-full rounded-full ' + impactBarColor(item.impact) + ' transition-all duration-500'}
                        style={{ width: item.score + '%' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Doctor Sign-off */}
      <Card className='border-sky-200/60 bg-sky-50/30 rounded-2xl shadow-lg shadow-sky-100/50'>
        <CardContent className='p-6 flex items-center justify-between flex-wrap gap-4'>
          <div className='flex items-center gap-3'>
            <div className='w-11 h-11 rounded-xl bg-sky-100 flex items-center justify-center'>
              <Stethoscope className='w-5 h-5 text-sky-600' />
            </div>
            <div>
              <p className='text-sm font-semibold text-slate-800'>{t('clinicianReview')}</p>
              <p className='text-xs text-slate-500'>{t('disclaimer')}</p>
            </div>
          </div>
          <Button className='bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-md shadow-sky-500/20 rounded-xl gap-2'>
            <CheckCircle2 className='w-4 h-4' />
            {t('clinicianReview')}
          </Button>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className='flex gap-3 justify-center pt-2'>
        <Button onClick={() => navigate(backView)} className='gap-2 h-10 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-md shadow-sky-500/20 rounded-xl'>
          <FileText className='w-4 h-4' />
          {t('viewHistory')}
        </Button>
        <Button variant='outline' onClick={() => navigate('new-assessment')} className='gap-2 h-10 rounded-xl border-slate-200'>
          <RotateCcw className='w-4 h-4' />
          {t('newAssessmentBtn')}
        </Button>
      </div>
    </div>
  );
}