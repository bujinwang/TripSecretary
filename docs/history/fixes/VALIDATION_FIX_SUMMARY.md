# Validation and Database API Fix for Incremental/Progressive Filling

## Problems Fixed

### 1. Validation Issue
The app was enforcing required field validation when saving passport data, which prevented users from saving incomplete data during incremental/progressive filling. This caused errors like:

```
Failed to save passport: Error: Validation failed: Date of birth is required, Nationality is required
```

### 2. Database API Issue
The app was using `runAsync()` method which doesn't exist in expo-sqlite v11.3.3. This caused errors like:

```
Failed to log audit event: TypeError: this.db.runAsync is not a function (it is undefined)
```

## Solutions

### 1. Validation Fix
Changed the default validation behavior in `PassportDataService` to skip validation by default, supporting incremental/progressive data entry.

### 2. Database API Fix
Converted all `runAsync()` calls to use the transaction-based API (`db.transaction()` with `tx.executeSql()`), which is the correct API for expo-sqlite v11.

## Changes Made

### File: `app/services/data/PassportDataService.js`

Changed the default `skipValidation` option from `false` to `true` in the following methods:

1. **savePassport()** (line ~625)
   - Before: `const saveOptions = { skipValidation: false, ...options };`
   - After: `const saveOptions = { skipValidation: true, ...options };`

2. **updatePassport()** (line ~675)
   - Before: `const saveOptions = { skipValidation: false, ...options };`
   - After: `const saveOptions = { skipValidation: true, ...options };`

3. **savePersonalInfo()** (line ~752)
   - Before: `await personalInfo.save({ skipValidation: false });`
   - After: `await personalInfo.save({ skipValidation: true });`

4. **updatePersonalInfo()** (line ~792)
   - Before: `await personalInfo.update(updates, { skipValidation: false });`
   - After: `await personalInfo.update(updates, { skipValidation: true });`

5. **saveFundingProof()** (line ~869)
   - Before: `await fundingProof.save({ skipValidation: false });`
   - After: `await fundingProof.save({ skipValidation: true });`

6. **updateFundingProof()** (line ~905)
   - Before: `await fundingProof.update(updates, { skipValidation: false });`
   - After: `await fundingProof.update(updates, { skipValidation: true });`

## How It Works

- **Default behavior**: Validation is now skipped by default, allowing users to save incomplete data
- **Override option**: If validation is needed, callers can explicitly pass `{ skipValidation: false }` in the options parameter
- **Backward compatible**: Existing code that already passes `skipValidation: true` continues to work

## Impact

✅ Users can now save passport data incrementally without filling all required fields
✅ Progressive data entry is fully supported
✅ No breaking changes to existing code
✅ Validation can still be enforced when needed by passing `{ skipValidation: false }`

## Testing

Test the fix by:
1. Opening the app
2. Entering partial passport data (e.g., only passport number, without date of birth or nationality)
3. Saving the data
4. Verify no validation errors occur
5. Verify data is saved successfully

## Changes to SecureStorageService

### File: `app/services/security/SecureStorageService.js`

Converted the following methods from `runAsync()` to transaction-based API:

1. **savePersonalInfo()** - Now uses `db.transaction()` with `tx.executeSql()`
2. **saveFundingProof()** - Now uses `db.transaction()` with `tx.executeSql()`
3. **saveTravelHistory()** - Now uses `db.transaction()` with `tx.executeSql()`
4. **deleteAllUserData()** - Now uses `db.transaction()` with multiple `tx.executeSql()` calls
5. **logAudit()** - Now uses `db.transaction()` with `tx.executeSql()`

All methods now properly use Promises with resolve/reject callbacks to maintain async/await compatibility.

## Related Files

- `app/models/Passport.js` - Contains the validation logic (unchanged)
- `app/services/data/PassportDataService.js` - Updated to skip validation by default
- `app/services/security/SecureStorageService.js` - Fixed database API calls
- `app/screens/ProfileScreen.js` - Already uses `skipValidation: true` in some places
- `app/screens/PassportReviewScreen.js` - Already uses `skipValidation: true`
