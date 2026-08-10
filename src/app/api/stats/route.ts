import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    let patientWhere: any = {};
    if (userId && userRole === "doctor") {
      patientWhere = { createdById: userId };
    } else if (userId && userRole === "patient") {
      patientWhere = { parentId: userId };
    }

    const patients = await db.patient.findMany({ where: patientWhere, select: { id: true } });
    const patientIds = patients.map((p: any) => p.id);

    const [userCount, patientCount, sessionCount, completedSessions, recentResults] =
      await Promise.all([
        db.user.count(),
        patientIds.length,
        patientIds.length > 0 ? db.session.count({ where: { patientId: { in: patientIds } } }) : 0,
        patientIds.length > 0 ? db.session.count({ where: { patientId: { in: patientIds }, status: "completed" } }) : 0,
        patientIds.length > 0 ? db.result.findMany({
          where: { session: { patientId: { in: patientIds } } },
          include: { session: { include: { patient: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        }) : [],
      ]);

    const riskDist: Record<string, number> = { low: 0, moderate: 0, high: 0, critical: 0 };
    const allResults = patientIds.length > 0
      ? await db.result.findMany({ where: { session: { patientId: { in: patientIds } } } })
      : [];
    for (const r of allResults) {
      if (riskDist[r.riskLevel] !== undefined) riskDist[r.riskLevel]++;
    }

    const subtypeDist: Record<string, number> = {};
    for (const r of allResults) {
      if (r.subtype) subtypeDist[r.subtype] = (subtypeDist[r.subtype] || 0) + 1;
    }

    const recentLogs = await db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true, role: true } } },
    });

    const assessByType: Record<string, number> = {};
    const allAssessments = patientIds.length > 0
      ? await db.assessment.findMany({ where: { completed: true, session: { patientId: { in: patientIds } } } })
      : [];
    for (const a of allAssessments) {
      assessByType[a.type] = (assessByType[a.type] || 0) + 1;
    }

    return NextResponse.json({
      userCount, patientCount, sessionCount, completedSessions,
      riskDist, subtypeDist, assessByType, recentResults, recentLogs,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}