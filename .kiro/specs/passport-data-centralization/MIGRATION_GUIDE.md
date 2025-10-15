# Migration Guide: AsyncStorage to SQLite

## Overview

This guide explains how the passport data centralization feature migrates existing user data from AsyncStorage to SQLite, ensuring a seamless transition for existing users.

## Migration Process

### Automatic Migration

The migration happens automatically when:
1. A user opens the app after the update
2. The system detects existing data in AsyncStorage
3. No previous migration has been completed for that user

### Migration Flow

```
User Opens App
     ↓
PassportDataService.initialize(userId)
     ↓
Check: needsMigration(userId)?
     ↓ (Yes)
migrateFromAsyncStorage(userId)
     ↓
Load data from AsyncStorage keys
     ↓
Transform data to new format
     ↓
Validate transformed data
     ↓
Save to SQLite tables
     ↓
Mark migration complete
     ↓
Continue normal operation
```

## Migration Details

### 1. Passport Data Migration

**AsyncStorage Keys Checked:**
- `@passport_${userId}`
- `@passport`
- `passport`
- `@user_passport`
- `user_passport`

**Transformation:**
```javascript
// Old format (AsyncStorage)
{
  passportNumber: "E12345678",
  fullName: "ZHANG, WEI",
  // ... other fields
}

// New format (SQLite)
{
  id: "passport_1234567890_abc123",
  userId: "user_123",
  passportNumber: "E12345678", // ENCRYPTED
  fullName: "ZHANG, WEI", // ENCRYPTED
  gender: "Male", // NEW FIELD
  // ... other fields
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

### 2. Personal Info Migration

**AsyncStorage Keys Checked:**
- `@personal_info_${userId}`
- `@personal_info`
- `personal_info`

**Transformation:**
- Adds `userId` field
- Adds `id` field
- Adds timestamps
- Maintains encryption on sensitive fields

### 3. Funding Proof Migration

**AsyncStorage Keys Checked:**
- `@funding_proof_${userId}`
- `@funding_proof`
- `funding_proof`

**Transformation:**
- Creates new FundingProof model instance
- Adds `userId` field
- Adds `id` field
- Adds timestamps
- Maintains encryption on all fields

## Migration Tracking

### Migration Status Table

```sql
CREATE TABLE IF NOT EXISTS migrations (
  user_id TEXT PRIMARY KEY,
  migrated_at TEXT,
  source TEXT
);
```

### Checking Migration Status

```javascript
const needsMigration = await SecureStorageService.needsMigration(userId);
if (needsMigration) {
  await PassportDataService.migrateFromAsyncStorage(userId);
}
```

## Error Handling

### Partial Migration

If migration fails for one data type, others continue:

```javascript
{
  success: true,
  passport: PassportInstance,
  personalInfo: null, // Failed to migrate
  fundingProof: FundingProofInstance,
  errors: ['PersonalInfo: Invalid data format']
}
```

### Migration Idempotency

Migration is safe to run multiple times:
- Checks if already completed before starting
- Marks completion in database
- Subsequent calls return immediately

### Fallback Strategy

If migration fails completely:
1. Error is logged
2. App continues with empty state
3. User can manually re-enter data
4. Data is saved to SQLite going forward

## Testing Migration

### Manual Testing

```javascript
// Force migration for testing
await SecureStorageService.clearMigrationStatus(userId);
await PassportDataService.migrateFromAsyncStorage(userId);
```

### Verification

```javascript
// Check migration result
const userData = await PassportDataService.getAllUserData(userId);
console.log('Migrated data:', userData);

// Verify in database
const migrationStatus = await SecureStorageService.getMigrationStatus(userId);
console.log('Migration status:', migrationStatus);
```

## Post-Migration

### Data Cleanup (Optional)

After successful migration, AsyncStorage data can be cleaned up:

```javascript
// Optional: Remove old AsyncStorage keys
await AsyncStorage.removeItem(`@passport_${userId}`);
await AsyncStorage.removeItem(`@personal_info_${userId}`);
await AsyncStorage.removeItem(`@funding_proof_${userId}`);
```

**Note:** Cleanup is optional and not automatically performed to maintain backward compatibility.

## Troubleshooting

### Migration Not Triggering

**Check:**
1. Is `PassportDataService.initialize(userId)` called?
2. Does user have data in AsyncStorage?
3. Is migration already marked complete?

### Data Not Appearing After Migration

**Check:**
1. Migration result object for errors
2. Database tables exist
3. Encryption keys are valid
4. Cache is not stale

### Performance Issues

**Solutions:**
1. Migration runs once per user
2. Uses batch operations for efficiency
3. Happens in background on app start
4. Does not block UI

## Best Practices

1. **Always initialize before use:**
   ```javascript
   await PassportDataService.initialize(userId);
   ```

2. **Handle migration errors gracefully:**
   ```javascript
   try {
     await PassportDataService.initialize(userId);
   } catch (error) {
     console.error('Migration failed:', error);
     // Continue with empty state
   }
   ```

3. **Monitor migration success rate:**
   - Log migration results
   - Track errors in analytics
   - Alert on high failure rates

4. **Test with real data:**
   - Export production AsyncStorage data
   - Test migration in development
   - Verify data integrity

## Migration Timeline

1. **Phase 1:** Deploy with migration code
2. **Phase 2:** Monitor migration success (1-2 weeks)
3. **Phase 3:** Optional AsyncStorage cleanup
4. **Phase 4:** Remove migration code (after 90% adoption)
