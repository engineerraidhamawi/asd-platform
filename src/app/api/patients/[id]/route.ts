import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const patient = await db.patient.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        sessions: {
          include: {
            result: true,
            assessments: { select: { type: true, score: true, maxScore: true, completed: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Patient fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch patient" }, { status: 500 });
  }
}