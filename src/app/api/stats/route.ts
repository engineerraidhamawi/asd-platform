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

    // --- Feature #1: Risk Alerts (doctor only) ---
    let riskAlerts: any[] = [];
    if (isDoctor || isMonitor) {
      const patientsWithResults = await db.result.findMany({
        where: resultsWhere,
        include: {
          session: { include: { patient: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      // Group by patient
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
        const prevIdx = riskOrder.indexOf(prev.riskLevel);
        const currIdx = riskOrder.indexOf(curr.riskLevel);
        if (currIdx > prevIdx) {
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
        where: {
          ...assessWhere,
          completed: true,
          createdAt: { gte: eightWeeksAgo },
        },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

      // Group by week
      const weekBuckets: Record<string, number> = {};
      for (const a of recentAssessments) {
        const d = new Date(a.createdAt);
        // Monday as start of week
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        const key = monday.toISOString().split('T')[0];
        weekBuckets[key] = (weekBuckets[key] || 0) + 1;
      }

      // Fill missing weeks
      const now = new Date();
      const currentDay = now.getDay();
      const currentMondayDiff = currentDay === 0 ? -6 : 1 - currentDay;
      const currentMonday = new Date(now);
      currentMonday.setDate(now.getDate() + currentMondayDiff);

      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(currentMonday);
        weekStart.setDate(currentMonday.getDate() - i * 7);
        const key = weekStart.toISOString().split('T')[0];
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
        assessmentTrend.push({
          week: label,
          count: weekBuckets[key] || 0,
        });
      }
    }

    return NextResponse.json({
      userCount,
      patientCount,
      sessionCount,
      completedSessions,
      riskDist,
      subtypeDist,
      assessByType,
      recentResults,
      recentLogs,
      riskAlerts,
      assessmentTrend,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
