"use client";

import { useAppStore, type ViewType, type UserInfo } from "@/store/useAppStore";
import { useLanguage } from "@/hooks/useLanguage";
import { Brain, LayoutDashboard, Users, UserPlus, Shield, FileText, BarChart3, ClipboardList, Activity, Database, ChevronRight, ChevronLeft } from "lucide-react";

interface NavItem {
  key: ViewType;
  icon: typeof Brain;
  labelKey: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", icon: LayoutDashboard, labelKey: "dashboard", roles: ["doctor", "monitor"] },
  { key: "patients", icon: Users, labelKey: "patients", roles: ["doctor"] },
  { key: "my-assessments", icon: ClipboardList, labelKey: "myAssessments", roles: ["patient"] },
  { key: "admin-users", icon: Shield, labelKey: "userManagement", roles: ["admin"] },
  { key: "admin-questions", icon: Database, labelKey: "questionsManagement", roles: ["admin"] },
  { key: "audit-log", icon: FileText, labelKey: "auditLog", roles: ["admin"] },
  { key: "monitor-data", icon: BarChart3, labelKey: "aggregatedData", roles: ["monitor"] },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { currentView, user, navigate } = useAppStore();
  const { t, dir } = useLanguage();

  if (!user) return null;

  const items = NAV_ITEMS.filter(item => item.roles.includes(user.role));

  return (
    <aside className={`${collapsed ? "w-16" : "w-56"} bg-white border-${dir === "rtl" ? "l" : "r"} border-gray-200 flex flex-col transition-all duration-200 flex-shrink-0 hidden md:flex`} dir={dir}>
      <div className="h-14 flex items-center gap-2 px-3 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
          <Brain className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-xs font-bold text-gray-900 truncate">{t("platformTitle")}</span>
        )}
      </div>
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {items.map(item => {
          const isActive = currentView === item.key ||
            (item.key === "patients" && currentView === "patient-detail");
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              title={collapsed ? t(item.labelKey as any) : undefined}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-emerald-600" : ""}`} />
              {!collapsed && <span className="truncate">{t(item.labelKey as any)}</span>}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-gray-100 p-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {collapsed ? (
            dir === "rtl" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            dir === "rtl" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
          )}
          {!collapsed && <span>{dir === "rtl" ? "Collapse" : "Collapse"}</span>}
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { currentView, user, navigate } = useAppStore();
  const { t, dir } = useLanguage();

  if (!user) return null;
  const items = NAV_ITEMS.filter(item => item.roles.includes(user.role));

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50 safe-area-bottom" dir={dir}>
      <div className="flex items-center justify-around py-1">
        {items.slice(0, 5).map(item => {
          const isActive = currentView === item.key ||
            (item.key === "patients" && currentView === "patient-detail");
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] transition-colors ${
                isActive ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[56px]">{t(item.labelKey as any)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

