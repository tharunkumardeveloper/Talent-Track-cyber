@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Talent Track RELEASE APK Builder (CLI)
echo ========================================
echo.

:: Check if signing key exists
if not exist "talent-track-key.keystore" (
    echo No signing key found. Creating one...
    echo.
    echo Please enter the following information:
    echo.
    
    keytool -genkey -v -keystore talent-track-key.keystore -alias talent-track -keyalg RSA -keysize 2048 -validity 10000
    
    if errorlevel 1 (
        echo.
        echo Failed to create signing key.
        pause
        exit /b 1
    )
    
    echo.
    echo Signing key created: talent-track-key.keystore
    echo IMPORTANT: Keep this file safe! You'll need it for all future updates.
    echo.
)

:: Check if key.properties exists
if not exist "android\key.properties" (
    echo.
    echo Creating android\key.properties file...
    echo.
    set /p storePassword="Enter keystore password: "
    set /p keyPassword="Enter key password: "
    
    (
        echo storePassword=!storePassword!
        echo keyPassword=!keyPassword!
        echo keyAlias=talent-track
        echo storeFile=../talent-track-key.keystore
    ) > android\key.properties
    
    echo key.properties created
    echo.
)

:: Step 1: Install dependencies
echo [1/7] Installing dependencies...
call npm install
if errorlevel 1 (
    echo Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

:: Step 2: Install Capacitor plugins
echo [2/7] Installing Capacitor plugins...
call npm install @capacitor/local-notifications @capacitor/camera @capacitor/filesystem @capacitor/app
if errorlevel 1 (
    echo Failed to install plugins
    pause
    exit /b 1
)
echo ✓ Plugins installed
echo.

:: Step 3: Build web app
echo [3/7] Building web application...
call npm run build
if errorlevel 1 (
    echo Web build failed
    pause
    exit /b 1
)
echo ✓ Web app built
echo.

:: Step 4: Sync with Android
echo [4/7] Syncing with Android...
call npx cap sync android
if errorlevel 1 (
    echo Sync failed
    pause
    exit /b 1
)
echo ✓ Synced
echo.

:: Step 5: Clean
echo [5/7] Cleaning previous builds...
cd android
call gradlew clean
cd ..
echo ✓ Cleaned
echo.

:: Step 6: Build release APK
echo [6/7] Building RELEASE APK...
echo This may take several minutes...
echo.
cd android
call gradlew assembleRelease --stacktrace
if errorlevel 1 (
    echo.
    echo Build failed!
    echo.
    echo Possible issues:
    echo 1. Signing configuration incorrect
    echo 2. Check android\key.properties file
    echo 3. Verify keystore password
    echo.
    cd ..
    pause
    exit /b 1
)
cd ..
echo.
echo ✓ Release APK built!
echo.

:: Step 7: Locate APK
echo [7/7] Locating release APK...
set "APK_PATH=android\app\build\outputs\apk\release\app-release.apk"
if exist "%APK_PATH%" (
    echo ✓ APK found!
    echo.
    echo ========================================
    echo SUCCESS! Release APK Built
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
    echo This APK is:
    echo ✓ Signed with your key
    echo ✓ Optimized for release
    echo ✓ Ready for distribution
    echo.
    echo Next steps:
    echo 1. Test on multiple devices
    echo 2. Upload to Google Play Store
    echo 3. Or distribute directly
    echo.
) else (
    echo APK not found at expected location
    echo Check android\app\build\outputs\apk\release\ folder
)

pause
