import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAction } from '@/lib/audit';

// POST /api/results — simulate AI analysis and create result
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, userId } = body;

    await db.session.update({ where: { id: sessionId }, data: { status: 'analyzing' } });

    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        patient: true,
        assessments: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const assessments = session.assessments;
    const questionnaire = assessments.find(a => a.type === 'questionnaire');

    // Parse questionnaire data for real scoring
    let questData: Record<string, number> = {};
    if (questionnaire?.rawData) {
      try { questData = JSON.parse(questionnaire.rawData); } catch {}
    }

    // M-CHAT scoring (items 0-19, 0=No=normal, 2=Yes=concern)
    let mchatScore = 0;
    let mchatCount = 0;
    for (let i = 0; i < 20; i++) {
      const val = questData[`mchat_${i}`];
      if (val !== undefined) { mchatScore += val; mchatCount++; }
    }
    const mchatNorm = mchatCount > 0 ? mchatScore / (mchatCount * 2) : 0.3;

    // SRS-2 scoring (items 0-9, 1=Never=good, 5=Always=concern) — reverse scored
    let srsScore = 0;
    let srsCount = 0;
    for (let i = 0; i < 10; i++) {
      const val = questData[`srs_${i}`];
      if (val !== undefined) { srsScore += val; srsCount++; }
    }
    const srsNorm = srsCount > 0 ? (srsScore - srsCount) / (srsCount * 4) : 0.3;

    // RBS-R scoring (items 0-9, 0=Never=good, 3=Often=concern)
    let rbsrScore = 0;
    let rbsrCount = 0;
    for (let i = 0; i < 10; i++) {
      const val = questData[`rbsr_${i}`];
      if (val !== undefined) { rbsrScore += val; rbsrCount++; }
    }
    const rbsrNorm = rbsrCount > 0 ? rbsrScore / (rbsrCount * 3) : 0.3;

    // Ensemble ML model simulation with weighted fusion
    // Weights: M-CHAT 0.35, SRS-2 0.35, RBS-R 0.30
    const ensembleRisk = mchatNorm * 0.35 + srsNorm * 0.35 + rbsrNorm * 0.30;

    // Add age-based calibration (younger = more weight to behavioral)
    const ageFactor = session.patient.age < 4 ? 1.1 : session.patient.age < 7 ? 1.0 : 0.9;
    const calibratedRisk = Math.min(1, ensembleRisk * ageFactor);

    // Add small random noise (simulating model variance)
    const noise = (Math.random() - 0.5) * 0.05;
    const finalRisk = Math.max(0, Math.min(1, calibratedRisk + noise));
    const riskPercent = Math.round(finalRisk * 100);

    // Risk level classification
    let riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    if (riskPercent < 30) riskLevel = 'low';
    else if (riskPercent < 55) riskLevel = 'moderate';
    else if (riskPercent < 75) riskLevel = 'high';
    else riskLevel = 'critical';

    // Generate 6-axis radar scores
    const social = Math.max(0, Math.min(100, Math.round(100 - (mchatNorm * 0.5 + srsNorm * 0.5) * 100 + (Math.random() - 0.5) * 8)));
    const nonverbal = Math.max(0, Math.min(100, Math.round(100 - (mchatNorm * 0.6 + srsNorm * 0.2) * 100 + (Math.random() - 0.5) * 8)));
    const repetitive = Math.max(0, Math.min(100, Math.round(rbsrNorm * 100 + (Math.random() - 0.5) * 10)));
    const sensory = Math.max(0, Math.min(100, Math.round((rbsrNorm * 0.6 + finalRisk * 0.4) * 100 + (Math.random() - 0.5) * 8)));
    const motor = Math.max(0, Math.min(100, Math.round(100 - finalRisk * 50 + (Math.random() - 0.5) * 10)));
    const executive = Math.max(0, Math.min(100, Math.round(100 - (srsNorm * 0.5 + finalRisk * 0.5) * 100 + (Math.random() - 0.5) * 8)));

    const radarScores = { social, nonverbal, repetitive, sensory, motor, executive };

    // Phenotypic subtyping based on radar profile
    let subtype: string;
    if (social < 35 && repetitive > 65) subtype = 'withdrawn';
    else if (social > 45 && repetitive > 50) subtype = 'active-odd';
    else if (social > 35 && social < 60 && sensory > 55) subtype = 'shy';
    else subtype = 'motor';

    // ADOS score estimation (0-10 range based on research)
    const adosScore = Math.round(finalRisk * 10 * 10) / 10;
    const adosConfidence = Math.round((0.82 + Math.random() * 0.12) * 100) / 100;

    // XAI explanations
    const xaiReport = [
      {
        feature_ar: 'التواصل البصري',
        feature_en: 'Eye Contact',
        severity_ar: mchatNorm > 0.4 ? `انخفاض بنسبة ${Math.round(mchatNorm * 100)}%` : 'ضمن المعدل الطبيعي',
        severity_en: mchatNorm > 0.4 ? `Reduced by ${Math.round(mchatNorm * 100)}%` : 'Within normal range',
        impact: mchatNorm > 0.4 ? 'high' : 'low',
        score: Math.round(mchatNorm * 100),
      },
      {
        feature_ar: 'الاستجابة الاجتماعية',
        feature_en: 'Social Responsiveness',
        severity_ar: srsNorm > 0.4 ? `صعوبة بنسبة ${Math.round(srsNorm * 100)}%` : 'مقبولة',
        severity_en: srsNorm > 0.4 ? `Difficulty ${Math.round(srsNorm * 100)}%` : 'Acceptable',
        impact: srsNorm > 0.4 ? 'high' : 'low',
        score: Math.round(srsNorm * 100),
      },
      {
        feature_ar: 'السلوكيات النمطية',
        feature_en: 'Repetitive Behaviors',
        severity_ar: rbsrNorm > 0.3 ? `ملاحظة - ${rbsrNorm > 0.6 ? 'شديدة' : 'متوسطة'}` : 'ضمن الحدود',
        severity_en: rbsrNorm > 0.3 ? `Noted - ${rbsrNorm > 0.6 ? 'severe' : 'moderate'}` : 'Within limits',
        impact: rbsrNorm > 0.3 ? 'high' : 'low',
        score: Math.round(rbsrNorm * 100),
      },
      {
        feature_ar: 'المرونة المعرفية',
        feature_en: 'Cognitive Flexibility',
        severity_ar: srsNorm > 0.5 ? 'صعوبة في التبديل' : 'مقبولة',
        severity_en: srsNorm > 0.5 ? 'Difficulty switching' : 'Acceptable',
        impact: srsNorm > 0.5 ? 'medium' : 'low',
        score: Math.round(srsNorm * 100),
      },
      {
        feature_ar: 'الاستجابة للاسم',
        feature_en: 'Name Response',
        severity_ar: mchatNorm > 0.3 ? `تأخر بنسبة ${Math.round(mchatNorm * 80)}%` : 'طبيعية',
        severity_en: mchatNorm > 0.3 ? `Delayed by ${Math.round(mchatNorm * 80)}%` : 'Normal',
        impact: mchatNorm > 0.3 ? 'high' : 'low',
        score: Math.round(mchatNorm * 100),
      },
    ];

    // Create result
    const result = await db.result.create({
      data: {
        sessionId,
        riskLevel,
        riskScore: riskPercent,
        adosScore,
        adosConfidence,
        subtype,
        radarScores: JSON.stringify(radarScores),
        xaiReport: JSON.stringify(xaiReport),
      },
    });

    await db.session.update({
      where: { id: sessionId },
      data: { status: 'completed', completedAt: new Date() },
    });

    logAction('RESULT_CREATED', result.id,
      `Risk: ${riskLevel} (${riskPercent}%), ADOS: ${adosScore}, Subtype: ${subtype}, Patient: ${session.patient.name}`,
      userId
    );

    return NextResponse.json({
      ...result,
      radarScores,
      xaiReport,
      riskPercent,
    });
  } catch (error) {
    console.error('Result error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const patientId = searchParams.get('patientId');

    if (sessionId) {
      const result = await db.result.findUnique({
        where: { sessionId },
        include: { session: { include: { patient: true } } },
      });
      if (!result) return NextResponse.json(null, { status: 404 });
      let parsed = { ...result };
      if (typeof result.radarScores === 'string') parsed = { ...parsed, radarScores: JSON.parse(result.radarScores) };
      if (typeof result.xaiReport === 'string') parsed = { ...parsed, xaiReport: JSON.parse(result.xaiReport) };
      return NextResponse.json(parsed);
    }
    if (patientId) {
      const results = await db.result.findMany({
        where: { session: { patientId } },
        include: { session: true },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(results);
    }
    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}