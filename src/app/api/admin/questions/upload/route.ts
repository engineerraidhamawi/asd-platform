import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

const VALID_PARTS = ['mchat', 'srs', 'rbsr'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json({ error: 'Only Excel files (.xlsx, .xls) are accepted' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ error: 'Empty workbook' }, { status: 400 });
    }
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | undefined)[]>(sheet, { header: 1 });

    if (rows.length < 2) {
      return NextResponse.json({ error: 'File must have at least a header row and one data row' }, { status: 400 });
    }

    const header = rows[0];
    if (header.length < 6) {
      return NextResponse.json({ error: 'File must have 6 columns: M-CHAT AR, M-CHAT EN, SRS-2 AR, SRS-2 EN, RBS-R AR, RBS-R EN' }, { status: 400 });
    }

    const parts = [
      { key: 'mchat', arCol: 0, enCol: 1 },
      { key: 'srs', arCol: 2, enCol: 3 },
      { key: 'rbsr', arCol: 4, enCol: 5 },
    ];

    const allQuestions: { part: string; index: number; ar: string; en: string }[] = [];

    for (const part of parts) {
      const partQuestions: { part: string; index: number; ar: string; en: string }[] = [];
      let qIndex = 0;

      for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
        const row = rows[rowIdx];
        const arText = (row[part.arCol] || '').toString().trim();
        const enText = (row[part.enCol] || '').toString().trim();

        if (arText && enText) {
          partQuestions.push({ part: part.key, index: qIndex, ar: arText, en: enText });
          qIndex++;
        }
      }

      if (partQuestions.length === 0) {
        return NextResponse.json(
          { error: `No valid questions found for ${part.key.toUpperCase()}. Each question needs both Arabic and English text.` },
          { status: 400 }
        );
      }

      allQuestions.push(...partQuestions);
    }

    await db.$transaction(async (tx) => {
      for (const partKey of VALID_PARTS) {
        await tx.question.deleteMany({ where: { part: partKey } });
      }
      await tx.question.createMany({ data: allQuestions });
    });

    const counts: Record<string, number> = {};
    for (const part of parts) {
      counts[part.key] = allQuestions.filter(q => q.part === part.key).length;
    }

    return NextResponse.json({
      message: 'Questions uploaded successfully',
      replaced: true,
      counts,
      total: allQuestions.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}
