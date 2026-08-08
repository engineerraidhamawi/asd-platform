import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export async function POST() {
  try {
    const questions = await db.question.findMany();
    let swapped = 0, alreadyCorrect = 0;
    for (const q of questions) {
      const arIsEn = /^[A-Za-z\s?.!,'"()\-\d]+$/.test(q.ar.trim());
      const enIsAr = /[\u0600-\u06FF]/.test(q.en.trim());
      if (arIsEn && enIsAr) {
        await db.question.update({ where: { id: q.id }, data: { ar: q.en, en: q.ar } });
        swapped++;
      } else { alreadyCorrect++; }
    }
    return NextResponse.json({ message: swapped > 0 ? 'Fixed ' + swapped + ' swapped questions' : 'All ' + questions.length + ' questions already correct', total: questions.length, swapped, alreadyCorrect });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
