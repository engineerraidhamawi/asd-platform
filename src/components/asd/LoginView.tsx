"use client";

import { useState, useEffect, useRef } from "react";
import { useAppStore, type UserInfo } from "@/store/useAppStore";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, LogIn, Shield } from "lucide-react";

export function LoginView() {
  const { navigate, setUser } = useAppStore();
  const { lang, t, dir } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const userId = localStorage.getItem("userId");
      if (userId) {
        fetch("/api/auth/me", {
          headers: { "x-user-id": userId },
        })
          .then((r) => {
            if (!r.ok) throw new Error("Not found");
            return r.json();
          })
          .then((data) => {
            const user: UserInfo = data.user;
            setUser(user);
          })
          .catch(() => {
            localStorage.removeItem("userId");
          });
      }
    }
  }, [setUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError(t("emailRequired")); return; }
    if (!password) { setError(t("passwordRequired")); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(t("loginError")); setLoading(false); return; }
      const user: UserInfo = data.user;
      localStorage.setItem("userId", user.id);
      setUser(user);
    } catch {
      setError(t("loginError"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center login-bg p-4" dir={dir}>
      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/25" style={{ animation: "float 3s ease-in-out infinite" }}>
            <Brain className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("welcomeBack")}</h1>
            <p className="text-sm text-gray-500 mt-1">{t("loginDesc")}</p>
          </div>
        </div>

        <Card className="border-blue-100/60 shadow-xl shadow-blue-900/5 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-sky-500" />
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">{t("email")}</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@example.com"
                  className="h-11 border-blue-100 focus:border-blue-400 focus:ring-blue-400/20"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">{t("password")}</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  className="h-11 border-blue-100 focus:border-blue-400 focus:ring-blue-400/20"
                  dir="ltr"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 gap-2 shadow-md shadow-blue-600/25 transition-all"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {t("loginButton")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500 hidden">
          {t("noAccount")}{" "}
          <button onClick={() => navigate("signup")} className="text-blue-600 hover:text-blue-700 font-medium">
            {t("signup")}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 pt-2">
          <Shield className="w-3 h-3" />
          <span>{t("disclaimer")}</span>
        </div>

        <button
          onClick={async () => {
            const res = await fetch("/asd-platform.zip");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "asd-platform.zip";
            document.body.appendChild(a); a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className="block w-full text-center text-xs text-gray-400 hover:text-blue-600 underline mt-2 py-2"
        >
          {"\u2B07"} Download Project ZIP (203 KB)
        </button>
      </div>
    </div>
  );
}