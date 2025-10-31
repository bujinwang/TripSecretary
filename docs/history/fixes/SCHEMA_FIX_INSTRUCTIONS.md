# Database Schema Fix Instructions

## Problem
The app is showing an error: "Error code 1: no such column: user_id" or "Failed to initialize PassportDataService"

This happens because the database was created with an older schema that didn't include the `user_id` column in the tables.

## Solution

### Option 1: Clear Storage via App (Recommended if app loads)
This will reset the database with the correct schema:

1. Open the app
2. Navigate to the **Profile** screen (bottom tab)
3. If you see an alert about "Database Schema Error", tap OK
4. Scroll down to the **Settings & Help** section
5. Tap on **"🗑️ Clear Saved Data"**
6. Confirm the action
7. The database will be reset with the correct schema
8. Restart the app

**Note:** This will delete all saved data, so you'll need to re-enter your information.

### Option 1B: Force Clear via React Native Debugger
If the Profile screen won't load:

1. Open React Native Debugger or Chrome DevTools
2. In the console, run: `global.clearProfileStorage()`
3. Restart the app

**Note:** This only works if the Profile screen has loaded at least once.

### Option 2: Manual Database Reset (Advanced)
If you have access to the device's file system:

1. Close the app completely
2. Delete the database file at: `[App Documents]/SQLite/tripsecretary_secure`
3. Restart the app
4. The database will be recreated with the correct schema

## What Was Fixed

1. **Validation Error**: Added `skipValidation: true` option to allow progressive data entry in ProfileScreen
2. **Database Initialization**: Fixed `SecureStorageService.initialize()` to receive userId parameter
3. **Schema Migration**: Updated migration system to add `user_id` column to all tables
4. **Error Handling**: Added graceful error handling so the app doesn't crash with old schema
5. **API Compatibility**: Fixed `markMigrationComplete()` to use transaction-based API instead of `runAsync`

## Current Status

The app will now:
- ✅ Not crash when encountering schema errors
- ✅ Show error messages in console but continue to work
- ✅ Allow you to clear storage and reset the database
- ⚠️ Some features may not work until storage is cleared

## After Clearing Storage

Once you clear storage, the app will:
- Have the correct database schema with `user_id` columns
- Work properly with all features
- Allow you to save and load data correctly
