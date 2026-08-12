import { FileSpreadsheet } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import * as XLSX from 'xlsx';
import { useAppStore } from '@/store/useAppStore';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users, UserPlus, Search, Trash2, Eye, Activity, X,
  Pencil, Check, Download, XCircle, ArrowUpDown, CheckCircle, X as XIcon, Calendar
} from 'lucide-react';

interface SessionResult {
  id: string;
  riskLevel: string;
  riskScore: number;
  radarScores: string;
  createdAt: string;
}

interface PatientWithSessions {
  id: string;
  name: string;
  age: number;
  gender: string;
  notes?: string;
  createdAt: string;
  createdBy?: { name: string } | null;
  sessions: { id: string; status: string; createdAt: string; result: SessionResult | null; assessments: { type: string; completed: boolean }[] }[];
}

const RISK_BADGE: Record<string, { bg: string; color: string; ar: string; en: string }> = {
  low:      { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', color: 'text-emerald-700', ar: '\u0645\u0646\u062e\u0641\u0636', en: 'Low' },
  moderate: { bg: 'bg-amber-50 text-amber-700 border-amber-200',   color: 'text-amber-700',   ar: '\u0645\u062a\u0648\u0633\u0637', en: 'Moderate' },
  high:     { bg: 'bg-orange-50 text-orange-700 border-orange-200',  color: 'text-orange-700',  ar: '\u0645\u0631\u062a\u0641\u0639', en: 'High' },
  critical: { bg: 'bg-red-50 text-red-700 border-red-200',        color: 'text-red-700',     ar: '\u062d\u0627\u062f',    en: 'Critical' },
};

const ASSESS_TYPE_COLORS: Record<string, string> = {
  questionnaire: 'bg-emerald-100 text-emerald-700',
  facial: 'bg-blue-100 text-blue-700',
  motor: 'bg-violet-100 text-violet-700',
  cognitive: 'bg-amber-100 text-amber-700',
};

type SortKey = 'name' | 'age' | 'date' | 'risk';

export function PatientListView() {
  const { user, navigate, setSelectedPatientId, startSession } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [patients, setPatients] = useState<PatientWithSessions[]>([]);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('5');
  const [gender, setGender] = useState('male');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [confirmState, setConfirmState] = useState<{open:boolean;action:()=>void;title:string;message:string}>({open:false,action:()=>{},title:'',message:''});

  // Toast
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([]);
  const toastId = useCallback(() => Date.now() + Math.random(), []);
  const addToast = useCallback((msg: string, type: string) => {
    const id = toastId();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, [toastId]);

  const loadPatients = () => {
    apiFetch('/api/patients')
      .then(r => r.json())
      .then(setPatients)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPatients(); }, []);

  const getLastResult = (patient: PatientWithSessions) => {
    const completed = patient.sessions.filter(s => s.result);
    return completed.length > 0 ? completed[completed.length - 1].result : null;
  };

  const getSorted = () => {
    const arr = [...filtered];
    const dirMul = sortAsc ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'name': return dirMul * a.name.localeCompare(b.name);
        case 'age': return dirMul * (a.age - b.age);
        case 'date': return dirMul * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        case 'risk': {
          const ra = getLastResult(a)?.riskScore || 0;
          const rb = getLastResult(b)?.riskScore || 0;
          return dirMul * (ra - rb);
        }
        default: return 0;
      }
    });
    return arr;
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SORT_LABELS: Record<SortKey, { ar: string; en: string }> = {
    name: { ar: '\u0627\u0644\u0627\u0633\u0645', en: 'Name' },
    age: { ar: '\u0627\u0644\u0639\u0645\u0631', en: 'Age' },
    date: { ar: '\u0627\u0644\u062a\u0627\u0631\u064a\u062e', en: 'Date' },
    risk: { ar: '\u0627\u0644\u062e\u0637\u0648\u0631\u0629', en: 'Risk' },
  };

  const filtered = patients.filter(p => {
    if (!p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom && new Date(p.createdAt) < new Date(dateFrom)) return false;
    if (dateTo) { const d = new Date(dateTo); d.setDate(d.getDate() + 1); if (new Date(p.createdAt) >= d) return false; }
    return true;
  });
  const sorted = getSorted();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await apiFetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age, gender, notes, createdById: user?.id }),
      });
      setShowNew(false); setName(''); setNotes('');
      loadPatients();
      addToast(lang === 'ar' ? '\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0631\u064a\u0636 \u0628\u0646\u062c\u0627\u062d' : 'Patient created successfully', 'success');
    } catch { addToast(lang === 'ar' ? '\u0641\u0634\u0644 \u0627\u0644\u0625\u0646\u0634\u0627\u0621' : 'Creation failed', 'error'); }
    setCreating(false);
  };

  const handleDelete = (id: string, patientName: string) => {
    setConfirmState({
      open: true,
      title: lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete',
      message: t('confirmDeletePatient'),
      action: async () => {
        await apiFetch('/api/patients?id=' + id + '&userId=' + (user?.id || ''), { method: 'DELETE' });
        loadPatients();
        addToast(lang === 'ar' ? 'تم الحذف' : 'Patient deleted', 'success');
      },
    });
  };

  const handleStartEdit = (patient: PatientWithSessions) => {
    setEditId(patient.id); setEditName(patient.name); setEditAge(String(patient.age));
    setEditGender(patient.gender); setEditNotes(patient.notes || '');
  };

  const handleCancelEdit = () => { setEditId(null); };

  const handleSaveEdit = async () => {
    if (!editId || !editName.trim()) return;
    setSaving(true);
    try {
      await apiFetch('/api/patients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, name: editName, age: editAge, gender: editGender, notes: editNotes }),
      });
      setEditId(null); loadPatients();
      addToast(lang === 'ar' ? '\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0631\u064a\u0636' : 'Patient updated', 'success');
    } catch { addToast(lang === 'ar' ? '\u0641\u0634\u0644 \u0627\u0644\u062d\u0641\u0638' : 'Save failed', 'error'); }
    setSaving(false);
  };

  const handleStartAssessment = async (patient: PatientWithSessions) => {
    const sessRes = await apiFetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: patient.id, userId: user?.id }),
    });
    const session = await sessRes.json();
    startSession(session.id, patient.id, patient.name, patient.age, patient.gender);
  };

  const handleViewPatient = (patientId: string) => {
    setSelectedPatientId(patientId); navigate('patient-detail');
  };

  const handleExportCSV = () => {
    const rows = [lang === 'ar'
      ? ['\u0627\u0644\u0627\u0633\u0645', '\u0627\u0644\u0639\u0645\u0631', '\u0627\u0644\u062c\u0646\u0633', '\u0627\u0644\u062c\u0644\u0633\u0627\u062a', '\u0627\u0644\u0645\u0643\u062a\u0645\u0644\u0629', '\u0622\u062e\u0631 \u0645\u0633\u062a\u0648\u0649 \u062e\u0637\u0648\u0631\u0629', '\u0622\u062e\u0631 \u062f\u0631\u062c\u0629', '\u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a', '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0646\u0634\u0627\u0621']
      : ['Name', 'Age', 'Gender', 'Sessions', 'Completed', 'Last Risk Level', 'Last Risk Score', 'Notes', 'Created At']
    ];
    for (const p of sorted) {
      const completed = p.sessions.filter(s => s.result);
      const last = completed.length > 0 ? completed[completed.length - 1].result : null;
      rows.push([p.name, String(p.age), p.gender, String(p.sessions.length), String(completed.length),
        last ? last.riskLevel : '', last ? String(last.riskScore) : '', p.notes || '',
        new Date(p.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US'),
      ]);
    }
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `patients_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    addToast(lang === 'ar' ? '\u062a\u0645 \u062a\u0635\u062f\u064a\u0631 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a' : 'CSV exported', 'success');
  };

    const handleExportExcel = () => {
    const rows = sorted.map(p => {
      const c = p.sessions.filter(s => s.result);
      const l = c.length > 0 ? c[c.length - 1].result : null;
      return { [lang==='ar'?'الاسم':'Name']: p.name, [lang==='ar'?'العمر':'Age']: p.age, [lang==='ar'?'الجنس':'Gender']: p.gender, [lang==='ar'?'الجلسات':'Sessions']: p.sessions.length, [lang==='ar'?'المكتملة':'Completed']: c.length, [lang==='ar'?'آخر مستوى خطورة':'Risk']: l?l.riskLevel:'', [lang==='ar'?'آخر درجة':'Score']: l?l.riskScore:'', [lang==='ar'?'الملاحظات':'Notes']: p.notes||'', [lang==='ar'?'تاريخ':'Created']: new Date(p.createdAt).toLocaleDateString(lang==='ar'?'ar-SA':'en-US') };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, lang==='ar'?'المرضى':'Patients');
    XLSX.writeFile(wb, 'patients_' + new Date().toISOString().split('T')[0] + '.xlsx');
    addToast(lang==='ar'?'تم تصدير Excel':'Excel exported', 'success');
  };
const TOAST_COLORS: Record<string, string> = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-blue-600' };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6" dir={dir}>
      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="fixed top-20 right-4 z-[100] space-y-2" style={{ maxWidth: 320 }}>
          {toasts.map(toast => (
            <div key={toast.id} className={"flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm shadow-lg " + (TOAST_COLORS[toast.type] || TOAST_COLORS.info) + " animate-[fadeIn_0.2s_ease-out]"}>
              {toast.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
              {toast.type === 'error' && <XIcon className="w-4 h-4 flex-shrink-0" />}
              <span className="flex-1">{toast.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            {t('patients')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{sorted.length} {lang === 'ar' ? '\u0645\u0631\u064a\u0636' : 'patients'}</p>
        </div>
        <div className="flex gap-2">
          {patients.length > 0 && (
            <Button variant="outline" onClick={handleExportExcel} className="gap-2"><FileSpreadsheet className="w-4 h-4" /> Excel</Button>
            </Button>
          )}
          {patients.length > 0 && (
            </Button>
          )}
          {patients.length > 0 && (
            <Button variant="outline" onClick={handleExportCSV} className="gap-2">
              <Download className="w-4 h-4" /> CSV
            </Button>
          )}
          <Button onClick={() => setShowNew(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <UserPlus className="w-4 h-4" /> {t('createPatient')}
          </Button>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${dir === 'rtl' ? 'right-3' : 'left-3'}`} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={lang === 'ar' ? '\u0628\u062d\u062b \u0639\u0646 \u0645\u0631\u064a\u0636...' : 'Search patients...'} className={`${dir === 'rtl' ? 'pr-9' : 'pl-9'}`} />
        </div>
        <div className="flex gap-1">
          {(['name', 'age', 'date', 'risk'] as SortKey[]).map(key => (
            <button key={key} onClick={() => toggleSort(key)} className={"px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-colors " + (sortKey === key ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
              {SORT_LABELS[key][lang]}
              <ArrowUpDown className={"w-3 h-3 inline-block " + (sortKey === key ? (sortAsc ? 'rotate-180' : '') : 'opacity-30')} />
            </button>
          ))}
        </div>
      </div>

            {/* Date Filter */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>{lang === 'ar' ? 'من' : 'From'}</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 px-2 rounded-md border border-gray-200 text-xs" />
          <span>{lang === 'ar' ? 'إلى' : 'To'}</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 px-2 rounded-md border border-gray-200 text-xs" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-red-500 hover:text-red-700">{lang === 'ar' ? 'مسح' : 'Clear'}</button>
          )}
        </div>
      </div>

      {/* New Patient Form */}
      {showNew && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{t('createPatient')}</h3>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1"><Label className="text-xs">{t('patientName')} *</Label><Input value={name} onChange={e => setName(e.target.value)} className="h-10" /></div>
              <div className="space-y-1"><Label className="text-xs">{t('patientAge')} *</Label><Input type="number" value={age} onChange={e => setAge(e.target.value)} min="1" max="18" className="h-10" /></div>
              <div className="space-y-1"><Label className="text-xs">{t('patientGender')}</Label><select value={gender} onChange={e => setGender(e.target.value)} className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm"><option value="male">{t('male')}</option><option value="female">{t('female')}</option></select></div>
              <div className="space-y-1"><Label className="text-xs">{t('notes')}</Label><Input value={notes} onChange={e => setNotes(e.target.value)} className="h-10" /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!name.trim() || creating} className="bg-emerald-600 hover:bg-emerald-700">{creating ? t('loading') : t('createPatient')}</Button>
              <Button variant="outline" onClick={() => setShowNew(false)}>{t('cancel')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient List */}
      {sorted.length === 0 ? (
        <div className="text-center py-16"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">{t('noPatients')}</p></div>
      ) : (
        <div className="space-y-2">
          {sorted.map(patient => {
            const lastResult = getLastResult(patient);
            const risk = lastResult ? RISK_BADGE[lastResult.riskLevel] : null;
            const isEditing = editId === patient.id;

            // Gather unique completed assessment types from latest session with assessments
            const latestWithAssess = [...patient.sessions].reverse().find(s => s.assessments && s.assessments.length > 0);
            const assessTypes = latestWithAssess
              ? [...new Set(latestWithAssess.assessments.filter((a: any) => a.completed).map((a: any) => a.type))]
              : [];

            return (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="space-y-1"><Label className="text-xs">{t('patientName')} *</Label><Input value={editName} onChange={e => setEditName(e.target.value)} className="h-9" /></div>
                        <div className="space-y-1"><Label className="text-xs">{t('patientAge')}</Label><Input type="number" value={editAge} onChange={e => setEditAge(e.target.value)} min="1" max="18" className="h-9" /></div>
                        <div className="space-y-1"><Label className="text-xs">{t('patientGender')}</Label><select value={editGender} onChange={e => setEditGender(e.target.value)} className="w-full h-9 px-3 rounded-md border border-gray-300 text-sm"><option value="male">{t('male')}</option><option value="female">{t('female')}</option></select></div>
                        <div className="space-y-1"><Label className="text-xs">{t('notes')}</Label><Input value={editNotes} onChange={e => setEditNotes(e.target.value)} className="h-9" /></div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit} disabled={!editName.trim() || saving} className="gap-1 bg-emerald-600 hover:bg-emerald-700"><Check className="w-3 h-3" />{lang === 'ar' ? '\u062d\u0641\u0638' : 'Save'}</Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit} className="gap-1"><XCircle className="w-3 h-3" />{t('cancel')}</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">{patient.name.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <button onClick={() => handleViewPatient(patient.id)} className="text-sm font-semibold text-gray-900 hover:text-emerald-600 transition-colors text-left truncate block">{patient.name}</button>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-xs text-gray-500">{t(patient.gender === 'male' ? 'male' : 'female')} \u00b7 {patient.age} {t('ageYears')}</span>
                            {assessTypes.length > 0 && (
                              <span className="flex gap-1">
                                {assessTypes.map((at: string) => (
                                  <span key={at} className={"text-[9px] px-1.5 py-0.5 rounded-full font-medium " + (ASSESS_TYPE_COLORS[at] || 'bg-gray-100 text-gray-600')}>{at.slice(0, 4)}</span>
                                ))}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {risk && (
                          <span className={`text-[10px] px-2 py-1 rounded-full border ${risk.bg} font-medium`}>{risk[lang]} \u00b7 {lastResult!.riskScore}%</span>
                        )}
                        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleViewPatient(patient.id)}><Eye className="w-3 h-3" /></Button>
                        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleStartEdit(patient)}><Pencil className="w-3 h-3" /></Button>
                        <Button size="sm" className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStartAssessment(patient)}><Activity className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-500" onClick={() => handleDelete(patient.id, patient.name)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <ConfirmDialog open={confirmState.open} title={confirmState.title} message={confirmState.message}
        confirmText={lang === "ar" ? "حذف" : "Delete"} cancelText={t("cancel")} variant="danger"
        onConfirm={() => { confirmState.action(); setConfirmState(s => ({...s, open: false})); }}
        onCancel={() => setConfirmState(s => ({...s, open: false}))} />
    </div>
  );
}
