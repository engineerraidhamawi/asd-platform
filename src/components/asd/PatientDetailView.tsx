'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, ArrowLeft, User, Calendar, Activity, AlertTriangle, Brain, Download
} from 'lucide-react';
import { RadarChart } from '@/components/asd/RadarChart';

interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: string;
  notes?: string;
  createdAt: string;
  createdBy?: { name: string } | null;
  sessions: SessionData[];
}

interface SessionData {
  id: string;
  status: string;
  consentedAt?: string;
  completedAt?: string;
  createdAt: string;
  result: ResultData | null;
  assessments: { type: string; score: number | null; maxScore: number | null; completed: boolean }[];
}

interface ResultData {
  id: string;
  riskLevel: string;
  riskScore: number;
  adosScore: number;
  adosConfidence: number;
  subtype: string | null;
  radarScores: any;
  xaiReport: any[];
  createdAt: string;
}

const RISK_STYLE: Record<string, { bg: string; color: string; ar: string; en: string }> = {
  low:      { bg: 'bg-emerald-50 border-emerald-200', color: 'text-emerald-700', ar: 'منخفض', en: 'Low' },
  moderate: { bg: 'bg-amber-50 border-amber-200',   color: 'text-amber-700',   ar: 'متوسط', en: 'Moderate' },
  high:     { bg: 'bg-orange-50 border-orange-200',  color: 'text-orange-700',  ar: 'مرتفع', en: 'High' },
  critical: { bg: 'bg-red-50 border-red-200',        color: 'text-red-700',     ar: 'حاد',    en: 'Critical' },
};

export function PatientDetailView() {
  const { selectedPatientId, navigate, startSession, user } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [selectedResult, setSelectedResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedPatientId) return;
    fetch('/api/patients/' + selectedPatientId)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((p: PatientData) => {
        setPatient(p);
        const completed = p.sessions.filter(s => s.result).sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        if (completed.length > 0) {
          let result = completed[0].result!;
          if (typeof result.radarScores === 'string') result = { ...result, radarScores: JSON.parse(result.radarScores) };
          if (typeof result.xaiReport === 'string') result = { ...result, xaiReport: JSON.parse(result.xaiReport) };
          setSelectedResult(result);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedPatientId]);

  const handleStartAssessment = async () => {
    if (!patient || !selectedPatientId) return;
    const sessRes = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': localStorage.getItem('userId') || '' },
      body: JSON.stringify({ patientId: selectedPatientId, userId: user?.id }),
    });
    const session = await sessRes.json();
    startSession(session.id, patient.id, patient.name, patient.age, patient.gender);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin" /></div>;
  }

  if (!patient) {
    return <div className="text-center py-20 text-gray-500">{lang === 'ar' ? 'لم يتم العثور على المريض' : 'Patient not found'}</div>;
  }

  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const radarLabels = [t('socialComm'), t('nonVerbal'), t('repetitive'), t('sensory'), t('motor'), t('executive')];

  return (
    <div className="space-y-6" dir={dir}>
      {/* Back button */}
      <button
        onClick={() => navigate('patients')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600 transition-colors"
      >
        <BackArrow className="w-4 h-4" />
        {t('backToPatients')}
      </button>

      {/* Patient Header */}
      <Card className="border-gray-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{patient.name.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{patient.name}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span>{t(patient.gender === 'male' ? 'male' : 'female')}</span>
                  <span>·</span>
                  <span>{patient.age} {t('ageYears')}</span>
                  {patient.notes && <><span>·</span><span>{patient.notes}</span></>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedResult && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const sid = patient.sessions.find(s => s.result?.id === selectedResult.id)?.id;
                    if (sid) window.open('/api/export/pdf?sessionId=' + sid, '_blank');
                  }}
                  className="gap-2 border-gray-200"
                >
                  <Download className="w-4 h-4" /> {t('downloadReport')}
                </Button>
              )}
              <Button onClick={handleStartAssessment} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Activity className="w-4 h-4" /> {t('startAssessment')}
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions History + Radar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions List */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">{t('sessionsHistory')}</h2>
            {patient.sessions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">{t('noAssessments')}</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {patient.sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((session, idx) => {
                  const risk = session.result ? RISK_STYLE[session.result.riskLevel] : null;
                  const isSelected = selectedResult?.id === session.result?.id;
                  return (
                    <button
                      key={session.id}
                      onClick={() => {
                        if (session.result) {
                          let r = session.result;
                          if (typeof r.radarScores === 'string') r = { ...r, radarScores: JSON.parse(r.radarScores) };
                          if (typeof r.xaiReport === 'string') r = { ...r, xaiReport: JSON.parse(r.xaiReport) };
                          setSelectedResult(r);
                        }
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isSelected ? 'border-emerald-300 bg-emerald-50/50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{t('sessionNumber')} {patient.sessions.length - idx}</p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(session.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                          </p>
                        </div>
                        {risk && (
                          <Badge variant="outline" className={`${risk.bg} ${risk.color} text-xs`}>
                            {risk[lang]} · {session.result!.riskScore}%
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">{t('radarOverview')}</h2>
            {selectedResult ? (
              <>
                <RadarChart
                  scores={[
                    selectedResult.radarScores?.social || 0,
                    selectedResult.radarScores?.nonverbal || 0,
                    selectedResult.radarScores?.repetitive || 0,
                    selectedResult.radarScores?.sensory || 0,
                    selectedResult.radarScores?.motor || 0,
                    selectedResult.radarScores?.executive || 0,
                  ]}
                  labels={radarLabels}
                  lang={lang}
                />
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{selectedResult.riskScore}%</p>
                    <p className="text-[10px] text-gray-500">{t('riskScore')}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{selectedResult.adosScore?.toFixed(1) || '—'}</p>
                    <p className="text-[10px] text-gray-500">{t('adosEstimated')}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{Math.round((selectedResult.adosConfidence || 0) * 100)}%</p>
                    <p className="text-[10px] text-gray-500">{t('confidence')}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <Brain className="w-12 h-12" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* XAI Details for selected result */}
      {selectedResult && (
        <Card>
          <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">{t('xaiFeatures')}</h2>
          <div className="space-y-2">
            {(selectedResult.xaiReport || []).map((item: any, i: number) => {
              const impactKey = item.impact === 'high' ? 'high' : item.impact === 'medium' ? 'medium' : 'low';
              const barColor = item.impact === 'high' ? 'bg-red-500' : item.impact === 'medium' ? 'bg-amber-500' : 'bg-emerald-500';
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-600">
                    {Math.round(item.score)}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{lang === 'ar' ? item.feature_ar : item.feature_en}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        item.impact === 'high' ? 'bg-red-100 text-red-700' : item.impact === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {t(impactKey as any)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{lang === 'ar' ? item.severity_ar : item.severity_en}</p>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${item.score}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Disclaimer */}
      <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-200">
        <p className="text-xs text-amber-800">{t('disclaimer')}</p>
      </div>
    </div>
  );
}