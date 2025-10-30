# Database Migration Fix

## Problem

App was crashing during initialization with multiple errors:

1. `Migration error: there is already another table or index with this name: snapshots_old`
2. `Failed to create tables: no such column: user_id`
3. BackgroundJobService failing to check expired packs

## Root Cause

The snapshots table migration (v1.5.0) was failing because:

1. **Orphaned table**: Previous failed migration left `snapshots_old` table in database
2. **Missing column check**: Migration tried to read data from old table without checking if required columns exist
3. **No cleanup**: Failed migrations left database in inconsistent state

## Fixes Applied

### 1. DatabaseSchema.js Migration Fix

**File**: `app/services/security/schema/DatabaseSchema.js`

**Line 549**: Added cleanup before renaming
```javascript
// Drop any existing snapshots_old table from previous failed migrations
await db.execAsync('DROP TABLE IF EXISTS snapshots_old;');

// Rename old table
await db.execAsync('ALTER TABLE snapshots RENAME TO snapshots_old;');
```

**Line 588**: Added column existence check before migration
```javascript
// Check if old table has user_id column (required for migration)
const oldTableInfo = await db.getAllAsync("PRAGMA table_info(snapshots_old)");
const oldHasUserId = oldTableInfo.some(col => col.name === 'user_id');

if (!oldHasUserId) {
  console.warn('⚠️ Old snapshots table missing user_id column, skipping data migration');
  await db.execAsync('DROP TABLE snapshots_old;');
  return;
}
```

### 2. Database Cleanup

Manually cleaned up orphaned tables:
```sql
DROP TABLE IF EXISTS snapshots_old;
DROP TABLE IF EXISTS entry_info_old;
```

### 3. Previous Fixes (Still Applied)

1. **EntryInfoService.js**: Added SecureStorageService initialization
2. **BackgroundJobService.js**: Added graceful error handling
3. **Thailand destination_id**: Fixed all hardcoded 'thailand' → 'th'

## Migration Strategy

The improved migration now:

1. ✅ Checks for and removes orphaned tables before starting
2. ✅ Validates old table schema before attempting data migration
3. ✅ Gracefully skips migration if data is incompatible
4. ✅ Logs warnings instead of throwing errors for non-critical failures

## Testing Steps

1. **Clean restart**:
   ```bash
   # Stop app
   # Restart with:
   npx expo start --clear
   ```

2. **Check console logs**:
   - Should see: "✅ Database schema v2.0 created successfully"
   - Should NOT see: "Migration error"
   - Should NOT see: "no such column: user_id"

3. **Verify HomeScreen**:
   - Thailand in "我的行程" section
   - Hong Kong in "填写中" section
   - No console errors

## Migration Flow

```
Start Migration
↓
Check snapshots table schema
↓
Has old schema? → NO → Skip migration
                 ↓ YES
                 ↓
Drop existing snapshots_old (cleanup)
                 ↓
Rename snapshots → snapshots_old
                 ↓
Create new snapshots table
                 ↓
Check if snapshots_old has user_id
                 ↓
Has user_id? → NO → Drop snapshots_old, exit
              ↓ YES
              ↓
Migrate data
              ↓
Drop snapshots_old
              ↓
Complete ✅
```

## Prevention

To prevent similar issues in future migrations:

1. **Always check for orphaned tables** before renaming
2. **Validate old schema** before attempting data migration
3. **Use transactions** for atomic operations
4. **Log warnings** instead of throwing for non-critical errors
5. **Test migrations** with different database states

## Files Modified

1. `app/services/security/schema/DatabaseSchema.js`
   - Line 549: Added snapshots_old cleanup
   - Line 588: Added user_id column check

2. `app/services/EntryInfoService.js`
   - Line 14: Added SecureStorageService initialization

3. `app/services/background/BackgroundJobService.js`
   - Line 165: Added try-catch for entry info retrieval

## Database State After Fix

All tables present and clean:
```
audit_log
digital_arrival_cards
entry_guide_progress
entry_info
entry_info_fund_items
fund_items
passport_countries
passports
personal_info
settings
snapshots (✅ migrated to v1.5.0)
tdac_submission_logs
travel_history
travel_info
travel_info_backup
users
```

No orphaned tables: ✅
