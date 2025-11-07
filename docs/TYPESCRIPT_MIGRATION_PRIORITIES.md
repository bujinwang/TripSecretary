# TypeScript Migration Priorities

> **Last Updated**: 2025-11-07  
> **Status**: Phase 11 complete — preparing model tests/mocks  
> **Migration Rate**: ~11.9% (80 files migrated out of ~672 total files)

## Overview

This document prioritizes which services should be migrated to TypeScript next, based on:
- **Usage frequency** (how many files import it)
- **File size** (complexity indicator)
- **Criticality** (core functionality vs. edge cases)
- **Dependencies** (services that other services depend on)
- **Business impact** (user-facing features)

## Migration Strategy

## Completed Phases

- **Phase 1: High-Impact Core Services** ✅
- **Phase 2: Notification Services** ✅
- **Phase 3: Entry Guide Services** ✅
- **Phase 4: Data Operations & Repositories** ✅
- **Phase 5: Traveler Context Builders** ✅
- **Phase 6: Validation & Data Services** ✅
- **Phase 7: Export & Backup Services** ✅
- **Phase 8: Supporting Services** ✅
- **Phase 9: AI Services** ✅
- **Phase 10: Security Utilities & Schema** ✅
- **Phase 11: Core Models** ✅ (`EntryInfo`, `PersonalInfo`, `TravelInfo`, `Passport`, `FundItem`, `DigitalArrivalCard`, `EntryPackSnapshot`, `PassportCountry`, `models/index`)

## Phase 12: Model Tests & Mocks (NEXT UP)
**Estimated Impact**: High for regression safety — keeps newly migrated models aligned with Jest suite.  
**Complexity**: Low-Medium (test conversions, mock updates).  
**Timeline**: 1 week.

### Target Files
1. `app/models/__tests__/EntryInfo.test.js`
2. `app/models/__tests__/PersonalInfo.test.js`
3. `app/models/__tests__/DigitalArrivalCard.test.js`
4. `app/models/__tests__/Passport.isPrimary.test.js`
5. `app/models/__mocks__/EntryInfo.js`
6. `app/models/__mocks__/PersonalInfo.js`
7. `app/models/__mocks__/Passport.js`
8. `app/models/__mocks__/EntryPack.js`

**Primary Tasks**
- Convert tests/mocks to TypeScript (`.ts` / `.tsx`) or modernize to ESM-friendly JS with typings.  
- Replace deprecated FundingProof usage inside mocks with `FundItem` equivalents.  
- Ensure Jest config picks up `.ts` tests (update `jest.config.js` if needed).  
- Run unit tests for model suite after conversion.

## Phase 13: Screens & Hooks (BACKLOG)
**Focus**: Screen-level data persistence and hooks that still import JS models.  
**Candidate Areas**:
- Country-specific persistence hooks (`useThailandDataPersistence.js`, `useSingaporeDataPersistence.js`, `useHongKongDataPersistence.js`, `useMalaysiaDataPersistence.js`, `useUSTravelData.js`).
- Screen integration tests referencing legacy mocks.
- `FundItemDetailModal.js` and related modals that assume JS models.

## Phase 14: Legacy Utility Cleanup (BACKLOG)
**Focus**: Remove or migrate residual helpers (`FundingProof` remnants, legacy snapshot utilities, CLI scripts) after Jest coverage is green.

## Notes
- Keep updating `docs/TYPESCRIPT_MIGRATION_STATUS.md` after each phase.  
- When migrating tests, prefer `ts-jest` friendly patterns and avoid `require`.  
- Prioritize high-churn files first to minimize merge conflicts.  
- After model tests, re-run lint and Jest to confirm coverage remains stable.

#### Priority 1: Core Entry Guide Service
1. **EntryGuideService.js** (Base class)
   - **Usage**: High - Used by all country entry guides
   - **Dependencies**: None (base class)
   - **Impact**: Critical - Foundation for all entry guides
   - **Effort**: Medium (2-3 days)

#### Priority 2: Country-Specific Entry Guides
2. **ThailandEntryGuideService.js** (580 lines)
   - **Usage**: Very High - Most popular destination
   - **Dependencies**: EntryGuideService
   - **Impact**: Critical - Primary feature
   - **Effort**: Medium (2-3 days)

3. **JapanEntryGuideService.js** (~400 lines estimated)
   - **Usage**: High - Popular destination
   - **Dependencies**: EntryGuideService
   - **Impact**: High - Important feature
   - **Effort**: Medium (2-3 days)

4. **KoreaEntryGuideService.js** (373 lines)
   - **Usage**: Medium-High
   - **Dependencies**: EntryGuideService
   - **Impact**: High
   - **Effort**: Medium (2 days)

5. **SingaporeEntryGuideService.js** (380 lines)
   - **Usage**: Medium-High
   - **Dependencies**: EntryGuideService
   - **Impact**: High
   - **Effort**: Medium (2 days)

6. **MalaysiaEntryGuideService.js** (382 lines)
   - **Usage**: Medium
   - **Dependencies**: EntryGuideService
   - **Impact**: Medium-High
   - **Effort**: Medium (2 days)

7. **VietnamEntryGuideService.js** (410 lines)
   - **Usage**: Medium
   - **Dependencies**: EntryGuideService
   - **Impact**: Medium-High
   - **Effort**: Medium (2 days)

8. **USEntryGuideService.js** (414 lines)
   - **Usage**: Medium
   - **Dependencies**: EntryGuideService
   - **Impact**: Medium-High
   - **Effort**: Medium (2 days)

9. **CanadaEntryGuideService.js** (494 lines)
   - **Usage**: Low-Medium
   - **Dependencies**: EntryGuideService
   - **Impact**: Medium
   - **Effort**: Medium (2 days)

**Total Effort**: ~20-25 days  
**Benefits**: Type safety for country-specific logic, easier to add new countries

### Phase 4: Data Operations & Repositories (MEDIUM-HIGH PRIORITY)
**Estimated Impact**: High - Core data layer
**Complexity**: Medium
**Timeline**: 2-3 weeks

#### Priority 1: Data Operations
1. **PassportOperations.js** (~400 lines estimated)
   - **Usage**: Very High - Used by UserDataService.ts
   - **Dependencies**: CacheStore.ts ✅, CacheManager.ts ✅
   - **Impact**: Critical - Core data operations
   - **Effort**: Medium (2-3 days)

2. **PersonalInfoOperations.js** (~400 lines estimated)
   - **Usage**: Very High - Used by UserDataService.ts
   - **Dependencies**: CacheStore.ts ✅, CacheManager.ts ✅
   - **Impact**: Critical - Core data operations
   - **Effort**: Medium (2-3 days)

3. **TravelInfoOperations.js** (~400 lines estimated)
   - **Usage**: Very High - Used by UserDataService.ts
   - **Dependencies**: CacheStore.ts ✅, CacheManager.ts ✅
   - **Impact**: Critical - Core data operations
   - **Effort**: Medium (2-3 days)

4. **EntryInfoOperations.js** (~400 lines estimated)
   - **Usage**: Very High - Used by UserDataService.ts
   - **Dependencies**: CacheStore.ts ✅, CacheManager.ts ✅
   - **Impact**: Critical - Core data operations
   - **Effort**: Medium (2-3 days)

5. **FundItemOperations.js** (~400 lines estimated)
   - **Usage**: High - Used by UserDataService.ts
   - **Dependencies**: CacheStore.ts ✅, CacheManager.ts ✅
   - **Impact**: High - Financial data
   - **Effort**: Medium (2-3 days)

#### Priority 2: Security Repositories
6. **EntryInfoRepository.js** (549 lines)
   - **Usage**: High - Used by SecureStorageService.ts
   - **Dependencies**: SecureStorageService.ts ✅
   - **Impact**: Critical - Data persistence
   - **Effort**: Medium (2-3 days)

7. **TravelInfoRepository.js** (529 lines)
   - **Usage**: High - Used by SecureStorageService.ts
   - **Dependencies**: SecureStorageService.ts ✅
   - **Impact**: Critical - Data persistence
   - **Effort**: Medium (2-3 days)

8. **PassportRepository.js** (~400 lines estimated)
   - **Usage**: High - Used by SecureStorageService.ts
   - **Dependencies**: SecureStorageService.ts ✅
   - **Impact**: Critical - Data persistence
   - **Effort**: Medium (2-3 days)

9. **PersonalInfoRepository.js** (~400 lines estimated)
   - **Usage**: High - Used by SecureStorageService.ts
   - **Dependencies**: SecureStorageService.ts ✅
   - **Impact**: Critical - Data persistence
   - **Effort**: Medium (2-3 days)

10. **FundItemRepository.js** (~400 lines estimated)
    - **Usage**: Medium-High - Used by SecureStorageService.ts
    - **Dependencies**: SecureStorageService.ts ✅
    - **Impact**: High - Financial data
    - **Effort**: Medium (2-3 days)

11. **DigitalArrivalCardRepository.js** (~400 lines estimated)
    - **Usage**: Medium - Used by SecureStorageService.ts
    - **Dependencies**: SecureStorageService.ts ✅
    - **Impact**: High - Submission data
    - **Effort**: Medium (2-3 days)

12. **SnapshotRepository.js** (~400 lines estimated)
    - **Usage**: Medium - Used by SnapshotService.ts
    - **Dependencies**: SnapshotService.ts ✅
    - **Impact**: Medium - Historical data
    - **Effort**: Medium (2-3 days)

**Total Effort**: ~25-30 days  
**Benefits**: Complete type safety for data layer, easier to maintain data integrity

### Phase 5: Traveler Context Builders (MEDIUM PRIORITY)
**Estimated Impact**: Medium - Country-specific features
**Complexity**: Medium
**Timeline**: 1-2 weeks

1. **JapanTravelerContextBuilder.js** (622 lines)
   - **Usage**: Medium - Japan-specific
   - **Dependencies**: UserDataService.ts ✅
   - **Impact**: Medium - Japan feature
   - **Effort**: Medium (2-3 days)

2. **HongKongTravelerContextBuilder.js** (440 lines)
   - **Usage**: Medium - Hong Kong-specific
   - **Dependencies**: UserDataService.ts ✅
   - **Impact**: Medium - Hong Kong feature
   - **Effort**: Medium (2 days)

**Note**: ThailandTravelerContextBuilder.ts ✅ already migrated

**Total Effort**: ~4-5 days  
**Benefits**: Consistency with Thailand implementation

### Phase 6: Validation & Data Services (MEDIUM PRIORITY)
**Estimated Impact**: Medium - Data quality
**Complexity**: Low-Medium
**Timeline**: 1-2 weeks

1. **ThailandDataValidator.js** (592 lines)
   - **Usage**: Medium - Thailand-specific validation
   - **Dependencies**: TDACValidationService.ts ✅
   - **Impact**: Medium - Data quality
   - **Effort**: Medium (2-3 days)

2. **JapanDataValidator.js** (436 lines)
   - **Usage**: Medium - Japan-specific validation
   - **Dependencies**: None
   - **Impact**: Medium - Data quality
   - **Effort**: Medium (2 days)

3. **EntryPackValidationService.js** (~400 lines estimated)
   - **Usage**: Medium - Used in entry flow
   - **Dependencies**: None
   - **Impact**: Medium - Data validation
   - **Effort**: Medium (2-3 days)

4. **DataValidationService.js** (~400 lines estimated)
   - **Usage**: Medium - Used by UserDataService
   - **Dependencies**: UserDataService.ts ✅
   - **Impact**: Medium - Data quality
   - **Effort**: Medium (2-3 days)

**Total Effort**: ~8-11 days  
**Benefits**: Type safety for validation logic

### Phase 7: Export & Backup Services (LOW-MEDIUM PRIORITY)
**Estimated Impact**: Low-Medium - Secondary features
**Complexity**: Medium-High (large files)
**Timeline**: 1-2 weeks

1. **DataExportService.js** (2028 lines) ⚠️ **LARGE FILE**
   - **Usage**: Low-Medium - Used in GDPR screens
   - **Dependencies**: UserDataService.ts ✅
   - **Impact**: Medium - GDPR compliance
   - **Effort**: High (4-5 days) - Large file, complex logic

2. **BackupService.js** (1886 lines) ⚠️ **LARGE FILE**
   - **Usage**: Low - Background service
   - **Dependencies**: SecureStorageService.ts ✅
   - **Impact**: Low-Medium - Backup feature
   - **Effort**: High (4-5 days) - Large file, complex logic

**Total Effort**: ~8-10 days  
**Benefits**: Type safety for complex export/backup logic

### Phase 8: Supporting Services (LOW PRIORITY)
**Estimated Impact**: Low - Supporting features
**Complexity**: Low-Medium
**Timeline**: 1-2 weeks

1. **LocalOCRService.js** (768 lines)
   - **Usage**: Medium - OCR functionality
   - **Dependencies**: None
   - **Impact**: Medium - Feature support
   - **Effort**: Medium (3-4 days)

2. **AuditLogService.js** (578 lines)
   - **Usage**: Low - Audit logging
   - **Dependencies**: LoggingService.ts ✅
   - **Impact**: Low - Observability
   - **Effort**: Medium (2-3 days)

3. **DigitalCardServiceBase.js** (418 lines)
   - **Usage**: Low - Abstract base class
   - **Dependencies**: None
   - **Impact**: Low - Base class
   - **Effort**: Low-Medium (1-2 days)

4. **StorageQuotaManager.js** (~400 lines estimated)
   - **Usage**: Low - Storage management
   - **Dependencies**: None
   - **Impact**: Low - Utility
   - **Effort**: Low-Medium (1-2 days)

5. **DataEventService.js** (~400 lines estimated)
   - **Usage**: Low - Event system
   - **Dependencies**: None
   - **Impact**: Low - Event handling
   - **Effort**: Low-Medium (1-2 days)

**Total Effort**: ~9-13 days  
**Benefits**: Complete migration, but lower priority

### Phase 9: AI Services (LOW PRIORITY)
**Estimated Impact**: Low - AI features
**Complexity**: Medium
**Timeline**: 1 week

1. **QwenService.js** (~400 lines estimated)
   - **Usage**: Low - AI integration
   - **Dependencies**: api.ts ✅
   - **Impact**: Low - AI feature
   - **Effort**: Medium (2-3 days)

2. **AIAssistantService.js** (~400 lines estimated)
   - **Usage**: Low - AI assistant
   - **Dependencies**: QwenService
   - **Impact**: Low - AI feature
   - **Effort**: Medium (2-3 days)

**Total Effort**: ~4-6 days  
**Benefits**: Type safety for AI integration

### Phase 10: Security Utilities & Schema (LOW PRIORITY)
**Estimated Impact**: Low - Internal utilities
**Complexity**: Low-Medium
**Timeline**: 1 week

1. **DatabaseSchema.ts** ✅ (701 lines)
   - **Usage**: Low - Schema definitions
   - **Dependencies**: SecureStorageService.ts ✅
   - **Impact**: Low - Internal
   - **Effort**: Medium (2-3 days)

2. **MigrationManager.ts** ✅ (~400 lines actual)
   - **Usage**: Low - Migration logic
   - **Dependencies**: SecureStorageService.ts ✅
   - **Impact**: Low - Internal
   - **Effort**: Medium (2-3 days)

3. **DataSerializer.ts** ✅ (~400 lines actual)
   - **Usage**: Low - Serialization
   - **Dependencies**: None
   - **Impact**: Low - Utility
   - **Effort**: Low-Medium (1-2 days)

4. **DecryptionHelper.ts** ✅ (~220 lines)
   - **Usage**: Low - Decryption utility
   - **Dependencies**: DataEncryptionService.ts ✅
   - **Impact**: Low - Utility
   - **Effort**: Low-Medium (1-2 days)

5. **SQLiteLegacyWrapper.ts** ✅ (~260 lines)
   - **Usage**: Low - Legacy wrapper
   - **Dependencies**: SecureStorageService.ts ✅
   - **Impact**: Low - Legacy support
   - **Effort**: Low-Medium (1-2 days)

6. **DataAccessLogService.ts** ✅ (~300 lines)
   - **Usage**: Low - Access logging
   - **Dependencies**: LoggingService.ts ✅
   - **Impact**: Low - Observability
   - **Effort**: Low-Medium (1-2 days)

**Total Effort**: ~8-13 days  
**Benefits**: Complete security layer migration

## Summary

### Quick Wins (High Impact, Low Effort)
1. Notification services (Phase 2) - High usage, medium effort
2. Data operations (Phase 4) - High usage, medium effort
3. Entry guide base service (Phase 3) - Foundation for all guides

### High Value (High Impact, Medium Effort)
1. Entry guide services (Phase 3) - Core user-facing feature
2. Repositories (Phase 4) - Data layer foundation

### Lower Priority (Lower Impact)
1. Export/Backup services (Phase 7) - Large files, lower usage
2. Supporting services (Phase 8) - Lower impact features
3. AI services (Phase 9) - Lower usage
4. Security utilities (Phase 10) - Internal tools

## Recommended Migration Order

### Month 1: Notification Services (Phase 2)
- Complete notification system type safety
- High user impact
- Medium effort (~15-20 days)

### Month 2: Entry Guide Services (Phase 3)
- Core user-facing feature
- Medium-high effort (~20-25 days)

### Month 3: Data Operations & Repositories (Phase 4)
- Complete data layer type safety
- High effort (~25-30 days)

### Month 4+: Remaining Services
- Traveler context builders
- Validation services
- Export/backup services
- Supporting services

## Success Metrics

- **Type Coverage**: Gradually increase from current ~2% to 50%+ in 6 months
- **Type Safety**: All new code in TypeScript
- **Error Reduction**: Catch type errors at compile time
- **Developer Experience**: Better IDE support, autocomplete, refactoring

## Notes

- All estimates assume working knowledge of TypeScript
- Large files (>1000 lines) may take longer due to complexity
- Some services may have circular dependencies that need careful handling
- Test files should be migrated after service files
- Index files (barrel exports) can be migrated last

