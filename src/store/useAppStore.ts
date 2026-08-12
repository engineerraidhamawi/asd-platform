import { create } from 'zustand';

export type ViewType =
  | 'login'
  | 'signup'
  | 'home'
  | 'dashboard'
  | 'patients'
  | 'patient-detail'
  | 'new-assessment'
  | 'consent'
  | 'assess-questionnaire'
  | 'assess-facial'
  | 'assess-motor'
  | 'assess-cognitive'
  | 'analyzing'
  | 'results'
  | 'history'
  | 'admin-users'
  | 'admin-questions'
  | 'audit-log'
  | 'monitor-data'
  | 'my-assessments'
  | 'profile';

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

interface AppState {
  currentView: ViewType;
  lang: 'ar' | 'en';
  darkMode: boolean;
  user: UserInfo | null;
  sessionId: string | null;
  patientId: string | null;
  selectedPatientId: string | null;
  patientName: string;
  patientAge: number;
  patientGender: string;
  questionnaireStep: number;
  questionnaireData: Record<string, number>;
  analysisProgress: number;

  navigate: (view: ViewType) => void;
  setLang: (lang: 'ar' | 'en') => void;
  toggleDarkMode: () => void;
  setUser: (user: UserInfo | null) => void;
  startSession: (sessionId: string, patientId: string, name: string, age: number, gender: string) => void;
  setQuestionnaireStep: (step: number) => void;
  setQuestionnaireData: (data: Record<string, number>) => void;
  setAnalysisProgress: (progress: number) => void;
  setSelectedPatientId: (id: string | null) => void;
  setSessionId: (id: string) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'login',
  lang: 'ar',
  darkMode: false,
  user: null,
  sessionId: null,
  patientId: null,
  selectedPatientId: null,
  patientName: '',
  patientAge: 5,
  patientGender: 'male',
  questionnaireStep: 0,
  questionnaireData: {},
  analysisProgress: 0,

  navigate: (view) => set({ currentView: view }),
  setLang: (lang) => set({ lang }),
  toggleDarkMode: () => set((s) => {
    const next = !s.darkMode;
    if (next) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
    return { darkMode: next };
  }),
  setUser: (user) => set({ user, currentView: user ? (user.role === 'admin' ? 'admin-users' : 'dashboard') : 'login' }),
  startSession: (sessionId, patientId, name, age, gender) =>
    set({ sessionId, patientId, patientName: name, patientAge: age, patientGender: gender, currentView: 'consent', questionnaireStep: 0, questionnaireData: {} }),
  setQuestionnaireStep: (step) => set({ questionnaireStep: step }),
  setQuestionnaireData: (data) => set({ questionnaireData: data }),
  setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
  setSelectedPatientId: (id) => set({ selectedPatientId: id }),
  setSessionId: (id) => set({ sessionId: id }),
  reset: () => set({ currentView: 'dashboard', sessionId: null, patientId: null, selectedPatientId: null, patientName: '', patientAge: 5, patientGender: 'male', questionnaireStep: 0, questionnaireData: {}, analysisProgress: 0 }),
}));
