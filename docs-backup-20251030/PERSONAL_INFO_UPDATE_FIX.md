# Personal Info Update Fix

## Issue
When typing in the "City of Residency" field (e.g., "Hefei") in the ThailandTravelInfoScreen and moving to the next field, the following error occurred:

```
Personal info not found for ID: personal_1760502976708_02w6kxxl3
Failed to update personal info
```

## Root Cause
The issue was in the `PassportDataService.upsertPersonalInfo()` method flow:

1. `upsertPersonalInfo(userId, data)` retrieves existing personal info by `userId`
2. If found, it calls `updatePersonalInfo(personalInfo.id, data)` - passing the **personal info ID** (e.g., `personal_1760502976708_02w6kxxl3`)
3. `updatePersonalInfo()` then calls `PersonalInfo.load(personalInfoId)` 
4. **Problem**: `PersonalInfo.load()` expects a `userId`, not a `personalInfoId`
5. The database query `SELECT * FROM personal_info WHERE user_id = ?` fails because it's searching for a userId that matches the personalInfoId
6. This causes the "Personal info not found" error

## Solution
Fixed the method signature and implementation to be consistent:

### 1. Updated `PassportDataService.updatePersonalInfo()`
- Changed parameter name from `personalInfoId` to `userId` to clarify expectations
- Method now correctly expects a `userId` parameter
- Simplified the logic to directly call `PersonalInfo.load(userId)`

### 2. Updated `PassportDataService.upsertPersonalInfo()`
- Changed the update call from `updatePersonalInfo(personalInfo.id, data)` to `updatePersonalInfo(userId, data)`
- Now passes the `userId` instead of `personalInfo.id`

### 3. Added `SecureStorageService.getPersonalInfoById()`
- Added a new method to query personal info by ID (not userId) for future use cases
- This provides flexibility if we need to query by personal info ID in other scenarios

## Files Modified
1. `app/services/data/PassportDataService.js`
   - Fixed `updatePersonalInfo()` method signature and implementation
   - Fixed `upsertPersonalInfo()` to pass userId instead of personalInfo.id

2. `app/services/security/SecureStorageService.js`
   - Added `getPersonalInfoById()` method for querying by personal info ID

## Testing
After this fix:
1. Type in "City of Residency" field (e.g., "Hefei")
2. Move to next field (blur event triggers auto-save)
3. Personal info should update successfully without errors
4. Data should persist correctly in the database

## Technical Details
The key insight is that the database schema uses `user_id` as the foreign key to link personal info to users, not the personal info's own `id`. The `PersonalInfo.load()` method queries by `user_id`, so we must pass the userId, not the personalInfoId.

Database schema:
```sql
CREATE TABLE personal_info (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,  -- This is what we query by
  ...
)
```

Query in `PersonalInfo.load()`:
```sql
SELECT * FROM personal_info WHERE user_id = ? LIMIT 1
```

## Prevention
To prevent similar issues in the future:
1. Use clear parameter names (`userId` vs `personalInfoId`)
2. Add JSDoc comments specifying what type of ID is expected
3. Consider adding validation to check ID format (userId vs personalInfoId)
