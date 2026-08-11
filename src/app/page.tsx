"use client";

import { useEffect, useState, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { useLanguage } from "@/hooks/useLanguage";
import { LoginView } from "@/components/asd/LoginView";
import { DashboardView } from "@/components/asd/DashboardView";
import { PatientListView } from "@/components/asd/PatientListView";
import { PatientDetailView } from "@/components/asd/PatientDetailView";
import { AdminUsersView } from "@/components/asd/AdminUsersView";
import { AdminQuestionsView } from "@/components/asd/AdminQuestionsView";
import { AuditLogView } from "@/components/asd/AuditLogView";
import { MonitorDataView } from "@/components/asd/MonitorDataView";
import { QuestionnaireView } from "@/components/asd/QuestionnaireView";
import { AnalyzingView } from "@/components/asd/AnalyzingView";
import { ResultsView } from "@/components/asd/ResultsView";
import { ConsentView } from "@/components/asd/ConsentView";
import { MyAssessmentsView } from "@/components/asd/MyAssessmentsView";
import { HistoryView } from "@/components/asd/HistoryView";
import { FacialView } from "@/components/asd/FacialView";
import { Sidebar, MobileNav } from "@/components/asd/Sidebar";
import { Brain, Globe, LogOut, Shield, Menu, X, User as UserIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    // Removed auto-seed â€” questions are managed via Excel upload by admin
    Promise.resolve().then(() => {
      const userId = localStorage.getItem("userId");
      if (userId) {
        fetch("/api/auth/me", { headers: { "x-user-id": userId } })
          .then(r => r.ok ? r.json() : Promise.reject())
          .then(data => {
            localStorage.setItem("userRole", data.user.role);
            setUser(data.user);
          })
          .catch(() => {
            localStorage.removeItem("userId");
            localStorage.removeItem("userRole");
          });
      }
      setReady(true);
    }).catch(() => setReady(true));
  }, [setUser]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-500 text-sm">{t("loading")}</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    navigate("login");
  };

  const isAuthView = ["login"].includes(currentView);
  if (isAuthView) {
    return <LoginView />;
  }

  const isAssessmentFlow = ["consent", "assess-facial", "assess-questionnaire", "analyzing", "results"].includes(currentView);

  const renderMainView = () => {
    switch (currentView) {
      case "dashboard": return <DashboardView />;
      case "patients": return <PatientListView />;
      case "patient-detail": return <PatientDetailView />;
      case "new-assessment": return <NewAssessmentView />;
      case "admin-users": return <AdminUsersView />;
      case "admin-questions": return <AdminQuestionsView />;
      case "audit-log": return <AuditLogView />;
      case "monitor-data": return <MonitorDataView />;
      case "my-assessments": return <MyAssessmentsView />;
      case "consent": return <ConsentView />;
      case "assess-facial": return <FacialView />;
      case "assess-questionnaire": return <QuestionnaireView key={useAppStore.getState().questionnaireStep} />;
      case "analyzing": return <AnalyzingView />;
      case "results": return <ResultsView />;
      case "history": return <HistoryView />;
      case "profile": return <ProfileView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent" dir={dir}>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className={`${isAssessmentFlow ? "max-w-3xl" : "max-w-full"} mx-auto px-4 h-14 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {!isAssessmentFlow && (
              <button className="md:hidden text-gray-500" onClick={() => setMobileMenu(!mobileMenu)}>
                {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
            <button onClick={() => navigate(user ? "dashboard" : "login")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              {!isAssessmentFlow && <span className="font-bold text-gray-900 text-sm hidden sm:inline">{t("platformTitle")}</span>}
            </button>

            {isAssessmentFlow && patientName && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">.</span>
                <span className="font-medium text-gray-700">{patientName}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleLang} className="text-xs gap-1 text-gray-500">
              <Globe className="w-3 h-3" />
              {lang === "ar" ? "EN" : "\u0639\u0631\u0628\u064a"}
            </Button>
            {user && (
              <>
                <Badge variant="outline" className="text-xs gap-1 hidden sm:flex">
                  {user.role === "admin" && <Shield className="w-3 h-3" />}
                  {t(user.role as any)}
                </Badge>
                <button onClick={() => navigate("profile")} className="text-xs text-gray-500 hidden sm:inline hover:text-emerald-600 transition-colors">{user.name}</button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs gap-1 text-gray-500">
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">{t("logout")}</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {!isAssessmentFlow && (
          <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        )}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {renderMainView()}
        </main>
      </div>

      {!isAssessmentFlow && (
        <footer className="mt-auto border-t border-gray-200 py-3 px-4 hidden md:block">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{t("platformTitle")} / {new Date().getFullYear()}</span>
            <span>{t("disclaimer")}</span>
          </div>
        </footer>
      )}

      {user && !isAssessmentFlow && <MobileNav />}
    </div>
  );
}

function NewAssessmentView() {
  const { user, startSession, navigate } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [name, setName] = useState("");
  const [age, setAge] = useState("5");
  const [gender, setGender] = useState("male");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await apiFetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, age, gender, notes, createdById: user?.id }),
      });
      const patient = await res.json();
      const sessRes = await apiFetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id, userId: user?.id }),
      });
      const session = await sessRes.json();
      startSession(session.id, patient.id, patient.name, parseInt(age), gender);
    } catch {}
    setCreating(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6" dir={dir}>
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t("startNew")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("platformSubtitle")}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">{t("patientName")} *</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t("patientAge")} *</label>
            <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" min="1" max="18" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t("patientGender")}</label>
            <select value={gender} onChange={e => setGender(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="male">{t("male")}</option>
              <option value="female">{t("female")}</option>
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">{t("notes")}</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder={lang === "ar" ? "\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0627\u062e\u062a\u064a\u0627\u0631\u064a\u0629" : "Optional notes"} />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreate} disabled={!name.trim() || creating} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
            {creating ? t("loading") : t("createPatient")}
          </Button>
          <Button variant="outline" onClick={() => navigate("dashboard")}>{t("cancel")}</Button>
        </div>
      </div>
    </div>
  );
}

function ProfileView() {
  const { user, setUser, navigate } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);
    try {
      const res = await apiFetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setUser({ ...user, name: name.trim() });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {}
    setSaving(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6" dir={dir}>
      <div>
        <h1 className="text-xl font-bold text-gray-900">{lang === "ar" ? "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a" : "Profile"}</h1>
        <p className="text-sm text-gray-500 mt-1">{lang === "ar" ? "\u0625\u062f\u0627\u0631\u0629 \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u062d\u0633\u0627\u0628\u0643" : "Manage your account information"}</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">{t("name")}</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">{t("email")}</label>
              <input value={user?.email || ""} disabled className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t("role")}</label>
                <input value={t(user?.role as any) || user?.role || ""} disabled className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{lang === "ar" ? "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0646\u0634\u0627\u0621" : "Member Since"}</label>
                <input
                  value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US") : ""}
                  disabled
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!name.trim() || saving || name === user?.name} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? t("loading") : saved ? (lang === "ar" ? "\u062a\u0645 \u0627\u0644\u062d\u0641\u0638 \u2713" : "Saved \u2713") : t("saveChanges")}
            </Button>
            <Button variant="outline" onClick={() => navigate("dashboard")}>{t("cancel")}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
