# Photo Persistence Fix

## Problem
Previously saved credit card photos were not displaying after app reload. The photo button showed "添加照片" (Add Photo) instead of displaying the saved image.

## Root Cause
When selecting images from the camera or photo library, the image picker returns temporary URIs like:
- iOS: `file:///var/mobile/Containers/Data/Application/.../tmp/...`
- Android: `content://media/external/images/media/...`

These temporary URIs are only valid for the current app session. When the app restarts, these URIs become invalid and the images cannot be loaded.

## Solution
Copy selected images to permanent storage in the app's document directory before saving them to the database.

### Implementation

1. **Added FileSystem Import**
   ```javascript
   import * as FileSystem from 'expo-file-system';
   ```

2. **Created Permanent Storage Function**
   ```javascript
   const copyImageToPermanentStorage = async (uri) => {
     // Create funds directory if it doesn't exist
     const fundsDir = `${FileSystem.documentDirectory}funds/`;
     const dirInfo = await FileSystem.getInfoAsync(fundsDir);
     if (!dirInfo.exists) {
       await FileSystem.makeDirectoryAsync(fundsDir, { intermediates: true });
     }

     // Generate unique filename
     const filename = `fund_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
     const permanentUri = fundsDir + filename;

     // Copy image to permanent storage
     await FileSystem.copyAsync({
       from: uri,
       to: permanentUri
     });

     return permanentUri;
   };
   ```

3. **Updated Photo Selection Handlers**
   - Camera: Copy image to permanent storage before calling `updateFund`
   - Photo Library: Copy image to permanent storage before calling `updateFund`

### Benefits
- ✅ Photos persist across app sessions
- ✅ Photos are stored in app's document directory
- ✅ Unique filenames prevent conflicts
- ✅ Fallback to original URI if copy fails
- ✅ Works on both iOS and Android

### Storage Location
Photos are stored in: `{FileSystem.documentDirectory}funds/`

Example path:
- iOS: `/var/mobile/Containers/Data/Application/{UUID}/Documents/funds/`
- Android: `/data/user/0/{package}/files/funds/`

### Testing
1. Select a credit card photo
2. Close and restart the app
3. Navigate back to Thailand travel info screen
4. Verify the photo is displayed correctly

### Additional Fix: State Closure Issue

**Problem:** Even with permanent storage, photos weren't persisting because of a React state closure issue. The `saveDataToSecureStorage` function was reading stale `funds` state when called from `setTimeout`.

**Solution:** Modified `saveDataToSecureStorage` to accept an optional `fundsToSave` parameter. When updating funds, we now pass the updated array directly:

```javascript
const updateFund = (id, key, value) => {
  const updatedFunds = funds.map((fund) => 
    (fund.id === id ? { ...fund, [key]: value } : fund)
  );
  setFunds(updatedFunds);
  
  // Pass updated funds directly to avoid stale state
  setTimeout(() => {
    saveDataToSecureStorage(updatedFunds);
  }, delay);
};
```

This ensures the save function always uses the latest funds data, not stale state from closure.

### Migration Note
Existing photos saved with temporary URIs will not display. Users will need to re-select those photos. The new photos will persist correctly.
