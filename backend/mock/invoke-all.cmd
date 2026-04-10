@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0invoke-all.ps1" %*
exit /b %errorlevel%
