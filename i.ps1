$f = Get-Content 'src\app\page.tsx' -Raw
if ($f -match 'Moon, Sun') { Write-Host 'Import exists' -ForegroundColor Yellow; exit }
$f = $f.Replace("from 'lucide-react';", "from 'lucide-react';`nimport { Moon, Sun } from 'lucide-react';")
Set-Content 'src\app\page.tsx' -Value $f -Encoding UTF8
Write-Host 'Import added' -ForegroundColor Green
