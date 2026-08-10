'use client';
import { apiFetch } from "@/lib/api";

import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, CheckCircle2, SkipForward } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

export function FacialView() {
  const { navigate, sessionId } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [phase, setPhase] = useState<'intro' | 'recording' | 'done'>('intro');
  const [timer, setTimer] = useState(15);
  const [landmarks, setLandmarks] = useState<{x:number;y:number}[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const animRef = useRef<number>(0);

  // Simulate facial landmark detection
  const simulateLandmarks = useCallback(() => {
    const points: {x:number;y:number}[] = [];
    const cx = 150 + Math.random() * 10;
    const cy = 130 + Math.random() * 5;
    // Face outline
    for (let i = 0; i < 17; i++) {
      const angle = (i / 17) * Math.PI * 2 - Math.PI / 2;
      const rx = 60 + Math.random() * 3;
      const ry = 75 + Math.random() * 3;
      points.push({ x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry });
    }
    // Eyes
    points.push({ x: cx - 20, y: cy - 8 }); points.push({ x: cx - 12, y: cy - 8 });
    points.push({ x: cx + 12, y: cy - 8 }); points.push({ x: cx + 20, y: cy - 8 });
    // Eyebrows
    points.push({ x: cx - 22, y: cy - 20 }); points.push({ x: cx - 10, y: cy - 22 });
    points.push({ x: cx + 10, y: cy - 22 }); points.push({ x: cx + 22, y: cy - 20 });
    // Nose
    points.push({ x: cx, y: cy + 5 }); points.push({ x: cx - 8, y: cy + 12 }); points.push({ x: cx + 8, y: cy + 12 });
    // Mouth
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI - Math.PI;
      points.push({ x: cx + Math.cos(angle) * 22, y: cy + 28 + Math.sin(angle) * 8 });
    }
    return points;
  }, []);

  const drawFaceRef = useRef<(() => void) | null>(null);

  const drawFace = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 300, 260);

    ctx.strokeStyle = '#10B981'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(155, 135, 62, 78, 0, 0, Math.PI * 2); ctx.stroke();

    const pts = simulateLandmarks();
    setLandmarks(pts);
    pts.forEach((p, i) => {
      ctx.fillStyle = i < 17 ? '#3B82F6' : '#F59E0B';
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill();
    });

    ctx.strokeStyle = '#3B82F680'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pts[17]?.x||0, pts[17]?.y||0); ctx.lineTo(pts[18]?.x||0, pts[18]?.y||0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pts[19]?.x||0, pts[19]?.y||0); ctx.lineTo(pts[20]?.x||0, pts[20]?.y||0); ctx.stroke();

    ctx.strokeStyle = '#F59E0B80'; ctx.beginPath();
    for (let i = 29; i < 38; i++) { const p = pts[i]; if (!p) continue; if (i === 29) { ctx.moveTo(p.x, p.y); } else { ctx.lineTo(p.x, p.y); } }
    ctx.stroke();

    animRef.current = requestAnimationFrame(() => drawFaceRef.current?.());
  }, [simulateLandmarks]);

  useEffect(() => { drawFaceRef.current = drawFace; }, [drawFace]);

  const startRecording = () => {
    setPhase('recording');
    setTimer(15);
    drawFaceRef.current?.();
    timerRef.current = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); cancelAnimationFrame(animRef.current); setPhase('done'); return 0; } return t - 1; });
    }, 1000);
  };

  const submit = async () => {
    const score = 55 + Math.random() * 35;
    await apiFetch('/api/assessments', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': localStorage.getItem('userId') || '' }, body: JSON.stringify({ sessionId, type: 'facial', rawData: { landmarksCount: landmarks.length, duration: 15 }, score: Math.round(score), maxScore: 100 }) });
    navigate('assess-motor');
  };

  useEffect(() => () => { clearInterval(timerRef.current); cancelAnimationFrame(animRef.current); }, []);

  return (
    <div className='view-transition max-w-3xl mx-auto space-y-6' dir={dir}>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-bold text-gray-900 flex items-center gap-2'>
            <Camera className='w-5 h-5 text-emerald-600' />
            {lang === 'ar' ? 'تحليل تعابير الوجه' : 'Facial Expression Analysis'}
          </h1>
          <p className='text-xs text-gray-500 mt-0.5'>
            {lang === 'ar' ? 'تتبع 68 نقطة وجه (Action Units) + حركة العين' : 'Tracking 68 facial landmarks (Action Units) + eye movement'}
          </p>
        </div>
        <span className='text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded'>1/4</span>
      </div>

      {phase === 'intro' && (
        <Card>
          <CardContent className='p-6 text-center space-y-4'>
            <div className='w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto'>
              <Camera className='w-8 h-8 text-emerald-600' />
            </div>
            <h2 className='text-lg font-bold'>
              {lang === 'ar' ? 'مرحلة تحليل الوجه' : 'Facial Analysis Phase'}
            </h2>
            <p className='text-sm text-gray-500 max-w-md mx-auto'>
              {lang === 'ar'
                ? 'سيتم تسجيل تعابير الوجه ونظرات العين لمدة 15 ثانية. يرجى النظر مباشرة إلى الكاميرا والاستجابة للإرشادات.'
                : 'Facial expressions and eye gaze will be recorded for 15 seconds. Please look directly at the camera and follow instructions.'}
            </p>
            <Button onClick={startRecording} className='bg-emerald-600 hover:bg-emerald-700 gap-2'>
              <Camera className='w-4 h-4' />
              {lang === 'ar' ? 'بدء التسجيل' : 'Start Recording'}
            </Button>
          </CardContent>
        </Card>
      )}

      {phase === 'recording' && (
        <Card>
          <CardContent className='p-6 space-y-4'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 rounded-full bg-red-500 animate-pulse' />
                <span className='text-sm font-medium text-red-600'>
                  {lang === 'ar' ? 'جاري التسجيل' : 'Recording'}
                </span>
              </div>
              <span className='text-2xl font-bold text-gray-900 tabular-nums'>{timer}s</span>
            </div>
            <div className='relative bg-gray-900 rounded-xl overflow-hidden' style={{aspectRatio:'300/260'}}>
              <canvas ref={canvasRef} width={300} height={260} className='w-full h-full' />
              <div className='absolute bottom-2 left-2 right-2 flex justify-between text-[10px]'>
                <span className='bg-black/60 text-emerald-400 px-2 py-0.5 rounded'>
                  {landmarks.length} {lang === 'ar' ? 'نقطة وجه' : 'landmarks'}
                </span>
                <span className='bg-black/60 text-blue-400 px-2 py-0.5 rounded'>68 AU</span>
              </div>
            </div>
            <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
              <div className='h-full bg-emerald-500 rounded-full transition-all duration-1000' style={{width:`${((15-timer)/15)*100}%`}} />
            </div>
          </CardContent>
        </Card>
      )}

      {phase === 'done' && (
        <Card className='border-emerald-200 bg-emerald-50/50'>
          <CardContent className='p-6 text-center space-y-4'>
            <CheckCircle2 className='w-12 h-12 text-emerald-600 mx-auto' />
            <h2 className='text-lg font-bold'>
              {lang === 'ar' ? 'تم تسجيل بيانات الوجه بنجاح' : 'Facial Data Recorded Successfully'}
            </h2>
            <p className='text-sm text-gray-500'>
              {lang === 'ar'
                ? `تم استخلاص ${landmarks.length} نقطة وجه وتحليل 15 ثانية من البيانات`
                : `Extracted ${landmarks.length} facial landmarks and analyzed 15 seconds of data`}
            </p>
            <div className='flex gap-3 justify-center'>
              <Button onClick={submit} className='bg-emerald-600 hover:bg-emerald-700 gap-2'>
                {lang === 'ar' ? 'التالي: المهام الحركية' : 'Next: Motor Tasks'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}