$lines = Get-Content 'src\app\page.tsx'
$out = @()
foreach ($line in $lines) {
  $out += $line
  if ($line -match 'lucide-react' -and $line -notmatch 'Moon') {
    $out += "import { Moon, Sun } from 'lucide-react';"
    Write-Host 'Import inserted' -ForegroundColor Green
  }
}
Set-Content 'src\app\page.tsx' -Value $out -Encoding UTF8