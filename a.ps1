# 1. Fix store - admin goes to admin-users instead of dashboard
$s = Get-Content 'src\store\useAppStore.ts' -Raw
$s = $s.Replace(
  "setUser: (user) => set({ user, currentView: user ? 'dashboard' : 'login' }),",
  "setUser: (user) => set({ user, currentView: user ? (user.role === 'admin' ? 'admin-users' : 'dashboard') : 'login' }),"
)
Set-Content 'src\store\useAppStore.ts' -Value $s -Encoding UTF8
Write-Host '[OK] Store: admin -> admin-users' -ForegroundColor Green

# 2. Remove dashboard from admin sidebar
$sb = Get-Content 'src\components\asd\Sidebar.tsx' -Raw
$sb = $sb.Replace(
  "{ key: 'dashboard', icon: LayoutDashboard, labelKey: 'dashboard', roles: ['admin', 'doctor', 'monitor', 'patient'] },",
  "{ key: 'dashboard', icon: LayoutDashboard, labelKey: 'dashboard', roles: ['doctor', 'monitor', 'patient'] },"
)
Set-Content 'src\components\asd\Sidebar.tsx' -Value $sb -Encoding UTF8
Write-Host '[OK] Sidebar: removed dashboard from admin' -ForegroundColor Green

Write-Host ''
Write-Host 'git add . ; git commit -m "admin no dashboard" ; git push' -ForegroundColor Yellow
