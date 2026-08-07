'use client';
import { useState } from 'react';
import { useAppStore, type UserInfo } from '@/store/useAppStore';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, UserPlus } from 'lucide-react';

const ROLES = ['admin', 'doctor', 'monitor', 'patient'] as const;

export function SignupView() {
  const { navigate, setUser } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!name.trim() || !email.trim() || !password) { setError(t('emailRequired')); return; }
    if (password.length < 6) { setError(t('passwordMin')); return; }
    if (!role) { setError(t('selectRole')); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error === 'Email already registered' ? t('emailExists') : t('loginError')); setLoading(false); return; }
      const user: UserInfo = data.user;
      localStorage.setItem('userId', user.id);
      setUser(user);
    } catch { setError(t('loginError')); setLoading(false); }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4' dir={dir}>
      <div className='w-full max-w-md space-y-6'>
        <div className='text-center space-y-4'>
          <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20'><Brain className='w-8 h-8 text-white' /></div>
          <div><h1 className='text-2xl font-bold text-gray-900'>{t('createAccount')}</h1><p className='text-sm text-gray-500 mt-1'>{t('signupDesc')}</p></div>
        </div>
        <Card><CardContent className='p-6'>
          <form onSubmit={handleSignup} className='space-y-4'>
            <div className='space-y-2'><Label>{t('name')}</Label><Input value={name} onChange={e => setName(e.target.value)} className='h-11' /></div>
            <div className='space-y-2'><Label>{t('email')}</Label><Input type='email' value={email} onChange={e => setEmail(e.target.value)} className='h-11' dir='ltr' /></div>
            <div className='space-y-2'><Label>{t('password')}</Label><Input type='password' value={password} onChange={e => setPassword(e.target.value)} className='h-11' dir='ltr' /></div>
            <div className='space-y-2'>
              <Label>{t('role')}</Label>
              <Select value={role} onValueChange={(val) => setRole(val || "")}><SelectTrigger className='w-full h-11'><SelectValue placeholder={t('selectRole')} /></SelectTrigger><SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{t(r)}</SelectItem>)}</SelectContent></Select>
            </div>
            {error && <p className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3'>{error}</p>}
            <Button type='submit' disabled={loading} className='w-full h-11 bg-emerald-600 hover:bg-emerald-700 gap-2'>
              {loading ? <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' /> : <UserPlus className='w-4 h-4' />}
              {t('signupButton')}
            </Button>
          </form>
        </CardContent></Card>
        <div className='text-center text-sm text-gray-500'>{t('haveAccount')} <button onClick={() => navigate('login')} className='text-emerald-600 hover:text-emerald-700 font-medium'>{t('login')}</button></div>
      </div>
    </div>
  );
}