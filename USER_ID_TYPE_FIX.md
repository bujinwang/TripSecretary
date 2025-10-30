# User ID Type Mismatch Fix

## The Real Problem (Final!)

After all previous fixes, app still failed with:
```
Failed to create tables: no such column: user_id
```

## Root Cause

**Type mismatch in foreign key references:**

Two tables had `user_id` defined as `INTEGER`, but the `users` table has `id` as `TEXT`:

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,  -- TEXT type
  ...
);

-- WRONG: Type mismatch
CREATE TABLE entry_guide_progress (
  user_id INTEGER NOT NULL,  -- INTEGER ❌
  FOREIGN KEY (user_id) REFERENCES users(id)  -- References TEXT
);

CREATE TABLE tdac_submission_logs (
  user_id INTEGER,  -- INTEGER ❌
  FOREIGN KEY (user_id) REFERENCES users(id)  -- References TEXT
);
```

## Why This Failed

SQLite enforces type affinity in foreign key relationships. When creating a foreign key that references a TEXT column, the referring column should also be TEXT.

The error "no such column: user_id" is misleading - it's actually a **type mismatch** error in the foreign key constraint validation.

## The Fix

### 1. Code Fix

**File**: `app/services/security/schema/DatabaseSchema.js`

**Line 478**: Changed `user_id INTEGER` → `user_id TEXT`
```javascript
CREATE TABLE IF NOT EXISTS entry_guide_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,  // ✅ Changed from INTEGER
  ...
);
```

**Line 513**: Changed `user_id INTEGER` → `user_id TEXT`
```javascript
CREATE TABLE IF NOT EXISTS tdac_submission_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,  // ✅ Changed from INTEGER
  ...
);
```

### 2. Database Cleanup

Dropped existing tables with wrong schema:
```sql
DROP TABLE entry_guide_progress;
DROP TABLE tdac_submission_logs;
```

These tables will be recreated with correct type on next app start.

## Complete Fix Timeline

### Issue 1: SecureStorageService not initialized
**Fix**: Added initialization in EntryInfoService.getAllEntryInfos()
**File**: app/services/EntryInfoService.js

### Issue 2: BackgroundJobService errors
**Fix**: Added graceful error handling
**File**: app/services/background/BackgroundJobService.js

### Issue 3: Snapshots migration failing
**Fix**: Added cleanup of orphaned tables, schema validation
**File**: app/services/security/schema/DatabaseSchema.js

### Issue 4: digital_arrival_cards wrong foreign key
**Fix**: Rebuilt table to reference entry_info instead of entry_info_old
**Database**: Manual rebuild

### Issue 5: user_id type mismatch (THIS FIX)
**Fix**: Changed INTEGER → TEXT in entry_guide_progress and tdac_submission_logs
**File**: app/services/security/schema/DatabaseSchema.js
**Database**: Dropped and will recreate with correct type

### Issue 6: Thailand destination_id inconsistency
**Fix**: Changed all 'thailand' → 'th'
**Files**: useThailandDataPersistence.js, ThailandEntryFlowScreen.js, TDACSubmissionService.js

## Type Consistency Check

All tables now correctly use TEXT for user_id:

✅ users: `id TEXT`
✅ passports: `user_id TEXT`
✅ personal_info: `user_id TEXT`
✅ fund_items: `user_id TEXT`
✅ entry_info: `user_id TEXT`
✅ travel_info: `user_id TEXT`
✅ entry_info_fund_items: `user_id TEXT`
✅ digital_arrival_cards: `user_id TEXT`
✅ travel_history: `user_id TEXT`
✅ snapshots: `user_id TEXT`
✅ entry_guide_progress: `user_id TEXT` (fixed)
✅ tdac_submission_logs: `user_id TEXT` (fixed)

## Testing

```bash
npx expo start --clear
```

### Expected Results:

1. ✅ No "no such column: user_id" error
2. ✅ No "Failed to create tables" error
3. ✅ Console shows: "✅ Database schema v2.0 created successfully"
4. ✅ Console shows: "BackgroundJobService started successfully"
5. ✅ entry_guide_progress table created with user_id TEXT
6. ✅ tdac_submission_logs table created with user_id TEXT
7. ✅ HomeScreen loads successfully
8. ✅ Thailand in "我的行程" (ARR: 0836C73)
9. ✅ Hong Kong in "填写中" (95%)

## Files Modified (Total: 4)

1. `app/services/EntryInfoService.js` - SecureStorageService initialization
2. `app/services/background/BackgroundJobService.js` - Error handling
3. `app/services/security/schema/DatabaseSchema.js` - Multiple fixes:
   - Snapshots migration cleanup
   - entry_guide_progress user_id type
   - tdac_submission_logs user_id type
4. Plus 3 Thailand destination_id files

## Prevention

To prevent type mismatches in future:

1. **Define user_id type consistently** across all tables
2. **Document type conventions** in schema comments
3. **Use TypeScript** for compile-time type checking
4. **Add schema validation** in migrations
5. **Test foreign key constraints** explicitly

## Lessons Learned

1. SQLite foreign key errors can be misleading ("no such column" instead of "type mismatch")
2. Type affinity matters even though SQLite is dynamically typed
3. Always check foreign key column types match referenced column types
4. Clean database state before testing schema changes
