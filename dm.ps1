$part1 = (Invoke-WebRequest -Uri 'https://paste.c-net.org/ClearsLyndon' -UseBasicParsing).Content.Trim()
$part2 = (Invoke-WebRequest -Uri 'https://paste.c-net.org/BottleChats' -UseBasicParsing).Content.Trim()
$b64 = $part1 + $part2
$bytes = [System.Convert]::FromBase64String($b64)
$all = [System.Text.Encoding]::UTF8.GetString($bytes)
$parts = $all -split '<<<SPLIT>>>'
$parts[0] | Set-Content -Path 'src\store\useAppStore.ts' -Encoding UTF8 -NoNewline
Write-Host '  [OK] useAppStore.ts' -ForegroundColor Green
$parts[1] | Set-Content -Path 'src\components\asd\LoginView.tsx' -Encoding UTF8 -NoNewline
Write-Host '  [OK] LoginView.tsx' -ForegroundColor Green
$parts[2] | Set-Content -Path 'src\app\page.tsx' -Encoding UTF8 -NoNewline
Write-Host '  [OK] page.tsx' -ForegroundColor Green
Write-Host ''
Write-Host 'Files written. Now run: git add . ; git commit -m "fix dark mode" ; git push' -ForegroundColor Yellow
