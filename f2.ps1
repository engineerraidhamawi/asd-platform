$p = (Invoke-WebRequest 'https://paste.c-net.org/SproutBethy' -UseBasicParsing).Content.Trim()
$b = [System.Convert]::FromBase64String($p)
[System.IO.File]::WriteAllBytes("$PWD\src\app\page.tsx", $b)
Write-Host '[OK] page.tsx' -ForegroundColor Green

$p2 = (Invoke-WebRequest 'https://paste.c-net.org/ElopedDimera' -UseBasicParsing).Content.Trim()
$b2 = [System.Convert]::FromBase64String($p2)
[System.IO.File]::WriteAllBytes("$PWD\src\components\asd\PatientDetailView.tsx", $b2)
Write-Host '[OK] PatientDetailView.tsx' -ForegroundColor Green

Write-Host 'Now: git add . ; git commit -m "fix" ; git push' -ForegroundColor Yellow
