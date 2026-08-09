'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Check } from 'lucide-react';
import { useNotifStore } from '@/store/useNotifStore';

const STEP_KEYS = [
  'stepExtractFace',
  'stepAnalyzeVoice',
  'stepAssessMotor',
  'stepCogFlex',
  'stepProcessQ',
  'stepMultimodal',
  'stepAIModel',
  'stepReport',
] as const;

const STEP_THRESHOLDS = [15, 25, 40, 55, 65, 75, 90, 100];

export function AnalyzingView() {
  const { navigate, sessionId, setAnalysisProgress } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const doneRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated progress
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 100;
        }
        const increment = 1.5 + Math.random() * 2;
        const np = Math.min(p + increment, 100);
        setAnalysisProgress(np);
        const stepIdx = STEP_THRESHOLDS.findIndex((threshold) => threshold >= np);
        setCurrentStep(stepIdx >= 0 ? stepIdx : STEP_KEYS.length - 1);
        return np;
      });
    }, 200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [setAnalysisProgress]);

  // When progress reaches 100%, trigger analysis and navigate
  useEffect(() => {
    if (progress >= 100 && !doneRef.current && sessionId) {
      doneRef.current = true;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        navigate('results');
      }, 5000);

      fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId: useAppStore.getState().user?.id }),
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then(() => {
          clearTimeout(timeoutId);
          navigate('results');
        })
        .catch(() => {
          clearTimeout(timeoutId);
          navigate('results');
        });
    }
  }, [progress, doneRef, sessionId, navigate]);

  const stepLabel = t(STEP_KEYS[currentStep] || 'stepReport');

  return (
    <div className='max-w-2xl mx-auto space-y-8 py-12' dir={dir}>
      {/* Hero */}
      <div className='text-center space-y-4'>
        <div className='w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto animate-pulse shadow-lg shadow-emerald-500/30'>
          <Brain className='w-10 h-10 text-white' />
        </div>
        <h1 className='text-2xl font-bold text-gray-900'>{t('aiAnalysis')}</h1>
        <p className='text-gray-500 text-sm'>{t('pleaseWait')}</p>
      </div>

      {/* Progress Bar */}
      <div className='space-y-3'>
        <div className='flex justify-between text-sm'>
          <span className='text-gray-500'>{stepLabel}</span>
          <span className='font-bold tabular-nums text-emerald-600'>{Math.round(progress)}%</span>
        </div>
        <div className='h-3 bg-gray-200 rounded-full overflow-hidden'>
          <div
            className='h-full bg-gradient-to-l from-emerald-400 to-teal-500 rounded-full transition-all duration-300'
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className='space-y-2'>
        {STEP_KEYS.map((key, i) => {
          const isComplete = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <div
              key={key}
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                isComplete
                  ? 'bg-emerald-50'
                  : isCurrent
                  ? 'bg-emerald-100 border border-emerald-300'
                  : 'bg-gray-50 opacity-50'
              }`}
            >
              <span className='text-sm'>
                {isComplete ? (
                  <Check className='w-4 h-4 text-emerald-600' />
                ) : isCurrent ? (
                  <div className='w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin' />
                ) : (
                  <div className='w-4 h-4 rounded-full bg-gray-300' />
                )}
              </span>
              <span
                className={`text-sm flex-1 ${
                  i <= currentStep ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {t(key)}
              </span>
              {isComplete && (
                <span className='text-emerald-600 text-xs font-medium'>✓</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}