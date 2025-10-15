# Funding Proof Photo Persistence - Final Solution

## Problem Summary
Photos added to funding proof items (credit cards, bank statements) were not persisting across app sessions.

## Root Causes Identified

### 1. Temporary Photo URIs
Image picker returns temporary URIs that become invalid after app restart.

**Solution:** Copy images to permanent storage in app's Documents directory.

### 2. React State Closure in setTimeout
The `saveDataToSecureStorage` function was reading stale `funds` state due to JavaScript closure.

**Solution:** Pass updated funds array directly as parameter to save function.

### 3. Multiple Database Records with Different IDs
Each save created a NEW funding_proof record instead of updating the existing one because random IDs were generated.

**Solution:** Use consistent ID based on userId (`funding_${userId}`) so `INSERT OR REPLACE` actually updates.

## Implementation

### Changes Made

#### 1. File System Storage (ThailandTravelInfoScreen.js)
```javascript
import * as FileSystem from 'expo-file-system';

const copyImageToPermanentStorage = async (uri) => {
  const fundsDir = `${FileSystem.documentDirectory}funds/`;
  await FileSystem.makeDirectoryAsync(fundsDir, { intermediates: true });
  
  const filename = `fund_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
  const permanentUri = fundsDir + filename;
  
  await FileSystem.copyAsync({ from: uri, to: permanentUri });
  return permanentUri;
};

// In photo selection handlers:
const permanentUri = await copyImageToPermanentStorage(result.assets[0].uri);
updateFund(id, 'photo', permanentUri);
```

#### 2. State Closure Fix (ThailandTravelInfoScreen.js)
```javascript
// Modified saveDataToSecureStorage to accept funds parameter
const saveDataToSecureStorage = async (fundsToSave = null) => {
  const fundsToUse = fundsToSave !== null ? fundsToSave : funds;
  // ... use fundsToUse instead of funds
};

// Pass updated funds directly
const updateFund = (id, key, value) => {
  const updatedFunds = funds.map((fund) => 
    (fund.id === id ? { ...fund, [key]: value } : fund)
  );
  setFunds(updatedFunds);
  
  setTimeout(() => {
    saveDataToSecureStorage(updatedFunds); // Pass directly!
  }, delay);
};

// Also in useEffect auto-save
useEffect(() => {
  if (!isLoading) {
    const timer = setTimeout(() => {
      saveDataToSecureStorage(funds); // Pass current funds
    }, 1000);
    return () => clearTimeout(timer);
  }
}, [funds, ...otherDeps]);
```

#### 3. Consistent ID Generation (FundingProof.js)
```javascript
class FundingProof {
  constructor(data = {}) {
    // Use consistent ID based on userId
    this.id = data.id || (data.userId ? `funding_${data.userId}` : FundingProof.generateId());
    this.userId = data.userId;
    // ...
  }
}
```

#### 4. Strip Old IDs (PassportDataService.js)
```javascript
static async saveFundingProof(fundingData, userId) {
  // Don't pass old ID - let model generate consistent one
  const { id, ...fundingDataWithoutId } = fundingData;
  const fundingProof = new FundingProof({
    ...fundingDataWithoutId,
    userId
  });
  
  await fundingProof.save({ skipValidation: true });
  // ...
}
```

#### 5. File Cleanup on Delete (ThailandTravelInfoScreen.js)
```javascript
const removeFund = async (id) => {
  const fundToRemove = funds.find((fund) => fund.id === id);
  
  // Delete photo file if it exists
  if (fundToRemove?.photo && fundToRemove.photo.includes('funds/')) {
    try {
      await FileSystem.deleteAsync(fundToRemove.photo);
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  }
  
  const updatedFunds = funds.filter((fund) => fund.id !== id);
  setFunds(updatedFunds);
  setTimeout(() => saveDataToSecureStorage(updatedFunds), 500);
};
```

## Testing the Fix

### Fresh Install Test
1. Delete app from simulator
2. Stop Metro and run `npx expo start --clear`
3. Reinstall app
4. Add a credit card with photo
5. Close and restart app
6. Photo should persist ✅

### Expected Behavior
- Photos stored in: `{DocumentDirectory}/funds/fund_*.jpg`
- Database uses consistent ID: `funding_default_user`
- Updates replace existing record instead of creating new ones
- Photos display correctly after app restart

## Known Issues

### Metro Bundler Caching
Code changes may not hot-reload properly. Always:
- Stop Metro (Ctrl+C)
- Run `npx expo start --clear`
- Delete app from simulator
- Reinstall fresh

### Existing Corrupted Data
Old funding_proof records with random IDs will remain in database. They won't interfere with new records but can cause confusion. Clean install recommended.

## Why File System > SQLite for Photos

**File System (Chosen):**
- ✅ Fast image loading
- ✅ No database bloat
- ✅ Industry standard (WhatsApp, Instagram, etc.)
- ✅ Easy to optimize/compress separately

**SQLite as Base64:**
- ❌ 33% size overhead
- ❌ Slow queries
- ❌ Memory intensive
- ❌ Database backup issues

## Future Improvements

1. **Migration Script:** Clean up old funding_proof records with random IDs
2. **Image Optimization:** Compress images before saving to reduce storage
3. **Backup Strategy:** Include photos in data export/import
4. **Error Recovery:** Handle missing photo files gracefully

## Summary

The photo persistence issue was caused by three compounding problems:
1. Temporary URIs (fixed with permanent storage)
2. Stale state in closures (fixed by passing data directly)
3. Multiple database records (fixed with consistent IDs)

All three fixes are required for photos to persist correctly.
