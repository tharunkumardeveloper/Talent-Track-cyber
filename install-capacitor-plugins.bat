@echo off
echo Installing Capacitor plugins for notifications and permissions...

npm install @capacitor/local-notifications
npm install @capacitor/camera
npm install @capacitor/filesystem
npm install @capacitor/app

echo.
echo Syncing with Android...
npx cap sync android

echo.
echo Done! Plugins installed successfully.
echo.
echo Next steps:
echo 1. Run: npm run build
echo 2. Run: npx cap open android
echo 3. Build and run the APK from Android Studio
pause
