'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore, type UserInfo } from '@/store/useAppStore';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, LogIn, HeartPulse, Puzzle, Moon, Sun } from 'lucide-react';
import { useNotifStore } from '@/store/useNotifStore';

export function LoginView() {
  const { navigate, setUser, darkMode, toggleDarkMode } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const userId = localStorage.getItem('userId');
      if (userId) {
        fetch('/api/auth/me', {
          headers: { 'x-user-id': userId },
        })
          .then((r) => {
            if (!r.ok) throw new Error('Not found');
            return r.json();
          })
          .then((data) => {
            const user: UserInfo = data.user;
            setUser(user);
          })
          .catch(() => {
            localStorage.removeItem('userId');
          });
      }
    }
  }, [setUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(t('emailRequired'));
      return;
    }
    if (!password) {
      setError(t('passwordRequired'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(t('loginError'));
        setLoading(false);
        return;
      }

      const user: UserInfo = data.user;
      localStorage.setItem('userId', user.id);
      setUser(user);
      useNotifStore.getState().add('success', 'تم تسجيل الدخول بنجاح', 'Logged in successfully');
    } catch {
      setError(t('loginError'));
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#F0F7FF] dark:bg-slate-950' dir={dir}>
      {/* Background decorative elements */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-sky-200/20 to-cyan-200/20 blur-3xl' />
        <div className='absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-violet-200/15 to-indigo-200/15 blur-3xl' />
        <div className='absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-teal-200/10 to-sky-200/10 blur-3xl' />
      </div>

      {/* Puzzle piece decorative pattern - subtle autism awareness */}
      <div className='absolute top-8 left-8 opacity-[0.04] text-sky-900'>
        <Puzzle className='w-32 h-32' />
      </div>
      <div className='absolute bottom-12 right-12 opacity-[0.03] text-violet-900'>
        <HeartPulse className='w-24 h-24' />
      </div>

      {/* Dark mode toggle */}
      <button
        onClick={toggleDarkMode}
        className='absolute top-5 right-5 z-20 w-10 h-10 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-all duration-300'
        title={lang === 'ar' ? 'الوضع الداكن' : 'Dark mode'}
      >
        {darkMode ? <Sun className='w-[18px] h-[18px]' /> : <Moon className='w-[18px] h-[18px]' />}
      </button>

      <div className='w-full max-w-md space-y-6 relative z-10'>
        {/* Logo */}
        <div className='text-center space-y-4'>
          <div className='relative inline-block'>
            <div className='w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-400 to-teal-400 flex items-center justify-center mx-auto shadow-2xl shadow-sky-500/25 rotate-3 hover:rotate-0 transition-transform duration-500'>
              <Brain className='w-9 h-9 text-white' />
            </div>
            <div className='absolute -inset-4 rounded-3xl bg-gradient-to-br from-sky-300/20 to-teal-300/20 blur-2xl -z-10' />
          </div>
          <div>
            <h1 className='text-2xl font-bold text-slate-800 tracking-tight'>{t('welcomeBack')}</h1>
            <p className='text-sm text-slate-500 mt-1.5'>{t('loginDesc')}</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className='glass-card rounded-2xl shadow-xl shadow-slate-200/50 border-0'>
          <CardContent className='p-7'>
            <form onSubmit={handleLogin} className='space-y-5'>
              <div className='space-y-2'>
                <Label htmlFor='login-email' className='text-slate-600 text-sm font-medium'>{t('email')}</Label>
                <Input
                  id='login-email'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='doctor@example.com'
                  className='h-12 rounded-xl border-slate-200 bg-white/70 focus:ring-sky-400/50 focus:border-sky-400 text-sm'
                  dir='ltr'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='login-password' className='text-slate-600 text-sm font-medium'>{t('password')}</Label>
                <Input
                  id='login-password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='••••••••'
                  className='h-12 rounded-xl border-slate-200 bg-white/70 focus:ring-sky-400/50 focus:border-sky-400 text-sm'
                  dir='ltr'
                />
              </div>

              {error && (
                <div className='flex items-center gap-2 text-sm text-red-600 bg-red-50/80 border border-red-200/60 rounded-xl p-3.5'>
                  <div className='w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0' />
                  {error}
                </div>
              )}

              <Button
                type='submit'
                disabled={loading}
                className='w-full h-12 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-lg shadow-sky-500/25 rounded-xl text-sm font-medium transition-all'
              >
                {loading ? (
                  <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                ) : (
                  <LogIn className='w-4 h-4' />
                )}
                {t('loginButton')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Signup link */}
        <div className='text-center text-sm text-slate-500'>
          {t('noAccount')}{' '}
          <button
            onClick={() => navigate('signup')}
            className='text-sky-600 hover:text-sky-700 font-semibold'
          >
            {t('signup')}
          </button>
        </div>

        {/* Download project */}
        <button
          onClick={async () => {
            const res = await fetch('/asd-platform.zip');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'asd-platform.zip';
            document.body.appendChild(a); a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className='block w-full text-center text-[11px] text-slate-400 hover:text-sky-600 underline mt-1 py-2 transition-colors'
        >
          Download Project ZIP
        </button>
      </div>
    </div>
  );
}