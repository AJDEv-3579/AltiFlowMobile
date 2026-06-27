@echo off
echo =========================================
echo  AltiFlow Mobile - Pull & Build Script
echo =========================================

echo.
echo Pulling latest changes from GitHub...
git pull origin main

echo.
echo Installing dependencies (just in case)...
call npm install

echo.
echo Building Android App Locally via EAS...
echo Ensure EXPO_PUBLIC_API_BASE is set if you want to override the production URL.
call npx eas-cli build --platform android --profile preview --local

echo.
echo Build process finished!
pause
