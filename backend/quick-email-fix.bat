@echo off
echo ============================================
echo GCEK Central - Quick Email Fix
echo ============================================
echo.
echo This will configure OTP email with Cognito default sender
echo so signup verification works even when SES is in sandbox.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-cognito-email.ps1" -EmailMode cognito-default

if errorlevel 1 (
echo.
echo Quick fix failed. Check error output above.
exit /b 1
)

echo.
echo ============================================
echo Done! Try signing up again.
echo ============================================
echo.
echo NOTE:
echo 1. Check spam/junk folder
echo 2. For production volume, move SES out of sandbox and run setup-cognito-email.ps1 in auto/ses mode
echo.
pause
