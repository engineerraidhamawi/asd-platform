import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) return NextResponse.json({ error: 'Only .xlsx/.xls files' }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<(string|undefined)[]>(sheet, { header: 1 });
    const dataRows = rows.slice(1).filter(r => r.some(c => c !== undefined && c !== ''));
    if (dataRows.length === 0) return NextResponse.json({ error: 'No data rows found' }, { status: 400 });
    const mchat: { part:string; index:number; ar:string; en:string }[] = [];
    const srs: { part:string; index:number; ar:string; en:string }[] = [];
    const rbsr: { part:string; index:number; ar:string; en:string }[] = [];
    for (let i = 0; i < dataRows.length; i++) {
      const r = dataRows[i];
      if (r[0] && r[1]) mchat.push({ part:'mchat', index:i, ar:String(r[0]).trim(), en:String(r[1]).trim() });
      if (r[2] && r[3]) srs.push({ part:'srs', index:i, ar:String(r[2]).trim(), en:String(r[3]).trim() });
      if (r[4] && r[5]) rbsr.push({ part:'rbsr', index:i, ar:String(r[4]).trim(), en:String(r[5]).trim() });
    }
    const allQ = [...mchat,...srs,...rbsr];
    if (allQ.length === 0) return NextResponse.json({ error: 'No valid question pairs' }, { status: 400 });
    await db.question.deleteMany({});
    await db.question.createMany({ data: allQ });
    return NextResponse.json({ message: 'Uploaded '+allQ.length+' questions', total: allQ.length, counts: { mchat:mchat.length, srs:srs.length, rbsr:rbsr.length } });
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 }); }
}
