$backupDir = "backup_working_20260318_121109"

Copy-Item "$backupDir\main.js" "src\main.js" -Force
Copy-Item "$backupDir\index.html" "src\index.html" -Force
Copy-Item "$backupDir\styles.css" "src\styles.css" -Force
if (Test-Path "$backupDir\csv-import.js") { Copy-Item "$backupDir\csv-import.js" "src\importers\csv-import.js" -Force }
Copy-Item "$backupDir\tauri.conf.json" "src-tauri\tauri.conf.json" -Force

Get-Process hazpenztar -ErrorAction SilentlyContinue | Stop-Process -Force
npm run tauri build
Start-Process ".\src-tauri\target\release\hazpenztar.exe"