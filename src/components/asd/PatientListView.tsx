'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users, UserPlus, Search, Trash2, Eye, Activity, X,
  Pencil, Check, Download, XCircle
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
  sessions: { id: string; status: string; createdAt: string; result: SessionResult | null }[];
}

const RISK_BADGE: Record<string, { bg: string; color: string; ar: string; en: string }> = {
  low:      { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', color: 'text-emerald-700', ar: 'منخفض', en: 'Low' },
  moderate: { bg: 'bg-amber-50 text-amber-700 border-amber-200',   color: 'text-amber-700',   ar: 'متوسط', en: 'Moderate' },
  high:     { bg: 'bg-orange-50 text-orange-700 border-orange-200',  color: 'text-orange-700',  ar: 'مرتفع', en: 'High' },
  critical: { bg: 'bg-red-50 text-red-700 border-red-200',        color: 'text-red-700',     ar: 'حاد',    en: 'Critical' },
};

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

  const loadPatients = () => {
    apiFetch('/api/patients')
      .then(r => r.json())
      .then(setPatients)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPatients(); }, []);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await apiFetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age, gender, notes, createdById: user?.id }),
      });
      setShowNew(false);
      setName('');
      setNotes('');
      loadPatients();
    } catch {}
    setCreating(false);
  };

  const handleDelete = async (id: string, patientName: string) => {
    if (!confirm(lang === 'ar' ? `هل أنت متأكد من حذف المريض "${patientName}"؟` : `Delete patient "${patientName}"?`)) return;
    await apiFetch(`/api/patients?id=${id}&userId=${user?.id}`, { method: 'DELETE' });
    loadPatients();
  };

  const handleStartEdit = (patient: PatientWithSessions) => {
    setEditId(patient.id);
    setEditName(patient.name);
    setEditAge(String(patient.age));
    setEditGender(patient.gender);
    setEditNotes(patient.notes || '');
  };

  const handleCancelEdit = () => {
    setEditId(null);
  };

  const handleSaveEdit = async () => {
    if (!editId || !editName.trim()) return;
    setSaving(true);
    try {
      await apiFetch('/api/patients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, name: editName, age: editAge, gender: editGender, notes: editNotes }),
      });
      setEditId(null);
      loadPatients();
    } catch {}
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
    setSelectedPatientId(patientId);
    navigate('patient-detail');
  };

  const handleExportCSV = () => {
    const rows = [lang === 'ar'
      ? ['\u0627\u0644\u0627\u0633\u0645', '\u0627\u0644\u0639\u0645\u0631', '\u0627\u0644\u062c\u0646\u0633', '\u0627\u0644\u062c\u0644\u0633\u0627\u062a', '\u0627\u0644\u0645\u0643\u062a\u0645\u0644\u0629', '\u0622\u062e\u0631 \u0645\u0633\u062a\u0648\u0649 \u062e\u0637\u0648\u0631\u0629', '\u0622\u062e\u0631 \u062f\u0631\u062c\u0629', '\u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a', '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0646\u0634\u0627\u0621']
      : ['Name', 'Age', 'Gender', 'Sessions', 'Completed', 'Last Risk Level', 'Last Risk Score', 'Notes', 'Created At']
    ];
    for (const p of filtered) {
      const completed = p.sessions.filter(s => s.result);
      const last = completed.length > 0 ? completed[completed.length - 1].result : null;
      rows.push([
        p.name,
        String(p.age),
        p.gender,
        String(p.sessions.length),
        String(completed.length),
        last ? last.riskLevel : '',
        last ? String(last.riskScore) : '',
        p.notes || '',
        new Date(p.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US'),
      ]);
    }
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}​"`).join(',')).join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patients_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLastResult = (patient: PatientWithSessions) => {
    const completed = patient.sessions.filter(s => s.result);
    return completed.length > 0 ? completed[completed.length - 1].result : null;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            {t('patients')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} {lang === 'ar' ? '\u0645\u0631\u064a\u0636' : 'patients'}</p>
        </div>
        <div className="flex gap-2">
          {patients.length > 0 && (
            <Button variant="outline" onClick={handleExportCSV} className="gap-2">
              <Download className="w-4 h-4" />
              {t('exportData')}
            </Button>
          )}
          <Button onClick={() => setShowNew(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <UserPlus className="w-4 h-4" /> {t('createPatient')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${dir === 'rtl' ? 'right-3' : 'left-3'}`} />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={lang === 'ar' ? '\u0628\u062d\u062b \u0639\u0646 \u0645\u0631\u064a\u0636...' : 'Search patients...'}
          className={`${dir === 'rtl' ? 'pr-9' : 'pl-9'}`}
        />
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
              <div className="space-y-1">
                <Label className="text-xs">{t('patientName')} *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder={lang === 'ar' ? '\u0623\u062d\u0645\u062f \u062e\u0627\u0644\u062f' : 'Ahmed Khalid'} className="h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('patientAge')} *</Label>
                <Input type="number" value={age} onChange={e => setAge(e.target.value)} min="1" max="18" className="h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('patientGender')}</Label>
                <select value={gender} onChange={e => setGender(e.target.value)} className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm">
                  <option value="male">{t('male')}</option>
                  <option value="female">{t('female')}</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('notes')}</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder={lang === 'ar' ? '\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0627\u062e\u062a\u064a\u0627\u0631\u064a\u0629' : 'Optional notes'} className="h-10" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!name.trim() || creating} className="bg-emerald-600 hover:bg-emerald-700">
                {creating ? t('loading') : t('createPatient')}
              </Button>
              <Button variant="outline" onClick={() => setShowNew(false)}>{t('cancel')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t('noPatients')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(patient => {
            const lastResult = getLastResult(patient);
            const risk = lastResult ? RISK_BADGE[lastResult.riskLevel] : null;
            const sessionCount = patient.sessions.length;
            const isEditing = editId === patient.id;

            return (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {isEditing ? (
                    /* Edit Mode */
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">{t('patientName')} *</Label>
                          <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-9" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t('patientAge')}</Label>
                          <Input type="number" value={editAge} onChange={e => setEditAge(e.target.value)} min="1" max="18" className="h-9" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t('patientGender')}</Label>
                          <select value={editGender} onChange={e => setEditGender(e.target.value)} className="w-full h-9 px-3 rounded-md border border-gray-300 text-sm">
                            <option value="male">{t('male')}</option>
                            <option value="female">{t('female')}</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t('notes')}</Label>
                          <Input value={editNotes} onChange={e => setEditNotes(e.target.value)} className="h-9" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit} disabled={!editName.trim() || saving} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                          <Check className="w-3 h-3" />
                          {lang === 'ar' ? '\u062d\u0641\u0638' : 'Save'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit} className="gap-1">
                          <XCircle className="w-3 h-3" />
                          {t('cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">{patient.name.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => handleViewPatient(patient.id)}
                            className="text-sm font-semibold text-gray-900 hover:text-emerald-600 transition-colors text-left truncate block"
                          >
                            {patient.name}
                          </button>
                          <p className="text-xs text-gray-500">
                            {t(patient.gender === 'male' ? 'male' : 'female')} \u00b7 {patient.age} {t('ageYears')}
                            {patient.notes ? ` \u00b7 ${patient.notes}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {risk && (
                          <span className={`text-[10px] px-2 py-1 rounded-full border ${risk.bg} font-medium`}>
                            {risk[lang]} \u00b7 {lastResult!.riskScore}%
                          </span>
                        )}
                        <span className="text-xs text-gray-400 hidden sm:inline">{sessionCount} {lang === 'ar' ? '\u062c\u0644\u0633\u0629' : 'sessions'}</span>

                        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleViewPatient(patient.id)}>
                          <Eye className="w-3 h-3" /> <span className="hidden sm:inline">{lang === 'ar' ? '\u0639\u0631\u0636' : 'View'}</span>
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleStartEdit(patient)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="sm" className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStartAssessment(patient)}>
                          <Activity className="w-3 h-3" /> <span className="hidden sm:inline">{t('startAssessment')}</span>
                        </Button>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-500" onClick={() => handleDelete(patient.id, patient.name)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}