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

    const patients = await db.patient.findMany({
      where: patientWhere,
      select: { id: true, gender: true },
    });
    const patientIds = patients.map((p: any) => p.id);

    const sessionWhere: any = patientIds.length > 0
      ? { patientId: { in: patientIds } }
      : (userRole === "admin" || userRole === "monitor" || !userId) ? {} : { patientId: { in: [] } };

    const [userCount, patientCount, sessionCount, completedSessions] = await Promise.all([
      (userRole === "admin" || userRole === "monitor") ? db.user.count() : Promise.resolve(0),
      db.patient.count({ where: patientWhere }),
      db.session.count({ where: sessionWhere }),
      db.session.count({ where: { ...sessionWhere, status: "completed" } }),
    ]);

    const resultWhere: any = patientIds.length > 0
      ? { session: { patientId: { in: patientIds } } }
      : (userRole === "admin" || userRole === "monitor" || !userId) ? {} : { session: { patientId: { in: [] } } };

    const [recentResults, allResults, recentLogs, allAssessments, allPatients] = await Promise.all([
      db.result.findMany({
        where: resultWhere,
        include: { session: { include: { patient: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.result.findMany({ where: resultWhere }),
      db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { name: true, role: true } } },
      }),
      db.assessment.findMany({
        where: patientIds.length > 0
          ? { session: { patientId: { in: patientIds } }, completed: true }
          : (userRole === "admin" || userRole === "monitor" || !userId)
            ? { completed: true }
            : { session: { patientId: { in: [] } }, completed: true },
      }),
      db.patient.findMany({
        where: patientWhere,
        select: { gender: true, age: true },
      }),
    ]);

    const riskDist: Record<string, number> = { low: 0, moderate: 0, high: 0, critical: 0 };
    for (const r of allResults) {
      if (riskDist[r.riskLevel] !== undefined) riskDist[r.riskLevel]++;
    }

    const subtypeDist: Record<string, number> = {};
    for (const r of allResults) {
      if (r.subtype) {
        subtypeDist[r.subtype] = (subtypeDist[r.subtype] || 0) + 1;
      }
    }

    const assessByType: Record<string, number> = {};
    for (const a of allAssessments) {
      assessByType[a.type] = (assessByType[a.type] || 0) + 1;
    }

    // Gender distribution
    const genderDist: Record<string, number> = { male: 0, female: 0 };
    for (const p of allPatients) {
      if (p.gender === "female") genderDist.female++;
      else genderDist.male++;
    }

    // Session status breakdown
    const sessionStatusCounts = await db.session.groupBy({
      by: ["status"],
      where: sessionWhere,
      _count: true,
    });
    const sessionStatus: Record<string, number> = { pending: 0, analyzing: 0, completed: 0, abandoned: 0 };
    for (const s of sessionStatusCounts) {
      if (sessionStatus[s.status] !== undefined) sessionStatus[s.status] = s._count;
    }


    // Age distribution
    const ageDist: Record<string, number> = { "0-3": 0, "4-6": 0, "7-9": 0, "10-12": 0, "13+": 0 };
    for (const p of allPatients) {
      if (p.age <= 3) ageDist["0-3"]++;
      else if (p.age <= 6) ageDist["4-6"]++;
      else if (p.age <= 9) ageDist["7-9"]++;
      else if (p.age <= 12) ageDist["10-12"]++;
      else ageDist["13+"]++;
    }

    // Doctor performance
    const doctorStats = await db.user.findMany({
      where: { role: "doctor" },
      select: {
        id: true, name: true,
        _count: { select: { patients: true } },
        sessions: { where: { status: "completed" }, select: { id: true, results: { select: { riskScore: true } } } },
      },
    }).then(docs => docs.map((d: any) => ({
      id: d.id, name: d.name,
      patientCount: d._count.patients,
      completedSessions: d.sessions.length,
      avgRisk: d.sessions.length > 0
        ? Math.round(d.sessions.reduce((s: number, sess: any) => s + (sess.results[0]?.riskScore || 0), 0) / d.sessions.length)
        : 0,
    })));

    // Age distribution
    const ageDist: Record<string, number> = { "0-3": 0, "4-6": 0, "7-9": 0, "10-12": 0, "13+": 0 };
    for (const p of allPatients) {
      if (p.age <= 3) ageDist["0-3"]++;
      else if (p.age <= 6) ageDist["4-6"]++;
      else if (p.age <= 9) ageDist["7-9"]++;
      else if (p.age <= 12) ageDist["10-12"]++;
      else ageDist["13+"]++;
    }

    // Doctor performance
    const doctorStats = await db.user.findMany({
      where: { role: "doctor" },
      select: {
        id: true, name: true,
        _count: { select: { patients: true } },
        sessions: { where: { status: "completed" }, select: { id: true, results: { select: { riskScore: true } } } },
      },
    }).then(docs => docs.map((d: any) => ({
      id: d.id, name: d.name,
      patientCount: d._count.patients,
      completedSessions: d.sessions.length,
      avgRisk: d.sessions.length > 0
        ? Math.round(d.sessions.reduce((s: number, sess: any) => s + (sess.results[0]?.riskScore || 0), 0) / d.sessions.length)
        : 0,
    })));
    return NextResponse.json({
      userCount,
      patientCount,
      sessionCount,
      completedSessions,
      riskDist,
      subtypeDist,
      assessByType,
      genderDist,
      sessionStatus,
      recentResults,
      recentLogs,
    });
  } catch (error) {
    console.error("Stats error:", error);

    // Age distribution
    const ageDist: Record<string, number> = { "0-3": 0, "4-6": 0, "7-9": 0, "10-12": 0, "13+": 0 };
    for (const p of allPatients) {
      if (p.age <= 3) ageDist["0-3"]++;
      else if (p.age <= 6) ageDist["4-6"]++;
      else if (p.age <= 9) ageDist["7-9"]++;
      else if (p.age <= 12) ageDist["10-12"]++;
      else ageDist["13+"]++;
    }

    // Doctor performance
    const doctorStats = await db.user.findMany({
      where: { role: "doctor" },
      select: {
        id: true, name: true,
        _count: { select: { patients: true } },
        sessions: { where: { status: "completed" }, select: { id: true, results: { select: { riskScore: true } } } },
      },
    }).then(docs => docs.map((d: any) => ({
      id: d.id, name: d.name,
      patientCount: d._count.patients,
      completedSessions: d.sessions.length,
      avgRisk: d.sessions.length > 0
        ? Math.round(d.sessions.reduce((s: number, sess: any) => s + (sess.results[0]?.riskScore || 0), 0) / d.sessions.length)
        : 0,
    })));

    // Age distribution
    const ageDist: Record<string, number> = { "0-3": 0, "4-6": 0, "7-9": 0, "10-12": 0, "13+": 0 };
    for (const p of allPatients) {
      if (p.age <= 3) ageDist["0-3"]++;
      else if (p.age <= 6) ageDist["4-6"]++;
      else if (p.age <= 9) ageDist["7-9"]++;
      else if (p.age <= 12) ageDist["10-12"]++;
      else ageDist["13+"]++;
    }

    // Doctor performance
    const doctorStats = await db.user.findMany({
      where: { role: "doctor" },
      select: {
        id: true, name: true,
        _count: { select: { patients: true } },
        sessions: { where: { status: "completed" }, select: { id: true, results: { select: { riskScore: true } } } },
      },
    }).then(docs => docs.map((d: any) => ({
      id: d.id, name: d.name,
      patientCount: d._count.patients,
      completedSessions: d.sessions.length,
      avgRisk: d.sessions.length > 0
        ? Math.round(d.sessions.reduce((s: number, sess: any) => s + (sess.results[0]?.riskScore || 0), 0) / d.sessions.length)
        : 0,
    })));
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
