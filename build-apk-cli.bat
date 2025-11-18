@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Talent Track APK Builder (CLI)
echo ========================================
echo.

:: Set colors for output
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "NC=[0m"

:: Step 1: Check requirements
echo [1/8] Checking requirements...
echo.

node --version >nul 2>&1
if errorlevel 1 (
    echo %RED%✗ Node.js not found%NC%
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo %GREEN%✓ Node.js found%NC%

java -version >nul 2>&1
if errorlevel 1 (
    echo %RED%✗ Java not found%NC%
    echo Please install Java JDK 11+ from https://adoptium.net/
    pause
    exit /b 1
)
echo %GREEN%✓ Java found%NC%

if not exist "android\gradlew.bat" (
    echo %RED%✗ Gradle wrapper not found%NC%
    echo Please run: npx cap add android
    pause
    exit /b 1
)
echo %GREEN%✓ Gradle wrapper found%NC%
echo.

:: Step 2: Install dependencies
echo [2/8] Installing npm dependencies...
call npm install
if errorlevel 1 (
    echo %RED%✗ npm install failed%NC%
    pause
    exit /b 1
)
echo %GREEN%✓ Dependencies installed%NC%
echo.

:: Step 3: Install Capacitor plugins
echo [3/8] Installing Capacitor plugins...
call npm install @capacitor/local-notifications @capacitor/camera @capacitor/filesystem @capacitor/app
if errorlevel 1 (
    echo %RED%✗ Plugin installation failed%NC%
    pause
    exit /b 1
)
echo %GREEN%✓ Capacitor plugins installed%NC%
echo.

:: Step 4: Build web app
echo [4/8] Building web application...
call npm run build
if errorlevel 1 (
    echo %RED%✗ Web build failed%NC%
    pause
    exit /b 1
)
echo %GREEN%✓ Web app built successfully%NC%
echo.

:: Step 5: Sync with Android
echo [5/8] Syncing with Android project...
call npx cap sync android
if errorlevel 1 (
    echo %RED%✗ Capacitor sync failed%NC%
    pause
    exit /b 1
)
echo %GREEN%✓ Synced with Android%NC%
echo.

:: Step 6: Clean previous builds
echo [6/8] Cleaning previous builds...
cd android
call gradlew clean
if errorlevel 1 (
    echo %YELLOW%⚠ Clean failed (continuing anyway)%NC%
)
cd ..
echo %GREEN%✓ Cleaned%NC%
echo.

:: Step 7: Build APK with Gradle
echo [7/8] Building APK with Gradle...
echo This may take a few minutes on first build...
echo.
cd android
call gradlew assembleDebug --stacktrace
if errorlevel 1 (
    echo.
    echo %RED%✗ Gradle build failed%NC%
    echo.
    echo Common issues:
    echo 1. Java version mismatch - need JDK 11 or 17
    echo 2. Android SDK not found - set ANDROID_HOME environment variable
    echo 3. Gradle daemon issues - try: gradlew --stop
    echo.
    cd ..
    pause
    exit /b 1
)
cd ..
echo.
echo %GREEN%✓ APK built successfully!%NC%
echo.

:: Step 8: Locate APK
echo [8/8] Locating APK...
set "APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk"
if exist "%APK_PATH%" (
    echo %GREEN%✓ APK found!%NC%
    echo.
    echo ========================================
    echo SUCCESS! APK Built
    echo ========================================
    echo.
    echo Location: %APK_PATH%
    echo.
    for %%A in ("%APK_PATH%") do (
        set "size=%%~zA"
        set /a "sizeMB=!size! / 1048576"
        echo Size: !sizeMB! MB
    )
    echo.
    echo Next steps:
    echo 1. Transfer APK to your Android device
    echo 2. Enable "Install from Unknown Sources"
    echo 3. Install and test the app
    echo.
    echo To install via ADB:
    echo   adb install "%APK_PATH%"
    echo.
) else (
    echo %RED%✗ APK not found at expected location%NC%
    echo Expected: %APK_PATH%
    echo.
    echo Check android\app\build\outputs\apk\ folder manually
)

pause
