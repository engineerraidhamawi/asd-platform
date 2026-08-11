# Fix dark mode - all files
Write-Host '=== Dark Mode Fix ===' -ForegroundColor Cyan

# 1. LoginView.tsx from base64
Write-Host 'Writing LoginView.tsx...' -NoNewline
$lv = (Invoke-WebRequest 'https://paste.c-net.org/CarolGibson' -UseBasicParsing).Content.Trim()
$lvBytes = [System.Convert]::FromBase64String($lv)
[System.IO.File]::WriteAllBytes("$PWD\src\components\asd\LoginView.tsx", $lvBytes)
Write-Host ' OK' -ForegroundColor Green

# 2. page.tsx - check and patch
Write-Host 'Checking page.tsx...' -NoNewline
$pg = Get-Content 'src\app\page.tsx' -Raw
if ($pg -match 'toggleDarkMode') {
  Write-Host ' already has dark mode, skipping' -ForegroundColor Yellow
} else {
  $lines = Get-Content 'src\app\page.tsx'
  $out = @()
  foreach ($line in $lines) {
    # Add Moon,Sun import
    if ($line -match "from 'lucide-react';" -and $line -notmatch 'Moon') {
      $out += $line -replace "from 'lucide-react';", "from 'lucide-react';`nimport { Moon, Sun } from 'lucide-react';"
    }
    # Add darkMode to store
    elseif ($line -match 'user, setUser \\}' -and $line -notmatch 'darkMode') {
      $out += $line -replace 'user, setUser \\}', 'user, setUser, darkMode, toggleDarkMode }'
    }
    # Add dark toggle button before lang button
    elseif ($line -match 'Button variant=.ghost. size=.sm. onClick=.toggleLang.') {
      $out += '            <button onClick={toggleDarkMode} className=''w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors''>'''
      $out += '              {darkMode ? <Sun className=''w-4 h-4'' /> : <Moon className=''w-4 h-4'' />}'''
      $out += '            </button>'
      $out += $line
    }
    else {
      $out += $line
    }
  }
  Set-Content 'src\app\page.tsx' -Value $out -Encoding UTF8
  Write-Host ' patched' -ForegroundColor Green
}

Write-Host ''
Write-Host 'git add . ; git commit -m "dark mode fix" ; git push' -ForegroundColor Yellow