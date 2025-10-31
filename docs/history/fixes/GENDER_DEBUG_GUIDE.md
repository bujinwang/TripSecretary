# Gender Selection Debug Guide

## Issue
Gender selection is not showing as selected (highlighted) when reopening the modal, even though it was saved.

## Root Cause Analysis

The issue appears to be related to old saved data in storage that doesn't match the current data structure.

## Debugging Steps

### 1. Check Console Logs
When you open the gender modal, check the console for these logs:
```
handleStartEdit called with type: personal field: gender
Current personalInfo: {gender: "MALE", ...}
Setting editingContext with type: personal field.key: gender currentValue: MALE
Rendering gender modal - editValue: MALE personalInfo.gender: MALE
renderGenderOptions - editValue: MALE personalInfo.gender: MALE
Option MALE: editValue="MALE", isActive=true
Option FEMALE: editValue="MALE", isActive=false
Option UNDEFINED: editValue="MALE", isActive=false
```

If `editValue` is empty or doesn't match the expected value, that's the problem.

### 2. Check Saved Data
Look for this log on app start:
```
Loading saved personalInfo: {...}
Saved gender value: MALE
Merged personalInfo: {...}
Final gender value: MALE
```

If the saved data doesn't have a `gender` field, or it's undefined, that's the issue.

### 3. Clear Saved Data
Two ways to clear the storage:

#### Option A: Use the UI Button
1. Scroll down in the Profile screen
2. Find "Settings & Help" section
3. Tap "Clear Saved Data" (🗑️ icon)
4. Confirm the alert

#### Option B: Use Console
Run this command in the console:
```javascript
global.clearProfileStorage()
```

### 4. Test Again
After clearing storage:
1. Close and reopen the app
2. Open the gender field
3. Select "Male" (男性)
4. Close the modal
5. Reopen the gender field
6. The "Male" button should now be highlighted

## Data Migration

The code now includes automatic migration for old data formats:
- If `name` field is missing but `nameEn` exists, it converts it
- If `nameEn` is "ZHANG WEI" (space-separated), it converts to "ZHANG, WEI" (comma-separated)
- Missing fields are filled with defaults

## Expected Behavior

When working correctly:
1. Opening gender modal shows current selection highlighted
2. Selecting a gender saves immediately
3. Modal closes after 0.5 seconds
4. Reopening shows the saved selection highlighted
5. Data persists across app restarts

## Common Issues

### Issue: Gender not highlighted
**Cause**: `editValue` doesn't match the saved value
**Solution**: Check console logs to see what `editValue` is set to

### Issue: Data not persisting
**Cause**: Storage save/load failing
**Solution**: Check for error logs in console

### Issue: Old data format
**Cause**: Data saved before migration code was added
**Solution**: Clear storage and start fresh
