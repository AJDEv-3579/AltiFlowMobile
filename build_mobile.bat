@echo off
echo ========================================================
echo   AltiFlow Mobile - Pulling Latest and Building APK
echo ========================================================
echo.

echo [1/3] Pulling latest changes from GitHub...
git pull
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to pull latest changes from git.
    goto end
)
echo.

echo [2/3] Installing/Syncing packages...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install node_modules.
    goto end
)
echo.

echo [3/3] Initiating EAS Android build...
call npx eas-cli build --platform android --profile preview
if %errorlevel% neq 0 (
    echo.
    echo ERROR: EAS Build failed.
    goto end
)
echo.
echo Build initiated successfully! Download link will be shown above.

:end
pause
