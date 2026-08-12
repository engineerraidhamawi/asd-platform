# Restore charts from git + fix syntax + dark mode
Write-Host 'Step 1: Restore DashboardView...' -NoNewline
git show 5e9aeb4:src/components/asd/DashboardView.tsx | Set-Content -Path (Join-Path $PWD 'src' 'components' 'asd' 'DashboardView.tsx') -Encoding UTF8
Write-Host ' OK' -ForegroundColor Green

Write-Host 'Step 2: Fix syntax...' -NoNewline
$p = Join-Path $PWD 'src' 'components' 'asd' 'DashboardView.tsx'
$c = Get-Content $p -Raw
$c = $c.Replace('Alert Panel */', 'Alert Panel */')
Set-Content $p -Value $c -Encoding UTF8
Write-Host ' OK' -ForegroundColor Green

Write-Host 'Step 3: api.ts...' -NoNewline
$libDir = Join-Path $PWD 'src' 'lib'
$apiPath = Join-Path $libDir 'api.ts'
if (-not (Test-Path $apiPath)) {
  New-Item -ItemType Directory -Force -Path $libDir | Out-Null
  $apiCode = 'export function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {' + [char]10
  $apiCode += '  const userId = typeof localStorage !== "undefined" ? localStorage.getItem("userId") : null;' + [char]10
  $apiCode += '  const userRole = typeof localStorage !== "undefined" ? localStorage.getItem("userRole") : null;' + [char]10
  $apiCode += '  const headers = new Headers(options.headers || {});' + [char]10
  $apiCode += '  if (userId) headers.set("x-user-id", userId);' + [char]10
  $apiCode += '  if (userRole) headers.set("x-user-role", userRole);' + [char]10
  $apiCode += '  return fetch(url, { ...options, headers });' + [char]10
  $apiCode += '}' + [char]10
  Set-Content $apiPath -Value $apiCode -Encoding UTF8
  Write-Host ' created' -ForegroundColor Green
} else {
  Write-Host ' exists' -ForegroundColor Yellow
}

Write-Host 'Step 4: Dark mode button...' -NoNewline
$pp = Join-Path $PWD 'src' 'app' 'page.tsx'
$pg = Get-Content $pp -Raw
if ($pg -match 'toggleDarkMode') {
  $lines = Get-Content $pp
  $hasBtn = $false
  foreach ($l in $lines) { if ($l -match 'toggleDarkMode' -and $l -match 'onClick') { $hasBtn = $true; break } }
  if ($hasBtn) { Write-Host ' already has button' -ForegroundColor Yellow }
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
    Set-Content $pp -Value $out -Encoding UTF8
    Write-Host ' added' -ForegroundColor Green
  }
} else {
  Write-Host ' skip (no darkMode var)' -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Done! Run: git add . ; git commit -m "restore all" ; git push' -ForegroundColor Yellow
