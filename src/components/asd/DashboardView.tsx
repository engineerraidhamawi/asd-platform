"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Activity, ClipboardCheck, Shield, Brain,
  UserPlus, BarChart3, ArrowUpRight, TrendingUp,
  AlertTriangle, Calendar, PieChart, Clock, CheckCircle2
} from "lucide-react";

interface Stats {
  userCount: number;
  patientCount: number;
  sessionCount: number;
  completedSessions: number;
  riskDist: Record<string, number>;
  subtypeDist: Record<string, number>;
  assessByType: Record<string, number>;
  genderDist: Record<string, number>;
  sessionStatus: Record<string, number>;
  recentResults: any[];
  recentLogs: any[];
}

const RISK_CONFIG: Record<string, { color: string; bg: string; ar: string; en: string }> = {
  low:      { color: "text-emerald-600", bg: "bg-emerald-500", ar: "\u0645\u0646\u062e\u0641\u0636", en: "Low" },
  moderate: { color: "text-amber-600",   bg: "bg-amber-500",   ar: "\u0645\u062a\u0648\u0633\u0637", en: "Moderate" },
  high:     { color: "text-orange-600",  bg: "bg-orange-500",  ar: "\u0645\u0631\u062a\u0641\u0639", en: "High" },
  critical: { color: "text-red-600",     bg: "bg-red-500",     ar: "\u062d\u0627\u062f",    en: "Critical" },
};

const GENDER_CONFIG: Record<string, { bg: string; ar: string; en: string }> = {
  male:   { bg: "bg-blue-500",   ar: "\u0630\u0643\u0631",    en: "Male" },
  female: { bg: "bg-pink-400",  ar: "\u0623\u0646\u062b\u0649",   en: "Female" },
};

const ASSESS_COLORS: Record<string, string> = {
  questionnaire: "bg-emerald-500",
  facial: "bg-blue-500",
  motor: "bg-violet-500",
  cognitive: "bg-amber-500",
};

const STATUS_CONFIG: Record<string, { icon: typeof Clock; bg: string; color: string; ar: string; en: string }> = {
  pending:   { icon: Clock,        bg: "bg-gray-100",   color: "text-gray-500",   ar: "\u0645\u0639\u0644\u0642",       en: "Pending" },
  analyzing: { icon: Activity,     bg: "bg-amber-100",  color: "text-amber-600",  ar: "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0644\u064a\u0644", en: "Analyzing" },
  completed: { icon: CheckCircle2, bg: "bg-emerald-100", color: "text-emerald-600", ar: "\u0645\u0643\u062a\u0645\u0644",      en: "Completed" },
  abandoned: { icon: AlertTriangle, bg: "bg-red-100",    color: "text-red-500",    ar: "\u0645\u062a\u0648\u0642\u0641",      en: "Abandoned" },
};

export function DashboardView() {
  const { user, navigate, startSession } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/stats")
      .then(r => r.json())
      .then(data => {
        setStats(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const role = user?.role || "doctor";
  const isDoctor = role === "doctor";
  const isAdmin = role === "admin";
  const isMonitor = role === "monitor";
  const isPatient = role === "patient";

  if (isPatient) {
    return (
      <div className="space-y-6" dir={dir}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {lang === "ar" ? "\u0645\u0631\u062d\u0628\u0627\u064b\u060c " + (user?.name || "") : "Welcome, " + (user?.name || "")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t("platformSubtitle")}</p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <Brain className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">
              {lang === "ar" ? "\u0627\u0633\u062a\u062e\u062f\u0645 \u0642\u0627\u0626\u0645\u0629 \u062a\u0642\u064a\u064a\u0645\u0627\u062a\u064a \u0644\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u0646\u062a\u0627\u0626\u062c \u0623\u0637\u0641\u0627\u0644\u0643" : "Use My Assessments in the sidebar to view your children results"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Precompute chart data
  const genderTotal = (stats?.genderDist?.male || 0) + (stats?.genderDist?.female || 0) || 1;
  const malePct = Math.round(((stats?.genderDist?.male || 0) / genderTotal) * 100);
  const femalePct = 100 - malePct;

  const assessEntries = Object.entries(stats?.assessByType || {});
  const assessTotal = assessEntries.reduce((a, [, v]) => a + v, 0) || 1;
  let assessConic = "";
  let cumulative = 0;
  for (const [key, val] of assessEntries) {
    const pct = (val / assessTotal) * 100;
    assessConic += `${ASSESS_COLORS[key] || "bg-gray-400"} ${cumulative}% ${cumulative + pct}%`;
    cumulative += pct;
  }

  const statusEntries = Object.entries(stats?.sessionStatus || {}).filter(([, v]) => v > 0);

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {lang === "ar" ? "\u0645\u0631\u062d\u0628\u0627\u064b\u060c " + (user?.name || "") : "Welcome, " + (user?.name || "")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t("platformSubtitle")}</p>
        </div>
        {isDoctor && (
          <Button onClick={() => navigate("new-assessment")} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <UserPlus className="w-4 h-4" />
            {t("startNew")}
          </Button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(isAdmin ? [
          { icon: Users, label: t("totalUsers"), value: stats?.userCount || 0, color: "text-blue-600 bg-blue-50" },
          { icon: Activity, label: t("totalPatients"), value: stats?.patientCount || 0, color: "text-emerald-600 bg-emerald-50" },
          { icon: ClipboardCheck, label: t("totalAssessments"), value: stats?.sessionCount || 0, color: "text-amber-600 bg-amber-50" },
          { icon: Shield, label: t("completedAssessments"), value: stats?.completedSessions || 0, color: "text-violet-600 bg-violet-50" },
        ] : isDoctor ? [
          { icon: Users, label: t("totalPatients"), value: stats?.patientCount || 0, color: "text-emerald-600 bg-emerald-50" },
          { icon: ClipboardCheck, label: t("totalAssessments"), value: stats?.sessionCount || 0, color: "text-amber-600 bg-amber-50" },
          { icon: Activity, label: t("completedAssessments"), value: stats?.completedSessions || 0, color: "text-teal-600 bg-teal-50" },
          { icon: Brain, label: t("questionnaires"), value: stats?.assessByType?.questionnaire || 0, color: "text-violet-600 bg-violet-50" },
        ] : [
          { icon: Users, label: t("totalPatients"), value: stats?.patientCount || 0, color: "text-emerald-600 bg-emerald-50" },
          { icon: ClipboardCheck, label: t("completedAssessments"), value: stats?.completedSessions || 0, color: "text-amber-600 bg-amber-50" },
          { icon: Activity, label: t("totalAssessments"), value: stats?.sessionCount || 0, color: "text-teal-600 bg-teal-50" },
          { icon: BarChart3, label: t("avgRiskScore"), value: stats?.completedSessions ? Math.round((stats.recentResults?.reduce((a: number, r: any) => a + (r.riskScore || 0), 0) || 0) / Math.max(stats.completedSessions, 1)) : 0, color: "text-rose-600 bg-rose-50" },
        ]).map(card => (
          <Card key={card.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={"w-10 h-10 rounded-lg " + card.color + " flex items-center justify-center"}>
                  <card.icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3 tabular-nums">{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Distribution + Assessment Type Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              {t("riskDistribution")}
            </h2>
            <div className="space-y-3">
              {Object.entries(RISK_CONFIG).map(([key, cfg]) => {
                const count = stats?.riskDist?.[key] || 0;
                const total = Object.values(stats?.riskDist || {}).reduce((a: number, b: number) => a + b, 0) || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className={"text-xs font-medium w-16 " + cfg.color}>{cfg[lang]}</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className={"h-full rounded-full " + cfg.bg + " transition-all duration-500"} style={{ width: pct + "%" }} />
                    </div>
                    <span className="text-xs text-gray-500 tabular-nums w-16 text-right">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Assessment Type Pie Chart */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              {t("assessmentTypes")}
            </h2>
            {assessEntries.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                {lang === "ar" ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a" : "No data"}
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <div
                  className="w-28 h-28 rounded-full flex-shrink-0"
                  style={{
                    background: assessConic,
                  }}
                />
                <div className="space-y-2 flex-1">
                  {assessEntries.map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={"w-3 h-3 rounded-full flex-shrink-0 " + (ASSESS_COLORS[key] || "bg-gray-400")} />
                      <span className="text-xs text-gray-600 flex-1">{key}</span>
                      <span className="text-xs font-medium text-gray-900 tabular-nums">{val}</span>
                      <span className="text-[10px] text-gray-400">{Math.round((val / assessTotal) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Session Status + Gender Distribution + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Status */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              {lang === "ar" ? "\u062d\u0627\u0644\u0629 \u0627\u0644\u062c\u0644\u0633\u0627\u062a" : "Session Status"}
            </h2>
            {statusEntries.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                {lang === "ar" ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u062c\u0644\u0633\u0627\u062a" : "No sessions"}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                  const count = stats?.sessionStatus?.[key] || 0;
                  if (count === 0 && key === "abandoned") return null;
                  const total = (stats?.sessionCount || 1);
                  const pct = Math.round((count / total) * 100);
                  const StatusIcon = cfg.icon;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className={"w-8 h-8 rounded-lg " + cfg.bg + " flex items-center justify-center"}>
                        <StatusIcon className={"w-4 h-4 " + cfg.color} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">{cfg[lang]}</span>
                          <span className="text-xs font-bold text-gray-900 tabular-nums">{count}</span>
                        </div>
                        <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={"h-full rounded-full " + cfg.color.replace("text-", "bg-")} style={{ width: pct + "%" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-500" />
              {lang === "ar" ? "\u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u062c\u0646\u0633" : "Gender Distribution"}
            </h2>
            {(stats?.patientCount || 0) === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                {lang === "ar" ? "\u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u0631\u0636\u0649" : "No patients"}
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <div
                  className="w-24 h-24 rounded-full flex-shrink-0"
                  style={{
                    background: `conic-gradient(#3b82f6 0% ${malePct}%, #f472b6 ${malePct}% 100%)`,
                  }}
                />
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs text-gray-600">{GENDER_CONFIG.male[lang]}</span>
                    <span className="text-xs font-bold text-gray-900 tabular-nums">{stats?.genderDist?.male || 0}</span>
                    <span className="text-[10px] text-gray-400">{malePct}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-400" />
                    <span className="text-xs text-gray-600">{GENDER_CONFIG.female[lang]}</span>
                    <span className="text-xs font-bold text-gray-900 tabular-nums">{stats?.genderDist?.female || 0}</span>
                    <span className="text-[10px] text-gray-400">{femalePct}%</span>
                  </div>
                  <div className="pt-1 border-t border-gray-100">
                    <span className="text-xs text-gray-500">{lang === "ar" ? "\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a" : "Total"}: <span className="font-bold text-gray-900">{stats?.patientCount || 0}</span></span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">{t("recentActivity")}</h2>
            <div className="space-y-3 max-h-56 overflow-y-auto">
              {(!stats?.recentLogs || stats.recentLogs.length === 0) ? (
                <p className="text-sm text-gray-400 text-center py-8">{lang === "ar" ? "\u0644\u0627 \u064a\u0648\u062c\u062f \u0646\u0634\u0627\u0637 \u0628\u0639\u062f" : "No activity yet"}</p>
              ) : (
                stats.recentLogs.slice(0, 8).map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 truncate">{log.details || log.action}</p>
                      <p className="text-xs text-gray-400">
                        {log.user?.name || "System"} / {new Date(log.createdAt).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {isDoctor && (
        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3">{t("quickActions")}</h2>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate("new-assessment")}>
                <UserPlus className="w-3 h-3" /> {t("createPatient")}
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate("patients")}>
                <Users className="w-3 h-3" /> {t("patients")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}