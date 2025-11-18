@echo off
setlocal enabledelayedexpansion

title Talent Track APK Builder

:menu
cls
echo ========================================
echo   TALENT TRACK APK BUILDER
echo ========================================
echo.
echo Choose an option:
echo.
echo 1. Diagnose Build Environment
echo 2. Build Debug APK (for testing)
echo 3. Build Release APK (for distribution)
echo 4. Install APK to connected device (ADB)
echo 5. Clean build files
echo 6. Exit
echo.
set /p choice="Enter choice (1-6): "

if "%choice%"=="1" goto diagnose
if "%choice%"=="2" goto build_debug
if "%choice%"=="3" goto build_release
if "%choice%"=="4" goto install_apk
if "%choice%"=="5" goto clean
if "%choice%"=="6" goto end

echo Invalid choice. Press any key to try again...
pause >nul
goto menu

:diagnose
cls
echo ========================================
echo Running Diagnostics...
echo ========================================
echo.
call diagnose-build.bat
goto menu

:build_debug
cls
echo ========================================
echo Building Debug APK
echo ========================================
echo.
call build-apk-cli.bat
echo.
echo Press any key to return to menu...
pause >nul
goto menu

:build_release
cls
echo ========================================
echo Building Release APK
echo ========================================
echo.
call build-release-cli.bat
echo.
echo Press any key to return to menu...
pause >nul
goto menu

:install_apk
cls
echo ========================================
echo Install APK via ADB
echo ========================================
echo.

:: Check if ADB is available
adb version >nul 2>&1
if errorlevel 1 (
    echo ADB not found!
    echo.
    echo Please install Android SDK Platform Tools
    echo Or add ADB to your PATH
    echo.
    pause
    goto menu
)

:: Check for connected devices
echo Checking for connected devices...
adb devices
echo.

:: Ask which APK to install
echo Which APK do you want to install?
echo.
echo 1. Debug APK (app-debug.apk)
echo 2. Release APK (app-release.apk)
echo 3. Cancel
echo.
set /p apk_choice="Enter choice (1-3): "

if "%apk_choice%"=="1" (
    set "APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk"
) else if "%apk_choice%"=="2" (
    set "APK_PATH=android\app\build\outputs\apk\release\app-release.apk"
) else (
    goto menu
)

if not exist "!APK_PATH!" (
    echo.
    echo APK not found: !APK_PATH!
    echo Please build the APK first.
    echo.
    pause
    goto menu
)

echo.
echo Installing !APK_PATH!...
adb install -r "!APK_PATH!"

if errorlevel 1 (
    echo.
    echo Installation failed!
    echo.
    echo Common issues:
    echo 1. Device not connected
    echo 2. USB debugging not enabled
    echo 3. App already installed (try uninstalling first)
    echo.
) else (
    echo.
    echo ✓ Installation successful!
    echo.
    echo You can now open Talent Track on your device.
    echo.
)

pause
goto menu

:clean
cls
echo ========================================
echo Cleaning Build Files
echo ========================================
echo.

echo Cleaning Android build...
if exist "android" (
    cd android
    call gradlew clean
    cd ..
    echo ✓ Android build cleaned
)

echo.
echo Cleaning web build...
if exist "dist" (
    rmdir /s /q dist
    echo ✓ Web build cleaned
)

echo.
echo Cleaning node_modules (optional)...
set /p clean_node="Do you want to clean node_modules? (y/n): "
if /i "%clean_node%"=="y" (
    if exist "node_modules" (
        echo This may take a while...
        rmdir /s /q node_modules
        echo ✓ node_modules cleaned
        echo Run 'npm install' before building again
    )
)

echo.
echo Clean complete!
echo.
pause
goto menu

:end
echo.
echo Goodbye!
timeout /t 2 >nul
exit /b 0
