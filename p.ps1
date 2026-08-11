# Step 1: Restore working page.tsx from git
git checkout 5e9aeb4 -- src/app/page.tsx
Write-Host 'Restored page.tsx' -ForegroundColor Green

# Step 2: Read file
$f = Get-Content 'src/app/page.tsx' -Raw

# Step 3: Apply dark mode patches
$f = $f.Replace("from 'lucide-react';", "from 'lucide-react';`nimport { Moon, Sun } from 'lucide-react';")

$f = $f.Replace('const { currentView, patientName, navigate, user, setUser }', 'const { currentView, patientName, navigate, user, setUser, darkMode, toggleDarkMode }')

$f = $f.Replace("style={{ background: '#F0F7FF' }} dir={dir}", "className='min-h-screen flex flex-col bg-[#F0F7FF] dark:bg-slate-950' dir={dir}")

# Add dark mode toggle button before language button
$old = "<Button variant='ghost' size='sm' onClick={toggleLang}"
$new = "<button onClick={toggleDarkMode} className='w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors' title='Dark mode'>{darkMode ? <Sun className='w-4 h-4' /> : <Moon className='w-4 h-4' />}</button>`n            <Button variant='ghost' size='sm' onClick={toggleLang}"
$f = $f.Replace($old, $new)

# Write back
Set-Content 'src/app/page.tsx' -Value $f -Encoding UTF8
Write-Host 'Patched page.tsx with dark mode' -ForegroundColor Green
