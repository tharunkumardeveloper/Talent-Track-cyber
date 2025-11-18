@echo off
echo ========================================
echo Build Diagnostics
echo ========================================
echo.

echo === System Information ===
echo.

echo Node.js:
node --version 2>nul
if errorlevel 1 (
    echo   NOT FOUND - Install from https://nodejs.org/
) else (
    echo   OK
)
echo.

echo npm:
npm --version 2>nul
if errorlevel 1 (
    echo   NOT FOUND
) else (
    echo   OK
)
echo.

echo Java:
java -version 2>&1 | findstr /i "version"
if errorlevel 1 (
    echo   NOT FOUND - Install JDK 11+ from https://adoptium.net/
) else (
    echo   OK
)
echo.

echo JAVA_HOME:
if defined JAVA_HOME (
    echo   %JAVA_HOME%
) else (
    echo   NOT SET - May cause build issues
)
echo.

echo ANDROID_HOME:
if defined ANDROID_HOME (
    echo   %ANDROID_HOME%
) else if exist "%LOCALAPPDATA%\Android\Sdk" (
    echo   Found at: %LOCALAPPDATA%\Android\Sdk
    echo   Consider setting ANDROID_HOME environment variable
) else (
    echo   NOT SET - Install Android Studio
)
echo.

echo === Project Files ===
echo.

if exist "package.json" (
    echo ✓ package.json found
) else (
    echo ✗ package.json NOT found
)

if exist "capacitor.config.ts" (
    echo ✓ capacitor.config.ts found
) else (
    echo ✗ capacitor.config.ts NOT found
)

if exist "android\app\build.gradle" (
    echo ✓ android\app\build.gradle found
) else (
    echo ✗ android\app\build.gradle NOT found
    echo   Run: npx cap add android
)

if exist "android\gradlew.bat" (
    echo ✓ android\gradlew.bat found
) else (
    echo ✗ android\gradlew.bat NOT found
)

if exist "node_modules" (
    echo ✓ node_modules folder exists
) else (
    echo ✗ node_modules NOT found
    echo   Run: npm install
)

if exist "dist" (
    echo ✓ dist folder exists
) else (
    echo ✗ dist folder NOT found
    echo   Run: npm run build
)
echo.

echo === Capacitor Plugins ===
echo.

if exist "node_modules\@capacitor\local-notifications" (
    echo ✓ local-notifications installed
) else (
    echo ✗ local-notifications NOT installed
)

if exist "node_modules\@capacitor\camera" (
    echo ✓ camera installed
) else (
    echo ✗ camera NOT installed
)

if exist "node_modules\@capacitor\filesystem" (
    echo ✓ filesystem installed
) else (
    echo ✗ filesystem NOT installed
)

if exist "node_modules\@capacitor\app" (
    echo ✓ app installed
) else (
    echo ✗ app NOT installed
)
echo.

echo === Signing Configuration ===
echo.

if exist "talent-track-key.keystore" (
    echo ✓ Keystore file found
) else (
    echo ✗ Keystore NOT found (needed for release builds)
)

if exist "android\key.properties" (
    echo ✓ key.properties found
) else (
    echo ✗ key.properties NOT found (needed for release builds)
)
echo.

echo === Gradle Status ===
echo.

if exist "android\gradlew.bat" (
    echo Testing Gradle...
    cd android
    call gradlew --version 2>nul
    if errorlevel 1 (
        echo   Gradle test FAILED
    ) else (
        echo   Gradle OK
    )
    cd ..
) else (
    echo Gradle wrapper not found
)
echo.

echo === Recent Build Outputs ===
echo.

if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo ✓ Debug APK exists
    for %%A in ("android\app\build\outputs\apk\debug\app-debug.apk") do (
        echo   Size: %%~zA bytes
        echo   Date: %%~tA
    )
) else (
    echo ✗ No debug APK found
)
echo.

if exist "android\app\build\outputs\apk\release\app-release.apk" (
    echo ✓ Release APK exists
    for %%A in ("android\app\build\outputs\apk\release\app-release.apk") do (
        echo   Size: %%~zA bytes
        echo   Date: %%~tA
    )
) else (
    echo ✗ No release APK found
)
echo.

echo === Recommendations ===
echo.

if not exist "node_modules" (
    echo 1. Run: npm install
)

if not exist "dist" (
    echo 2. Run: npm run build
)

if not exist "android\app\build.gradle" (
    echo 3. Run: npx cap add android
)

if not exist "node_modules\@capacitor\local-notifications" (
    echo 4. Run: npm install @capacitor/local-notifications @capacitor/camera @capacitor/filesystem @capacitor/app
)

echo.
echo To build APK, run: build-apk-cli.bat
echo.

pause
