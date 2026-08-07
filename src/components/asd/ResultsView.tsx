"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RotateCcw, FileText, Stethoscope, CheckCircle2, ArrowLeft } from "lucide-react";
import { RadarChart } from "@/components/asd/RadarChart";

interface RadarScores {
  social: number;
  nonverbal: number;
  repetitive: number;
  sensory: number;
  motor: number;
  executive: number;
}

interface XAIItem {
  feature_ar: string;
  feature_en: string;
  severity_ar: string;
  severity_en: string;
  impact: string;
  score: number;
}

interface ResultData {
  id: string;
  sessionId: string;
  riskLevel: string;
  riskScore: number;
  adosScore: number;
  adosConfidence: number;
  subtype: string | null;
  radarScores: RadarScores;
  xaiReport: XAIItem[];
  riskPercent?: number;
}

const RISK_STYLES: Record<string, { color: string; bg: string }> = {
  low: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  moderate: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  high: { color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  critical: { color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

const SUBTYPE_STYLES: Record<string, { color: string; bg: string }> = {
  withdrawn: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  "active-odd": { color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  shy: { color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
  motor: { color: "text-rose-700", bg: "bg-rose-50 border-rose-200" },
};

export function ResultsView() {
  const { sessionId, navigate, user } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    fetch("/api/results?sessionId=" + sessionId)
      .then((r) => r.json())
      .then((data) => {
        let parsed = data;
        if (typeof data.radarScores === "string") {
          parsed = { ...data, radarScores: JSON.parse(data.radarScores) };
        }
        if (typeof data.xaiReport === "string") {
          parsed = { ...parsed, xaiReport: JSON.parse(data.xaiReport) };
        }
        setResult(parsed);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{t("noResults")}</p>
      </div>
    );
  }

  const risk = RISK_STYLES[result.riskLevel] || RISK_STYLES.low;
  const riskPercent = result.riskPercent || result.riskScore;
  const subtype = SUBTYPE_STYLES[result.subtype || ""] || SUBTYPE_STYLES.withdrawn;
  const isPatient = user?.role === "patient";

  const radarLabels = [
    t("socialComm"),
    t("nonVerbal"),
    t("repetitive"),
    t("sensory"),
    t("motor"),
    t("executive"),
  ];

  const radarScores = [
    result.radarScores?.social || 0,
    result.radarScores?.nonverbal || 0,
    result.radarScores?.repetitive || 0,
    result.radarScores?.sensory || 0,
    result.radarScores?.motor || 0,
    result.radarScores?.executive || 0,
  ];

  const impactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-red-100 text-red-700";
      case "medium": return "bg-amber-100 text-amber-700";
      default: return "bg-emerald-100 text-emerald-700";
    }
  };

  const impactBarColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-red-500";
      case "medium": return "bg-amber-500";
      default: return "bg-emerald-500";
    }
  };

  const riskKey = "risk" + result.riskLevel.charAt(0).toUpperCase() + result.riskLevel.slice(1);
  const subtypeKey = result.subtype === "active-odd" ? "activeOdd" : result.subtype === "motor" ? "motorSub" : (result.subtype || "withdrawn");

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir={dir}>
      <Card className={risk.bg + " border"}>
        <CardContent className="p-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className={"w-12 h-12 rounded-xl " + risk.bg + " flex items-center justify-center"}>
              <AlertTriangle className={"w-6 h-6 " + risk.color} />
            </div>
            <div>
              <h1 className={"text-xl font-bold " + risk.color}>
                {t("riskLevel")}: {t(riskKey as any)}
              </h1>
              <p className="text-sm text-gray-600">{t((riskKey + "Desc") as any)}</p>
            </div>
          </div>
          <div className="text-left space-y-1">
            <p className="text-3xl font-bold tabular-nums">
              {riskPercent}
              <span className="text-lg text-gray-500">/100</span>
            </p>
            <p className="text-xs text-gray-500">{t("overallRiskScore")}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums text-teal-600">
              {typeof result.adosScore === "number" ? result.adosScore.toFixed(1) : "--"}
            </p>
            <p className="text-xs text-gray-500">{t("adosPrediction")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums text-teal-600">
              {typeof result.adosConfidence === "number" ? (Math.round(result.adosConfidence * 100) + "%") : "--"}
            </p>
            <p className="text-xs text-gray-500">{t("confidence")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Badge variant="outline" className={subtype.bg + " " + subtype.color + " text-sm font-bold"}>
              {result.subtype ? t(subtypeKey as any) : "--"}
            </Badge>
            <p className="text-xs text-gray-500 mt-1">{t("behavioralSubtype")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums text-teal-600">6</p>
            <p className="text-xs text-gray-500">{t("assessmentAxes")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">{t("radarOverview")}</h2>
          <RadarChart scores={radarScores} labels={radarLabels} lang={lang} />
        </CardContent>
      </Card>

      {result.subtype && (
        <Card>
          <CardContent className="p-5">
            <h2 className="text-base font-bold text-gray-900 mb-3">{t("subtypingTitle")}</h2>
            <div className={subtype.bg + " rounded-xl p-4 border"}>
              <div className="flex items-center gap-2">
                <Badge className={subtype.color + " " + subtype.bg}>
                  {t(subtypeKey as any)}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {t((subtypeKey + "Desc") as any)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">{t("xaiFeatures")}</h2>
            <p className="text-xs text-gray-500 mt-1">{t("xaiDesc")}</p>
          </div>
          <div className="space-y-3">
            {(result.xaiReport || []).map((item, i) => {
              const isHigh = item.impact === "high";
              const impactKey = item.impact === "high" ? "high" : item.impact === "medium" ? "medium" : "low";
              return (
                <div key={i} className="flex gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className={"w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold " +
                    (isHigh ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
                    {Math.round(item.score)}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {lang === "ar" ? item.feature_ar : item.feature_en}
                      </p>
                      <span className={"text-[10px] px-2 py-0.5 rounded-full " + impactColor(item.impact)}>
                        {t("impact")}: {t(impactKey as any)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {lang === "ar" ? item.severity_ar : item.severity_en}
                    </p>
                    <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={"h-full rounded-full " + impactBarColor(item.impact)}
                        style={{ width: item.score + "%" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="p-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{t("clinicianReview")}</p>
              <p className="text-xs text-gray-500">{t("disclaimer")}</p>
            </div>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {t("clinicianReview")}
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-center pt-2">
        {isPatient ? (
          <Button onClick={() => navigate("my-assessments")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t("myAssessments")}
          </Button>
        ) : (
          <>
            <Button onClick={() => navigate("patients")} className="gap-2">
              <FileText className="w-4 h-4" />
              {t("viewHistory")}
            </Button>
            <Button variant="outline" onClick={() => navigate("new-assessment")} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              {t("newAssessmentBtn")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}