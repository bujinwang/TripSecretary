# Fix Guide for non-std C++ exception Error

## The Problem
After reorganizing screens into country-specific folders, the React Native metro bundler needs to be fully reset to recognize the new file structure.

## Solution: Complete Clean Restart

### Option 1: Quick Fix (Recommended)
Run the provided script:
```bash
./restart-clean.sh
```

Then rebuild your app in Xcode or press 'i' in the Metro terminal.

### Option 2: Manual Steps

1. **Stop all running processes:**
   ```bash
   # Kill any running Metro bundlers
   pkill -f "react-native"
   pkill -f "node"
   ```

2. **Clear all caches:**
   ```bash
   # Clear Metro bundler cache
   rm -rf $TMPDIR/metro-*
   rm -rf $TMPDIR/haste-*
   
   # Clear Watchman cache
   watchman watch-del-all
   
   # Clear node modules cache
   rm -rf node_modules/.cache
   
   # Clear iOS build (if on Mac)
   rm -rf ios/build
   rm -rf ~/Library/Developer/Xcode/DerivedData/*
   
   # Clear Android build
   rm -rf android/app/build
   rm -rf android/.gradle
   ```

3. **Reinstall pods (iOS only):**
   ```bash
   cd ios
   pod deintegrate
   pod install
   cd ..
   ```

4. **Start Metro with clean cache:**
   ```bash
   npm start -- --reset-cache
   ```

5. **Rebuild the app:**
   - **iOS**: Press `i` in Metro terminal, or run `npx react-native run-ios`
   - **Android**: Press `a` in Metro terminal, or run `npx react-native run-android`

### Option 3: Nuclear Option (if above doesn't work)

```bash
# Stop everything
pkill -f "react-native"
pkill -f "node"

# Remove and reinstall node_modules
rm -rf node_modules
npm install

# Clear all caches
watchman watch-del-all
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# iOS: Clean and reinstall pods
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..

# Start fresh
npm start -- --reset-cache
```

## Why This Happened

The error occurred because:
1. We moved files to new folders (`japan/` and `thailand/`)
2. React Native's Metro bundler cached the old file locations
3. The app tried to load screens from old paths but they don't exist anymore
4. This caused a fatal C++ exception when the module loader failed

## What Was Changed

- ✅ All Japan screens moved to `app/screens/japan/`
- ✅ All Thailand screens moved to `app/screens/thailand/`
- ✅ Navigation updated to use centralized imports
- ✅ Git history preserved with `git mv`

## Verification

After rebuild, verify the app works by:
1. Opening the app
2. Navigating to Japan immigration guide
3. Checking that all screens load properly

If you still see errors, check the Metro bundler terminal for specific import errors.
