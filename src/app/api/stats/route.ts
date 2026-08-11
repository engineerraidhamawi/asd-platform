import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const userRole = req.headers.get("x-user-role");

    // Admin: only user count and audit logs, no patient data
    if (userRole === "admin") {
      const [userCount, recentLogs] = await Promise.all([
        db.user.count(),
        db.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { user: { select: { name: true, role: true } } },
        }),
      ]);
      return NextResponse.json({
        userCount,
        patientCount: 0,
        sessionCount: 0,
        completedSessions: 0,
        riskDist: { low: 0, moderate: 0, high: 0, critical: 0 },
        subtypeDist: {},
        assessByType: {},
        recentResults: [],
        recentLogs,
      });
    }

    // Monitor: see everything
    if (userRole === "monitor") {
      const [userCount, patientCount, sessionCount, completedSessions, recentResults, recentLogs] = await Promise.all([
        db.user.count(),
        db.patient.count(),
        db.session.count(),
        db.session.count({ where: { status: "completed" } }),
        db.result.findMany({
          include: { session: { include: { patient: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        db.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { user: { select: { name: true, role: true } } },
        }),
      ]);
      const allResults = await db.result.findMany();
      const riskDist: Record<string, number> = { low: 0, moderate: 0, high: 0, critical: 0 };
      for (const r of allResults) { if (riskDist[r.riskLevel] !== undefined) riskDist[r.riskLevel]++; }
      const subtypeDist: Record<string, number> = {};
      for (const r of allResults) { if (r.subtype) subtypeDist[r.subtype] = (subtypeDist[r.subtype] || 0) + 1; }
      return NextResponse.json({ userCount, patientCount, sessionCount, completedSessions, riskDist, subtypeDist, assessByType: {}, recentResults, recentLogs });
    }

    // Doctor: see only their own patients
    const userId = req.headers.get("x-user-id");
    const patientWhere: any = userId ? { createdById: userId } : {};
    const patients = await db.patient.findMany({ where: patientWhere, select: { id: true } });
    const patientIds = patients.map((p: any) => p.id);
    const sessionWhere: any = patientIds.length > 0 ? { patientId: { in: patientIds } } : { patientId: { in: [] } };
    const resultWhere: any = patientIds.length > 0 ? { session: { patientId: { in: patientIds } } } : { session: { patientId: { in: [] } } };

    const [patientCount, sessionCount, completedSessions, recentResults, allResults, recentLogs, allAssessments] = await Promise.all([
      db.patient.count({ where: patientWhere }),
      db.session.count({ where: sessionWhere }),
      db.session.count({ where: { ...sessionWhere, status: "completed" } }),
      db.result.findMany({ where: resultWhere, include: { session: { include: { patient: true } } }, orderBy: { createdAt: "desc" }, take: 10 }),
      db.result.findMany({ where: resultWhere }),
      db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { user: { select: { name: true, role: true } } } }),
      db.assessment.findMany({ where: { session: { patientId: { in: patientIds } }, completed: true } }),
    ]);

    const riskDist: Record<string, number> = { low: 0, moderate: 0, high: 0, critical: 0 };
    for (const r of allResults) { if (riskDist[r.riskLevel] !== undefined) riskDist[r.riskLevel]++; }
    const subtypeDist: Record<string, number> = {};
    for (const r of allResults) { if (r.subtype) subtypeDist[r.subtype] = (subtypeDist[r.subtype] || 0) + 1; }
    const assessByType: Record<string, number> = {};
    for (const a of allAssessments) { assessByType[a.type] = (assessByType[a.type] || 0) + 1; }

    return NextResponse.json({ userCount: 0, patientCount, sessionCount, completedSessions, riskDist, subtypeDist, assessByType, recentResults, recentLogs });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}