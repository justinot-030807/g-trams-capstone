@echo off
title G-TRAMS Capstone Defense Demo Launcher - Group 5
color 0F
cls

echo ==============================================================================
echo        G-TRAMS: GASAN TRICYCLE REGULATORY AND MANAGEMENT SYSTEM
echo        Marinduque State University - College of Information and Computing Sciences
echo        Group 5 Capstone Defense Launcher
echo ==============================================================================
echo.
echo  [1] Open Cloud Production Demo (https://g-trams-official.vercel.app)
echo  [2] Start Local Offline Server & App (0%% Internet Fallback)
echo  [3] Open Interactive Defense Slide Deck (docs/presentation.html)
echo  [4] Open Deliverable #7 User's Manual (PDF)
echo  [5] Run Backend Test Suite (Verify 201 Tests)
echo  [6] Exit
echo.
echo ==============================================================================
set /p opt="Piliin ang numero (1-6): "

if "%opt%"=="1" goto cloud_demo
if "%opt%"=="2" goto local_demo
if "%opt%"=="3" goto slides
if "%opt%"=="4" goto manual_pdf
if "%opt%"=="5" goto run_tests
if "%opt%"=="6" goto exit_app
goto exit_app

:cloud_demo
echo.
echo [INFO] Binubuksan ang Live Production Web App at Presentation...
start "" "https://g-trams-official.vercel.app"
start "" "%~dp0docs\presentation.html"
goto end

:local_demo
echo.
echo [INFO] Sinisimulan ang Local Offline Backend (Port 5000)...
start "G-TRAMS Backend Server" cmd /k "cd /d %~dp0backend && npm start"
timeout /t 3 /nobreak >nul

echo [INFO] Sinisimulan ang Local Offline Frontend (Port 5173)...
start "G-TRAMS Frontend Web" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo [INFO] Binubuksan ang Browser sa Localhost...
start "" "http://localhost:5173"
goto end

:slides
echo.
echo [INFO] Binubuksan ang Offline Slide Deck...
start "" "%~dp0docs\presentation.html"
goto end

:manual_pdf
echo.
echo [INFO] Binubuksan ang Deliverable 7 User's Manual PDF...
start "" "%~dp0Deliverable7_Group5_GTRAMS_UsersManual.pdf"
goto end

:run_tests
echo.
echo [INFO] Pinapatakbo ang Jest Test Suite...
cd /d %~dp0backend && npm test
pause
goto end

:exit_app
exit

:end
echo.
echo [TAGUMPAY] Handang-handa na ang inyong demo para sa Defense Day!
timeout /t 5 >nul
exit
