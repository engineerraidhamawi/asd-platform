'use client';
import { apiFetch } from "@/lib/api";

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Shield, UserPlus, Trash2, Edit3, X, Check, Users as UsersIcon
} from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count?: { patients: number; auditLogs: number };
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin:   { bg: 'bg-red-50 text-red-700 border-red-200', color: 'text-red-600' },
  doctor:  { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', color: 'text-emerald-600' },
  monitor: { bg: 'bg-blue-50 text-blue-700 border-blue-200', color: 'text-blue-600' },
  patient: { bg: 'bg-amber-50 text-amber-700 border-amber-200', color: 'text-amber-600' },
};

const ROLES = ['admin', 'doctor', 'monitor', 'patient'];

export function AdminUsersView() {
  const { user } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [users, setUsers] = useState<UserData[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'doctor' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadUsers = () => {
    apiFetch('/api/users').then(r => r.json()).then(setUsers).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password) return;
    setSaving(true);
    await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, createdById: user?.id }),
    });
    setShowAdd(false);
    setForm({ name: '', email: '', password: '', role: 'doctor' });
    loadUsers();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    await apiFetch(`/api/users?id=${id}&adminId=${user?.id}`, { method: 'DELETE' });
    loadUsers();
  };

  const handleEdit = async (id: string) => {
    setSaving(true);
    await apiFetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: form.name, email: form.email, role: form.role, password: form.password || undefined, adminId: user?.id }),
    });
    setEditingId(null);
    setForm({ name: '', email: '', password: '', role: 'doctor' });
    loadUsers();
    setSaving(false);
  };

  const startEdit = (u: UserData) => {
    setEditingId(u.id);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAdd(false);
    setForm({ name: '', email: '', password: '', role: 'doctor' });
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            {t('userManagement')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} {lang === 'ar' ? 'مستخدم' : 'users'}</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <UserPlus className="w-4 h-4" /> {t('addUser')}
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(showAdd || editingId) && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{editingId ? t('editUser') : t('addUser')}</h3>
              <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">{t('name')} *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('email')} *</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-10" dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('password')} {editingId ? '' : '*'}</Label>
                <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={editingId ? (lang === 'ar' ? 'اتركه فارغاً للإبقاء' : 'Leave empty to keep') : ''} className="h-10" dir="ltr" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('role')} *</Label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm">
                  {ROLES.map(r => <option key={r} value={r}>{t(r as any)}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={editingId ? () => handleEdit(editingId) : handleAdd} disabled={saving || !form.name || !form.email || (!editingId && !form.password)} className="bg-emerald-600 hover:bg-emerald-700 gap-1">
                <Check className="w-4 h-4" /> {editingId ? t('saveChanges') : t('addUser')}
              </Button>
              <Button variant="outline" onClick={cancelEdit}>{t('cancel')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="text-center py-16">
          <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t('noUsers')}</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className={`${dir === 'rtl' ? 'text-right' : 'text-left'} p-3 text-xs font-medium text-gray-500`}>{t('name')}</th>
                    <th className={`${dir === 'rtl' ? 'text-right' : 'text-left'} p-3 text-xs font-medium text-gray-500`}>{t('email')}</th>
                    <th className={`${dir === 'rtl' ? 'text-right' : 'text-left'} p-3 text-xs font-medium text-gray-500`}>{t('role')}</th>
                    <th className={`${dir === 'rtl' ? 'text-right' : 'text-left'} p-3 text-xs font-medium text-gray-500`}>{lang === 'ar' ? 'المرضى' : 'Patients'}</th>
                    <th className={`${dir === 'rtl' ? 'text-right' : 'text-left'} p-3 text-xs font-medium text-gray-500`}>{t('createdAt')}</th>
                    <th className="p-3 text-xs font-medium text-gray-500">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-3 font-medium text-gray-900">{u.name}</td>
                      <td className="p-3 text-gray-500" dir="ltr">{u.email}</td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${ROLE_COLORS[u.role]?.bg || ''}`}>
                          {t(u.role as any)}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500 tabular-nums">{u._count?.patients || 0}</td>
                      <td className="p-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEdit(u)}>
                            <Edit3 className="w-3 h-3 text-gray-400" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:text-red-500" onClick={() => handleDelete(u.id)} disabled={u.id === user?.id}>
                            <Trash2 className="w-3 h-3 text-gray-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}