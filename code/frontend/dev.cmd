@echo off
rem Lance le serveur de dev Vite en s'assurant que Node.js est dans le PATH
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
npm run dev
