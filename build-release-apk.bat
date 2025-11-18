@echo off
echo ========================================
echo Building Talent Track RELEASE APK
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

echo Step 2: Building web app for production...
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

echo Step 4: Building release APK with Gradle...
echo.
cd android
call gradlew assembleRelease
if errorlevel 1 (
    echo.
    echo ERROR: Release build failed!
    echo.
    echo This might be because:
    echo 1. You haven't set up signing keys yet
    echo 2. Gradle is not configured properly
    echo.
    echo To fix:
    echo 1. Generate signing key (see MOBILE_APK_SETUP.md)
    echo 2. Create android/key.properties file
    echo 3. Update android/app/build.gradle
    echo.
    echo OR use Android Studio:
    echo 1. Run: npx cap open android
    echo 2. Build ^> Generate Signed Bundle / APK
    echo 3. Follow the wizard
    echo.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo ✓ Release APK built successfully!
echo ========================================
echo.
echo APK location: android\app\build\outputs\apk\release\app-release.apk
echo.
echo Next steps:
echo 1. Test the APK on your device
echo 2. Distribute via Google Play Store or direct download
echo.
pause
