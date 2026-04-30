@echo off
setlocal EnableExtensions
cd /d "%~dp0" || exit /b 1

echo.
echo === VerMillion: Expo web export + Vercel production ===
echo    Directory: %CD%
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"
set "EC=%ERRORLEVEL%"

if %EC% neq 0 (
  echo.
  echo [ERROR] Deploy failed ^(exit code %EC%^).
  endlocal & exit /b %EC%
)

echo.
echo [OK] Finished.
endlocal & exit /b 0
