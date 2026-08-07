import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAction } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientId, userId } = body;

    const patient = await db.patient.findUnique({ where: { id: patientId } });

    const session = await db.session.create({
      data: { patientId, status: 'consented', consentedAt: new Date() },
    });

    logAction('SESSION_CREATED', session.id, `New session for patient: ${patient?.name || patientId}`, userId);

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, status, userId } = body;
    const session = await db.session.update({
      where: { id: sessionId },
      data: { status, completedAt: status === 'completed' ? new Date() : undefined },
    });
    logAction('SESSION_UPDATED', sessionId, `Session status: ${status}`, userId);
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}