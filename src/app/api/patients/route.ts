import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    let whereClause: any = {};

    if (userId) {
      const userRecord = await db.user.findUnique({ where: { id: userId } });
      if (userRecord) {
        if (userRecord.role === "patient") {
          whereClause.parentId = userId;
        } else if (userRecord.role === "doctor") {
          whereClause.createdById = userId;
        }
        // admin and monitor see all
      }
    }

    const patients = await db.patient.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true } },
        sessions: {
          include: { result: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    return NextResponse.json(patients);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, age, gender, notes, createdById, parentId } = body;

    const patient = await db.patient.create({
      data: {
        name,
        age: parseInt(age),
        gender: gender || "male",
        notes: notes || "",
        createdById: createdById || null,
        parentId: parentId || null,
      },
      include: { createdBy: { select: { name: true } } },
    });

    logAction("PATIENT_CREATED", patient.id, "New patient: " + name + ", age " + age + ", " + gender, createdById);

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create patient" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id) {
      return NextResponse.json({ error: "Patient ID required" }, { status: 400 });
    }

    const patient = await db.patient.findUnique({ where: { id } });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const sessions = await db.session.findMany({ where: { patientId: id } });
    for (const s of sessions) {
      await db.assessment.deleteMany({ where: { sessionId: s.id } });
      await db.result.deleteMany({ where: { sessionId: s.id } });
    }
    await db.session.deleteMany({ where: { patientId: id } });
    await db.patient.delete({ where: { id } });

    logAction("PATIENT_DELETED", id, "Deleted patient: " + patient.name, userId || undefined);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete patient" }, { status: 500 });
  }
}