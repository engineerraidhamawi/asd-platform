$c = Get-Content 'src\components\asd\DashboardView.tsx' -Raw
$c = $c.Replace('Alert Panel */', 'Alert Panel */}')
Set-Content 'src\components\asd\DashboardView.tsx' -Value $c -Encoding UTF8
Write-Host 'Fixed' -ForegroundColor Green
