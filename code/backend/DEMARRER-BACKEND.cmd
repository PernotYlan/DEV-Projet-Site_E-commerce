@echo off
rem ============================================================
rem  Demarre l'API back-end CYNA (connectee a PostgreSQL cyna_db)
rem  Double-cliquez sur ce fichier. API sur http://localhost:3000
rem ============================================================
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"

if not exist node_modules (
  echo Premiere utilisation : installation des dependances...
  call npm install
)

echo.
echo API CYNA sur http://localhost:3000  (Ctrl+C pour arreter)
echo.
npm run dev
