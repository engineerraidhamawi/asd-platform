'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ClipboardList, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

// --- Question definitions (bilingual) ---

interface Question {
  ar: string;
  en: string;
}

// Step 0: M-CHAT-R/F — 20 questions, 3 options: No(0), Sometimes(1), Yes(2)
const MCHAT_QUESTIONS: Question[] = [
  { ar: 'هل يبدو طفلك مهتماً بالأطفال الآخرين؟', en: 'Does your child seem interested in other children?' },
  { ar: 'هل يشير طفلك لإظهار الأشياء التي تعجبه؟', en: 'Does your child point to show you things they like?' },
  { ar: 'هل يجلب طفلك الأشياء إليك ليُريكها؟', en: 'Does your child bring things to you to show you?' },
  { ar: 'هل يُقلّد طفلك ما تفعله أنت أو آخرون؟', en: 'Does your child imitate what you or others do?' },
  { ar: 'هل يستجيب طفلك عندما تناديه باسمه؟', en: 'Does your child respond when you call their name?' },
  { ar: 'هل يُشير طفلك بيدك لطلب المساعدة؟', en: 'Does your child take your hand to get help?' },
  { ar: 'هل يلوّح طفلك بالوداع؟', en: 'Does your child wave goodbye?' },
  { ar: 'هل يُظهر طفلك اهتماماً بالألعاب المناسبة لعمره؟', en: 'Does your child show interest in age-appropriate toys?' },
  { ar: 'هل يحرك طفلك الأشياء ذهاباً وإياباً بشكل متكرر؟', en: 'Does your child move objects back and forth repeatedly?' },
  { ar: 'هل يستجيب طفلك للأصوات العالية أو المفاجئة؟', en: 'Does your child respond to loud or sudden sounds?' },
  { ar: 'هل ينظر طفلك مباشرةً إلى عينيك عند الحديث معه؟', en: 'Does your child look directly into your eyes when talking?' },
  { ar: 'هل يبتسم طفلك عندما تبتسم له؟', en: 'Does your child smile back when you smile at them?' },
  { ar: 'هل يبادر طفلك باللعب معك أو اللعب به؟', en: 'Does your child initiate play with you or want you to play?' },
  { ar: 'هل يُظهر طفلك اهتماماً بأشياء غير عادية مقارنة بألعاب الأطفال؟', en: 'Does your child show interest in unusual items vs. typical toys?' },
  { ar: 'هل يستجيب طفلك لاسمه عندما لا يراك؟', en: 'Does your child respond to their name when they cannot see you?' },
  { ar: 'هل يستخدم طفلك أصابعه للإشارة إلى الأشياء؟', en: 'Does your child use fingers to point at things?' },
  { ar: 'هل يحاول طفلك جذب انتباهك لسلوك معين؟', en: 'Does your child try to get your attention to a specific behavior?' },
  { ar: 'هل يتجنب طفلك التواصل البصري المباشر؟', en: 'Does your child avoid direct eye contact?' },
  { ar: 'هل يستطيع طفلك ترتيب مكعبات أو ألعاب بشكل مناسب؟', en: 'Can your child stack blocks or toys appropriately?' },
  { ar: 'هل يُظهر طفلك سلوكيات متكررة أو غير عادية؟', en: 'Does your child display repetitive or unusual behaviors?' },
];

// Step 1: SRS-2 — 10 questions, 5-point: Never(1), Rarely(2), Sometimes(3), Often(4), Always(5)
const SRS_QUESTIONS: Question[] = [
  { ar: 'يُظهر طفلك مهارات اجتماعية مناسبة لعمره', en: 'My child shows age-appropriate social skills' },
  { ar: 'يلتقي طفلك بنظرة الآخرين أثناء الحديث', en: 'My child makes eye contact during conversation' },
  { ar: 'يفهم طفلك نكات الآخرين أو نواياهم الكامنة', en: 'My child understands jokes or hidden intentions of others' },
  { ar: 'يبدو طفلك مرتاحاً في المواقف الاجتماعية الجديدة', en: 'My child seems comfortable in new social situations' },
  { ar: 'يتفاعل طفلك بشكل طبيعي مع أقرانه', en: 'My child interacts naturally with peers' },
  { ar: 'يستطيع طفلك التعبير عن مشاعره بشكل واضح', en: 'My child can express their feelings clearly' },
  { ar: 'يُظهر طفلك مرونة عند تغيير الروتين', en: 'My child shows flexibility when routines change' },
  { ar: 'يُحب طفلك الأنشطة الجماعية أو اللعب مع الآخرين', en: 'My child enjoys group activities or playing with others' },
  { ar: 'يُظهر طفلك تعاطفاً مع مشاعر الآخرين', en: 'My child shows empathy for others\' feelings' },
  { ar: 'يُميّز طفلك التعبيرات الوجهية المختلفة بدقة', en: 'My child can distinguish different facial expressions accurately' },
];

// Step 2: RBS-R — 10 questions, 4-point: Never(0), Rarely(1), Sometimes(2), Often(3)
const RBSR_QUESTIONS: Question[] = [
  { ar: 'يتكرر ترديد طفلك للكلمات أو العبارات', en: 'My child repeats words or phrases repeatedly' },
  { ar: 'يقوم طفلك بحركات يدية متكررة (مثل التلويت أو الطبطبة)', en: 'My child makes repetitive hand movements (flapping, tapping)' },
  { ar: 'يلتفت طفلك أو يهز جسمه بشكل متكرر', en: 'My child rocks or sways body repeatedly' },
  { ar: 'يُصر طفلك على ترتيب الأشياء بطريقة معينة', en: 'My child insists on arranging objects in a specific order' },
  { ar: 'يُظهر طفلك اهتماماً شديداً بأجزاء معينة من الأشياء', en: 'My child shows intense interest in specific parts of objects' },
  { ar: 'يتنفس طفلك أو يشم الأشياء بشكل متكرر', en: 'My child sniffs or smells objects frequently' },
  { ar: 'يُظهر طفلك حساسية عالية للأصوات أو الأضواء', en: 'My child shows high sensitivity to sounds or lights' },
  { ar: 'يمشي طفلك على أطراف أصابعه بشكل متكرر', en: 'My child frequently walks on tiptoes' },
  { ar: 'يُكرر طفلك مشاهدة نفس الفيديو أو الصورة', en: 'My child repeatedly watches the same video or image' },
  { ar: 'يُظهر طفلك انزعاجاً شديداً عند تغيير الروتين اليومي', en: 'My child shows severe distress when changing daily routine' },
];

type StepConfig = {
  key: string;
  titleKey: string;
  questions: Question[];
  scaleValues: number[];
  scaleLabels: { ar: string; en: string }[];
};

const STEPS: StepConfig[] = [
  {
    key: 'mchat',
    titleKey: 'mchatTitle',
    questions: MCHAT_QUESTIONS,
    scaleValues: [0, 1, 2],
    scaleLabels: [
      { ar: 'لا', en: 'No' },
      { ar: 'أحياناً', en: 'Sometimes' },
      { ar: 'نعم', en: 'Yes' },
    ],
  },
  {
    key: 'srs',
    titleKey: 'srsTitle',
    questions: SRS_QUESTIONS,
    scaleValues: [1, 2, 3, 4, 5],
    scaleLabels: [
      { ar: 'أبداً', en: 'Never' },
      { ar: 'نادراً', en: 'Rarely' },
      { ar: 'أحياناً', en: 'Sometimes' },
      { ar: 'غالباً', en: 'Often' },
      { ar: 'دائماً', en: 'Always' },
    ],
  },
  {
    key: 'rbsr',
    titleKey: 'rbsrTitle',
    questions: RBSR_QUESTIONS,
    scaleValues: [0, 1, 2, 3],
    scaleLabels: [
      { ar: 'أبداً', en: 'Never' },
      { ar: 'نادراً', en: 'Rarely' },
      { ar: 'أحياناً', en: 'Sometimes' },
      { ar: 'غالباً', en: 'Often' },
    ],
  },
];

export function QuestionnaireView() {
  const { navigate, sessionId, questionnaireStep, questionnaireData, setQuestionnaireStep, setQuestionnaireData } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const step = STEPS[questionnaireStep];
  const question = step.questions[currentQ];
  const totalQuestions = step.questions.length;

  const answerKey = `${step.key}_${currentQ}`;
  const selectedValue = questionnaireData[answerKey];

  const selectAnswer = (value: number) => {
    setQuestionnaireData({ ...questionnaireData, [answerKey]: value });
  };

  const goNext = () => {
    if (currentQ < totalQuestions - 1) {
      setCurrentQ(currentQ + 1);
    }
  };

  const goPrev = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
    } else if (questionnaireStep > 0) {
      setQuestionnaireStep(questionnaireStep - 1);
    }
  };

  const goNextStep = () => {
    if (questionnaireStep < STEPS.length - 1) {
      setQuestionnaireStep(questionnaireStep + 1);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': localStorage.getItem('userId') || '' },
        body: JSON.stringify({
          sessionId,
          type: 'questionnaire',
          rawData: JSON.stringify(questionnaireData),
          score: Object.values(questionnaireData).reduce((a, b) => a + b, 0),
          maxScore: 200,
        }),
      });
      await res.json();
    } catch {
      // continue even if save fails
    }

    navigate('analyzing');
  };

  // Calculate total progress across all steps
  let totalAnswered = 0;
  let totalAllQuestions = 0;
  for (let s = 0; s < STEPS.length; s++) {
    totalAllQuestions += STEPS[s].questions.length;
    for (let q = 0; q < STEPS[s].questions.length; q++) {
      if (questionnaireData[`${STEPS[s].key}_${q}`] !== undefined) {
        totalAnswered++;
      }
    }
  }
  const overallProgress = Math.round((totalAnswered / totalAllQuestions) * 100);

  // Check if current step is complete
  const isStepComplete = step.questions.every((_, i) => questionnaireData[`${step.key}_${i}`] !== undefined);

  const isLastStep = questionnaireStep === STEPS.length - 1;
  const isLastQuestion = currentQ === totalQuestions - 1;
  const canSubmit = isLastStep && isStepComplete;

  return (
    <div className='space-y-6 max-w-3xl mx-auto' dir={dir}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center'>
            <ClipboardList className='w-5 h-5 text-emerald-600' />
          </div>
          <div>
            <h1 className='text-lg font-bold text-gray-900'>{t(step.titleKey as any)}</h1>
            <p className='text-xs text-gray-500'>
              {t('step')} {questionnaireStep + 1} {t('of')} 3 — {t('question')} {currentQ + 1} {t('of')} {totalQuestions}
            </p>
          </div>
        </div>
        <span className='text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full'>
          {questionnaireStep + 1}/3
        </span>
      </div>

      {/* Overall progress */}
      <div className='space-y-1'>
        <div className='flex justify-between text-xs text-gray-500'>
          <span>{t('questionnaireProgress')}</span>
          <span>{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className='h-2 [&>div]:bg-emerald-500' />
      </div>

      {/* Step indicators */}
      <div className='flex gap-2'>
        {STEPS.map((s, i) => {
          const stepComplete = s.questions.every((_, qi) => questionnaireData[`${s.key}_${qi}`] !== undefined);
          return (
            <div
              key={s.key}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i < questionnaireStep ? 'bg-emerald-500' :
                i === questionnaireStep ? 'bg-emerald-400' :
                stepComplete ? 'bg-emerald-300' : 'bg-gray-200'
              }`}
            />
          );
        })}
      </div>

      {/* Current Question */}
      <Card className='border-gray-200'>
        <CardContent className='p-6 space-y-6'>
          <div className='flex items-start gap-4'>
            <span className='text-lg font-bold text-emerald-600 mt-0.5'>{currentQ + 1}.</span>
            <p className='text-base text-gray-900 leading-relaxed font-medium flex-1'>{question[lang]}</p>
          </div>

          {/* Scale Options */}
          <div className='flex flex-wrap gap-3'>
            {step.scaleValues.map((value, i) => {
              const isSelected = selectedValue === value;
              return (
                <button
                  key={value}
                  onClick={() => selectAnswer(value)}
                  className={`flex-1 min-w-[80px] px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                      : 'border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  {step.scaleLabels[i][lang]}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className='flex justify-between'>
        <Button
          variant='outline'
          onClick={goPrev}
          className='gap-2'
          disabled={questionnaireStep === 0 && currentQ === 0}
        >
          <ChevronLeft className={`w-4 h-4 ${dir === 'ltr' ? 'rotate-180' : ''}`} />
          {t('prev')}
        </Button>

        {isLastQuestion && !isLastStep && (
          <Button
            onClick={goNextStep}
            disabled={!isStepComplete}
            className='bg-emerald-600 hover:bg-emerald-700 gap-2'
          >
            {t('next')}
            <ChevronRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
          </Button>
        )}

        {isLastQuestion && isLastStep && (
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className='bg-emerald-600 hover:bg-emerald-700 gap-2 min-w-[200px]'
          >
            {submitting ? (
              <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
            ) : (
              <CheckCircle2 className='w-4 h-4' />
            )}
            {submitting ? t('analyzing') : t('submit')}
          </Button>
        )}

        {!isLastQuestion && (
          <Button
            onClick={goNext}
            className='bg-emerald-600 hover:bg-emerald-700 gap-2'
          >
            {t('next')}
            <ChevronRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
          </Button>
        )}
      </div>

      {/* Step title cards */}
      <div className='grid grid-cols-3 gap-2'>
        {STEPS.map((s, i) => {
          const isActive = i === questionnaireStep;
          const isComplete = s.questions.every((_, qi) => questionnaireData[`${s.key}_${qi}`] !== undefined);
          return (
            <button
              key={s.key}
              onClick={() => {
                if (isComplete || i < questionnaireStep) {
                  setQuestionnaireStep(i);
                }
              }}
              className={`p-3 rounded-xl border text-center transition-all ${
                isActive
                  ? 'bg-emerald-50 border-emerald-300'
                  : isComplete
                  ? 'bg-gray-50 border-emerald-200 hover:bg-emerald-50'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <p className={`text-xs font-medium ${isActive ? 'text-emerald-700' : 'text-gray-600'}`}>
                {t(s.titleKey as any)}
              </p>
              <p className='text-[10px] text-gray-400 mt-1'>
                {isComplete
                  ? '✓'
                  : `${s.questions.filter((_, qi) => questionnaireData[`${s.key}_${qi}`] !== undefined).length}/${s.questions.length}`
                }
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}