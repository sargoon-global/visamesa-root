# VisaMesa Mobile App

React Native app that guides users through the Spanish TIE process and automates government website steps on-device.

## What This App Does

1. User logs in with VisaMesa credentials (Google sign-in)
2. Completes profile information and TIE step checklist
3. Launches on-device WebView booking assistants for supported procedures (e.g. cita previa, empadronamiento)
4. Syncs progress, entitlements, and encrypted profile data with the VisaMesa backend

**Target Users**: Individuals navigating the Spanish TIE immigration process

## Architecture

```
┌─────────────────────────┐
│   VisaMesa Web App      │  Marketing, checkout, account
│   (React)               │
└──────────┬──────────────┘
           │
┌──────────▼──────────────┐
│   VisaMesa Backend      │  Auth, profile, payments, entitlements
│   (Fastify + PostgreSQL)│
└──────────┬──────────────┘
           │
┌──────────▼──────────────┐
│   VisaMesa Mobile       │  ← This app
│   (React Native)        │  TIE guidance + WebView booking assistant
└─────────────────────────┘
```

---

## Quick Start for New Developers

### Prerequisites

- **macOS** (for iOS development)
- **Node.js 18+** (via nvm recommended)
- **Xcode 15+** (macOS only)
- **Android Studio** (for Android development)

### Setup Commands

```bash
# 1. Install dependencies
cd apps/mobile
npm ci

# 2. Install iOS dependencies (macOS only)
cd ios && pod install && cd ..

# 3. Start Metro bundler
npm start

# 4. Run the app (in a new terminal)
npm run ios              # iOS
npm run android          # Android
open ios/VisaMesa.xcworkspace  # Or open in Xcode GUI
```

**That's it!** Skip to [Running the App](#running-the-app) if setup works.

**Payments (website checkout + entitlements):** [../../../visamesa_be/docs/LOCAL_PAYMENTS.md](../../../visamesa_be/docs/LOCAL_PAYMENTS.md)

---

## Complete Environment Setup

<details>
<summary><b>📱 iOS Setup (macOS only)</b></summary>

### 1. Install Xcode

```bash
# Install from App Store or:
xcode-select --install

# Verify
xcode-select -p
# Should output: /Applications/Xcode.app/Contents/Developer
```

### 2. Install CocoaPods

```bash
# Install if not present
sudo gem install cocoapods

# Verify
pod --version
```

### 3. Install Project Dependencies

```bash
cd apps/mobile
npm ci
cd ios && LANG=en_US.UTF-8 pod install && cd ..
```

**Common Issues:**

- If `pod install` fails, set UTF-8: `export LANG=en_US.UTF-8`
- If Hermes build fails, ensure Node is in PATH: `which node`

</details>

<details>
<summary><b>🤖 Android Setup (macOS, Linux, Windows)</b></summary>

### 1. Install Java Development Kit (JDK 17)

```bash
# macOS (via Homebrew)
brew install openjdk@17
brew link --force openjdk@17

# Verify
java -version  # Should show version 17
```

### 2. Install Android Studio

1. Download from https://developer.android.com/studio
2. Run installer and follow setup wizard
3. Install required SDK components:
   - Android SDK Platform 34 (API 34)
   - Android SDK Platform 36 (API 36)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Android Emulator

### 3. Set Environment Variables

Add to `~/.zshrc` (or `~/.bashrc`):

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Then reload: `source ~/.zshrc`

### 4. Verify Setup

```bash
# Check environment
echo $ANDROID_HOME    # Should show path to SDK
which adb             # Should show path to adb

# Optional: Run React Native doctor
npx react-native doctor
```

### 5. Create Android Emulator (Optional)

```bash
# Open Android Studio
# Tools → Device Manager → Create Device
# Choose: Pixel 6, API 34, Download system image
```

</details>

---

## Running the App

### Start Metro Bundler

```bash
# Terminal 1 - Start Metro
cd apps/mobile
npm start

# If cache issues:
npm start -- --reset-cache
```

### Run on iOS

```bash
# Terminal 2 - Run on simulator
npm run ios

# Or open in Xcode GUI:
open ios/VisaMesa.xcworkspace
# Then press Cmd+R in Xcode
```

### Run on Android

```bash
# Terminal 2 - Run on emulator or physical device
npm run android

# For physical device: Connect via USB, enable USB debugging
# Check device: adb devices
```

---

## Project Structure

```
apps/mobile/
├── src/
│   ├── App.tsx                    # Main app component
│   ├── features/                  # Feature modules (screens, hooks, services, components)
│   │   ├── home/
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── auth/
│   │   ├── legal/
│   │   └── settings/
│   ├── navigation/                # React Navigation stacks and tabs
│   ├── components/                # Shared UI components
│   ├── contexts/                  # App-wide React context
│   ├── services/                  # Infrastructure (api, auth, crypto, payment)
│   ├── webViewInjection/          # WebView booking assistant + WebsiteWebView screen
│   ├── scripts/                   # Government site injection scripts
│   │   ├── cita-previa/
│   │   └── empadronamiento/
│   ├── theme/                     # Unistyles theme configuration
│   └── types/                     # Shared TypeScript types
├── android/                       # Android native code
├── ios/                          # iOS native code
├── index.js                      # App entry point
└── package.json                  # Dependencies
```

---

## Critical Fixes & Known Issues

### ✅ FIXED: Metro Bundler Crash

**Issue**: `Cannot read properties of undefined (reading 'handle')`

**Cause**: `@react-native-community/cli` 16.x/20.x is incompatible with this project's React Native version.

**Solution**: Keep CLI on the 15.x line in `package.json`. DO NOT upgrade to 16.x or 20.x.

```json
{
  "@react-native-community/cli": "^15.0.0" // ← Keep on 15.x
}
```

### ✅ FIXED: iOS Build Hermes Error

**Issue**: `PhaseScriptExecution [CP-User] [Hermes] Replace Hermes failed`

**Cause**: Committed `ios/.xcode.env.local` with wrong Node path

**Solution**: File deleted and added to `.gitignore`. Never commit machine-specific paths.

### ✅ FIXED: Android Kotlin Compilation Error

**Issue**: `Cannot infer type for this parameter` in `react-native-safe-area-context`

**Cause**: `react-native-safe-area-context` 5.x targets React Native 0.77+ and is incompatible with this project's RN 0.76 baseline.

**Solution**: Use version 4.x for React Native 0.76:

```json
{
  "react-native-safe-area-context": "^4.8.2" // ← Required for RN 0.76
}
```

### ✅ FIXED: iOS Missing Source File / Pod Mismatch

**Issue**: `Build input file cannot be found: ...PerformanceEntryCircularBuffer.cpp` or `Unable to find module dependency: 'ReactAppDependencyProvider'`

**Cause**: `ios/Podfile.lock` and native iOS files were out of sync with the JavaScript `react-native` version (e.g. Pods from 0.77.x while `node_modules` has 0.76.x).

**Solution**: Reinstall pods after changing the React Native version:

```bash
cd ios
rm -rf Pods Podfile.lock build
pod install
cd ..
```

Also ensure `ios/VisaMesa/AppDelegate.swift` matches the React Native version template (0.77-only APIs like `ReactAppDependencyProvider` must not be used on 0.76).

### ✅ FIXED: Android BuildConfig Error

**Issue**: `Unresolved reference 'BuildConfig'`

**Cause**: Android Gradle requires an explicit `buildConfig` feature flag for this project setup.

**Solution**: Added to `android/app/build.gradle`:

```gradle
buildFeatures {
  buildConfig = true
}
```

### ✅ FIXED: App Name Registration Error

**Issue**: `"VisaMesa" has not been registered`

**Cause**: Metro cached old app name after rename

**Solution**: Clear Metro cache:

```bash
npm start -- --reset-cache
```

---

## Dependency Versions (DO NOT CHANGE)

| Package                          | Version | Why Locked?                                   |
| -------------------------------- | ------- | --------------------------------------------- |
| `@react-native-community/cli`    | ^15.0.0 | CLI 16.x has iOS bugs, 20.x breaks Metro      |
| `react-native`                   | 0.76.8  | Project baseline                              |
| `react-native-safe-area-context` | ^4.8.2  | 5.x targets RN 0.77+ and breaks this baseline |
| `react-native-unistyles`         | 2.43.0  | Styling library used across screens           |

**Warning**: Running `npm update` or `npm upgrade` may break the app. Always test in a branch first. After changing `react-native`, always reinstall iOS pods (see [Debug](#debug) below).

---

## Troubleshooting

### iOS: Build fails after `git pull`

```bash
# Clean everything
cd ios
rm -rf Pods Podfile.lock build
pod install
cd ..

# Rebuild
npm run ios
```

### Android: Build fails after `git pull`

```bash
# Clean Gradle cache
cd android
./gradlew clean
cd ..

# Clear Metro cache
rm -rf node_modules/.cache

# Rebuild
npm run android
```

### Metro: "Port 8081 already in use"

```bash
# Kill existing Metro
lsof -ti:8081 | xargs kill -9

# Restart
npm start
```

### iOS: "Could not find scheme VisaMesa"

This was fixed by completing the app rename. If you still see it:

```bash
# Use Xcode GUI instead
open ios/VisaMesa.xcworkspace
```

### Android: "SDK location not found"

```bash
# Set ANDROID_HOME
echo $ANDROID_HOME  # Should show: /Users/yourname/Library/Android/sdk

# If empty, add to ~/.zshrc:
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
source ~/.zshrc
```

---

## Team Collaboration

### Git Workflow

**Never commit:**

- `node_modules/`
- `ios/Pods/`
- `ios/.xcode.env.local` ← **Machine-specific, breaks other machines**
- `android/local.properties`
- `*.log`

**Always commit:**

- `package-lock.json`
- `ios/Podfile.lock`
- `android/gradle/wrapper/gradle-wrapper.properties`

### For New Team Members

1. Clone repo: `git clone <repo-url>`
2. Install Node 18+: `nvm install 18 && nvm use 18`
3. Install dependencies: `npm ci` (NOT `npm install`)
4. iOS only: `cd ios && pod install && cd ..`
5. Start Metro: `npm start`
6. Run app: `npm run ios` or `npm run android`

**DO NOT:**

- Run `npm install` (use `npm ci` for exact versions)
- Create `ios/.xcode.env.local` (unnecessary in most cases)
- Upgrade dependencies without team approval

---

## Development Workflow

### Unit tests

Tests live next to the code they cover (`*.test.ts` / `*.test.tsx`). Shared helpers are in `src/test/`.

```bash
npm test
```

**What we test**
- Hooks and services (business logic)
- Reusable components with non-trivial behavior (e.g. `Stepper`)
- WebView booking assistant rules and injection timing

**What we skip**
- Thin screen wrappers that only compose hooks + UI
- Pure styling and one-line utilities without logic

**Conventions**
- Use `src/test/renderHook.tsx` for hook tests
- Use `src/test/fixtures/` for shared test data
- Mock navigation with `src/test/navigation.ts`
- Prefer testing behavior over implementation details

### Testing Changes

1. Make code changes in `src/`
2. Metro auto-reloads (if running)
3. Or manually reload:
   - **iOS**: Press `Cmd+R` in simulator
   - **Android**: Press `R+R` in terminal or shake device

### Adding Dependencies

```bash
# Install package
npm install <package-name>

# iOS: Update native dependencies
cd ios && pod install && cd ..

# Test on both platforms
npm run ios
npm run android
```

### Debugging

- **iOS**: Use Xcode debugger or Safari Web Inspector
- **Android**: Use Chrome DevTools (`chrome://inspect`)
- **React DevTools**: `npx react-devtools`

---

## Production Build

### iOS

```bash
# 1. Archive in Xcode
open ios/VisaMesa.xcworkspace
# Product → Archive

# 2. Or via command line
cd ios
xcodebuild -workspace VisaMesa.xcworkspace \
  -scheme VisaMesa \
  -configuration Release \
  -archivePath ./build/VisaMesa.xcarchive \
  archive
```

### Android

```bash
# 1. Generate release APK
cd android
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## Environment Variables

The production API origin is defined once in `@visamesa/content/site` as `API_BASE_URL` (`https://api.visamesa.com`). Release builds resolve it via `src/config/resolveApiBaseUrl.ts` — do not hardcode URLs in app code.

| Build | API origin |
|-------|------------|
| Debug / Metro (`__DEV__`) | `http://localhost:3000` (iOS sim) or `http://10.0.2.2:3000` (Android emulator) |
| Release | `API_BASE_URL` from `@visamesa/content/site` (validated HTTPS) |

Optional `.env` entries for local tooling only (not read by the app at runtime):

```bash
API_TIMEOUT=30000
ENABLE_CRASH_REPORTING=false
ENABLE_ANALYTICS=false
```

---

## Tech Stack

- **Framework**: React Native 0.76.8
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **Styling**: react-native-unistyles
- **State**: React Context API
- **HTTP Client**: Axios
- **Storage**: AsyncStorage
- **WebView**: react-native-webview (for booking assistant)

---

## Support

- **Issues**: Open GitHub issue with:
  - Platform (iOS/Android)
  - React Native version
  - Error message
  - Steps to reproduce
- **Questions**: Contact development team

---

## Debug

When JS dependencies change:

```bash
npm ci
# ios
cd ios && rm -rf Pods Podfile.lock build && LANG=en_US.UTF-8 pod install && cd ..
npm run ios

# android
cd android && ./gradlew clean && rm -rf app/build build .gradle && cd ..
npm run android
```

If Metro shows `Unknown device with ID ...`, restart Metro with a clean cache:

```bash
npm start -- --reset-cache
```

---

## License

Proprietary - VisaMesa © 2026

---

**Last Updated**: May 24, 2026  
**React Native**: 0.76.8  
**Node.js**: 18+
