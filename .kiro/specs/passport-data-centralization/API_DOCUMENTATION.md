# PassportDataService API Documentation

## Overview

PassportDataService is the unified data access layer for all user data in the 入境通 (Entry Assistant) app. It provides a consistent interface for managing passport, personal info, and funding proof data with built-in caching, migration, and batch operations.

## Table of Contents

1. [Initialization](#initialization)
2. [Passport Operations](#passport-operations)
3. [Personal Info Operations](#personal-info-operations)
4. [Funding Proof Operations](#funding-proof-operations)
5. [Unified Operations](#unified-operations)
6. [Cache Management](#cache-management)
7. [Migration](#migration)
8. [Error Handling](#error-handling)

## Initialization

### `initialize(userId)`

Initialize the service for a user. Must be called before any other operations.

**Parameters:**
- `userId` (string): User identifier

**Returns:** `Promise<void>`

**Example:**
```javascript
import PassportDataService from './services/data/PassportDataService';

await PassportDataService.initialize('user_123');
```

**Notes:**
- Automatically checks and performs migration if needed
- Safe to call multiple times (idempotent)
- Should be called on app startup

## Passport Operations

### `getPassport(userId)`

Get passport data for a user with caching.

**Parameters:**
- `userId` (string): User identifier

**Returns:** `Promise<Passport|null>`

**Example:**
```javascript
const passport = await PassportDataService.getPassport('user_123');
if (passport) {
  console.log('Passport number:', passport.passportNumber);
  console.log('Full name:', passport.fullName);
  console.log('Gender:', passport.gender);
}
```

### `savePassport(passportData, userId)`

Create a new passport record.

**Parameters:**
- `passportData` (Object): Passport data
- `userId` (string): User identifier

**Returns:** `Promise<Passport>`

**Example:**
```javascript
const passport = await PassportDataService.savePassport({
  passportNumber: 'E12345678',
  fullName: 'ZHANG, WEI',
  dateOfBirth: '1988-01-22',
  nationality: 'CHN',
  gender: 'Male',
  expiryDate: '2030-12-31',
  issueDate: '2020-12-31',
  issuePlace: 'Shanghai'
}, 'user_123');
```

### `updatePassport(passportId, updates)`

Update specific fields of an existing passport.

**Parameters:**
- `passportId` (string): Passport ID or userId
- `updates` (Object): Fields to update

**Returns:** `Promise<Passport>`

**Example:**
```javascript
const updatedPassport = await PassportDataService.updatePassport('user_123', {
  expiryDate: '2031-12-31',
  issuePlace: 'Beijing'
});
```

## Personal Info Operations

### `getPersonalInfo(userId)`

Get personal info for a user with caching.

**Parameters:**
- `userId` (string): User identifier

**Returns:** `Promise<PersonalInfo|null>`

**Example:**
```javascript
const personalInfo = await PassportDataService.getPersonalInfo('user_123');
if (personalInfo) {
  console.log('Email:', personalInfo.email);
  console.log('Phone:', personalInfo.phoneNumber);
  console.log('Occupation:', personalInfo.occupation);
}
```

### `savePersonalInfo(personalData, userId)`

Create a new personal info record.

**Parameters:**
- `personalData` (Object): Personal info data
- `userId` (string): User identifier

**Returns:** `Promise<PersonalInfo>`

**Example:**
```javascript
const personalInfo = await PassportDataService.savePersonalInfo({
  phoneNumber: '+86 13812345678',
  email: 'traveler@example.com',
  homeAddress: '123 Main St, Shanghai',
  occupation: 'BUSINESS MAN',
  provinceCity: 'ANHUI',
  countryRegion: 'CHN'
}, 'user_123');
```

### `updatePersonalInfo(personalInfoId, updates)`

Update specific fields of existing personal info.

**Parameters:**
- `personalInfoId` (string): Personal info ID or userId
- `updates` (Object): Fields to update

**Returns:** `Promise<PersonalInfo>`

**Example:**
```javascript
const updated = await PassportDataService.updatePersonalInfo('user_123', {
  phoneNumber: '+86 13987654321',
  occupation: 'ENGINEER'
});
```

## Funding Proof Operations

### `getFundingProof(userId)`

Get funding proof for a user with caching.

**Parameters:**
- `userId` (string): User identifier

**Returns:** `Promise<FundingProof|null>`

**Example:**
```javascript
const fundingProof = await PassportDataService.getFundingProof('user_123');
if (fundingProof) {
  console.log('Cash:', fundingProof.cashAmount);
  console.log('Bank cards:', fundingProof.bankCards);
}
```

### `saveFundingProof(fundingData, userId)`

Create a new funding proof record.

**Parameters:**
- `fundingData` (Object): Funding proof data
- `userId` (string): User identifier

**Returns:** `Promise<FundingProof>`

**Example:**
```javascript
const fundingProof = await PassportDataService.saveFundingProof({
  cashAmount: '10,000 THB equivalent',
  bankCards: 'CMB Visa (****1234) · Balance 20,000 CNY',
  supportingDocs: 'Bank app screenshots saved'
}, 'user_123');
```

### `updateFundingProof(fundingProofId, updates)`

Update specific fields of existing funding proof.

**Parameters:**
- `fundingProofId` (string): Funding proof ID or userId
- `updates` (Object): Fields to update

**Returns:** `Promise<FundingProof>`

**Example:**
```javascript
const updated = await PassportDataService.updateFundingProof('user_123', {
  cashAmount: '15,000 THB equivalent'
});
```

## Unified Operations

### `getAllUserData(userId, options)`

Load all user data at once with optimized batch loading.

**Parameters:**
- `userId` (string): User identifier
- `options` (Object, optional):
  - `useBatchLoad` (boolean): Use batch loading (default: true)

**Returns:** `Promise<Object>`

**Response Object:**
```javascript
{
  passport: Passport|null,
  personalInfo: PersonalInfo|null,
  fundingProof: FundingProof|null,
  userId: string,
  loadedAt: string,
  loadDurationMs: number
}
```

**Example:**
```javascript
const userData = await PassportDataService.getAllUserData('user_123');
console.log('Passport:', userData.passport);
console.log('Personal Info:', userData.personalInfo);
console.log('Funding Proof:', userData.fundingProof);
console.log('Load time:', userData.loadDurationMs, 'ms');
```

### `saveAllUserData(userData, userId)`

Save all user data at once using batch operations.

**Parameters:**
- `userData` (Object): Object containing all user data
  - `passport` (Object, optional): Passport data
  - `personalInfo` (Object, optional): Personal info data
  - `fundingProof` (Object, optional): Funding proof data
- `userId` (string): User identifier

**Returns:** `Promise<Object>`

**Example:**
```javascript
const saved = await PassportDataService.saveAllUserData({
  passport: { passportNumber: 'E12345678', ... },
  personalInfo: { email: 'user@example.com', ... },
  fundingProof: { cashAmount: '10,000 THB', ... }
}, 'user_123');
```

### `batchUpdate(userId, updates)`

Update multiple data types in a single transaction.

**Parameters:**
- `userId` (string): User identifier
- `updates` (Object): Updates for each data type
  - `passport` (Object, optional): Passport updates
  - `personalInfo` (Object, optional): Personal info updates
  - `fundingProof` (Object, optional): Funding proof updates

**Returns:** `Promise<Object>`

**Example:**
```javascript
const updated = await PassportDataService.batchUpdate('user_123', {
  passport: { expiryDate: '2031-12-31' },
  personalInfo: { phoneNumber: '+86 13987654321' },
  fundingProof: { cashAmount: '15,000 THB' }
});
```

### `hasUserData(userId)`

Check if user has any data.

**Parameters:**
- `userId` (string): User identifier

**Returns:** `Promise<boolean>`

**Example:**
```javascript
const hasData = await PassportDataService.hasUserData('user_123');
if (!hasData) {
  console.log('User has no data yet');
}
```

### `deleteAllUserData(userId)`

Delete all user data (GDPR compliance).

**Parameters:**
- `userId` (string): User identifier

**Returns:** `Promise<void>`

**Example:**
```javascript
await PassportDataService.deleteAllUserData('user_123');
console.log('All user data deleted');
```

## Cache Management

### `clearCache()`

Clear all cached data.

**Returns:** `void`

**Example:**
```javascript
PassportDataService.clearCache();
```

### `refreshCache(userId)`

Refresh cache for a specific user.

**Parameters:**
- `userId` (string): User identifier

**Returns:** `Promise<void>`

**Example:**
```javascript
await PassportDataService.refreshCache('user_123');
```

### `getCacheStats()`

Get cache performance statistics.

**Returns:** `Object`

**Response Object:**
```javascript
{
  hits: number,
  misses: number,
  invalidations: number,
  totalRequests: number,
  hitRate: number,
  timeSinceReset: number,
  lastReset: number
}
```

**Example:**
```javascript
const stats = PassportDataService.getCacheStats();
console.log('Cache hit rate:', stats.hitRate, '%');
console.log('Total requests:', stats.totalRequests);
```

### `logCacheStats()`

Log cache statistics to console.

**Returns:** `void`

**Example:**
```javascript
PassportDataService.logCacheStats();
// Output:
// === PassportDataService Cache Statistics ===
// Time period: 5.23 minutes
// Cache hits: 45
// Cache misses: 12
// Hit rate: 78.95%
// ...
```

### `resetCacheStats()`

Reset cache statistics counters.

**Returns:** `void`

**Example:**
```javascript
PassportDataService.resetCacheStats();
```

## Migration

### `migrateFromAsyncStorage(userId)`

Migrate user data from AsyncStorage to SQLite.

**Parameters:**
- `userId` (string): User identifier

**Returns:** `Promise<Object>`

**Response Object:**
```javascript
{
  success: boolean,
  alreadyMigrated: boolean,
  passport: Passport|null,
  personalInfo: PersonalInfo|null,
  fundingProof: FundingProof|null,
  errors: string[]
}
```

**Example:**
```javascript
const result = await PassportDataService.migrateFromAsyncStorage('user_123');
if (result.success) {
  console.log('Migration successful');
  console.log('Migrated passport:', result.passport);
  console.log('Errors:', result.errors);
}
```

**Notes:**
- Automatically called during initialization
- Safe to call multiple times (idempotent)
- Partial migration is supported (some data types may fail)

## Error Handling

### Error Types

1. **ValidationError**: Data validation failed
2. **StorageError**: Database operation failed
3. **MigrationError**: Migration failed
4. **NotFoundError**: Data not found

### Error Handling Pattern

```javascript
try {
  const passport = await PassportDataService.getPassport('user_123');
} catch (error) {
  if (error.name === 'ValidationError') {
    console.error('Invalid data:', error.message);
  } else if (error.name === 'StorageError') {
    console.error('Database error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Best Practices

1. **Always initialize first:**
   ```javascript
   await PassportDataService.initialize(userId);
   ```

2. **Handle null returns:**
   ```javascript
   const passport = await PassportDataService.getPassport(userId);
   if (!passport) {
     // Handle no data case
   }
   ```

3. **Use batch operations for multiple updates:**
   ```javascript
   // Good: Single transaction
   await PassportDataService.batchUpdate(userId, { ... });
   
   // Avoid: Multiple separate calls
   await PassportDataService.updatePassport(userId, { ... });
   await PassportDataService.updatePersonalInfo(userId, { ... });
   ```

4. **Monitor cache performance:**
   ```javascript
   // Periodically check cache effectiveness
   const stats = PassportDataService.getCacheStats();
   if (stats.hitRate < 50) {
     console.warn('Low cache hit rate');
   }
   ```

5. **Clear cache on logout:**
   ```javascript
   PassportDataService.clearCache();
   ```

## Performance Considerations

- **Caching**: 5-minute TTL reduces database calls
- **Batch Loading**: Single transaction for getAllUserData()
- **Batch Updates**: Single transaction for multiple updates
- **Indexes**: userId indexes on all tables for fast lookups
- **Connection Pooling**: Reuses database connections

## Security

- **Encryption**: Sensitive fields encrypted at rest
- **Access Control**: userId validation on all operations
- **Audit Logging**: All operations logged
- **GDPR Compliance**: Export and delete operations supported
