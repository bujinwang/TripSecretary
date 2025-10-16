# Design Document

## Overview

This design implements a centralized data management system for user information (passport, personal info, and funding proof) using SQLite as the single source of truth. The architecture eliminates data duplication across screens and ensures consistency by having all entry forms (Thailand, Japan, etc.) and the Profile screen read from and write to the same centralized tables.

### Key Design Principles

1. **Single Source of Truth**: SQLite database is the authoritative source for all user data
2. **Data Reusability**: User data entered once is available across all destinations
3. **Consistency**: All screens see the same data at all times
4. **Progressive Enhancement**: Existing AsyncStorage data is migrated seamlessly
5. **Security**: Sensitive fields remain encrypted using existing SecureStorageService

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
├─────────────────┬─────────────────┬─────────────────────────┤
│  ProfileScreen  │ ThailandScreen  │  JapanScreen (future)   │
└────────┬────────┴────────┬────────┴────────┬────────────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Unified   │
                    │   Data      │
                    │   Service   │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
    │Passport │      │Personal │      │ Funding │
    │  Model  │      │  Info   │      │  Proof  │
    │         │      │  Model  │      │  Model  │
    └────┬────┘      └────┬────┘      └────┬────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                  ┌────────▼────────┐
                  │ SecureStorage   │
                  │    Service      │
                  └────────┬────────┘
                           │
                  ┌────────▼────────┐
                  │  SQLite Tables  │
                  │  - passports    │
                  │  - personal_info│
                  │  - funding_proof│
                  └─────────────────┘
```

### Data Flow

1. **Read Flow**: Screen → Unified Service → Model → SecureStorageService → SQLite
2. **Write Flow**: Screen → Unified Service → Model (validate) → SecureStorageService → SQLite
3. **Migration Flow**: AsyncStorage → Unified Service → SQLite (one-time)


## Components and Interfaces

### 1. Unified Data Service (New Component)

**Purpose**: Centralized service for managing all user data operations

**Location**: `app/services/data/PassportDataService.js`

**Interface**:
```javascript
class PassportDataService {
  // Initialization
  static async initialize(userId)
  
  // Passport Operations
  static async getPassport(userId)
  static async savePassport(passportData, userId)
  static async updatePassport(passportId, updates)
  
  // Personal Info Operations
  static async getPersonalInfo(userId)
  static async savePersonalInfo(personalData, userId)
  static async updatePersonalInfo(personalInfoId, updates)
  
  // Funding Proof Operations
  static async getFundingProof(userId)
  static async saveFundingProof(fundingData, userId)
  static async updateFundingProof(fundingProofId, updates)
  
  // Unified Operations
  static async getAllUserData(userId)
  static async migrateFromAsyncStorage(userId)
  
  // Cache Management
  static clearCache()
  static refreshCache(userId)
}
```

**Key Features**:
- In-memory caching for performance
- Automatic migration from AsyncStorage
- Batch operations for efficiency
- Event emission for data changes

### 2. Enhanced Passport Model

**Updates to**: `app/models/Passport.js`

**New Fields**:
```javascript
{
  // Existing fields...
  gender: 'Male' | 'Female' | 'Undefined', // NEW: Gender field
  userId: string, // Link to user
}
```

**New Methods**:
```javascript
// Get user's primary passport
static async getPrimaryPassport(userId)

// List all passports for user (multi-passport support)
static async listPassports(userId)

// Set as primary passport
async setAsPrimary()
```

### 3. Enhanced Personal Info Model

**Updates to**: `app/models/PersonalInfo.js`

**Schema** (already exists, ensure consistency):
```javascript
{
  id: string,
  userId: string,
  phoneNumber: string, // ENCRYPTED
  email: string, // ENCRYPTED
  homeAddress: string, // ENCRYPTED
  occupation: string,
  provinceCity: string,
  countryRegion: string,
  createdAt: string,
  updatedAt: string
}
```

**New Methods**:
```javascript
// Get user's personal info (one per user)
static async getByUserId(userId)

// Merge updates without overwriting empty fields
async mergeUpdates(updates)
```

### 4. Enhanced Funding Proof Model

**Updates to**: `app/models/FundingProof.js` (needs to be created)

**Schema**:
```javascript
{
  id: string,
  userId: string,
  cashAmount: string, // ENCRYPTED
  bankCards: string, // ENCRYPTED
  supportingDocs: string, // ENCRYPTED
  createdAt: string,
  updatedAt: string
}
```

**Methods**:
```javascript
class FundingProof {
  constructor(data)
  static generateId()
  validate()
  async save(options)
  static async load(userId)
  async update(updates, options)
  exportData()
}
```

### 5. Enhanced SecureStorageService

**Updates to**: `app/services/security/SecureStorageService.js`

**New Methods**:
```javascript
// Passport operations
async getUserPassport(userId) // Get primary passport by userId
async listUserPassports(userId) // List all passports

// Check if migration is needed
async needsMigration(userId)
async markMigrationComplete(userId)

// Batch operations
async batchSave(operations)
```

**Database Schema Updates**:
```sql
-- Add gender field to passports table
ALTER TABLE passports ADD COLUMN gender TEXT;

-- Add user_id field to passports table
ALTER TABLE passports ADD COLUMN user_id TEXT;

-- Add user_id index for faster lookups
CREATE INDEX IF NOT EXISTS idx_passports_user_id ON passports(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_info_user_id ON personal_info(user_id);
CREATE INDEX IF NOT EXISTS idx_funding_proof_user_id ON funding_proof(user_id);

-- Add migration tracking
CREATE TABLE IF NOT EXISTS migrations (
  user_id TEXT PRIMARY KEY,
  migrated_at TEXT,
  source TEXT
);
```


### 6. Screen Integration Pattern

**Pattern for all entry screens** (Thailand, Japan, etc.):

```javascript
// On screen mount
useEffect(() => {
  const loadUserData = async () => {
    try {
      const userId = getCurrentUserId();
      
      // Load all data from centralized service
      const userData = await PassportDataService.getAllUserData(userId);
      
      // Populate state
      setPassportData(userData.passport);
      setPersonalInfo(userData.personalInfo);
      setFundingProof(userData.fundingProof);
      
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };
  
  loadUserData();
}, []);

// On field update
const handlePassportFieldUpdate = async (field, value) => {
  try {
    const userId = getCurrentUserId();
    
    // Update local state
    setPassportData(prev => ({ ...prev, [field]: value }));
    
    // Save to centralized storage
    await PassportDataService.updatePassport(passportData.id, {
      [field]: value
    });
    
  } catch (error) {
    console.error('Failed to update passport:', error);
  }
};
```

**Pattern for Profile Screen**:

```javascript
// Same pattern as entry screens
// Profile is just another consumer of centralized data
// No special treatment needed
```

## Data Models

### Passport Data Model

```javascript
{
  id: "passport_123456789",
  userId: "user_123",
  passportNumber: "E12345678", // ENCRYPTED
  fullName: "ZHANG, WEI", // ENCRYPTED
  dateOfBirth: "1988-01-22", // ENCRYPTED
  nationality: "CHN", // ENCRYPTED
  gender: "Male", // NEW FIELD
  expiryDate: "2030-12-31",
  issueDate: "2020-12-31",
  issuePlace: "Shanghai",
  photoUri: "file:///...",
  isPrimary: true, // NEW: Mark primary passport
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

### Personal Info Data Model

```javascript
{
  id: "personal_123456789",
  userId: "user_123",
  phoneNumber: "+86 12343434343", // ENCRYPTED
  email: "traveler@example.com", // ENCRYPTED
  homeAddress: "123 Main St, Shanghai", // ENCRYPTED
  occupation: "BUSINESS MAN",
  provinceCity: "ANHUI",
  countryRegion: "CHN",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

### Funding Proof Data Model

```javascript
{
  id: "funding_123456789",
  userId: "user_123",
  cashAmount: "10,000 THB equivalent", // ENCRYPTED
  bankCards: "CMB Visa (****1234) · Balance 20,000 CNY", // ENCRYPTED
  supportingDocs: "Bank app screenshots saved", // ENCRYPTED
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-15T10:30:00Z"
}
```

## Error Handling

### Error Types

1. **Migration Errors**: AsyncStorage → SQLite migration failures
2. **Validation Errors**: Invalid data format or missing required fields
3. **Storage Errors**: SQLite operation failures
4. **Concurrency Errors**: Multiple simultaneous updates

### Error Handling Strategy

```javascript
try {
  await PassportDataService.savePassport(data, userId);
} catch (error) {
  if (error instanceof ValidationError) {
    // Show user-friendly validation message
    showError('Please check your passport information');
  } else if (error instanceof StorageError) {
    // Log and retry
    console.error('Storage error:', error);
    await retryOperation();
  } else {
    // Generic error handling
    showError('An unexpected error occurred');
  }
}
```

### Graceful Degradation

1. If SQLite fails, fall back to AsyncStorage (read-only mode)
2. If encryption fails, log error and prevent saving sensitive data
3. If migration fails, continue with empty state and log for manual review

## Testing Strategy

### Unit Tests

1. **PassportDataService Tests**
   - Test CRUD operations for each data type
   - Test migration logic
   - Test cache management
   - Test error handling

2. **Model Tests**
   - Test validation logic
   - Test data transformation
   - Test encryption/decryption

3. **SecureStorageService Tests**
   - Test database operations
   - Test concurrent access
   - Test migration tracking

### Integration Tests

1. **Screen Integration Tests**
   - Test data loading on screen mount
   - Test data updates from screens
   - Test data consistency across screens

2. **Migration Tests**
   - Test AsyncStorage → SQLite migration
   - Test data preservation during migration
   - Test migration idempotency

### End-to-End Tests

1. **User Flow Tests**
   - Enter passport data in Thailand screen → Verify in Profile
   - Update passport in Profile → Verify in Japan screen
   - Fill funding proof in Profile → Verify in Thailand screen


## Migration Strategy

### Phase 1: Data Migration

```javascript
async function migrateUserData(userId) {
  // 1. Check if migration already done
  const migrated = await SecureStorageService.checkMigration(userId);
  if (migrated) return;
  
  // 2. Load data from AsyncStorage
  const asyncData = await loadFromAsyncStorage(userId);
  
  // 3. Transform and validate
  const passport = transformPassportData(asyncData.passport);
  const personalInfo = transformPersonalInfo(asyncData.personalInfo);
  const fundingProof = transformFundingProof(asyncData.fundingProof);
  
  // 4. Save to SQLite
  await PassportDataService.savePassport(passport, userId);
  await PassportDataService.savePersonalInfo(personalInfo, userId);
  await PassportDataService.saveFundingProof(fundingProof, userId);
  
  // 5. Mark migration complete
  await SecureStorageService.markMigrationComplete(userId);
  
  // 6. Clean up AsyncStorage (optional)
  // await cleanupAsyncStorage(userId);
}
```

### Phase 2: Screen Updates

1. Update ThailandTravelInfoScreen to use PassportDataService
2. Update ProfileScreen to use PassportDataService
3. Add JapanTravelInfoScreen using same pattern
4. Remove direct AsyncStorage calls

### Phase 3: Cleanup

1. Remove AsyncStorage fallback code
2. Remove duplicate data handling logic
3. Update documentation

## Performance Considerations

### Caching Strategy

```javascript
class PassportDataService {
  static cache = {
    passport: new Map(),
    personalInfo: new Map(),
    fundingProof: new Map(),
    lastUpdate: new Map()
  };
  
  static CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  static async getPassport(userId) {
    // Check cache first
    const cached = this.cache.passport.get(userId);
    const lastUpdate = this.cache.lastUpdate.get(`passport_${userId}`);
    
    if (cached && Date.now() - lastUpdate < this.CACHE_TTL) {
      return cached;
    }
    
    // Load from database
    const passport = await Passport.load(userId);
    
    // Update cache
    this.cache.passport.set(userId, passport);
    this.cache.lastUpdate.set(`passport_${userId}`, Date.now());
    
    return passport;
  }
}
```

### Database Optimization

1. **Indexes**: Add indexes on userId for fast lookups
2. **Batch Operations**: Group multiple updates into single transaction
3. **Lazy Loading**: Load data only when needed
4. **Connection Pooling**: Reuse database connections

### Memory Management

1. Clear cache when app goes to background
2. Limit cache size to prevent memory issues
3. Use weak references for cached objects

## Security Considerations

### Data Encryption

- Continue using existing SecureStorageService encryption
- Sensitive fields remain encrypted at rest
- Encryption keys managed by SecureStore

### Access Control

- Each user can only access their own data
- UserId validation on all operations
- Audit logging for sensitive operations

### Data Privacy

- GDPR/PIPL compliance maintained
- Export and delete operations supported
- Audit trail for all data access

## Rollback Plan

If issues arise:

1. **Immediate**: Disable PassportDataService, fall back to AsyncStorage
2. **Short-term**: Fix issues, re-enable with feature flag
3. **Long-term**: If unfixable, revert to previous architecture

## Success Metrics

1. **Data Consistency**: 100% consistency across screens
2. **Performance**: < 100ms data load time
3. **Migration Success**: > 99% successful migrations
4. **User Experience**: Reduced data entry time by 50%
5. **Error Rate**: < 0.1% storage operation failures
