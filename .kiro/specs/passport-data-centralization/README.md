# Passport Data Centralization

## Overview

This feature implements a centralized data management system for user information in the 入境通 (Entry Assistant) app. It eliminates data duplication across screens and ensures consistency by using SQLite as the single source of truth for all user data.

## Problem Statement

**Before:** User data (passport, personal info, funding proof) was duplicated and managed separately in different entry forms (Thailand, Japan, etc.) and the Profile screen, leading to:
- Data inconsistency across screens
- Redundant data entry for users
- Difficult maintenance and debugging
- Poor user experience

**After:** All user data is centralized in SQLite tables, with:
- Single source of truth
- Automatic data reuse across all screens
- Consistent data everywhere
- Better performance with caching
- Seamless migration from old storage

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  (ProfileScreen, ThailandScreen, JapanScreen, etc.)         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ PassportDataService  │ ← Unified Data Access Layer
              │  (Caching, Migration)│
              └──────────┬───────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    ┌─────────┐    ┌──────────┐   ┌──────────┐
    │Passport │    │Personal  │   │ Funding  │
    │ Model   │    │Info Model│   │Proof Model│
    └────┬────┘    └────┬─────┘   └────┬─────┘
         │              │              │
         └──────────────┼──────────────┘
                        ▼
              ┌──────────────────┐
              │SecureStorageService│
              │  (Encryption)     │
              └─────────┬─────────┘
                        ▼
              ┌──────────────────┐
              │  SQLite Database │
              │  - passports     │
              │  - personal_info │
              │  - funding_proof │
              └──────────────────┘
```

### Key Components

1. **PassportDataService** - Unified data access layer
   - Location: `app/services/data/PassportDataService.js`
   - Provides CRUD operations for all data types
   - Implements caching for performance
   - Handles migration from AsyncStorage

2. **Data Models**
   - `Passport` - Passport information
   - `PersonalInfo` - Personal details
   - `FundingProof` - Financial proof documents

3. **SecureStorageService** - Database layer
   - Manages SQLite operations
   - Handles encryption/decryption
   - Provides transaction support

## Features

### ✅ Centralized Storage
- Single SQLite database for all user data
- No more data duplication
- Consistent data across all screens

### ✅ Automatic Migration
- Seamlessly migrates existing AsyncStorage data
- One-time migration per user
- No data loss

### ✅ Performance Optimization
- In-memory caching (5-minute TTL)
- Batch operations for multiple updates
- Database indexes for fast lookups
- ~100ms data load time

### ✅ Data Consistency
- Validation on save
- Conflict detection and resolution
- Consistency checks across data types

### ✅ Security
- Field-level encryption for sensitive data
- Secure key management
- GDPR compliance (export/delete)

## Quick Start

### Basic Usage

```javascript
import PassportDataService from './services/data/PassportDataService';

// 1. Initialize (call once on app start)
await PassportDataService.initialize('user_123');

// 2. Load all user data
const userData = await PassportDataService.getAllUserData('user_123');
console.log(userData.passport);
console.log(userData.personalInfo);
console.log(userData.fundingProof);

// 3. Update data
await PassportDataService.updatePassport('user_123', {
  expiryDate: '2031-12-31'
});
```

### Screen Integration

```javascript
// In your screen component
useEffect(() => {
  const loadData = async () => {
    const userId = getCurrentUserId();
    await PassportDataService.initialize(userId);
    const data = await PassportDataService.getAllUserData(userId);
    setPassportData(data.passport);
    setPersonalInfo(data.personalInfo);
  };
  loadData();
}, []);
```

## Documentation

### Core Documentation

1. **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference
2. **[Usage Examples](./USAGE_EXAMPLES.md)** - Code examples and patterns
3. **[Migration Guide](./MIGRATION_GUIDE.md)** - AsyncStorage to SQLite migration
4. **[Requirements](./requirements.md)** - Feature requirements
5. **[Design](./design.md)** - Technical design document

### Additional Resources

- **[Validation Examples](./VALIDATION_EXAMPLES.md)** - Data validation patterns
- **[Cache Demo](./CACHE_DEMO.js)** - Caching demonstration
- **[Batch Operations](./BATCH_OPERATIONS_DEMO.md)** - Batch operation examples
- **[Index Documentation](./INDEX_DOCUMENTATION.md)** - Database index details
- **[Cleanup Summary](./CLEANUP_SUMMARY.md)** - Code cleanup report

## Data Models

### Passport

```javascript
{
  id: "passport_123456789",
  userId: "user_123",
  passportNumber: "E12345678",     // ENCRYPTED
  fullName: "ZHANG, WEI",          // ENCRYPTED
  dateOfBirth: "1988-01-22",       // ENCRYPTED
  nationality: "CHN",              // ENCRYPTED
  gender: "Male",                  // NEW FIELD
  expiryDate: "2030-12-31",
  issueDate: "2020-12-31",
  issuePlace: "Shanghai",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

### Personal Info

```javascript
{
  id: "personal_123456789",
  userId: "user_123",
  phoneNumber: "+86 12345678901",  // ENCRYPTED
  email: "user@example.com",       // ENCRYPTED
  homeAddress: "123 Main St",      // ENCRYPTED
  occupation: "BUSINESS MAN",
  provinceCity: "ANHUI",
  countryRegion: "CHN",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

### Funding Proof

```javascript
{
  id: "funding_123456789",
  userId: "user_123",
  cashAmount: "10,000 THB",        // ENCRYPTED
  bankCards: "CMB Visa (****1234)", // ENCRYPTED
  supportingDocs: "Screenshots",   // ENCRYPTED
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

## API Reference

### Initialization

```javascript
await PassportDataService.initialize(userId)
```

### Passport Operations

```javascript
// Get passport
const passport = await PassportDataService.getPassport(userId);

// Save passport
await PassportDataService.savePassport(passportData, userId);

// Update passport
await PassportDataService.updatePassport(userId, updates);
```

### Personal Info Operations

```javascript
// Get personal info
const info = await PassportDataService.getPersonalInfo(userId);

// Save personal info
await PassportDataService.savePersonalInfo(infoData, userId);

// Update personal info
await PassportDataService.updatePersonalInfo(userId, updates);
```

### Funding Proof Operations

```javascript
// Get funding proof
const proof = await PassportDataService.getFundingProof(userId);

// Save funding proof
await PassportDataService.saveFundingProof(proofData, userId);

// Update funding proof
await PassportDataService.updateFundingProof(userId, updates);
```

### Unified Operations

```javascript
// Get all data at once (optimized)
const userData = await PassportDataService.getAllUserData(userId);

// Batch update (single transaction)
await PassportDataService.batchUpdate(userId, {
  passport: { expiryDate: '2031-12-31' },
  personalInfo: { phoneNumber: '+86 13987654321' },
  fundingProof: { cashAmount: '15,000 THB' }
});
```

### Cache Management

```javascript
// Clear all cache
PassportDataService.clearCache();

// Refresh user cache
await PassportDataService.refreshCache(userId);

// Get cache statistics
const stats = PassportDataService.getCacheStats();
console.log('Hit rate:', stats.hitRate, '%');
```

## Migration

### Automatic Migration

Migration happens automatically when:
1. User opens the app after update
2. System detects AsyncStorage data
3. No previous migration completed

### Migration Process

```
1. Check if migration needed
2. Load data from AsyncStorage
3. Transform to new format
4. Validate data
5. Save to SQLite
6. Mark migration complete
```

### Manual Migration

```javascript
const result = await PassportDataService.migrateFromAsyncStorage(userId);
console.log('Migration result:', result);
```

See [Migration Guide](./MIGRATION_GUIDE.md) for details.

## Performance

### Benchmarks

- **Data Load Time:** < 100ms (with cache)
- **Cache Hit Rate:** 70-80% typical
- **Batch Operations:** 3x faster than individual calls
- **Migration Time:** < 500ms per user

### Optimization Features

1. **Caching** - 5-minute TTL reduces database calls
2. **Batch Loading** - Single transaction for getAllUserData()
3. **Batch Updates** - Single transaction for multiple updates
4. **Database Indexes** - Fast userId lookups
5. **Connection Pooling** - Reuses database connections

## Testing

### Test Coverage

- ✅ Unit tests for PassportDataService
- ✅ Integration tests for screen updates
- ✅ Migration scenario tests
- ✅ Performance tests
- ✅ Consistency validation tests
- ✅ Conflict resolution tests

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test PassportDataService.test.js

# Run with coverage
npm test -- --coverage
```

## Troubleshooting

### Common Issues

**Issue:** Data not loading
```javascript
// Solution: Check initialization
await PassportDataService.initialize(userId);
```

**Issue:** Cache not updating
```javascript
// Solution: Refresh cache
await PassportDataService.refreshCache(userId);
```

**Issue:** Migration not triggering
```javascript
// Solution: Check migration status
const needsMigration = await SecureStorageService.needsMigration(userId);
console.log('Needs migration:', needsMigration);
```

See [API Documentation](./API_DOCUMENTATION.md) for more troubleshooting tips.

## Security

### Encryption

- Sensitive fields encrypted at rest
- AES-256 encryption
- Secure key storage using SecureStore

### Access Control

- User ID validation on all operations
- No cross-user data access
- Audit logging for sensitive operations

### GDPR Compliance

```javascript
// Export user data
const userData = await PassportDataService.getAllUserData(userId);
const exportData = {
  passport: userData.passport?.exportData(),
  personalInfo: userData.personalInfo?.exportData(),
  fundingProof: userData.fundingProof?.exportData()
};

// Delete user data
await PassportDataService.deleteAllUserData(userId);
```

## Contributing

### Adding New Data Types

1. Create model in `app/models/`
2. Add CRUD methods to PassportDataService
3. Update SecureStorageService for database operations
4. Add tests
5. Update documentation

### Code Style

- Use JSDoc comments for all public methods
- Follow existing patterns for consistency
- Add error handling for all async operations
- Include usage examples in comments

## Support

### Getting Help

1. Check [API Documentation](./API_DOCUMENTATION.md)
2. Review [Usage Examples](./USAGE_EXAMPLES.md)
3. Search existing issues
4. Contact development team

### Reporting Issues

Include:
- Error messages
- Steps to reproduce
- Expected vs actual behavior
- User ID (if applicable)
- Device/platform information

## License

Copyright © 2024 入境通 (Entry Assistant)

## Changelog

### Version 1.0.0 (Current)

- ✅ Centralized data storage in SQLite
- ✅ Automatic AsyncStorage migration
- ✅ In-memory caching with TTL
- ✅ Batch operations support
- ✅ Data consistency validation
- ✅ Conflict detection and resolution
- ✅ Comprehensive test coverage
- ✅ Complete documentation

### Future Enhancements

- [ ] Logging service with levels
- [ ] Analytics integration
- [ ] Offline sync support
- [ ] Multi-device sync
- [ ] Data backup/restore
