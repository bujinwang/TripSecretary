# PassportDataService Migration Process Documentation

## Overview

This document describes the complete migration process for transitioning user data from AsyncStorage to SQLite using the PassportDataService. The migration is automatic, one-time, and designed to be transparent to users.

## Migration Architecture

### High-Level Flow

```
┌─────────────────┐
│  App Startup    │
│  or User Login  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ PassportDataService.initialize()│
└────────┬────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Check if migration needed        │
│ SecureStorageService.            │
│   needsMigration(userId)         │
└────────┬─────────────────────────┘
         │
         ├─── Already Migrated ───► Skip Migration
         │
         └─── Needs Migration
                    │
                    ▼
         ┌──────────────────────────┐
         │ migrateFromAsyncStorage()│
         └──────────┬───────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         ▼                     ▼
┌────────────────┐    ┌────────────────┐
│ Migrate        │    │ Migrate        │
│ Passport       │    │ PersonalInfo   │
└────────┬───────┘    └────────┬───────┘
         │                     │
         └──────────┬──────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Migrate FundingProof │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────────┐
         │ Mark Migration Complete  │
         │ (prevents re-migration)  │
         └──────────────────────────┘
```

## Migration Process Details

### 1. Migration Check

The migration check determines if a user's data needs to be migrated from AsyncStorage to SQLite.

```javascript
// Check if migration is needed
const needsMigration = await SecureStorageService.needsMigration(userId);

// Returns true if:
// - No migration record exists for this user in the migrations table
// - User has never been migrated before

// Returns false if:
// - Migration record exists (user already migrated)
// - Migration was completed successfully in the past
```

### 2. Migration Execution

When migration is needed, the service executes a three-phase migration:

#### Phase 1: Passport Data Migration

```javascript
async migratePassportFromAsyncStorage(userId) {
  // 1. Search for passport data in common AsyncStorage keys
  const possibleKeys = [
    `@passport_${userId}`,
    '@passport',
    'passport',
    '@user_passport',
    'user_passport'
  ];

  // 2. Load data from first matching key
  let passportData = null;
  for (const key of possibleKeys) {
    const data = await AsyncStorage.getItem(key);
    if (data) {
      passportData = JSON.parse(data);
      break;
    }
  }

  // 3. Transform data to new format
  const transformedData = this.transformPassportData(passportData, userId);

  // 4. Save to SQLite
  const passport = await this.savePassport(transformedData, userId);

  return passport;
}
```

**Data Transformation:**
- Adds `userId` field if missing
- Adds `gender` field with default value 'Undefined'
- Ensures all required fields are present
- Validates data format
- Generates new ID if needed

#### Phase 2: Personal Info Migration

```javascript
async migratePersonalInfoFromAsyncStorage(userId) {
  // Similar process to passport migration
  const possibleKeys = [
    `@personal_info_${userId}`,
    '@personal_info',
    'personal_info',
    '@user_personal_info',
    'user_personal_info'
  ];

  // Load, transform, and save to SQLite
  // ...
}
```

**Data Transformation:**
- Adds `userId` field
- Ensures encrypted fields remain encrypted
- Validates email and phone number formats
- Generates new ID if needed

#### Phase 3: Funding Proof Migration

```javascript
async migrateFundingProofFromAsyncStorage(userId) {
  // Similar process to passport migration
  const possibleKeys = [
    `@funding_proof_${userId}`,
    '@funding_proof',
    'funding_proof',
    '@user_funding_proof',
    'user_funding_proof'
  ];

  // Load, transform, and save to SQLite
  // ...
}
```

**Data Transformation:**
- Adds `userId` field
- Ensures sensitive financial data remains encrypted
- Validates data structure
- Generates new ID if needed

### 3. Migration Completion

After all three phases complete (successfully or with errors), the migration is marked as complete:

```javascript
// Mark migration as complete
await SecureStorageService.markMigrationComplete(userId, 'AsyncStorage');

// This creates a record in the migrations table:
// {
//   user_id: 'user_123',
//   migrated_at: '2024-01-15T10:30:00Z',
//   source: 'AsyncStorage'
// }
```

## Migration Result Object

The migration process returns a detailed result object:

```javascript
{
  success: true,              // Overall migration success
  alreadyMigrated: false,     // Whether migration was already done
  passport: Passport,         // Migrated passport instance (or null)
  personalInfo: PersonalInfo, // Migrated personal info instance (or null)
  fundingProof: FundingProof, // Migrated funding proof instance (or null)
  errors: [],                 // Array of error messages (if any)
  message: 'Migration completed successfully'
}
```

## Error Handling

### Partial Migration Success

The migration is designed to be resilient. If one data type fails to migrate, the others will still be attempted:

```javascript
// Example: Passport migration fails, but others succeed
{
  success: true,
  passport: null,
  personalInfo: PersonalInfo,
  fundingProof: FundingProof,
  errors: ['Passport: Invalid data format']
}
```

### Complete Migration Failure

If all migrations fail, the result indicates failure but doesn't prevent app usage:

```javascript
{
  success: false,
  passport: null,
  personalInfo: null,
  fundingProof: null,
  errors: [
    'Passport: No data found',
    'PersonalInfo: No data found',
    'FundingProof: No data found'
  ]
}
```

### Graceful Degradation

If migration fails completely:
1. User can still use the app
2. They start with empty data
3. New data is saved directly to SQLite
4. Migration is marked complete to prevent retry loops

## Migration Idempotency

The migration process is idempotent - it can be called multiple times safely:

```javascript
// First call: Performs migration
await PassportDataService.migrateFromAsyncStorage(userId);
// Result: { success: true, alreadyMigrated: false, ... }

// Second call: Skips migration
await PassportDataService.migrateFromAsyncStorage(userId);
// Result: { success: true, alreadyMigrated: true, message: 'Migration already completed' }
```

## Data Transformation Examples

### Passport Data Transformation

**Before (AsyncStorage):**
```javascript
{
  passportNumber: "E12345678",
  fullName: "ZHANG, WEI",
  dateOfBirth: "1988-01-22",
  nationality: "CHN",
  expiryDate: "2030-12-31"
  // Missing: userId, gender, id
}
```

**After (SQLite):**
```javascript
{
  id: "passport_1705315800000_abc123",
  userId: "user_123",
  passportNumber: "E12345678",
  fullName: "ZHANG, WEI",
  dateOfBirth: "1988-01-22",
  nationality: "CHN",
  gender: "Undefined",  // Added with default
  expiryDate: "2030-12-31",
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

### Personal Info Transformation

**Before (AsyncStorage):**
```javascript
{
  phoneNumber: "+86 12345678901",
  email: "user@example.com",
  occupation: "BUSINESS MAN"
  // Missing: userId, id, timestamps
}
```

**After (SQLite):**
```javascript
{
  id: "personal_1705315800000_def456",
  userId: "user_123",
  phoneNumber: "+86 12345678901",  // Encrypted
  email: "user@example.com",       // Encrypted
  occupation: "BUSINESS MAN",
  provinceCity: "",
  countryRegion: "",
  homeAddress: "",
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

## Testing Migration

### Manual Testing

```javascript
// 1. Set up test data in AsyncStorage
await AsyncStorage.setItem('@passport', JSON.stringify({
  passportNumber: "E12345678",
  fullName: "TEST USER",
  nationality: "CHN"
}));

// 2. Clear any existing migration records
await SecureStorageService.clearMigrationStatus('test_user');

// 3. Run migration
const result = await PassportDataService.migrateFromAsyncStorage('test_user');

// 4. Verify result
console.log('Migration result:', result);
expect(result.success).toBe(true);
expect(result.passport).toBeTruthy();

// 5. Verify data in SQLite
const passport = await PassportDataService.getPassport('test_user');
expect(passport.passportNumber).toBe("E12345678");
```

### Automated Testing

See `app/services/data/__tests__/PassportDataService.migration.test.js` for comprehensive migration tests.

## Migration Monitoring

### Logging

The migration process includes detailed logging:

```javascript
// Migration start
console.log('Starting AsyncStorage migration for user user_123');

// Individual data type migrations
console.log('Found passport data in AsyncStorage key: @passport');
console.log('Passport data migrated successfully');

// Migration completion
console.log('AsyncStorage migration completed for user user_123');
console.log('Migration result:', migrationResult);
```

### Error Logging

Errors are logged but don't prevent partial success:

```javascript
// Individual errors
console.error('Failed to migrate passport data:', error);

// Collected in result
migrationResult.errors.push(`Passport: ${error.message}`);
```

## Best Practices

### 1. Call During Initialization

Always call migration during app initialization or user login:

```javascript
// In App.js or login handler
useEffect(() => {
  const initializeApp = async () => {
    const userId = await getCurrentUserId();
    await PassportDataService.initialize(userId);
    // Migration happens automatically if needed
  };
  
  initializeApp();
}, []);
```

### 2. Handle Migration Errors Gracefully

Don't block app usage if migration fails:

```javascript
try {
  await PassportDataService.initialize(userId);
} catch (error) {
  console.error('Initialization failed:', error);
  // App continues to work with empty data
}
```

### 3. Don't Manually Call Migration

Let `initialize()` handle migration automatically:

```javascript
// ✅ Good: Let initialize handle it
await PassportDataService.initialize(userId);

// ❌ Bad: Manual migration call
await PassportDataService.migrateFromAsyncStorage(userId);
```

### 4. Monitor Migration Success

Track migration success rates in production:

```javascript
const result = await PassportDataService.initialize(userId);
if (result && !result.alreadyMigrated) {
  // Log migration event to analytics
  analytics.track('data_migration_completed', {
    success: result.success,
    errors: result.errors.length
  });
}
```

## Troubleshooting

### Migration Not Running

**Problem:** Migration doesn't execute even though data exists in AsyncStorage.

**Solution:**
1. Check if migration was already marked complete
2. Clear migration status for testing: `await SecureStorageService.clearMigrationStatus(userId)`
3. Verify AsyncStorage keys match expected patterns

### Partial Data Migration

**Problem:** Some data types migrate but others don't.

**Solution:**
1. Check migration result object for specific errors
2. Verify data format in AsyncStorage
3. Check console logs for detailed error messages

### Data Not Appearing After Migration

**Problem:** Migration succeeds but data doesn't appear in app.

**Solution:**
1. Clear cache: `PassportDataService.clearCache()`
2. Verify data in SQLite: `await PassportDataService.getAllUserData(userId)`
3. Check if screens are using PassportDataService correctly

## Migration Rollback

If migration causes issues, you can rollback by:

1. **Clear migration status:**
```javascript
await SecureStorageService.clearMigrationStatus(userId);
```

2. **Clear SQLite data:**
```javascript
await PassportDataService.deleteAllUserData(userId);
```

3. **Re-run migration:**
```javascript
await PassportDataService.initialize(userId);
```

## Future Considerations

### Multi-Version Migration

If data schema changes in the future, add version tracking:

```javascript
// migrations table
{
  user_id: 'user_123',
  migrated_at: '2024-01-15T10:30:00Z',
  source: 'AsyncStorage',
  version: 1  // Add version tracking
}
```

### Batch Migration

For migrating many users at once (e.g., during app update):

```javascript
async function batchMigrate(userIds) {
  const results = await Promise.allSettled(
    userIds.map(id => PassportDataService.migrateFromAsyncStorage(id))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`Batch migration: ${successful} succeeded, ${failed} failed`);
}
```

## Summary

The migration process is:
- **Automatic**: Triggered during initialization
- **One-time**: Marked complete after first run
- **Resilient**: Handles partial failures gracefully
- **Idempotent**: Safe to call multiple times
- **Transparent**: Users don't see migration happening
- **Logged**: Detailed logging for debugging

For implementation details, see:
- `app/services/data/PassportDataService.js` - Migration implementation
- `app/services/security/SecureStorageService.js` - Migration tracking
- `app/services/data/__tests__/PassportDataService.migration.test.js` - Migration tests
