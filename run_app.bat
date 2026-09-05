@echo off
title NSE Momentum Screener - Full Stack
color 0b

echo ====================================================================
echo             NSE DUAL-HORIZON MOMENTUM SCREENER
echo                Full-Stack TypeScript Platform
echo ====================================================================
echo.

echo [1/2] Launching TypeScript Backend API (Port 5000)...
start "NSE Momentum Backend" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 2 /nobreak >nul

echo [2/2] Launching React Vite Frontend (Port 5173)...
start "NSE Momentum Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ====================================================================
echo  Platform is now running!
echo  Frontend UI: http://localhost:5173
echo  Backend API: http://localhost:5000/api
echo ====================================================================
echo.

start http://localhost:5173
