# 1. DashboardView with all charts
Write-Host 'Writing DashboardView.tsx...' -NoNewline
$dv=(Invoke-WebRequest 'https://paste.c-net.org/PrideColder' -UseBasicParsing).Content.Trim()
[System.IO.File]::WriteAllBytes("$PWD\src\components\asd\DashboardView.tsx",[System.Convert]::FromBase64String($dv))
Write-Host ' OK' -ForegroundColor Green

# 2. apiFetch helper (needed by DashboardView)
if (-not (Test-Path 'src\lib\api.ts')) {
  Write-Host 'Writing api.ts...' -NoNewline
  $api=(Invoke-WebRequest 'https://paste.c-net.org/MechaNirvana' -UseBasicParsing).Content.Trim()
  New-Item -ItemType Directory -Force -Path 'src\lib' | Out-Null
  [System.IO.File]::WriteAllBytes("$PWD\src\lib\api.ts",[System.Convert]::FromBase64String($api))
  Write-Host ' OK' -ForegroundColor Green
} else {
  Write-Host 'api.ts exists, skipping' -ForegroundColor Yellow
}

# 3. Fix dark mode button in page.tsx
$pg = Get-Content 'src\app\page.tsx' -Raw
if ($pg -match 'onClick=\{toggleDarkMode\}') {
  Write-Host 'page.tsx already has dark mode button' -ForegroundColor Yellow
} else {
  $lines = Get-Content 'src\app\page.tsx'
  $out = @()
  $found = $false
  foreach ($line in $lines) {
    if ((-not $found) -and ($line -match 'onClick=\{toggleLang\}')) {
      $out += '            <button onClick={toggleDarkMode} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">'
      $out += '              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}'
      $out += '            </button>'
      $found = $true
    }
    $out += $line
  }
  Set-Content 'src\app\page.tsx' -Value $out -Encoding UTF8
  Write-Host 'Dark mode button added to page.tsx' -ForegroundColor Green
}

Write-Host ''
Write-Host 'git add . ; git commit -m "restore charts + dark mode" ; git push' -ForegroundColor Yellow