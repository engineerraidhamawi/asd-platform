# Fix all - simple paths
$dvPath = 'src\components\asd\DashboardView.tsx'
$pgPath = 'src\app\page.tsx'
$apiPath = 'src\lib\api.ts'

# 1. Restore DashboardView from git
git show 5e9aeb4:src/components/asd/DashboardView.tsx | Set-Content $dvPath -Encoding UTF8
Write-Host '[OK] DashboardView restored' -ForegroundColor Green

# 2. Fix the syntax error
$c = Get-Content $dvPath -Raw
$c = $c.Replace('Alert Panel */', 'Alert Panel */')
Set-Content $dvPath -Value $c -Encoding UTF8
Write-Host '[OK] Syntax fixed' -ForegroundColor Green

# 3. Create api.ts
if (-not (Test-Path $apiPath)) {
  New-Item -ItemType Directory -Force -Path 'src\lib' | Out-Null
  'export function apiFetch(url: string, options: RequestInit = {}): Promise<Response> { const userId = typeof localStorage !== "undefined" ? localStorage.getItem("userId") : null; const userRole = typeof localStorage !== "undefined" ? localStorage.getItem("userRole") : null; const headers = new Headers(options.headers || {}); if (userId) headers.set("x-user-id", userId); if (userRole) headers.set("x-user-role", userRole); return fetch(url, { ...options, headers }); }' | Set-Content $apiPath -Encoding UTF8
  Write-Host '[OK] api.ts created' -ForegroundColor Green
} else { Write-Host '[--] api.ts exists' -ForegroundColor Yellow }

# 4. Dark mode button
$lines = Get-Content $pgPath
$hasBtn = $false
foreach ($l in $lines) { if ($l -match 'toggleDarkMode' -and $l -match 'onClick') { $hasBtn = $true; break } }
if ($hasBtn) { Write-Host '[--] Dark mode button exists' -ForegroundColor Yellow }
else {
  $out = @()
  foreach ($line in $lines) {
    if ($line -match 'onClick=\{toggleLang\}') {
      $out += '            <button onClick={toggleDarkMode} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">'
      $out += '              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}'
      $out += '            </button>'
    }
    $out += $line
  }
  Set-Content $pgPath -Value $out -Encoding UTF8
  Write-Host '[OK] Dark mode button added' -ForegroundColor Green
}

Write-Host 'git add . ; git commit -m "restore charts + dark mode" ; git push' -ForegroundColor Yellow
