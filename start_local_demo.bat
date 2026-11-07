@echo off
TITLE G-TRaMS Local Offline Demo Starter
COLOR 0A

echo ==============================================================================
echo       G-TRAMS: GASAN TRICYCLE FRANCHISE RECORDS AND MONITORING SYSTEM
echo                 Capstone Defense Emergency Localhost Starter
echo ==============================================================================
echo.
echo [1/3] Starting Backend API Server (Node.js/Express on Port 5000)...
start "G-TRaMS Backend API" cmd /k "cd /d %~dp0backend && npm start"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Frontend Client (React 19 / Vite on Port 5173)...
start "G-TRaMS Frontend Web" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Opening Browser to Localhost Web App...
start http://localhost:5173

echo.
echo ==============================================================================
echo  SYSTEM ONLINE!
echo  URL: http://localhost:5173
echo.
echo  OFFICIAL DEMO TESTER CREDENTIALS:
echo  - System Admin:    admin.tester@gtrams.com    / Password123!
echo  - BPLO Officer:    bplo.tester@gtrams.com     / Password123!
echo  - Operator:        operator.tester@gtrams.com / Password123!
echo  - TODA President:  todapres.tester@gtrams.com / Password123!
echo  - Cashier:         cashier.tester@gtrams.com  / Password123!
echo ==============================================================================
echo.
echo Press any key to exit this launcher window (servers will remain running).
pause >nul
