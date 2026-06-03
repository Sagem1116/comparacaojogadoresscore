@echo off
REM start-dev.bat - Starts the dev server and opens the browser automatically

echo =============================================
echo Scoring app - start-dev script
echo =============================================

echo 1) Installing dependencies (skip by pressing CTRL+C now)
echo    Running: npm install
call npm install

echo.
echo 2) Starting Vite dev server in a new terminal window
echo    Running: npm run dev
start "Vite Dev" cmd /k "npm run dev"

echo.
echo 3) Waiting briefly for server to start, then opening browser
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo Done. The dev server is running in the new terminal window.
echo If the browser didn't open, visit http://localhost:5173 manually.
pause
