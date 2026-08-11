$lines = Get-Content 'src\app\page.tsx'
$out = @()
foreach ($line in $lines) {
  if ($line -match 'onClick=\{toggleLang\}') {
    $out += '            <button'
    $out += '              onClick={toggleDarkMode}'
    $out += '              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"'
    $out += '              title="Dark mode"'
    $out += '            >'
    $out += '              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}'
    $out += '            </button>'
  }
  $out += $line
}
Set-Content 'src\app\page.tsx' -Value $out -Encoding UTF8
Write-Host 'Button added to page.tsx' -ForegroundColor Green