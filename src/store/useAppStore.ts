import { create } from "zustand";

export type ViewType =
  | "login"
  | "signup"
  | "dashboard"
  | "patients"
  | "patient-detail"
  | "new-assesment"
  | "consent"
  | "assess-questionnaire"
  | "analyzing"
  | "results"
  | "history"
  | "admin-users"
  | "audit-log"
  | "monitor-data"
  | "my-assessments" | "assess-facial" | "assess-motor" | "admin-questions";

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

interface AppState {
  currentView: ViewType;
  lang: "ar" | "en";
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
  setLang: (lang: "ar" | "en") => void;
  setUser: (user: UserInfo | null) => void;
  startSession: (sessionId: string, patientId: string, name: string, age: number, gender: string) => void;
  setQuestionnaireStep: (step: number) => void;
  setQuestionnaireData: (data: Record<string, number>) => void;
  setAnalysisProgress: (progress: number) => void;
  setSelectedPatientId: (id: string | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: "login",
  lang: "ar",
  user: null,
  sessionId: null,
  patientId: null,
  selectedPatientId: null,
  patientName: "",
  patientAge: 5,
  patientGender: "male",
  questionnaireStep: 0,
  questionnaireData: {},
  analysisProgress: 0,

  navigate: (view) => set({ currentView: view }),
  setLang: (lang) => set({ lang }),
  setUser: (user) => set({
    user,
    currentView: user
      ? (user.role === "patient" ? "my-assessments" : user.role === "admin" ? "admin-users" : "dashboard")
      : "login",
  }),
  startSession: (sessionId, patientId, name, age, gender) =>
    set({ sessionId, patientId, patientName: name, patientAge: age, patientGender: gender, currentView: "consent", questionnaireStep: 0, questionnaireData: {} }),
  setQuestionnaireStep: (step) => set({ questionnaireStep: step }),
  setQuestionnaireData: (data) => set({ questionnaireData: data }),
  setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
  setSelectedPatientId: (id) => set({ selectedPatientId: id }),
  reset: () => set({ currentView: "dashboard", sessionId: null, patientId: null, selectedPatientId: null, patientName: "", patientAge: 5, patientGender: "male", questionnaireStep: 0, questionnaireData: {}, analysisProgress: 0 }),
}));
