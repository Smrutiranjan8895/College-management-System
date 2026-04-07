@echo off
REM GCEK Central - Cognito OTP Email Setup Wrapper

echo ============================================
echo GCEK Central - OTP Email Setup
echo ============================================
echo.
echo This script runs setup-cognito-email.ps1
echo and configures Cognito OTP email verification end-to-end.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-cognito-email.ps1"

if errorlevel 1 (
	echo.
	echo Setup failed. Check the error output above.
	exit /b 1
)

echo.
echo ============================================
echo Setup complete!
echo ============================================
echo.
echo You can now test signup and email OTP verification.
pause
