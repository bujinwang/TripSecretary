# Thai Implementation Refactoring Checklist

**Status:** Ready to Begin
**Target Completion:** Before Multi-Country Expansion

---

## Phase 1: Critical Foundation (MUST DO FIRST)

### 1.1 Destination Config System ⏳ Priority: CRITICAL
- [ ] Create `app/config/destinations/` directory structure
- [ ] Create `app/config/destinations/index.js` with central registry
- [ ] Create `app/config/destinations/thailand/index.js`
- [ ] Migrate Thailand metadata (ID, name, currency, flag, etc.)
- [ ] Migrate Thailand validation rules
- [ ] Migrate Thailand entry guide configuration
- [ ] Migrate Thailand financial info (ATM fees, currency)
- [ ] Migrate Thailand emergency contacts
- [ ] Add `getDestination(id)` and `getActiveDestinations()` helpers
- [ ] Write tests for destination config system

**Files to Create:**
- `app/config/destinations/index.js`
- `app/config/destinations/thailand/index.js`
- `app/config/destinations/thailand/metadata.js`
- `app/config/destinations/thailand/validation.js`
- `app/config/destinations/thailand/entryGuide.js`
- `app/config/destinations/thailand/financialInfo.js`
- `app/config/destinations/thailand/emergencyInfo.js`

**Estimated Time:** 6-8 hours

---

### 1.2 Remove Hardcoded Destination IDs ⏳ Priority: CRITICAL
- [ ] Update `TDACSubmissionService.findOrCreateEntryInfoId()` to accept `destinationId` parameter
- [ ] Update `TDACSubmissionService.handleTDACSubmissionSuccess()` to pass `destinationId`
- [ ] Update `ThailandEntryFlowScreen` to pass `destinationId` consistently
- [ ] Update `useThailandDataPersistence` hook to use passed `destinationId`
- [ ] Update `HomeScreen` destination list to use config
- [ ] Search codebase for all `'th'` string literals and verify none are hardcoded
- [ ] Test all affected flows end-to-end

**Files to Modify:**
- `app/services/thailand/TDACSubmissionService.js` (line 336)
- `app/screens/thailand/ThailandEntryFlowScreen.js` (line 112)
- `app/hooks/thailand/useThailandDataPersistence.js` (multiple locations)
- `app/screens/HomeScreen.js` (line 370)

**Estimated Time:** 4-6 hours

---

### 1.3 Dynamic Session-Based ID Loading ⏳ Priority: CRITICAL
- [ ] Create `TDACSessionManager.js` class
- [ ] Implement `initializeSession()` method to fetch TDAC session metadata
- [ ] Implement `fetchGenderIds()` method
- [ ] Implement `fetchTransportModeIds()` method
- [ ] Implement `fetchAccommodationIds()` method
- [ ] Implement `fetchPurposeIds()` method
- [ ] Implement `fetchNationalityIds()` method (if possible from TDAC API)
- [ ] Update `ThailandTravelerContextBuilder` to remove hardcoded IDs
- [ ] Update `TDACAPIService` to use session manager
- [ ] Add session expiry handling
- [ ] Test with multiple TDAC sessions to verify IDs are refreshed

**Files to Create:**
- `app/services/thailand/TDACSessionManager.js`

**Files to Modify:**
- `app/services/thailand/ThailandTravelerContextBuilder.js` (lines 960-1195)
- `app/services/thailand/TDACAPIService.js`

**Estimated Time:** 8-10 hours

---

### 1.4 Centralized Name Parsing Utility ⏳ Priority: HIGH
- [ ] Create `app/utils/nameUtils.js`
- [ ] Implement `NameParser.parseFullName()` with all format support
- [ ] Implement `NameParser.formatForDisplay()`
- [ ] Implement `NameParser.validateNameFormat()`
- [ ] Handle comma-separated format: "ZHANG, WEI MING"
- [ ] Handle space-separated format: "LI A MAO"
- [ ] Handle two-part names: "WANG BAOBAO"
- [ ] Handle multi-part names (4+ parts)
- [ ] Replace all instances of name parsing with utility
- [ ] Write comprehensive tests for all name formats

**Files to Create:**
- `app/utils/nameUtils.js`

**Files to Modify:**
- `app/services/thailand/ThailandTravelerContextBuilder.js` (lines 346-412)
- Any other locations with duplicate name parsing logic

**Estimated Time:** 3-4 hours

---

### 1.5 Centralized Phone Number Utility ⏳ Priority: HIGH
- [ ] Create `app/utils/phoneUtils.js`
- [ ] Evaluate `libphonenumber-js` library for integration
- [ ] Implement `PhoneNumberUtils.parse()` method
- [ ] Implement `PhoneNumberUtils.getCountryCode()` method
- [ ] Implement `PhoneNumberUtils.formatForDisplay()` method
- [ ] Implement `PhoneNumberUtils.validate()` method
- [ ] Replace all phone extraction logic with utility
- [ ] Test with various phone formats (+86, 86, +852, +1, etc.)
- [ ] Write comprehensive tests

**Files to Create:**
- `app/utils/phoneUtils.js`

**Files to Modify:**
- `app/services/thailand/ThailandTravelerContextBuilder.js` (lines 467-567)
- Any other locations with phone parsing logic

**Estimated Time:** 4-5 hours

---

## Phase 2: Code Quality Improvements

### 2.1 Accommodation Type Mapping ⏳ Priority: MEDIUM
- [ ] Create `app/config/destinations/thailand/accommodationMapping.js`
- [ ] Extract UI to API accommodation type mapping
- [ ] Document ID mapping (session-specific IDs)
- [ ] Update `ThailandTravelerContextBuilder.normalizeAccommodationType()`
- [ ] Update `ThailandTravelerContextBuilder.getAccommodationTypeId()`
- [ ] Test all accommodation type mappings

**Files to Create:**
- `app/config/destinations/thailand/accommodationMapping.js`

**Files to Modify:**
- `app/services/thailand/ThailandTravelerContextBuilder.js` (lines 1041-1110)

**Estimated Time:** 2-3 hours

---

### 2.2 Travel Purpose Mapping ⏳ Priority: MEDIUM
- [ ] Create `app/config/destinations/thailand/purposeMapping.js`
- [ ] Extract travel purpose mapping
- [ ] Document ID mapping (session-specific IDs)
- [ ] Update `ThailandTravelerContextBuilder.getPurposeId()`
- [ ] Test all purpose mappings

**Files to Create:**
- `app/config/destinations/thailand/purposeMapping.js`

**Files to Modify:**
- `app/services/thailand/ThailandTravelerContextBuilder.js` (lines 1118-1173)

**Estimated Time:** 2-3 hours

---

### 2.3 Location Formatting Utility ⏳ Priority: LOW
- [ ] Create `app/utils/locationUtils.js`
- [ ] Implement `LocationFormatter.formatCode()`
- [ ] Implement `LocationFormatter.formatWithTranslation()`
- [ ] Implement `LocationFormatter.getDisplayValue()`
- [ ] Replace all location formatting logic
- [ ] Test with various location codes

**Files to Create:**
- `app/utils/locationUtils.js`

**Files to Modify:**
- `app/services/thailand/ThailandTravelerContextBuilder.js` (lines 667-682)
- Components using location display

**Estimated Time:** 2-3 hours

---

### 2.4 Validation Rule Engine ⏳ Priority: MEDIUM
- [ ] Create `app/utils/validation/ValidationRuleEngine.js`
- [ ] Define `DEFAULT_RULES` for common fields
- [ ] Define `COUNTRY_RULES` structure
- [ ] Extract Thailand-specific rules to config
- [ ] Implement rule engine with inheritance
- [ ] Update `ThailandValidationRules.js` to use rule engine
- [ ] Test with all field types

**Files to Create:**
- `app/utils/validation/ValidationRuleEngine.js`
- `app/config/destinations/thailand/validationRules.js`

**Files to Modify:**
- `app/utils/thailand/ThailandValidationRules.js`

**Estimated Time:** 6-8 hours

---

### 2.5 Field Naming Standardization ⚠️ Priority: MEDIUM (RISKY)
- [ ] **REVIEW DATABASE SCHEMA FIRST** - Requires migration
- [ ] Create database migration for field renames
- [ ] Rename `arrivalArrivalDate` → `arrivalDate` (in DB and code)
- [ ] Rename `departureDepartureDate` → `departureDate` (in DB and code)
- [ ] Update all queries and services
- [ ] Update all forms and components
- [ ] Test thoroughly - this is a breaking change
- [ ] Consider backward compatibility during transition

**Files to Modify:**
- Database schema
- `app/models/` - All models referencing these fields
- `app/services/` - All services using these fields
- `app/hooks/` - All hooks with form state
- `app/components/` - All form components

**Estimated Time:** 6-8 hours + testing time

**⚠️ WARNING:** This is a breaking change. Consider deferring until after Phase 1 is complete.

---

## Phase 3: Technical Debt & Enhancements

### 3.1 QR Code Extraction ⏳ Priority: MEDIUM
- [ ] Research PDF parsing libraries (pdf-lib, react-native-pdf-lib)
- [ ] Implement QR code extraction from PDF
- [ ] Save QR as separate image file
- [ ] Update `TDACSubmissionService` to extract QR after submission
- [ ] Update `qrUri` field to point to QR image (not PDF)
- [ ] Keep `pdfUrl` pointing to full PDF
- [ ] Test QR extraction with real TDAC PDFs

**Files to Modify:**
- `app/services/thailand/TDACSubmissionService.js` (lines 78-90)
- Add new utility: `app/utils/qrExtraction.js`

**Estimated Time:** 6-8 hours

---

### 3.2 Airport Code to Country Mapping ⏳ Priority: LOW
- [ ] Research airport code libraries or APIs
- [ ] Create `app/data/airportCodes.js` (or use library)
- [ ] Expand coverage beyond current 30 codes
- [ ] Update `ThailandTravelerContextBuilder.getCountryFromAirport()`
- [ ] Consider using external service for real-time data

**Files to Create:**
- `app/data/airportCodes.js` (if not using library)

**Files to Modify:**
- `app/services/thailand/ThailandTravelerContextBuilder.js` (lines 723-763)

**Estimated Time:** 2-3 hours

---

### 3.3 Date Formatting Enhancements ⏳ Priority: LOW
- [ ] Review existing `app/utils/dateUtils.js`
- [ ] Add `formatDateForDestination()` method
- [ ] Support country-specific date formats
- [ ] Update destination config with date format preferences
- [ ] Test with various date formats

**Files to Modify:**
- `app/utils/dateUtils.js`
- `app/config/destinations/thailand/metadata.js`

**Estimated Time:** 2-3 hours

---

### 3.4 TypeScript Migration (Optional) ⏳ Priority: LOW
- [ ] Convert key types to TypeScript
- [ ] Start with type definitions (`progressiveEntryFlow.js` → `.ts`)
- [ ] Convert utilities to TypeScript
- [ ] Convert services to TypeScript
- [ ] Add strict type checking
- [ ] Generate type documentation

**Estimated Time:** 12-16 hours (large effort)

**Note:** This is optional but highly recommended for long-term maintainability.

---

### 3.5 Comprehensive Testing ⏳ Priority: HIGH
- [ ] Set up testing framework (Jest + React Native Testing Library)
- [ ] Write unit tests for name parsing
- [ ] Write unit tests for phone parsing
- [ ] Write unit tests for validation rules
- [ ] Write unit tests for date formatting
- [ ] Write integration tests for TDAC submission flow
- [ ] Write integration tests for entry info lifecycle
- [ ] Write integration tests for data persistence
- [ ] Aim for >60% code coverage
- [ ] Set up CI/CD to run tests automatically

**Estimated Time:** 12-16 hours

---

## Progress Tracking

### Phase 1: Critical Foundation
- [ ] 0/5 major tasks completed
- [ ] Estimated: 25-33 hours
- [ ] Status: Not Started

### Phase 2: Code Quality
- [ ] 0/5 major tasks completed
- [ ] Estimated: 18-25 hours
- [ ] Status: Not Started

### Phase 3: Technical Debt
- [ ] 0/5 major tasks completed
- [ ] Estimated: 34-46 hours
- [ ] Status: Not Started

---

## Total Effort Estimate

- **Phase 1 (Critical):** 25-33 hours
- **Phase 2 (Quality):** 18-25 hours
- **Phase 3 (Enhancements):** 34-46 hours

**Grand Total:** 77-104 hours (10-13 developer days)

---

## Success Criteria

✅ **Phase 1 Complete When:**
- No hardcoded `destinationId = 'th'` in codebase
- Destination config system fully functional
- All utilities centralized and tested
- All existing functionality still works

✅ **Phase 2 Complete When:**
- All mappings externalized to config
- Validation rules engine implemented
- Code duplication reduced by >70%

✅ **Phase 3 Complete When:**
- QR extraction working
- Test coverage >60%
- All technical debt addressed
- Documentation complete

---

## Next Actions

1. **Review this checklist with the team**
2. **Approve Phase 1 tasks**
3. **Begin with task 1.1 (Destination Config System)**
4. **Work through Phase 1 sequentially**
5. **Review progress after Phase 1 before proceeding to Phase 2**

---

**Last Updated:** 2025-10-30
**Version:** 1.0
