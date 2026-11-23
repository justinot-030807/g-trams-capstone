@echo off
TITLE G-TRAMS Local Offline Demo Starter
COLOR 0A

echo ==============================================================================
echo     G-TRAMS: GASAN TRICYCLE RECORDS AND APPLICATION MANAGEMENT SYSTEM
echo                 Capstone Defense Emergency Localhost Starter
echo ==============================================================================
echo.
echo [1/3] Starting Backend API Server (Node.js/Express on Port 3000)...
start "G-TRAMS Backend API" cmd /k "cd /d %~dp0backend && npm start"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Frontend Client (React 19 / Vite on Port 5173)...
start "G-TRAMS Frontend Web" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Opening Browser to Localhost Web App...
start http://localhost:5173

echo.
echo ==============================================================================
echo  SYSTEM ONLINE!
echo  Frontend URL: http://localhost:5173  |  Backend API: http://localhost:3000
echo.
echo  OFFICIAL DEMO TESTER CREDENTIALS (Password: Password123!):
echo  - System Admin:       admin.tester@gtrams.com
echo  - OVM / LLSA I Staff: llsa.tester@gtrams.com
echo  - Operator 1:         operator.tester@gtrams.com
echo  - Operator 2:         ian.operator@gtrams.com
echo  - TODA President:     todapres.tester@gtrams.com
echo  - Cashier:            cashier.tester@gtrams.com
echo ==============================================================================
echo.
echo Press any key to exit this launcher window (servers will remain running).
pause >nul
