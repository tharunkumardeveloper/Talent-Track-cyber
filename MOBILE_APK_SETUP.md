# Mobile APK Setup Guide - Talent Track

This guide will help you build and deploy the Talent Track mobile app with notifications and background processing.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Android Studio** (latest version)
3. **Java JDK** (v11 or higher)

## Step 1: Install Capacitor Plugins

Run the installation script:

```bash
install-capacitor-plugins.bat
```

This will install:
- `@capacitor/local-notifications` - For processing notifications
- `@capacitor/camera` - For camera access
- `@capacitor/filesystem` - For file/storage access
- `@capacitor/app` - For app lifecycle management

## Step 2: Build the Web App

```bash
npm run build
```

## Step 3: Sync with Android

```bash
npx cap sync android
```

## Step 4: Open in Android Studio

```bash
npx cap open android
```

## Step 5: Configure App Icon

1. In Android Studio, navigate to `android/app/src/main/res/`
2. Replace the default launcher icons with your favicon:
   - `mipmap-hdpi/ic_launcher.png` (72x72)
   - `mipmap-mdpi/ic_launcher.png` (48x48)
   - `mipmap-xhdpi/ic_launcher.png` (96x96)
   - `mipmap-xxhdpi/ic_launcher.png` (144x144)
   - `mipmap-xxxhdpi/ic_launcher.png` (192x192)

Or use Android Studio's Image Asset tool:
1. Right-click on `res` folder
2. Select `New > Image Asset`
3. Choose your favicon image
4. Generate icons

## Step 6: Build APK

### Debug APK (for testing):

1. In Android Studio, go to `Build > Build Bundle(s) / APK(s) > Build APK(s)`
2. Wait for build to complete
3. APK will be in `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK (for distribution):

1. Generate signing key:
```bash
keytool -genkey -v -keystore talent-track-key.keystore -alias talent-track -keyalg RSA -keysize 2048 -validity 10000
```

2. Create `android/key.properties`:
```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=talent-track
storeFile=../talent-track-key.keystore
```

3. Update `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('android.injected.signing.store.file')) {
                storeFile file(project.property('android.injected.signing.store.file'))
                storePassword project.property('android.injected.signing.store.password')
                keyAlias project.property('android.injected.signing.key.alias')
                keyPassword project.property('android.injected.signing.key.password')
            } else {
                def keystorePropertiesFile = rootProject.file("key.properties")
                def keystoreProperties = new Properties()
                keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

4. Build release APK:
```bash
cd android
./gradlew assembleRelease
```

5. APK will be in `android/app/build/outputs/apk/release/app-release.apk`

## Features Implemented

### ✅ Permissions
- **Camera**: For recording workout videos
- **Storage**: For saving and loading videos
- **Notifications**: For background processing updates

### ✅ Notifications
- **Processing notification**: Shows progress while video is being analyzed
- **Completion notification**: Alerts when processing is done
- **Background processing**: Works even when app is in background

### ✅ Background Processing
- Videos continue processing even when app is minimized
- Notifications keep user informed of progress
- No need to keep app open

## App Configuration

**App Name**: Talent Track  
**Package ID**: com.talenttrack.app  
**Icon**: Uses your favicon (configure in Step 5)

## Permissions Requested

The app will request these permissions on first launch:

1. **Camera** - To record workout videos
2. **Storage** - To save and access video files
3. **Notifications** - To show processing updates

Users can grant or deny these permissions. The app will work with limited functionality if permissions are denied.

## Testing

1. Install the APK on your Android device
2. Grant all permissions when prompted
3. Upload a workout video
4. Minimize the app - you should see processing notifications
5. Wait for completion notification

## Troubleshooting

### Build fails
- Make sure Android SDK is installed
- Check Java version: `java -version`
- Clean and rebuild: `cd android && ./gradlew clean`

### Notifications not showing
- Check if notifications are enabled in device settings
- Verify `POST_NOTIFICATIONS` permission is granted
- Check Android version (notifications require Android 13+)

### Camera not working
- Verify camera permission is granted
- Check if another app is using the camera
- Restart the app

## Distribution

### Google Play Store
1. Create a Google Play Developer account
2. Build signed release APK
3. Upload to Play Console
4. Fill in app details and screenshots
5. Submit for review

### Direct Distribution
1. Build signed release APK
2. Share APK file directly
3. Users need to enable "Install from Unknown Sources"

## Updates

To update the app:

1. Make changes to your code
2. Increment version in `capacitor.config.ts`
3. Run `npm run build`
4. Run `npx cap sync android`
5. Build new APK
6. Distribute updated APK

## Support

For issues or questions:
- Check Android Studio logs
- Use `npx cap doctor` to diagnose issues
- Check Capacitor documentation: https://capacitorjs.com/docs
