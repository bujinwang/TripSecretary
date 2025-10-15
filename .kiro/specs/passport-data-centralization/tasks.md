# Implementation Plan

- [x] 1. Set up database schema and migrations
  - Add gender field to passports table
  - Add user_id field to passports table
  - Create indexes for userId lookups on all tables
  - Create migrations tracking table
  - _Requirements: 1.1, 1.6, 7.1, 8.1_

- [x] 2. Create FundingProof model
  - [x] 2.1 Implement FundingProof class with constructor and fields
    - Create class structure with id, userId, cashAmount, bankCards, supportingDocs
    - Add createdAt and updatedAt timestamps
    - Implement generateId() static method
    - _Requirements: 8.1, 8.6_

  - [x] 2.2 Add validation methods to FundingProof
    - Implement validate() method for data validation
    - Add field-specific validation helpers
    - _Requirements: 5.2, 8.6_

  - [x] 2.3 Implement save/load methods for FundingProof
    - Add save() method with skipValidation option
    - Add static load(userId) method
    - Add update() method for partial updates
    - _Requirements: 8.2, 8.3_

  - [x] 2.4 Add GDPR compliance methods to FundingProof
    - Implement exportData() method
    - Add getSummary() for safe logging
    - _Requirements: 6.1, 6.2_

- [x] 3. Enhance SecureStorageService
  - [x] 3.1 Add database schema migration methods
    - Implement runMigration() to add gender and user_id columns
    - Add createIndexes() for performance optimization
    - Create migrations table and tracking methods
    - _Requirements: 1.1, 4.1, 7.1_

  - [x] 3.2 Add user-based passport lookup methods
    - Implement getUserPassport(userId) method
    - Add listUserPassports(userId) for multi-passport support
    - Update getPassport() to support userId parameter
    - _Requirements: 1.3, 1.4, 7.3_

  - [x] 3.3 Add migration tracking methods
    - Implement needsMigration(userId) check
    - Add markMigrationComplete(userId) method
    - Create getMigrationStatus(userId) helper
    - _Requirements: 4.1, 4.3, 4.4_

  - [x] 3.4 Add batch operation support
    - Implement batchSave(operations) method
    - Add transaction support for atomic operations
    - _Requirements: 10.2_

- [x] 4. Create PassportDataService (Unified Data Service)
  - [x] 4.1 Implement core service structure
    - Create PassportDataService class with static methods
    - Add initialization method
    - Implement cache structure (Map-based)
    - _Requirements: 9.1, 9.2, 10.1_

  - [x] 4.2 Implement passport operations
    - Add getPassport(userId) with caching
    - Add savePassport(passportData, userId) method
    - Add updatePassport(passportId, updates) method
    - Implement cache invalidation on updates
    - _Requirements: 1.2, 1.3, 1.4, 9.3_

  - [x] 4.3 Implement personal info operations
    - Add getPersonalInfo(userId) with caching
    - Add savePersonalInfo(personalData, userId) method
    - Add updatePersonalInfo(personalInfoId, updates) method
    - Implement cache invalidation on updates
    - _Requirements: 7.2, 7.3, 7.4, 9.3_

  - [x] 4.4 Implement funding proof operations
    - Add getFundingProof(userId) with caching
    - Add saveFundingProof(fundingData, userId) method
    - Add updateFundingProof(fundingProofId, updates) method
    - Implement cache invalidation on updates
    - _Requirements: 8.2, 8.3, 8.4, 9.3_

  - [x] 4.5 Implement unified data operations
    - Add getAllUserData(userId) to fetch all data at once
    - Implement batch loading for performance
    - Add cache management methods (clearCache, refreshCache)
    - _Requirements: 9.2, 10.1, 10.2_

  - [x] 4.6 Implement AsyncStorage migration logic
    - Add migrateFromAsyncStorage(userId) method
    - Implement data transformation from old format to new
    - Add migration validation and error handling
    - Integrate with migration tracking in SecureStorageService
    - _Requirements: 4.1, 4.2, 4.3, 9.5_

- [x] 5. Enhance Passport model
  - [x] 5.1 Add gender field to Passport model
    - Add gender property to constructor
    - Update validation to include gender
    - Add gender to save/load operations
    - _Requirements: 1.6_

  - [x] 5.2 Add userId field to Passport model
    - Add userId property to constructor
    - Update save() to include userId
    - Update load() to support userId-based lookup
    - _Requirements: 1.2, 1.3_

  - [x] 5.3 Add multi-passport support methods
    - Implement static getPrimaryPassport(userId) method
    - Add static listPassports(userId) method
    - Add setAsPrimary() instance method
    - _Requirements: 5.5_

- [x] 6. Enhance PersonalInfo model
  - [x] 6.1 Add userId-based lookup method
    - Implement static getByUserId(userId) method
    - Update load() to support userId parameter
    - _Requirements: 7.3, 7.4_

  - [x] 6.2 Add merge update method
    - Implement mergeUpdates(updates) method
    - Ensure empty fields are not overwritten
    - _Requirements: 7.4, 9.4_

- [x] 7. Update ThailandTravelInfoScreen
  - [x] 7.1 Replace AsyncStorage with PassportDataService
    - Remove AsyncStorage imports and direct calls
    - Add PassportDataService import
    - Update loadSavedData() to use PassportDataService.getAllUserData()
    - _Requirements: 1.3, 3.1, 7.3, 8.3_

  - [x] 7.2 Update passport data loading
    - Load passport from PassportDataService.getPassport()
    - Populate passport fields from centralized data
    - Handle missing data gracefully
    - _Requirements: 1.3, 1.5_

  - [x] 7.3 Update personal info loading
    - Load personal info from PassportDataService.getPersonalInfo()
    - Populate personal info fields from centralized data
    - Include gender field mapping
    - _Requirements: 7.3, 7.5_

  - [x] 7.4 Update funding proof loading
    - Load funding proof from PassportDataService.getFundingProof()
    - Populate funding fields from centralized data
    - _Requirements: 8.3, 8.5_

  - [x] 7.5 Update data saving logic
    - Replace saveDataToSecureStorage() with PassportDataService calls
    - Use updatePassport(), updatePersonalInfo(), updateFundingProof()
    - Remove AsyncStorage save operations
    - _Requirements: 1.2, 7.2, 8.2_

  - [x] 7.6 Add migration trigger on first load
    - Check if migration is needed on component mount
    - Trigger PassportDataService.migrateFromAsyncStorage() if needed
    - Handle migration errors gracefully
    - _Requirements: 4.1, 4.2, 4.4_

- [x] 8. Update ProfileScreen
  - [x] 8.1 Replace AsyncStorage with PassportDataService
    - Remove SecureStorageService.getItem/setItem calls
    - Add PassportDataService import
    - Update loadSavedData() to use PassportDataService.getAllUserData()
    - _Requirements: 2.1, 2.3, 7.3, 8.3_

  - [x] 8.2 Update passport data loading
    - Load passport from PassportDataService.getPassport()
    - Populate passport fields including gender
    - _Requirements: 2.1, 2.3_

  - [x] 8.3 Update personal info loading
    - Load personal info from PassportDataService.getPersonalInfo()
    - Populate all personal info fields
    - _Requirements: 2.1, 2.3, 7.3_

  - [x] 8.4 Update funding proof loading
    - Load funding proof from PassportDataService.getFundingProof()
    - Populate funding proof fields
    - _Requirements: 2.1, 2.3, 8.3_

  - [x] 8.5 Update data saving logic
    - Replace useEffect save hooks with PassportDataService calls
    - Use updatePassport(), updatePersonalInfo(), updateFundingProof()
    - Remove AsyncStorage save operations
    - _Requirements: 2.2, 2.4, 7.4, 8.4_

  - [x] 8.6 Add migration trigger on first load
    - Check if migration is needed on component mount
    - Trigger PassportDataService.migrateFromAsyncStorage() if needed
    - _Requirements: 4.1, 4.2_

- [x] 9. Add data consistency validation
  - [x] 9.1 Implement data consistency checks
    - Add validation that passport data matches across screens
    - Verify personal info consistency
    - Check funding proof consistency
    - _Requirements: 5.1, 5.3_

  - [x] 9.2 Add error handling for data conflicts
    - Detect when AsyncStorage and SQLite have different data
    - Implement conflict resolution (SQLite wins)
    - Log conflicts for debugging
    - _Requirements: 5.5, 10.5_

- [x] 10. Performance optimization
  - [x] 10.1 Implement caching in PassportDataService
    - Add in-memory cache with TTL (5 minutes)
    - Implement cache invalidation on updates
    - Add cache hit/miss logging
    - _Requirements: 10.1, 10.2_

  - [x] 10.2 Add database indexes
    - Create indexes on user_id columns
    - Verify index usage with query plans
    - _Requirements: 10.1_

  - [x] 10.3 Optimize batch operations
    - Use transactions for multiple updates
    - Implement batch loading for getAllUserData()
    - _Requirements: 10.2_

- [x] 11. Testing and validation
  - [x] 11.1 Write unit tests for PassportDataService
    - Test CRUD operations for each data type
    - Test caching behavior
    - Test migration logic
    - Test error handling
    - _Requirements: All_

  - [x] 11.2 Write integration tests for screen updates
    - Test data loading in ThailandTravelInfoScreen
    - Test data loading in ProfileScreen
    - Test data updates from both screens
    - Verify data consistency across screens
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 11.3 Test migration scenarios
    - Test migration from AsyncStorage to SQLite
    - Test migration with partial data
    - Test migration with corrupt data
    - Verify migration idempotency
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 11.4 Performance testing
    - Measure data load times
    - Test concurrent access scenarios
    - Verify cache effectiveness
    - _Requirements: 10.1, 10.2_

- [x] 12. Documentation and cleanup
  - [x] 12.1 Update code documentation
    - Add JSDoc comments to PassportDataService
    - Document migration process
    - Add usage examples
    - _Requirements: All_

  - [x] 12.2 Clean up deprecated code
    - Remove unused AsyncStorage calls
    - Remove duplicate data handling logic
    - Clean up console.log statements
    - _Requirements: All_

  - [x] 12.3 Update README and developer docs
    - Document new data architecture
    - Add migration guide
    - Document PassportDataService API
    - _Requirements: All_
