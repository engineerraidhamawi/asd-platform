'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useLanguage } from '@/hooks/useLanguage';
import { LoginView } from '@/components/asd/LoginView';
import { SignupView } from '@/components/asd/SignupView';
import { DashboardView } from '@/components/asd/DashboardView';
import { PatientListView } from '@/components/asd/PatientListView';
import { PatientDetailView } from '@/components/asd/PatientDetailView';
import { AdminUsersView } from '@/components/asd/AdminUsersView';
import { AuditLogView } from '@/components/asd/AuditLogView';
import { MonitorDataView } from '@/components/asd/MonitorDataView';
import { ProfileView } from '@/components/asd/ProfileView';
import { QuestionnaireView } from '@/components/asd/QuestionnaireView';
import { AnalyzingView } from '@/components/asd/AnalyzingView';
import { ResultsView } from '@/components/asd/ResultsView';
import { ConsentView } from '@/components/asd/ConsentView';
import { Sidebar, MobileNav } from '@/components/asd/Sidebar';
import { Brain, Globe, LogOut, Shield, Menu, X, Moon, Sun } from 'lucide-react';
import { ToastContainer } from '@/components/asd/ToastContainer';
import { useNotifStore } from '@/store/useNotifStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PlatformPage() {
  const { currentView, patientName, navigate, user, setUser, darkMode, toggleDarkMode } = useAppStore();
  const { lang, t, dir, toggleLang } = useLanguage();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [ready, setReady] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetch('/api/seed', { method: 'POST' }).then(() => {
      const userId = localStorage.getItem('userId');
      if (userId) {
        fetch('/api/auth/me', { headers: { 'x-user-id': userId } })
          .then(r => r.ok ? r.json() : Promise.reject())
          .then(data => setUser(data.user))
          .catch(() => localStorage.removeItem('userId'));
      }
      setReady(true);
    }).catch(() => setReady(true));
  }, [setUser]);

  if (!ready) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-[#F0F7FF] dark:bg-slate-950'>
        <div className='text-center space-y-5'>
          <div className='relative inline-block'>
            <div className='w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center mx-auto shadow-xl shadow-sky-500/25 animate-pulse'>
              <Brain className='w-10 h-10 text-white' />
            </div>
            <div className='absolute -inset-3 rounded-3xl bg-gradient-to-br from-sky-200/30 to-cyan-200/30 blur-xl -z-10 animate-pulse' />
          </div>
          <div>
            <p className='text-slate-600 text-sm font-medium'>{t('loading')}</p>
            <p className='text-slate-400 text-xs mt-1'>ASD Digital Phenotyping</p>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('userId');
    navigate('login');
  };

  // Auth views — full screen, no sidebar
  const isAuthView = ['login', 'signup'].includes(currentView);
  if (isAuthView) {
    switch (currentView) {
      case 'login': return <LoginView />;
      case 'signup': return <SignupView />;
      default: return <LoginView />;
    }
  }

  // Assessment flow views — no sidebar, header only
  const isAssessmentFlow = ['consent', 'assess-questionnaire', 'analyzing', 'results'].includes(currentView);

  const renderMainView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'patients': return <PatientListView />;
      case 'patient-detail': return <PatientDetailView />;
      case 'new-assessment': return <NewAssessmentView />;
      case 'admin-users': return <AdminUsersView />;
      case 'audit-log': return <AuditLogView />;
      case 'monitor-data': return <MonitorDataView />;
      case 'profile': return <ProfileView />;
      case 'consent': return <ConsentView />;
      case 'assess-questionnaire': return <QuestionnaireView key={useAppStore.getState().questionnaireStep} />;
      case 'analyzing': return <AnalyzingView />;
      case 'results': return <ResultsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className='min-h-screen flex flex-col bg-[#F0F7FF] dark:bg-slate-950' dir={dir}>
      {/* Header */}
      <header className='bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 sticky top-0 z-50'>
        <div className={`${isAssessmentFlow ? 'max-w-3xl' : 'max-w-full'} mx-auto px-4 h-[60px] flex items-center justify-between bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-slate-900/90 dark:to-slate-900/95'>
          <div className='flex items-center gap-3'>
            {/* Mobile menu toggle */}
            {!isAssessmentFlow && (
              <button className='md:hidden text-slate-500 hover:text-slate-700' onClick={() => setMobileMenu(!mobileMenu)}>
                {mobileMenu ? <X className='w-5 h-5' /> : <Menu className='w-5 h-5' />}
              </button>
            )}
            <button onClick={() => navigate(user ? 'dashboard' : 'login')} className='flex items-center gap-2.5 hover:opacity-80 transition-opacity'>
              <div className='w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-md shadow-sky-500/15'>
                <Brain className='w-5 h-5 text-white' />
              </div>
              {!isAssessmentFlow && <span className='font-bold text-slate-800 text-sm hidden sm:inline'>{t('platformTitle')}</span>}
            </button>

            {isAssessmentFlow && patientName && (
              <div className='flex items-center gap-2 text-sm'>
                <span className='text-slate-300'>|</span>
                <span className='font-medium text-slate-600'>{patientName}</span>
              </div>
            )}
          </div>

          <div className='flex items-center gap-2'>
            <button
              onClick={toggleDarkMode}
              className='w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
              title={lang === 'ar' ? 'الوضع الداكن' : 'Dark mode'}
            >
              {darkMode ? <Sun className='w-4 h-4' /> : <Moon className='w-4 h-4' />}
            </button>
            <Button variant='ghost' size='sm' onClick={toggleLang} className='text-xs gap-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100'>
              <Globe className='w-3.5 h-3.5' />
              {lang === 'ar' ? 'EN' : 'عربي'}
            </Button>
            {user && (
              <>
                <Badge variant='outline' className='text-[10px] gap-1 hidden sm:flex border-slate-200 text-slate-500 bg-slate-50/50'>
                  {user.role === 'admin' && <Shield className='w-3 h-3' />}
                  {t(user.role as any)}
                </Badge>
                <span className='text-xs text-slate-500 hidden sm:inline font-medium'>{user.name}</span>
                <Button variant='ghost' size='sm' onClick={handleLogout} className='text-xs gap-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50'>
                  <LogOut className='w-3.5 h-3.5' />
                  <span className='hidden sm:inline'>{t('logout')}</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className='flex flex-1 overflow-hidden'>
        {!isAssessmentFlow && (
          <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        )}
        <main className='flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6'>
          {renderMainView()}
        </main>
      </div>

      {/* Footer */}
      {!isAssessmentFlow && (
        <footer className='mt-auto border-t border-slate-200/60 py-3 px-4 hidden md:block bg-white/50'>
          <div className='flex items-center justify-between text-[11px] text-slate-400'>
            <span>{t('platformTitle')} © {new Date().getFullYear()}</span>
            <span>{t('disclaimer')}</span>
          </div>
        </footer>
      )}

      {/* Mobile Bottom Nav */}
      {user && !isAssessmentFlow && <MobileNav />}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

// Inline New Assessment View
function NewAssessmentView() {
  const { user, startSession, navigate } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [name, setName] = useState('');
  const [age, setAge] = useState('5');
  const [gender, setGender] = useState('male');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age, gender, notes, createdById: user?.id }),
      });
      const patient = await res.json();
      const sessRes = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: patient.id, userId: user?.id }),
      });
      const session = await sessRes.json();
      startSession(session.id, patient.id, patient.name, parseInt(age), gender);
      useNotifStore.getState().add('success', 'تم إنشاء المريض وبدء التقييم', 'Patient created and assessment started');
    } catch {
      useNotifStore.getState().add('error', 'فشل إنشاء المريض', 'Failed to create patient');
    }
    setCreating(false);
  };

  return (
    <div className='max-w-lg mx-auto space-y-6' dir={dir}>
      <div>
        <h1 className='text-xl font-bold text-slate-800'>{t('startNew')}</h1>
        <p className='text-sm text-slate-500 mt-1'>{t('platformSubtitle')}</p>
      </div>
      <div className='glass-card rounded-2xl p-6 space-y-4'>
        <div className='space-y-1'>
          <label className='text-sm font-medium text-slate-700'>{t('patientName')} *</label>
          <input value={name} onChange={e => setName(e.target.value)} className='w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-all' />
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-1'>
            <label className='text-sm font-medium text-slate-700'>{t('patientAge')} *</label>
            <input type='number' value={age} onChange={e => setAge(e.target.value)} className='w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-all' min='1' max='18' />
          </div>
          <div className='space-y-1'>
            <label className='text-sm font-medium text-slate-700'>{t('patientGender')}</label>
            <select value={gender} onChange={e => setGender(e.target.value)} className='w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-all'>
              <option value='male'>{t('male')}</option>
              <option value='female'>{t('female')}</option>
            </select>
          </div>
        </div>
        <div className='space-y-1'>
          <label className='text-sm font-medium text-slate-700'>{t('notes')}</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} className='w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-all' placeholder={lang === 'ar' ? 'ملاحظات اختيارية' : 'Optional notes'} />
        </div>
        <div className='flex gap-2 pt-1'>
          <Button onClick={handleCreate} disabled={!name.trim() || creating} className='flex-1 h-11 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 shadow-md shadow-sky-500/20 text-white rounded-xl transition-all'>
            {creating ? t('loading') : t('createPatient')}
          </Button>
          <Button variant='outline' onClick={() => navigate('dashboard')} className='h-11 rounded-xl border-slate-200'>{t('cancel')}</Button>
        </div>
      </div>
    </div>
  );
}