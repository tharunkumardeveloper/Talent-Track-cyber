@echo off
echo ========================================
echo Building Talent Track APK
echo ========================================
echo.

echo Step 1: Installing Capacitor plugins...
call npm install @capacitor/local-notifications @capacitor/camera @capacitor/filesystem @capacitor/app
if errorlevel 1 (
    echo ERROR: Failed to install plugins
    pause
    exit /b 1
)
echo ✓ Plugins installed
echo.

echo Step 2: Building web app...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo ✓ Web app built
echo.

echo Step 3: Syncing with Android...
call npx cap sync android
if errorlevel 1 (
    echo ERROR: Sync failed
    pause
    exit /b 1
)
echo ✓ Synced with Android
echo.

echo Step 4: Opening Android Studio...
echo.
echo IMPORTANT: In Android Studio, you need to:
echo 1. Wait for Gradle sync to complete
echo 2. Go to Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
echo 3. Wait for build to complete
echo 4. APK will be in: android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Press any key to open Android Studio...
pause > nul

call npx cap open android

echo.
echo ========================================
echo Build process started!
echo ========================================
echo.
echo After Android Studio opens:
echo 1. Wait for Gradle sync (bottom right corner)
echo 2. Click Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
echo 3. Wait for "BUILD SUCCESSFUL" message
echo 4. Click "locate" link to find your APK
echo.
echo APK location: android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
