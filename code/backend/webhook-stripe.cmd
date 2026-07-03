@echo off
rem ============================================================
rem  Relais des webhooks Stripe vers le backend local.
rem  À lancer (et laisser ouvert) pendant les tests de paiement.
rem  Récupère la clé secrète depuis .env, pas besoin de "stripe login".
rem ============================================================
setlocal
cd /d "%~dp0"

rem Ajoute le Stripe CLI au PATH (installé via winget)
set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\Stripe.StripeCli_Microsoft.Winget.Source_8wekyb3d8bbwe;%PATH%"

rem Lit STRIPE_SECRET_KEY depuis .env
for /f "tokens=1,* delims==" %%a in ('findstr /b "STRIPE_SECRET_KEY=" .env') do set "SK=%%b"

echo Relais des webhooks Stripe vers http://localhost:3000/api/paiement/webhook
echo (laisser cette fenetre ouverte pendant les tests, Ctrl+C pour arreter)
echo.
stripe listen --api-key %SK% --forward-to localhost:3000/api/paiement/webhook
