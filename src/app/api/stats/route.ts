import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole') || 'doctor';

    const isAdmin = userRole === 'admin';
    const isDoctor = userRole === 'doctor';
    const isMonitor = userRole === 'monitor';

    // Common queries
    const userCount = await db.user.count();
    const recentLogs = await db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { name: true, role: true } } },
    });

    // Patient query with role filtering
    const patientWhere = isDoctor ? { createdById: userId || undefined } : {};
    const patientCount = await db.patient.count({ where: patientWhere });

    // Session query
    const sessionWhere = isDoctor
      ? { patient: { createdById: userId || undefined } }
      : {};
    const sessionCount = await db.session.count({ where: sessionWhere });
    const completedSessions = await db.session.count({
      where: { ...sessionWhere, status: 'completed' },
    });

    // Results
    const resultsWhere = isDoctor
      ? { session: { patient: { createdById: userId || undefined } } }
      : {};
    const allResults = await db.result.findMany({
      where: resultsWhere,
      include: { session: { include: { patient: true } } },
    });

    const recentResults = allResults
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    // Risk distribution
    const riskDist: Record<string, number> = { low: 0, moderate: 0, high: 0, critical: 0 };
    for (const r of allResults) {
      if (riskDist[r.riskLevel] !== undefined) riskDist[r.riskLevel]++;
    }

    // Subtype distribution
    const subtypeDist: Record<string, number> = {};
    for (const r of allResults) {
      if (r.subtype) {
        subtypeDist[r.subtype] = (subtypeDist[r.subtype] || 0) + 1;
      }
    }

    // Assessments by type
    const assessByType: Record<string, number> = {};
    const assessWhere = isDoctor
      ? { session: { patient: { createdById: userId || undefined } } }
      : {};
    const allAssessments = await db.assessment.findMany({
      where: { ...assessWhere, completed: true },
    });
    for (const a of allAssessments) {
      assessByType[a.type] = (assessByType[a.type] || 0) + 1;
    }

    // --- Feature #1: Risk Alerts ---
    let riskAlerts: any[] = [];
    if (isDoctor || isMonitor) {
      const patientsWithResults = await db.result.findMany({
        where: resultsWhere,
        include: { session: { include: { patient: true } } },
        orderBy: { createdAt: 'asc' },
      });
      const grouped: Record<string, any[]> = {};
      for (const r of patientsWithResults) {
        const pid = r.session.patientId;
        if (!grouped[pid]) grouped[pid] = [];
        grouped[pid].push(r);
      }
      const riskOrder = ['low', 'moderate', 'high', 'critical'];
      for (const [, results] of Object.entries(grouped)) {
        if (results.length < 2) continue;
        const prev = results[results.length - 2];
        const curr = results[results.length - 1];
        if (riskOrder.indexOf(curr.riskLevel) > riskOrder.indexOf(prev.riskLevel)) {
          riskAlerts.push({
            patientId: results[0].session.patient.id,
            patientName: results[0].session.patient.name,
            previousRisk: prev.riskLevel,
            currentRisk: curr.riskLevel,
            date: curr.createdAt,
          });
        }
      }
    }

    // --- Feature #2: Assessment Trend (last 8 weeks) ---
    let assessmentTrend: { week: string; count: number }[] = [];
    if (!isAdmin) {
      const eightWeeksAgo = new Date();
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
      eightWeeksAgo.setHours(0, 0, 0, 0);
      const recentAssessments = await db.assessment.findMany({
        where: { ...assessWhere, completed: true, createdAt: { gte: eightWeeksAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      });
      const weekBuckets: Record<string, number> = {};
      for (const a of recentAssessments) {
        const d = new Date(a.createdAt);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);
        const key = monday.toISOString().split('T')[0];
        weekBuckets[key] = (weekBuckets[key] || 0) + 1;
      }
      const now = new Date();
      const cd = now.getDay();
      const cm = new Date(now);
      cm.setDate(now.getDate() + (cd === 0 ? -6 : 1 - cd));
      for (let i = 7; i >= 0; i--) {
        const ws = new Date(cm);
        ws.setDate(cm.getDate() - i * 7);
        const key = ws.toISOString().split('T')[0];
        assessmentTrend.push({
          week: (ws.getMonth() + 1) + '/' + ws.getDate(),
          count: weekBuckets[key] || 0,
        });
      }
    }

    // --- Feature #3: Age Distribution ---
    let ageDistribution: { range: string; count: number }[] = [];
    if (!isAdmin) {
      const patients = await db.patient.findMany({
        where: patientWhere,
        select: { age: true },
      });
      const buckets: Record<string, number> = {
        '0-2': 0, '3-5': 0, '6-11': 0, '12-17': 0, '18+': 0,
      };
      for (const p of patients) {
        const a = p.age;
        if (a <= 2) buckets['0-2']++;
        else if (a <= 5) buckets['3-5']++;
        else if (a <= 11) buckets['6-11']++;
        else if (a <= 17) buckets['12-17']++;
        else buckets['18+']++;
      }
      ageDistribution = Object.entries(buckets).map(([range, count]) => ({ range, count }));
    }

    // --- Feature #4: Incomplete Sessions ---
    let incompleteSessions: any[] = [];
    if (!isAdmin) {
      incompleteSessions = await db.session.findMany({
        where: { ...sessionWhere, status: { not: 'completed' } },
        include: { patient: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    }

    // --- Feature #5: Doctor Performance (monitor only) ---
    let doctorPerformance: any[] = [];
    if (isMonitor) {
      const doctors = await db.user.findMany({
        where: { role: 'doctor' },
        select: { id: true, name: true },
      });
      for (const doc of doctors) {
        const pCount = await db.patient.count({ where: { createdById: doc.id } });
        if (pCount === 0) continue;
        const sTotal = await db.session.count({
          where: { patient: { createdById: doc.id } },
        });
        const sCompleted = await db.session.count({
          where: { patient: { createdById: doc.id }, status: 'completed' },
        });
        const docResults = await db.result.findMany({
          where: { session: { patient: { createdById: doc.id } } },
          select: { riskScore: true },
        });
        const avgRisk = docResults.length > 0
          ? Math.round(docResults.reduce((sum, r) => sum + (r.riskScore || 0), 0) / docResults.length)
          : 0;
        doctorPerformance.push({
          doctorId: doc.id,
          doctorName: doc.name,
          patientCount: pCount,
          totalSessions: sTotal,
          completedSessions: sCompleted,
          avgRiskScore: avgRisk,
        });
      }
    }

    return NextResponse.json({
      userCount, patientCount, sessionCount, completedSessions,
      riskDist, subtypeDist, assessByType, recentResults, recentLogs,
      riskAlerts, assessmentTrend, ageDistribution, incompleteSessions,
      doctorPerformance,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
