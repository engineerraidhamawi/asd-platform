$p=(Invoke-WebRequest 'https://paste.c-net.org/SantiagoMortals' -UseBasicParsing).Content.Trim()
$b=[System.Convert]::FromBase64String($p)
[System.IO.File]::WriteAllBytes("$PWD\src\components\asd\DashboardView.tsx",$b)
Write-Host '[OK] DashboardView.tsx' -ForegroundColor Green
Write-Host 'git add . ; git commit -m "fix dashboard" ; git push' -ForegroundColor Yellow
