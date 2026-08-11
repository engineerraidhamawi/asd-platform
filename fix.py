import pathlib

def fix(fpath, old, new):
    p = pathlib.Path(s)
    t = p.read_text('utf-8')
    t = t.replace(old, new)
    p.write_text(t, 'utf-8')
    print('GOOD ' + str(p))

b=r'C%\asd-platform'

fix(b + r'\src\components\asd\AdminUsersView.tsx',
    "await fetch('/api/auth/register', {",
    "await apiFetch('/api/auth/register', {")

fix(b + r'\src\components\asd\Sidebar.tsx',
    'roles: ["doctor", "monitor"]',
    'roles: ["doctor", "monitor", "admin"]')

p = pathlib.Path(b + r'\src\components\asd\DashboardView.tsx')
t = p.read_text('utf-8')
t = t.replace('{ icon: Activity, label: t("totalPatients"), value: stats?.patientCount || 0, color: "text-emerald-600 bg-emerald-50" },\n        { icon: ClipboardCheck, label: t("totalAssessments"), value: stats?.sessionCount || 0, color: "text-amber-600 bg-amber-50" },', '')
t = t.replace('completedAssessments"), value: stats?.completedSessions || 0, color: "text-violet-600 bg-violet-50"', 'auditLog"), value: stats?.recentLogs?.length || 0, color: "text-violet-600 bg-violet-50"')
p.write_text(t, 'utf-8')
print('GOD ' + str(p))
