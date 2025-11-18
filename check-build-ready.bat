@echo off
echo ========================================
echo Checking Build Requirements
echo ========================================
echo.

set "allGood=1"

echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Node.js NOT found
    echo   Install from: https://nodejs.org/
    set "allGood=0"
) else (
    for /f "tokens=*" %%i in ('node --version') do set nodeVersion=%%i
    echo ✓ Node.js found: %nodeVersion%
)
echo.

echo Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ✗ npm NOT found
    set "allGood=0"
) else (
    for /f "tokens=*" %%i in ('npm --version') do set npmVersion=%%i
    echo ✓ npm found: %npmVersion%
)
echo.

echo Checking Java...
java -version >nul 2>&1
if errorlevel 1 (
    echo ✗ Java NOT found
    echo   Install JDK 11 or higher
    echo   Download from: https://adoptium.net/
    set "allGood=0"
) else (
    echo ✓ Java found
    java -version 2>&1 | findstr /i "version"
)
echo.

echo Checking Android SDK...
if exist "%ANDROID_HOME%\platform-tools\adb.exe" (
    echo ✓ Android SDK found: %ANDROID_HOME%
) else if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" (
    echo ✓ Android SDK found: %LOCALAPPDATA%\Android\Sdk
) else (
    echo ✗ Android SDK NOT found
    echo   Install Android Studio from: https://developer.android.com/studio
    set "allGood=0"
)
echo.

echo Checking Capacitor...
if exist "capacitor.config.ts" (
    echo ✓ Capacitor config found
) else (
    echo ✗ Capacitor config NOT found
    set "allGood=0"
)
echo.

echo Checking Android project...
if exist "android\app\build.gradle" (
    echo ✓ Android project found
) else (
    echo ✗ Android project NOT found
    echo   Run: npx cap add android
    set "allGood=0"
)
echo.

echo Checking node_modules...
if exist "node_modules" (
    echo ✓ Dependencies installed
) else (
    echo ✗ Dependencies NOT installed
    echo   Run: npm install
    set "allGood=0"
)
echo.

echo ========================================
if "%allGood%"=="1" (
    echo ✓ All requirements met!
    echo.
    echo You're ready to build the APK.
    echo Run: build-apk.bat
) else (
    echo ✗ Some requirements are missing
    echo.
    echo Please install missing components and try again.
)
echo ========================================
echo.
pause
