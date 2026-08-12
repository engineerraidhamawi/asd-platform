import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [userCount, patientCount, maleCount, femaleCount, sessionCount, completedSessions, recentResults] =
      await Promise.all([
        db.user.count(),
        db.patient.count(),
        db.patient.count({ where: { gender: 'male' } }),
        db.patient.count({ where: { gender: 'female' } }),
        db.session.count(),
        db.session.count({ where: { status: "completed" } }),
        db.result.findMany({
          include: { session: { include: { patient: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

    const riskDist: Record<string, number> = { low: 0, moderate: 0, high: 0, critical: 0 };
    const allResults = await db.result.findMany();
    for (const r of allResults) {
      if (riskDist[r.riskLevel] !== undefined) riskDist[r.riskLevel]++;
    }

    const subtypeDist: Record<string, number> = {};
    for (const r of allResults) {
      if (r.subtype) {
        subtypeDist[r.subtype] = (subtypeDist[r.subtype] || 0) + 1;
      }
    }

    const recentLogs = await db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true, role: true } } },
    });

    const assessByType: Record<string, number> = {};
    const allAssessments = await db.assessment.findMany({ where: { completed: true } });
    for (const a of allAssessments) {
      assessByType[a.type] = (assessByType[a.type] || 0) + 1;
    }

    return NextResponse.json({
      userCount,
      patientCount,
      sessionCount,
      completedSessions,
      genderDist,
      riskDist,
      subtypeDist,
      assessByType,
      recentResults,
      recentLogs,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
