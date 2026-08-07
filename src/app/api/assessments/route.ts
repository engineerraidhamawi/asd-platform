import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const assessment = await db.assessment.create({
      data: {
        sessionId: body.sessionId,
        type: body.type,
        rawData: JSON.stringify(body.rawData || {}),
        score: body.score,
        maxScore: body.maxScore,
        completed: true,
      },
    });
    // Update session status
    await db.session.update({ where: { id: body.sessionId }, data: { status: 'assessing' } });
    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) return NextResponse.json([]);
    const assessments = await db.assessment.findMany({ where: { sessionId } });
    return NextResponse.json(assessments);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}