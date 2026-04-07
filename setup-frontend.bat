@echo off
REM GCEK Central Frontend Setup Script
REM Run this script from the gcek-central directory

echo =============================================
echo    GCEK Central Frontend Setup
echo =============================================
echo.

cd /d "%~dp0"

echo Step 1: Creating directory structure...
mkdir frontend 2>nul
mkdir frontend\src 2>nul
mkdir frontend\src\components 2>nul
mkdir frontend\src\pages 2>nul
mkdir frontend\src\pages\dashboards 2>nul
mkdir frontend\src\hooks 2>nul
mkdir frontend\src\utils 2>nul
mkdir frontend\public 2>nul

echo Done!
echo.
echo =============================================
echo NEXT STEPS:
echo =============================================
echo.
echo 1. Copy files from FRONTEND_FILES_PART1.md,
echo    FRONTEND_FILES_PART2.md, and FRONTEND_FILES_PART3.md
echo    into the frontend folder structure.
echo.
echo 2. Run in the frontend folder:
echo      npm install
echo.
echo 3. Create frontend\.env file with:
echo      VITE_API_URL=your-api-gateway-url
echo      VITE_COGNITO_REGION=ap-south-1
echo      VITE_COGNITO_USER_POOL_ID=your-pool-id
echo      VITE_COGNITO_APP_CLIENT_ID=your-client-id
echo.
echo 4. Start development:
echo      npm run dev
echo.
echo =============================================
pause
