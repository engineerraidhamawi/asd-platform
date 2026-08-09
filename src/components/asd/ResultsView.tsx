import { useAppStore } from '@/store/useAppStore';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle, ChevronDown, ChevronUp, Download, Activity, History, Plus, Brain
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { RadarChart } from '@/components/asd/RadarChart';
import { db } from '@/lib/db';

interface RadarScores {
  social?: number;
  nonverbal?: number;
  repetitive?: number;
  sensory?: number;
  motor?: number;
  executive?: number;
}

interface XAIItem {
  feature_ar: string;
  feature_en: string;
  severity_ar: string;
  severity_en: string;
  score: number;
  impact: string;
}

interface QuestionAnswer {
  questionAr: string;
  questionEn: string;
  answer: number;
  answerLabel: string;
  part: string;
}

interface ResultData {
  id: string;
  sessionId: string;
  riskLevel: string;
  riskScore: number;
  riskPercent?: number;
  adosScore: number;
  adosConfidence: number;
  subtype: string | null;
  radarScores: RadarScores | string;
  xaiReport: XAIItem[] | string;
  createdAt: string;
}

const RISK_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  low:      { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'emerald' },
  moderate: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   icon: 'amber' },
  high:     { bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  icon: 'orange' },
  critical: { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     icon: 'red' },
};

const SUBTYPE_STYLES: Record<string, { label_ar: string; label_en: string; desc_ar: string; desc_en: string }> = {
  withdrawn: { label_ar: 'المنعزل', label_en: 'Withdrawn', desc_ar: 'انخفاض التفاعل الاجتماعي مع سلوكيات نمطية عالية', desc_en: 'Reduced social interaction with high stereotyped behaviors' },
  'active-odd': { label_ar: 'النشط-الغريب', label_en: 'Active-odd', desc_ar: 'تفاعل اجتماعي لكن بأسلوب غير تقليدي', desc_en: 'Social interaction but in an unconventional manner' },
  shy: { label_ar: 'الخجول', label_en: 'Shy', desc_ar: 'رغبة في التواصل مع قلق اجتماعي شديد', desc_en: 'Desire to interact with severe social anxiety' },
  motor: { label_ar: 'الحركي', label_en: 'Motor', desc_ar: 'صعوبات حركية بارزة مع مشاكل حسية', desc_en: 'Prominent motor difficulties with sensory issues' },
};

const ANSWER_LABELS: Record<string, Record<number, { ar: string; en: string }>> = {
  mchat: { 0: { ar: 'لا', en: 'No' }, 1: { ar: 'نعم', en: 'Yes' } },
  srs2: { 1: { ar: 'أبداً', en: 'Never' }, 2: { ar: 'نادراً', en: 'Rarely' }, 3: { ar: 'أحياناً', en: 'Sometimes' }, 4: { ar: 'غالباً', en: 'Often' } },
  rbsr: { 0: { ar: 'أبداً', en: 'Never' }, 1: { ar: 'نادراً', en: 'Rarely' }, 2: { ar: 'أحياناً', en: 'Sometimes' }, 3: { ar: 'غالباً', en: 'Often' } },
};

export function ResultsView() {
  const { sessionId, patientName, navigate } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [result, setResult] = useState<ResultData | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    fetch(/api/results?sessionId={sessionId})
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        let r = Array.isArray(data) ? data[0] : data;
        if (typeof r.radarScores === 'string') r = { ...r, radarScores: JSON.parse(r.radarScores) };
        if (typeof r.xaiReport === 'string') r = { ...r, xaiReport: JSON.parse(r.xaiReport) };
        setResult(r);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch question answers for scoring breakdown
    fetch(/api/assessments?sessionId={sessionId})
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(async (assessments) => {
        const qaAssessment = assessments.find((a: any) => a.type === 'questionnaire');
        if (qaAssessment && qaAssessment.rawData) {
          const rawData = typeof qaAssessment.rawData === 'string' ? JSON.parse(qaAssessment.rawData) : qaAssessment.rawData;
          // Fetch all questions from DB
          const qRes = await fetch('/api/questions');
          const allQuestions = await qRes.json();
          const answers: QuestionAnswer[] = [];
          for (const [key, val] of Object.entries(rawData)) {
            const [part, idx] = key.split('_');
            const qIndex = parseInt(idx);
            const q = allQuestions.find((qq: any) => qq.part === part && qq.index === qIndex);
            if (q) {
              const labels = ANSWER_LABELS[part] || {};
              const answerLabel = labels[val as number] || { ar: String(val), en: String(val) };
              answers.push({ questionAr: q.ar, questionEn: q.en, answer: val as number, answerLabel: answerLabel[lang] || String(val), part });
            }
          }
          setQuestionAnswers(answers);
        }
      })
      .catch(() => {});
  }, [sessionId, lang]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin" /></div>;
  }

  if (!result) {
    return <div className="text-center py-20 text-gray-500">{t('noResults')}</div>;
  }

  const risk = RISK_STYLES[result.riskLevel] || RISK_STYLES.low;
  const radarLabels = [t('socialComm'), t('nonVerbal'), t('repetitive'), t('sensory'), t('motor'), t('executive')];
  const radarScores = result.radarScores as RadarScores;
  const scores = [
    radarScores?.social || 0, radarScores?.nonverbal || 0,
    radarScores?.repetitive || 0, radarScores?.sensory || 0,
    radarScores?.motor || 0, radarScores?.executive || 0,
  ];

  const sub = result.subtype ? SUBTYPE_STYLES[result.subtype] : null;
  const xaiItems: XAIItem[] = Array.isArray(result.xaiReport) ? result.xaiReport : [];
  const impactColor = (imp: string) => imp === 'high' ? 'bg-red-500' : imp === 'medium' ? 'bg-amber-500' : 'bg-emerald-500';

  // Group question answers by part
  const groupedAnswers = {
    mchat: questionAnswers.filter(qa => qa.part === 'mchat'),
    srs2: questionAnswers.filter(qa => qa.part === 'srs2'),
    rbsr: questionAnswers.filter(qa => qa.part === 'rbsr'),
  };
  const partTitles: Record<string, { ar: string; en: string }> = {
    mchat: { ar: 'استبيان M-CHAT-R/F', en: 'M-CHAT-R/F Questionnaire' },
    srs2: { ar: 'مقياس SRS-2', en: 'SRS-2 Scale' },
    rbsr: { ar: 'مقياس RBS-R', en: 'RBS-R Scale' },
  };

  return (
    <div className='view-transition space-y-6' dir={dir}>
      {/* Print-only header */}
      <div className="hidden print:block mb-6 border-b-2 border-gray-900 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">ASD Digital Phenotyping Report</h1>
            <p className="text-sm text-gray-600 mt-1">Clinical Decision Support System</p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>Patient: {patientName}</p>
            <p>Date: {new Date().toLocaleDateString()}</p>
            <p>Session ID: {sessionId}</p>
          </div>
        </div>
      </div>

      {/* Risk Level Card */}
      <Card className={order-2  }>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
            <AlertTriangle className={w-8 h-8 } />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500">{t('riskLevel')}</p>
            <p className={	ext-3xl font-bold }>
              {t(isk{result.riskLevel.charAt(0).toUpperCase() + result.riskLevel.slice(1)} as any)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {t('overallRiskScore')}: <span className="font-bold text-gray-900">{result.riskPercent || result.riskScore}</span>/100
            </p>
          </div>
          <div className="text-4xl font-black text-gray-200">{result.riskPercent || result.riskScore}%</div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-gray-500">{t('adosPrediction')}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{result.adosScore?.toFixed(1)}</p>
          <p className="text-xs text-gray-400">ADOS-2</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-gray-500">{t('confidence')}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{Math.round((result.adosConfidence || 0) * 100)}%</p>
          <p className="text-xs text-gray-400">Ensemble</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-gray-500">{t('behavioralSubtype')}</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{sub ? sub[label_{lang}] : '—'}</p>
          <p className="text-xs text-gray-400">{t('subtypingTitle')}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-gray-500">{t('assessmentAxes')}</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">6</p>
          <p className="text-xs text-gray-400">{t('radarOverview')}</p>
        </CardContent></Card>
      </div>

      {/* Radar Chart */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">{t('radarOverview')}</h2>
          <RadarChart scores={scores} labels={radarLabels} lang={lang} />
        </CardContent>
      </Card>

      {/* Subtype Detail */}
      {sub && (
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-2">{t('behavioralSubtype')}</h2>
            <p className="font-medium text-gray-900">{sub[label_{lang}]}</p>
            <p className="text-sm text-gray-500 mt-1">{sub[desc_{lang}]}</p>
          </CardContent>
        </Card>
      )}

      {/* Per-Question Scoring Breakdown */}
      {questionAnswers.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full flex items-center justify-between text-sm font-bold text-gray-900"
            >
              <span>{lang === 'ar' ? 'تفصيل الإجابات' : 'Answer Breakdown'}</span>
              {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showBreakdown && (
              <div className="mt-4 space-y-6">
                {Object.entries(groupedAnswers).map(([part, qas]) => {
                  if (qas.length === 0) return null;
                  const pt = partTitles[part] || { ar: part, en: part };
                  return (
                    <div key={part}>
                      <h3 className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">{pt[lang]}</h3>
                      <div className="space-y-1">
                        {qas.map((qa, i) => (
                          <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 text-sm">
                            <span className="text-gray-400 w-6 text-right flex-shrink-0">{i + 1}.</span>
                            <p className="flex-1 text-gray-700">{lang === 'ar' ? qa.questionAr : qa.questionEn}</p>
                            <Badge variant="outline" className="text-xs flex-shrink-0">{qa.answerLabel}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* XAI Features */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="text-sm font-bold text-gray-900">{t('xaiFeatures')}</h2>
          <p className="text-xs text-gray-500">{t('xaiDesc')}</p>
          <div className="space-y-2">
            {xaiItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-600">
                  {Math.round(item.score)}%
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{lang === 'ar' ? item.feature_ar : item.feature_en}</p>
                    <span className={	ext-[10px] px-1.5 py-0.5 rounded-full }>{t(item.impact as any)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{lang === 'ar' ? item.severity_ar : item.severity_en}</p>
                  <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={h-full rounded-full } style={{ width: ${item.score}% }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clinician Review */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-bold text-gray-900">{t('clinicianReview')}</h2>
          </div>
          <p className="text-xs text-amber-800">{t('disclaimer')}</p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 print:hidden">
        <Button variant="outline" onClick={() => navigate('history')} className="gap-2">
          <History className="w-4 h-4" /> {t('viewHistory')}
        </Button>
        <Button variant="outline" onClick={() => window.print()} className="gap-2">
          <Download className="w-4 h-4" /> {t('downloadReport')}
        </Button>
        <Button onClick={() => navigate('dashboard')} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4" /> {t('newAssessmentBtn')}
        </Button>
      </div>
    </div>
  );
}