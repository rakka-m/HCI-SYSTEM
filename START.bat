@echo off
setlocal
title PLMun Business Center - Shop / Cashier / Admin
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
  set RUN=python
) else (
  where py >nul 2>nul
  if %errorlevel%==0 ( set RUN=py ) else ( goto noPython )
)

echo Starting the local server for the three sites...
start "PLMun server" cmd /c "%RUN% -m http.server 8000"
timeout /t 2 >nul

start "" http://localhost:8000/index.html
start "" http://localhost:8000/cashier.html
start "" http://localhost:8000/admin.html

echo.
echo   Shop     http://localhost:8000/index.html
echo   Cashier  http://localhost:8000/cashier.html
echo   Admin    http://localhost:8000/admin.html
echo.
echo Keep the "PLMun server" window open while you demo.
echo Close that window when you are done.
echo.
pause
goto end

:noPython
echo.
echo Python was not found on this computer.
echo Install Python from https://www.python.org/downloads/ and run this file again.
echo.
echo You can still open the three HTML files directly, but some browsers
echo then stop them from sharing data, so the live sync may not work.
echo.
pause
:end
