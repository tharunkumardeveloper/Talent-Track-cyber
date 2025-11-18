# Quick APK Build Guide

## Option 1: Debug APK (Fastest - For Testing)

Just run:
```bash
build-apk.bat
```

This will:
1. Install required plugins
2. Build the web app
3. Sync with Android
4. Open Android Studio

Then in Android Studio:
1. Wait for Gradle sync (bottom right)
2. Click `Build > Build Bundle(s) / APK(s) > Build APK(s)`
3. Wait for "BUILD SUCCESSFUL"
4. Click "locate" to find APK

**APK Location**: `android\app\build\outputs\apk\debug\app-debug.apk`

---

## Option 2: Release APK (For Distribution)

### First Time Setup:

1. **Generate signing key**:
```bash
keytool -genkey -v -keystore talent-track-key.keystore -alias talent-track -keyalg RSA -keysize 2048 -validity 10000
```

2. **Create `android/key.properties`**:
```properties
storePassword=YOUR_PASSWORD_HERE
keyPassword=YOUR_PASSWORD_HERE
keyAlias=talent-track
storeFile=../talent-track-key.keystore
```

3. **Update `android/app/build.gradle`** - Add before `android {`:
```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

And add inside `android {`:
```gradle
signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
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
```

### Build Release APK:

```bash
build-release-apk.bat
```

**APK Location**: `android\app\build\outputs\apk\release\app-release.apk`

---

## Option 3: Using Android Studio GUI (Easiest)

1. Run:
```bash
npm run build
npx cap sync android
npx cap open android
```

2. In Android Studio:
   - `Build > Generate Signed Bundle / APK`
   - Select `APK`
   - Click `Next`
   - Create new keystore or use existing
   - Fill in passwords
   - Click `Next`
   - Select `release` build variant
   - Click `Finish`

---

## Testing the APK

1. **Transfer to phone**:
   - USB cable: Copy APK to phone
   - Or email it to yourself
   - Or use ADB: `adb install app-debug.apk`

2. **Install**:
   - Enable "Install from Unknown Sources" in settings
   - Tap the APK file
   - Click "Install"

3. **Test**:
   - Open Talent Track app
   - Grant permissions (camera, storage, notifications)
   - Upload a workout video
   - Minimize app - check notifications
   - Wait for completion notification

---

## Troubleshooting

### "Gradle sync failed"
```bash
cd android
gradlew clean
cd ..
npx cap sync android
```

### "Build failed"
- Check Java version: `java -version` (need Java 11+)
- Update Android SDK in Android Studio
- Check `android/app/build.gradle` for errors

### "Signing failed"
- Make sure `key.properties` exists
- Check passwords are correct
- Verify keystore file path

### "APK not found"
- Check `android\app\build\outputs\apk\debug\` folder
- Or `android\app\build\outputs\apk\release\` for release
- Look for `app-debug.apk` or `app-release.apk`

---

## File Sizes

- **Debug APK**: ~50-80 MB (includes debugging info)
- **Release APK**: ~30-50 MB (optimized)

---

## App Info

- **Name**: Talent Track
- **Package**: com.talenttrack.app
- **Min Android**: 5.0 (API 21)
- **Target Android**: 14 (API 34)

---

## Next Steps After Building

1. **Test thoroughly** on multiple devices
2. **Create app icon** (replace default launcher icons)
3. **Add screenshots** for Play Store
4. **Write app description**
5. **Submit to Google Play** (optional)

---

## Quick Commands Reference

```bash
# Install plugins
npm install @capacitor/local-notifications @capacitor/camera @capacitor/filesystem @capacitor/app

# Build web app
npm run build

# Sync with Android
npx cap sync android

# Open Android Studio
npx cap open android

# Build debug APK (in android folder)
cd android
gradlew assembleDebug

# Build release APK (in android folder)
cd android
gradlew assembleRelease
```
