@echo off
setlocal
cd /d "%~dp0.."

echo [verify] TypeScript check...
call npx tsc --noEmit
if errorlevel 1 exit /b 1

echo [verify] Jest unit tests...
call npm test
if errorlevel 1 exit /b 1

if "%SKIP_E2E%"=="1" (
  echo [verify] SKIP_E2E=1 — skipping Maestro
  exit /b 0
)

where maestro >nul 2>&1
if errorlevel 1 (
  echo [verify] Maestro not installed — skipping e2e. Install: https://maestro.mobile.dev
  exit /b 0
)

adb devices | findstr /R "device$" >nul
if errorlevel 1 (
  echo [verify] No Android device/emulator — skipping e2e.
  echo          Start emulator, install dev build, then run:
  echo          npm run test:e2e -- -e EMAIL=... -e PASSWORD=...
  exit /b 0
)

if "%EMAIL%"=="" (
  echo [verify] Set EMAIL and PASSWORD env vars to run Maestro e2e.
  exit /b 0
)

echo [verify] Maestro e2e...
call maestro test .maestro/smoke.yaml .maestro/shopping-add.yaml .maestro/recipe-add.yaml -e EMAIL=%EMAIL% -e PASSWORD=%PASSWORD%
exit /b %errorlevel%
