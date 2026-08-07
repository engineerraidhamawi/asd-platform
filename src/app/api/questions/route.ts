import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const questions = await db.question.findMany({
      orderBy: [{ part: 'asc' }, { index: 'asc' }],
    });

    const grouped: Record<string, { ar: string; en: string }[]> = {};
    for (const q of questions) {
      if (!grouped[q.part]) grouped[q.part] = [];
      grouped[q.part].push({ ar: q.ar, en: q.en });
    }

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Questions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
