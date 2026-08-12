const fs=require('fs'),R=f=>fs.readFileSync(f,'utf8'),W=(f,c)=>fs.writeFileSync(f,c,'utf8');
console.log('=== Patching ===');

// 1. ConfirmDialog
W('src/components/asd/ConfirmDialog.tsx',[
"'use client';",
"",
"import { useEffect } from 'react';",
"",
"interface ConfirmDialogProps {",
"  open: boolean; title: string; message: string;",
"  onConfirm: () => void; onCancel: () => void;",
"  confirmText?: string; cancelText?: string; variant?: 'danger' | 'default';",
"}",
"",
"export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmText, cancelText, variant = 'default' }: ConfirmDialogProps) {",
"  useEffect(() => {",
"    if (!open) return;",
"    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };",
"    document.addEventListener('keydown', h);",
"    return () => document.removeEventListener('keydown', h);",
"  }, [open, onCancel]);",
"  if (!open) return null;",
"  return (",
"    <div className='fixed inset-0 z-[200] flex items-center justify-center'>",
"      <div className='absolute inset-0 bg-black/40' onClick={onCancel} />",
"      <div className='relative bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4' style={{animation:'fadeIn 0.15s ease-out'}}>",
"        <h3 className='text-base font-bold text-gray-900 dark:text-white'>{title}</h3>",
"        <p className='text-sm text-gray-600 dark:text-gray-300 mt-2'>{message}</p>",
"        <div className='flex justify-end gap-2 mt-5'>",
"          <button onClick={onCancel} className='px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'>{cancelText || 'Cancel'}</button>",
"          <button onClick={onConfirm} className={'px-4 py-2 text-sm rounded-lg text-white '+(variant==='danger'?'bg-red-600 hover:bg-red-700':'bg-emerald-600 hover:bg-emerald-700')}>{confirmText || 'Confirm'}</button>",
"        </div>",
"      </div>",
"    </div>",
"  );",
"}",
].join('\n'));
console.log('1/5 ConfirmDialog created');

// 2. AdminUsersView
let a=R('src/components/asd/AdminUsersView.tsx');
a=a.replace("} from 'lucide-react';","} from 'lucide-react';\nimport { ConfirmDialog } from './ConfirmDialog';");
a=a.replace('const [saving, setSaving] = useState(false);',"const [saving, setSaving] = useState(false);\n  const [confirmState, setConfirmState] = useState<{open:boolean;action:()=>void;title:string;message:string}>({open:false,action:()=>{},title:'',message:''});");
a=a.replace(/const handleDelete = async \(id: string\) => \{[\s\S]*?^  \};/m,"const handleDelete = (id: string) => {\n    setConfirmState({\n      open: true,\n      title: lang === 'ar' ? '\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062d\u0630\u0641' : 'Confirm Delete',\n      message: t('confirmDelete'),\n      action: async () => {\n        await apiFetch('/api/users?id=' + id + '&adminId=' + (user?.id || ''), { method: 'DELETE' });\n        loadUsers();\n      },\n    });\n  };");
a=a.replace('    </div>\n  );\n}','      <ConfirmDialog open={confirmState.open} title={confirmState.title} message={confirmState.message}\n        confirmText={lang === "ar" ? "\u062d\u0630\u0641" : "Delete"} cancelText={t("cancel")} variant="danger"\n        onConfirm={() => { confirmState.action(); setConfirmState(s => ({...s, open: false})); }}\n        onCancel={() => setConfirmState(s => ({...s, open: false}))} />\n    </div>\n  );\n}');
W('src/components/asd/AdminUsersView.tsx',a);
console.log('2/5 AdminUsersView patched');

// 3. PatientListView
let p=R('src/components/asd/PatientListView.tsx');
p="import { FileSpreadsheet } from 'lucide-react';\nimport { ConfirmDialog } from './ConfirmDialog';\n"+p;
p=p.replace("import { apiFetch } from '@/lib/api';","import { apiFetch } from '@/lib/api';\nimport * as XLSX from 'xlsx';");
p=p.replace('X as XIcon','X as XIcon, Calendar');
p=p.replace('const [sortAsc, setSortAsc] = useState(false);',"const [sortAsc, setSortAsc] = useState(false);\n  const [dateFrom, setDateFrom] = useState('');\n  const [dateTo, setDateTo] = useState('');\n  const [confirmState, setConfirmState] = useState<{open:boolean;action:()=>void;title:string;message:string}>({open:false,action:()=>{},title:'',message:''});");
p=p.replace(/const handleDelete = async \(id: string, patientName: string\) => \{[\s\S]*?^  \};/m,"const handleDelete = (id: string, patientName: string) => {\n    setConfirmState({\n      open: true,\n      title: lang === 'ar' ? '\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062d\u0630\u0641' : 'Confirm Delete',\n      message: t('confirmDeletePatient'),\n      action: async () => {\n        await apiFetch('/api/patients?id=' + id + '&userId=' + (user?.id || ''), { method: 'DELETE' });\n        loadPatients();\n        addToast(lang === 'ar' ? '\u062a\u0645 \u0627\u0644\u062d\u0630\u0641' : 'Patient deleted', 'success');\n      },\n    });\n  };");
p=p.replace(/const filtered = patients\.filter\(p =>[\s\S]*?\);/,"const filtered = patients.filter(p => {\n    if (!p.name.toLowerCase().includes(search.toLowerCase())) return false;\n    if (dateFrom && new Date(p.createdAt) < new Date(dateFrom)) return false;\n    if (dateTo) { const d = new Date(dateTo); d.setDate(d.getDate() + 1); if (new Date(p.createdAt) >= d) return false; }\n    return true;\n  });");
var xlsxFn="  const handleExportExcel = () => {\n    const rows = sorted.map(p => {\n      const c = p.sessions.filter(s => s.result);\n      const l = c.length > 0 ? c[c.length - 1].result : null;\n      return { [lang==='ar'?'\u0627\u0644\u0627\u0633\u0645':'Name']: p.name, [lang==='ar'?'\u0627\u0644\u0639\u0645\u0631':'Age']: p.age, [lang==='ar'?'\u0627\u0644\u062c\u0646\u0633':'Gender']: p.gender, [lang==='ar'?'\u0627\u0644\u062c\u0644\u0633\u0627\u062a':'Sessions']: p.sessions.length, [lang==='ar'?'\u0627\u0644\u0645\u0643\u062a\u0645\u0644\u0629':'Completed']: c.length, [lang==='ar'?'\u0622\u062e\u0631 \u0645\u0633\u062a\u0648\u0649 \u062e\u0637\u0648\u0631\u0629':'Risk']: l?l.riskLevel:'', [lang==='ar'?'\u0622\u062e\u0631 \u062f\u0631\u062c\u0629':'Score']: l?l.riskScore:'', [lang==='ar'?'\u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a':'Notes']: p.notes||'', [lang==='ar'?'\u062a\u0627\u0631\u064a\u062e':'Created']: new Date(p.createdAt).toLocaleDateString(lang==='ar'?'ar-SA':'en-US') };\n    });\n    const ws = XLSX.utils.json_to_sheet(rows);\n    const wb = XLSX.utils.book_new();\n    XLSX.utils.book_append_sheet(wb, ws, lang==='ar'?'\u0627\u0644\u0645\u0631\u0636\u0649':'Patients');\n    XLSX.writeFile(wb, 'patients_' + new Date().toISOString().split('T')[0] + '.xlsx');\n    addToast(lang==='ar'?'\u062a\u0645 \u062a\u0635\u062f\u064a\u0631 Excel':'Excel exported', 'success');\n  };\n";
p=p.replace('const TOAST_COLORS',xlsxFn+'const TOAST_COLORS');
p=p.replace("<Download className=\"w-4 h-4\" /> {t('exportData')}","<Download className=\"w-4 h-4\" /> CSV");
var btn='<Button variant="outline" onClick={handleExportExcel} className="gap-2"><FileSpreadsheet className="w-4 h-4" /> Excel</Button>';
p=p.replace('{patients.length > 0 && (','{patients.length > 0 && (\n            '+btn);
p=p.replace('{/* New Patient Form */}','      {/* Date Filter */}\n      <div className="flex gap-3 flex-wrap items-center">\n        <div className="flex items-center gap-2 text-xs text-gray-500">\n          <Calendar className="w-3.5 h-3.5" />\n          <span>{lang === \'ar\' ? \'\u0645\u0646\' : \'From\'}</span>\n          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 px-2 rounded-md border border-gray-200 text-xs" />\n          <span>{lang === \'ar\' ? \'\u0625\u0644\u0649\' : \'To\'}</span>\n          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 px-2 rounded-md border border-gray-200 text-xs" />\n          {(dateFrom || dateTo) && (\n            <button onClick={() => { setDateFrom(\'\'); setDateTo(\'\'); }} className="text-xs text-red-500 hover:text-red-700">{lang === \'ar\' ? \'\u0645\u0633\u062d\' : \'Clear\'}</button>\n          )}\n        </div>\n      </div>\n\n      {/* New Patient Form */}');
p=p.replace('    </div>\n  );\n}','      <ConfirmDialog open={confirmState.open} title={confirmState.title} message={confirmState.message}\n        confirmText={lang === "ar" ? "\u062d\u0630\u0641" : "Delete"} cancelText={t("cancel")} variant="danger"\n        onConfirm={() => { confirmState.action(); setConfirmState(s => ({...s, open: false})); }}\n        onCancel={() => setConfirmState(s => ({...s, open: false}))} />\n    </div>\n  );\n}');
W('src/components/asd/PatientListView.tsx',p);
console.log('3/5 PatientListView patched');

// 4. Stats API
let s=R('src/app/api/stats/route.ts');
if (s.indexOf('riskTrend') === -1) {
s=s.replace('    return NextResponse.json({',"    const sixMonthsAgo = new Date();\n    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);\n    const trendResults = await db.result.findMany({\n      where: { ...resultWhere, createdAt: { gte: sixMonthsAgo } },\n      select: { riskLevel: true, riskScore: true, createdAt: true },\n      orderBy: { createdAt: 'asc' },\n    });\n    const trendByMonth = {};\n    for (const r of trendResults) {\n      const key = r.createdAt.toISOString().slice(0, 7);\n      if (!trendByMonth[key]) trendByMonth[key] = { high: 0, total: 0, avgScore: 0, count: 0 };\n      trendByMonth[key].total++;\n      trendByMonth[key].avgScore += r.riskScore;\n      if (r.riskLevel === 'high' || r.riskLevel === 'critical') trendByMonth[key].high++;\n    }\n    for (const k of Object.keys(trendByMonth)) { trendByMonth[k].avgScore = Math.round(trendByMonth[k].avgScore / trendByMonth[k].count); }\n    const riskTrend = Object.entries(trendByMonth).map(function(e) { return { month: e[0], ...e[1] }; });\n    return NextResponse.json({");
s=s.replace('      doctorStats,\n    });','      doctorStats,\n      riskTrend,\n    });');
W('src/app/api/stats/route.ts',s);
}
console.log('4/5 Stats API patched');

// 5. DashboardView
let d=R('src/components/asd/DashboardView.tsx');
if (d.indexOf('riskTrend') === -1) {
d=d.replace('  doctorStats: { id: string; name: string; patientCount: number; completedSessions: number; avgRisk: number }[];',"  doctorStats: { id: string; name: string; patientCount: number; completedSessions: number; avgRisk: number }[];\n  riskTrend: { month: string; high: number; total: number; avgScore: number; count: number }[];");
d=d.replace('{/* Risk Distribution + Assessment Type Pie */}','      {/* Risk Alerts Trend */}\n      {stats?.riskTrend && stats.riskTrend.length > 1 && (\n        <Card>\n          <CardContent className="p-5">\n            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">\n              <TrendingUp className="w-4 h-4 text-red-500" />\n              {lang === "ar" ? "\u0627\u062a\u062c\u0627\u0647 \u0627\u0644\u062e\u0637\u0648\u0631\u0629" : "Risk Alerts Trend"}\n              <span className="text-[10px] font-normal text-gray-400 ml-auto">{lang === "ar" ? "6 \u0623\u0634\u0647\u0631" : "6 months"}</span>\n            </h2>\n            <div className="h-40"><TrendChart data={stats.riskTrend} lang={lang} /></div>\n          </CardContent>\n        </Card>\n      )}\n\n      {/* Risk Distribution + Assessment Type Pie */}');
W('src/components/asd/DashboardView.tsx',d);
}
var TC="\nfunction TrendChart({ data, lang }: { data: { month: string; high: number; total: number; avgScore: number }[]; lang: string }) {\n  const canvasRef = useCallback((el: HTMLCanvasElement | null) => {\n    if (!el || data.length < 2) return;\n    const ctx = el.getContext('2d'); if (!ctx) return;\n    const W = el.width, H = el.height; ctx.clearRect(0, 0, W, H);\n    const pad = { t: 10, r: 10, b: 24, l: 32 };\n    const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;\n    const maxT = Math.max(...data.map(d => d.total), 1);\n    const maxH = Math.max(...data.map(d => d.high), 1);\n    ctx.strokeStyle = '#f3f4f6'; ctx.lineWidth = 0.5;\n    for (let i = 0; i <= 4; i++) { const y = pad.t + (ch/4)*i; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W-pad.r, y); ctx.stroke(); }\n    ctx.beginPath(); ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;\n    data.forEach((d, i) => { const x = pad.l + (cw/(data.length-1))*i; const y = pad.t + ch - (d.total/maxT)*ch; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); }); ctx.stroke();\n    ctx.beginPath(); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;\n    data.forEach((d, i) => { const x = pad.l + (cw/(data.length-1))*i; const y = pad.t + ch - (d.high/maxH)*ch; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); }); ctx.stroke();\n    data.forEach((d, i) => {\n      const x = pad.l + (cw/(data.length-1))*i;\n      ctx.fillStyle='#3b82f6'; ctx.beginPath(); ctx.arc(x, pad.t+ch-(d.total/maxT)*ch, 3, 0, Math.PI*2); ctx.fill();\n      ctx.fillStyle='#ef4444'; ctx.beginPath(); ctx.arc(x, pad.t+ch-(d.high/maxH)*ch, 3, 0, Math.PI*2); ctx.fill();\n      ctx.fillStyle='#9ca3af'; ctx.font='9px sans-serif'; ctx.textAlign='center'; ctx.fillText(d.month.slice(5), x, H-4);\n    });\n    ctx.font='9px sans-serif'; ctx.fillStyle='#3b82f6'; ctx.fillRect(W-120,2,10,10);\n    ctx.fillStyle='#6b7280'; ctx.textAlign='left';\n    ctx.fillText(lang==='ar'?'\u0625\u062c\u0645\u0627\u0644\u064a':'Total', W-106, 10);\n    ctx.fillStyle='#ef4444'; ctx.fillRect(W-60,2,10,10);\n    ctx.fillStyle='#6b7280'; ctx.fillText(lang==='ar'?'\u0639\u0627\u0644\u064a \u062e\u0637\u0648\u0631\u0629':'High Risk', W-46, 10);\n  }, [data, lang]);\n  return <canvas ref={canvasRef} width={400} height={160} className='w-full h-full' />;\n}\n";
fs.appendFileSync('src/components/asd/DashboardView.tsx', TC);
console.log('5/5 DashboardView patched');
console.log('=== Done! Run: npm run build ===');
