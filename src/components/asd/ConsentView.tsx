'use client';
import { apiFetch } from "@/lib/api";

import { useAppStore } from '@/store/useAppStore';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Lock, Eye, Trash2, Server, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export function ConsentView() {
  const { navigate, sessionId, patientName } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [agreed, setAgreed] = useState([false, false, false, false, false]);
  const [submitting, setSubmitting] = useState(false);

  const allAgreed = agreed.every(Boolean);

  const handleConsent = async () => {
    if (!allAgreed || !sessionId) return;
    setSubmitting(true);
    await apiFetch('/api/sessions', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-user-id': localStorage.getItem('userId') || '' }, body: JSON.stringify({ sessionId, status: 'assessing' }) });
    navigate('assess-questionnaire');
  };

  const PRINCIPLES = [
    {
      icon: Lock,
      title_ar: 'التشفير الشامل', title_en: 'End-to-End Encryption',
      desc_ar: 'جميع البيانات مشفرة بـ AES-256 أثناء النقل والتخزين.',
      desc_en: 'All data is encrypted with AES-256 during transit and storage.',
    },
    {
      icon: Eye,
      title_ar: 'عدم تخزين الفيديوهات الخام', title_en: 'No Raw Video Storage',
      desc_ar: 'يتم استخلاص الملامح الرقمية فقط ثم حذف الفيديو فوراً.',
      desc_en: 'Only digital features are extracted, then video is immediately deleted.',
    },
    {
      icon: Server,
      title_ar: 'المعالجة المحلية', title_en: 'Local Processing',
      desc_ar: 'كل المعالجة تتم محلياً. لا يتم إرسال بيانات إلى خوادم خارجية.',
      desc_en: 'All processing is local. No data sent to external servers.',
    },
    {
      icon: Shield,
      title_ar: 'الموافقة المسبقة', title_en: 'Prior Informed Consent',
      desc_ar: 'لا يبدأ أي تحليل بدون موافقة ولي الأمر الصريحة.',
      desc_en: 'No analysis begins without explicit parental consent.',
    },
    {
      icon: Trash2,
      title_ar: 'الحق في الحذف الكامل', title_en: 'Right to Complete Deletion',
      desc_ar: 'يمكن لولي الأمر طلب حذف جميع البيانات نهائياً (GDPR).',
      desc_en: 'Parents can request complete data deletion (GDPR compliant).',
    },
  ];

  return (
    <div className='max-w-3xl mx-auto space-y-6' dir={dir}>
      {/* Header */}
      <div className='text-center space-y-2'>
        <div className='w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto'>
          <Shield className='w-6 h-6 text-emerald-600' />
        </div>
        <h1 className='text-2xl font-bold text-gray-900'>
          {lang === 'ar' ? 'الموافقة والأخلاقيات' : 'Consent & Ethics'}
        </h1>
        <p className='text-gray-500 text-sm'>
          {lang === 'ar'
            ? `قبل بدء تقييم ${patientName}، يرجى الاطلاع على سياسة الخصوصية والموافقة`
            : `Before assessing ${patientName}, please review the privacy policy and consent`
          }
        </p>
      </div>

      {/* Principles */}
      <div className='space-y-3'>
        {PRINCIPLES.map((p, i) => (
          <Card key={i} className='hover:shadow-sm transition-shadow'>
            <CardContent className='p-4 flex gap-4 items-start'>
              <div className='w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0'>
                <p.icon className='w-5 h-5 text-emerald-600' />
              </div>
              <div className='flex-1'>
                <h3 className='text-sm font-semibold text-gray-900'>
                  {lang === 'ar' ? p.title_ar : p.title_en}
                </h3>
                <p className='text-xs text-gray-500 mt-1 leading-relaxed'>
                  {lang === 'ar' ? p.desc_ar : p.desc_en}
                </p>
              </div>
              <button
                onClick={() => { const n = [...agreed]; n[i] = !n[i]; setAgreed(n); }}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  agreed[i] ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'
                }`}
              >
                {agreed[i] && <CheckCircle2 className='w-4 h-4 text-white' />}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className='flex gap-3 justify-center pt-4'>
        <Button
          onClick={handleConsent}
          disabled={!allAgreed || submitting}
          className='bg-emerald-600 hover:bg-emerald-700 gap-2 min-w-[160px]'
        >
          {submitting
            ? (lang === 'ar' ? 'جاري الموافقة...' : 'Consenting...')
            : (lang === 'ar' ? 'الموافقة وبدء التقييم' : 'Consent & Start Assessment')
          }
        </Button>
        <Button variant='outline' onClick={() => navigate('dashboard')}>
          {t('cancel')}
        </Button>
      </div>
    </div>
  );
}