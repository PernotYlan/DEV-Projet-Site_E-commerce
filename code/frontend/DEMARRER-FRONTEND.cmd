@echo off
rem ============================================================
rem  Demarre le site CYNA (frontend React) en mode API reelle.
rem  Le back-end doit tourner en parallele (DEMARRER-BACKEND.cmd).
rem  Double-cliquez. Site sur http://localhost:5173
rem ============================================================
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"

if not exist node_modules (
  echo Premiere utilisation : installation des dependances...
  call npm install
)

echo.
echo Site CYNA sur http://localhost:5173  (Ctrl+C pour arreter)
echo.
start "" http://localhost:5173
npm run dev
