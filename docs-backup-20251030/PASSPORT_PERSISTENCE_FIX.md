# Passport & Personal Data Persistence Fix

## Issue
Passport and personal data (nationality, DOB, name, etc.) were not persisting when navigating away and returning to the Thailand Travel Info screen. Data would be saved successfully but would disappear on reload.

## Root Causes

### 1. Multiple Passport Records
The database had multiple passport records for the same user (e.g., `passport_1760539524586_5ch6ygz1q` and `passport_1760539524072_q36do2umw`). Each time the screen loaded, it would randomly pick one of these records, causing data to appear inconsistent.

### 2. Empty Values Overwriting Existing Data
The `updatePassport` method used `Object.assign()` which would overwrite ALL fields, including setting fields to empty strings if they were in the updates object. When a field was blurred, `saveDataToSecureStorage` would collect ALL current state values (some might be empty) and overwrite the database, losing previously saved data.

### 3. Missing Save Function
The `saveDataToSecureStorage()` function that was supposed to save data on field blur was missing from the Thailand screen, so data was never being persisted.

## Solutions

### Fix 1: Added Missing Save Function
Re-added the `saveDataToSecureStorage()` function that:
- Filters out empty fields (only saves non-empty values)
- Saves passport data using `updatePassport` or `savePassport`
- Saves personal info using `upsertPersonalInfo`
- Uses `skipValidation: true` for progressive filling
- Updates state to track the correct passport/personal info IDs

### Fix 2: Filter Empty Values in updatePassport
Modified `PassportDataService.updatePassport()` to filter out empty values before applying updates:

```javascript
// Filter out empty values to avoid overwriting existing data
const nonEmptyUpdates = {};
for (const [key, value] of Object.entries(updates)) {
  if (key === 'id' || key === 'userId' || key === 'createdAt') continue;
  
  if (value !== null && value !== undefined) {
    if (typeof value === 'string') {
      if (value.trim().length > 0) {
        nonEmptyUpdates[key] = value;
      }
    } else {
      nonEmptyUpdates[key] = value;
    }
  }
}

Object.assign(passport, nonEmptyUpdates);
```

This ensures that:
- Only non-empty values are applied to the passport
- Existing data is preserved when updating individual fields
- Empty strings don't overwrite previously saved data

### Fix 3: Consistent Passport Selection
Modified `SecureStorageService.getUserPassport()` to always return the most recently updated passport:

```javascript
'SELECT * FROM passports WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1'
```

Previously, the query used `LIMIT 1` without `ORDER BY`, which would return a random passport when multiple existed.

### Fix 4: Automatic Duplicate Cleanup
Added `cleanupDuplicatePassports()` function to SecureStorageService that:
- Finds all passports for a user
- Keeps the most recently updated one
- Deletes all duplicates

This function is called automatically during `PassportDataService.initialize()`:

```javascript
// Clean up duplicate passports (keep only the most recent one)
try {
  const deletedCount = await SecureStorageService.cleanupDuplicatePassports(userId);
  if (deletedCount > 0) {
    console.log(`Cleaned up ${deletedCount} duplicate passport(s)`);
  }
} catch (cleanupError) {
  console.warn('Could not cleanup duplicate passports:', cleanupError.message);
}
```

## Files Modified

1. **app/screens/thailand/ThailandTravelInfoScreen.js**
   - Re-added `saveDataToSecureStorage()` function
   - Modified `handleFieldBlur()` to call save function
   - Updated gender selection to trigger save
   - Added state updates to track passport/personal info IDs
   - Added detailed logging for debugging

2. **app/services/data/PassportDataService.js**
   - Modified `updatePassport()` to filter empty values
   - Added duplicate cleanup call in `initialize()`

3. **app/services/security/SecureStorageService.js**
   - Modified `getUserPassport()` query to order by `updated_at DESC`
   - Added `cleanupDuplicatePassports()` function

## How It Works Now

### On Field Blur
1. Field is validated
2. If valid, `saveDataToSecureStorage()` is called
3. Function gets the existing passport from database
4. Only non-empty fields are included in the update
5. Data is saved using `updatePassport` (which filters empty values)
6. State is updated to track the correct passport ID

### On Screen Load
1. `PassportDataService.initialize()` is called
2. Duplicate passports are automatically cleaned up
3. `getUserPassport()` returns the most recently updated passport
4. All fields are loaded from this single, consistent passport record

### Progressive Data Filling
Users can fill in fields one at a time:
- Each field save preserves previously saved data
- Empty fields don't overwrite existing data
- The UI state and database state stay in sync
- Only one passport record exists per user

## Testing

After this fix:
1. Fill in name (e.g., "LI, MAO")
2. Navigate away and come back → ✅ Name persists
3. Fill in nationality (e.g., "CHN")
4. Navigate away and come back → ✅ Name AND nationality persist
5. Fill in DOB (e.g., "1988-01-01")
6. Navigate away and come back → ✅ All three fields persist
7. Fill in passport number and expiry date
8. Navigate away and come back → ✅ All passport fields persist
9. Fill in personal info (occupation, city, phone, email)
10. Navigate away and come back → ✅ All data persists

## Prevention

To prevent similar issues in the future:
1. Always filter empty values before updating records
2. Use `ORDER BY` with `LIMIT` queries to ensure consistent results
3. Implement duplicate detection and cleanup
4. Track entity IDs in state to ensure consistent updates
5. Add logging to track what data is being saved vs loaded
6. Use `mergeUpdates` pattern for progressive data filling
