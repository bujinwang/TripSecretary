# Quick Fix for Database Schema Error

## The Problem
Your database has an old schema that's incompatible with the current version of the app.

## Fastest Solution

### Method 1: Delete and Reinstall (Easiest)
1. Delete the app from your device/simulator
2. Reinstall the app
3. All data will be fresh with the correct schema

### Method 2: Clear App Data (iOS Simulator)
1. In iOS Simulator, go to: Device → Erase All Content and Settings
2. Restart the simulator
3. Reinstall the app

### Method 3: Clear App Data (Android)
1. Go to Settings → Apps → [Your App Name]
2. Tap "Storage"
3. Tap "Clear Data"
4. Restart the app

### Method 4: Expo Development Menu
1. Shake your device or press Cmd+D (iOS) / Cmd+M (Android)
2. Tap "Clear AsyncStorage"
3. Restart the app

### Method 5: React Native Debugger Console
If you can open the React Native Debugger:

```javascript
// Run this in the console:
const SecureStorageService = require('./app/services/security/SecureStorageService').default;
await SecureStorageService.resetDatabase();
await SecureStorageService.initialize('default_user');
```

Then reload the app.

## After Fixing
Once the database is reset, the app will work normally and you can enter your data again.
