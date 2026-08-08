import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
export async function GET() {
  try {
    const ws = XLSX.utils.aoa_to_sheet([
      ['M-CHAT (AR)','M-CHAT (EN)','SRS-2 (AR)','SRS-2 (EN)','RBS-R (AR)','RBS-R (EN)'],
      ['Does your child seem interested in other children?','Does your child seem interested in other children?','My child shows age-appropriate social skills','My child shows age-appropriate social skills','My child repeats words or phrases repeatedly','My child repeats words or phrases repeatedly']
    ]);
    ws['!cols'] = [{ wch:45 },{ wch:50 },{ wch:45 },{ wch:50 },{ wch:45 },{ wch:50 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    const buf = XLSX.write(wb, { type:'buffer', bookType:'xlsx' });
    return new NextResponse(buf, { headers: { 'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition':'attachment; filename="questions_template.xlsx"' } });
  } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
