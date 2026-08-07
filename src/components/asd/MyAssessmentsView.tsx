"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, AlertTriangle } from "lucide-react";

interface PatientResult {
  id: string;
  name: string;
  age: number;
  gender: string;
  sessions: Array<{
    id: string;
    status: string;
    createdAt: string;
    result: {
      id: string;
      riskLevel: string;
      riskScore: number;
      adosScore: number | null;
      radarScores: string;
      createdAt: string;
    } | null;
  }>;
}

const RISK_BADGE: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  moderate: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

const RISK_BG: Record<string, string> = {
  low: "bg-emerald-50 border-emerald-200",
  moderate: "bg-amber-50 border-amber-200",
  high: "bg-orange-50 border-orange-200",
  critical: "bg-red-50 border-red-200",
};

export function MyAssessmentsView() {
  const { user, navigate } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [patients, setPatients] = useState<PatientResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch("/api/patients?userId=" + user.id)
      .then(r => r.json())
      .then(data => {
        setPatients(Array.isArray(data) ? data : []);
      })
      .catch(() => setPatients([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const handleViewResults = (patient: PatientResult) => {
    const completedSession = patient.sessions?.find(s => s.result);
    if (!completedSession) return;
    useAppStore.setState({
      sessionId: completedSession.id,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
    });
    navigate("results");
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {lang === "ar" ? "مرحباً، " + (user?.name || "") : "Welcome, " + (user?.name || "")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {lang === "ar"
            ? "متابعة تقييمات أطفالك ونتائجهم"
            : "Follow up on your children assessments and results"}
        </p>
      </div>

      {patients.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-bold text-gray-400">?</span>
            </div>
            <p className="text-gray-500 font-medium">
              {lang === "ar"
                ? "لا يوجد أطفال مرتبطين بحسابك"
                : "No children linked to your account"}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {lang === "ar"
                ? "سيتم ربط أطفالك عندما ينشئ الطبيب ملفهم"
                : "Your children will be linked when their doctor creates their profile"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {patients.map(patient => {
            const completedSession = patient.sessions?.find(s => s.result);
            const result = completedSession?.result;
            const risk = result?.riskLevel || "low";
            const hasResult = !!result;

            return (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                        <p className="text-xs text-gray-400">
                          {patient.age} {t("ageYears")}
                          {" / "}
                          {t(patient.gender === "male" ? "male" : "female" as any)}
                        </p>
                      </div>
                    </div>
                    {hasResult && (
                      <Badge variant="outline" className={RISK_BADGE[risk] || ""}>
                        {t("risk" + risk.charAt(0).toUpperCase() + risk.slice(1) as any)}
                      </Badge>
                    )}
                  </div>

                  {hasResult ? (
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-400">{t("riskScore")}</p>
                          <p className="text-lg font-bold text-gray-900 tabular-nums">
                            {Math.round(result!.riskScore)}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-400">{t("adosEstimated")}</p>
                          <p className="text-lg font-bold text-gray-900 tabular-nums">
                            {result!.adosScore ?? "--"}
                          </p>
                        </div>
                      </div>
                      <div className={"p-3 rounded-lg border " + (RISK_BG[risk] || "")}>
                        <p className="text-xs text-gray-600">
                          {t("risk" + risk.charAt(0).toUpperCase() + risk.slice(1) + "Desc" as any)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => handleViewResults(patient)}
                      >
                        {t("viewResults")}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-gray-400">
                        {lang === "ar" ? "لا توجد نتائج بعد" : "No results yet"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            {t("disclaimer")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}