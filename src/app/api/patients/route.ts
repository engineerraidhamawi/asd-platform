import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id") || req.nextUrl.searchParams.get("userId");
    const userRole = req.headers.get("x-user-role");

    let whereClause: any = {};

    if (userId) {
      const userRecord = await db.user.findUnique({ where: { id: userId } });
      if (userRecord) {
        if (userRecord.role === "patient") {
          whereClause.parentId = userId;
        } else if (userRecord.role === "doctor") {
          whereClause.createdById = userId;
        }
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

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, age, gender, notes } = body;
    const callerId = req.headers.get("x-user-id");
    const callerRole = req.headers.get("x-user-role");

    if (!id) {
      return NextResponse.json({ error: "Patient ID required" }, { status: 400 });
    }

    const existing = await db.patient.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    if (callerRole !== "admin" && existing.createdById !== callerId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (age !== undefined) updateData.age = parseInt(age);
    if (gender !== undefined) updateData.gender = gender;
    if (notes !== undefined) updateData.notes = notes;

    const patient = await db.patient.update({
      where: { id },
      data: updateData,
      include: { createdBy: { select: { name: true } } },
    });

    logAction("PATIENT_UPDATED", id, "Updated patient: " + (name || existing.name), callerId || undefined);

    return NextResponse.json(patient);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update patient" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const callerId = req.headers.get("x-user-id");
    const callerRole = req.headers.get("x-user-role");

    if (!id) {
      return NextResponse.json({ error: "Patient ID required" }, { status: 400 });
    }

    const patient = await db.patient.findUnique({ where: { id } });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    if (callerRole !== "admin" && patient.createdById !== callerId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const sessions = await db.session.findMany({ where: { patientId: id } });
    for (const s of sessions) {
      await db.assessment.deleteMany({ where: { sessionId: s.id } });
      await db.result.deleteMany({ where: { sessionId: s.id } });
    }
    await db.session.deleteMany({ where: { patientId: id } });
    await db.patient.delete({ where: { id } });

    logAction("PATIENT_DELETED", id, "Deleted patient: " + patient.name, callerId || undefined);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete patient" }, { status: 500 });
  }
}
