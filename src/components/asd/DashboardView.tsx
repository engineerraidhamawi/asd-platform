"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Activity, ClipboardCheck, Shield, Brain,
  UserPlus, BarChart3, ArrowUpRight, TrendingUp
} from "lucide-react";

interface Stats {
  userCount: number;
  patientCount: number;
  sessionCount: number;
  completedSessions: number;
  riskDist: Record<string, number>;
  subtypeDist: Record<string, number>;
  assessByType: Record<string, number>;
  recentResults: any[];
  recentLogs: any[];
}

const RISK_CONFIG: Record<string, { color: string; bg: string; ar: string; en: string }> = {
  low:      { color: "text-emerald-600", bg: "bg-emerald-500", ar: "\u0645\u0646\u062e\u0641\u0636", en: "Low" },
  moderate: { color: "text-amber-600",   bg: "bg-amber-500",   ar: "\u0645\u062a\u0648\u0633\u0637", en: "Moderate" },
  high:     { color: "text-orange-600",  bg: "bg-orange-500",  ar: "\u0645\u0631\u062a\u0641\u0639", en: "High" },
  critical: { color: "text-red-600",     bg: "bg-red-500",     ar: "\u062d\u0627\u062f",    en: "Critical" },
};

export function DashboardView() {
  const { user, navigate, startSession } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/seed", { method: "POST" }).then(() =>
      fetch("/api/stats")
        .then(r => r.json())
        .then(data => {
          setStats(data)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    );
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

        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">{t("recentActivity")}</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
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