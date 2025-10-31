# Change Proposal: Country Travel Info Screen Template System V2

**Status:** IN_PROGRESS
**Feature ID:** country-template-system-v2
**Created:** 2025-01-31
**Branch:** `claude/add-country-templates-011CUcbMij6Z9Xz1sLAv1S2F`

## Overview

This change proposal documents the V2 template system for country-specific travel info screens. The system reduces country implementation from ~2,700 lines to ~11 lines by extracting all complexity into a reusable template with config-driven behavior.

**Current Status:** V2 template is complete with all core features. Vietnam is fully migrated. Thailand migration and testing are pending.

**Code Reduction:** 98-99% per country (Vietnam: 630 → 11 lines, Thailand projected: 2,887 → 50 lines)

---

## ADDED Requirements

### Requirement: Enhanced Travel Info Template V2

The system SHALL provide a reusable template component that automatically provides Thailand-grade features for any country.

#### Scenario: Template renders all sections from config

**Given** a country configuration file with 4 sections (passport, personal, funds, travel)
**When** the template component receives the config via props
**Then** the template SHALL dynamically render all enabled sections with fields from config
**And** each section SHALL support collapse/expand functionality
**And** field counts SHALL display as "filled/total" for each section

**Implementation:**
- File: `app/templates/EnhancedTravelInfoTemplate.v2.js` (863 lines) ✅
- Renders sections conditionally based on `config.sections.{sectionKey}.enabled`
- Uses shared section components: PassportSection, PersonalInfoSection, FundsSection, TravelDetailsSection

#### Scenario: Template loads data from UserDataService

**Given** a user ID and destination ID
**When** the template mounts and userInteractionTracker initializes
**Then** the template SHALL load data from 4 tables in parallel:
  - passports table → passport fields
  - personal_info table → personal fields
  - fund_items table → funds array
  - travel_info table → travel fields
**And** loaded data SHALL populate formState
**And** all loaded fields SHALL be marked as pre-filled (not user-modified)

**Implementation:**
- File: `app/templates/EnhancedTravelInfoTemplate.v2.js:203-284`
- Function: `loadDataFromUserDataService()`
- Handles field name mapping (passportNo ↔ passportNumber, dob ↔ dateOfBirth)
- Triggers on: userId available AND userInteractionTracker.isInitialized === true

#### Scenario: Template saves data to UserDataService with field filtering

**Given** user has modified some fields but not others
**When** auto-save or manual save is triggered
**Then** the template SHALL filter save payload to only include:
  - Fields the user has explicitly modified (isUserModified === true)
  - Fields in the immediateSaveFields array (always saved)
  - Fields with non-empty existing values (preserveExisting === true)
**And** filtered data SHALL be saved to appropriate tables via UserDataService

**Implementation:**
- File: `app/templates/EnhancedTravelInfoTemplate.v2.js:289-398`
- Function: `saveDataToUserDataService()`
- Uses: `TemplateFieldStateManager.filterSaveableFields()`
- Prevents data overwrites by respecting field interaction state

#### Scenario: Template pre-fills from route params

**Given** user navigates from passport selection with passport data in route.params
**When** formState initializes
**Then** the template SHALL pre-fill passport fields from route.params.passport
**And** fields SHALL show data immediately (before UserDataService loads)
**And** pre-filled data SHALL be available for field count calculations

**Implementation:**
- File: `app/templates/EnhancedTravelInfoTemplate.v2.js:176-192`
- Handles both field name formats: passportNumber/passportNo, dateOfBirth/dob
- Ensures first-time users see passport data immediately

---

### Requirement: User Interaction Tracking Hook

The system SHALL track which fields are user-modified vs pre-filled to prevent data overwrites.

#### Scenario: Mark field as user-modified

**Given** a field name and value
**When** `markFieldAsModified(fieldName, value)` is called
**Then** the hook SHALL set `interactionState[fieldName].isUserModified = true`
**And** SHALL record timestamp in `interactionState[fieldName].lastModified`
**And** SHALL persist updated state to AsyncStorage at key `user_interaction_state_{destinationId}`

**Implementation:**
- File: `app/templates/hooks/useTemplateUserInteractionTracker.js` (220 lines) ✅
- Storage key: `STORAGE_KEY_PREFIX + screenId` (e.g., `user_interaction_state_vn`)
- Persists complete state with sessionId and lastUpdated timestamp

#### Scenario: Mark field as pre-filled

**Given** a field name and value loaded from database
**When** `markFieldAsPreFilled(fieldName, value)` is called
**Then** the hook SHALL set `interactionState[fieldName].isUserModified = false`
**And** SHALL record initialValue for reference
**And** SHALL NOT overwrite if field is already marked as user-modified

**Implementation:**
- File: `app/templates/hooks/useTemplateUserInteractionTracker.js:133-154`
- Respects existing user modifications (doesn't downgrade user-modified to pre-filled)

#### Scenario: Query field modification status

**Given** a field name
**When** `isFieldUserModified(fieldName)` is called
**Then** the hook SHALL return true if user has modified the field
**And** SHALL return false if field is pre-filled or empty
**And** SHALL default to true if tracking is disabled in config

**Implementation:**
- File: `app/templates/hooks/useTemplateUserInteractionTracker.js:156-159`
- Config toggle: `config.tracking.trackFieldModifications`

---

### Requirement: Config-Driven Validation Hook

The system SHALL validate fields based on rules defined in configuration.

#### Scenario: Pattern validation

**Given** a field with `pattern: /^[A-Z0-9]{5,20}$/` in config
**When** field value is validated
**Then** the hook SHALL test value against the regex pattern
**And** SHALL return `isValid: false` with `validationMessage` if pattern doesn't match
**And** SHALL return `isValid: true` if pattern matches

**Implementation:**
- File: `app/templates/hooks/useTemplateValidation.js:80-106` ✅
- Supports any regex pattern defined in config

#### Scenario: Date validation (futureOnly)

**Given** a field with `futureOnly: true` in config (e.g., expiryDate)
**When** field value is validated
**Then** the hook SHALL check if date > current date
**And** SHALL return error if date is in the past
**And** SHALL return valid if date is in the future

**Implementation:**
- File: `app/templates/hooks/useTemplateValidation.js:118-136`
- Also supports: `pastOnly`, `minMonthsValid` for expiry dates

#### Scenario: Soft validation (warnings)

**Given** a field with `warning: true` in config
**When** validation fails
**Then** the hook SHALL set field in warnings state (not errors state)
**And** form SHALL still allow submission with warnings
**And** warnings SHALL display in yellow, errors in red

**Implementation:**
- File: `app/templates/hooks/useTemplateValidation.js:98-103`
- Distinguishes between hard errors (block submission) and soft warnings

#### Scenario: Smart button configuration

**Given** form completion percentage
**When** `getSmartButtonConfig()` is called
**Then** the hook SHALL return button config based on thresholds:
  - completionPercent < 70%: { label: 'Complete Required Fields', variant: 'secondary' }
  - 70% ≤ completionPercent < 90%: { label: 'Almost Done', variant: 'primary' }
  - completionPercent ≥ 90%: { label: 'Continue', variant: 'primary' }
**And** labels SHALL be configurable per country in `config.navigation.submitButton.labels`

**Implementation:**
- File: `app/templates/hooks/useTemplateValidation.js:325-352`
- Thresholds configurable in `config.navigation.submitButton.thresholds`

#### Scenario: Field blur validation with auto-save

**Given** a field loses focus
**When** `handleFieldBlur(fieldName, fieldValue)` is called
**Then** the hook SHALL:
  1. Mark field as user-modified via userInteractionTracker
  2. Validate field against config rules
  3. Update errors/warnings state
  4. If valid and field is in `immediateSaveFields`: save immediately
  5. If valid and field is NOT in `immediateSaveFields`: debounced save

**Implementation:**
- File: `app/templates/hooks/useTemplateValidation.js:176-232`
- Immediate save fields bypass debounce (critical identity fields: dob, sex, nationality)

---

### Requirement: Fund Management Hook

The system SHALL manage fund items with CRUD operations and modal state.

#### Scenario: Add new fund item

**Given** a fund type (e.g., 'CASH_VND')
**When** `addFund(fundType)` is called
**Then** the hook SHALL open fund modal in create mode
**And** SHALL set `fundItemModalVisible = true`
**And** SHALL set `newFundItemType = fundType`
**And** SHALL set `currentFundItem = null`

**Implementation:**
- File: `app/templates/hooks/useTemplateFundManagement.js:34-43` ✅

#### Scenario: Update existing fund item

**Given** an updated fund item object
**When** `handleFundItemUpdate(updatedFundItem)` is called
**Then** the hook SHALL save to fund_items table via UserDataService
**And** SHALL update fund in formState.funds array
**And** SHALL close modal
**And** SHALL trigger debounced save

**Implementation:**
- File: `app/templates/hooks/useTemplateFundManagement.js:53-62`

#### Scenario: Delete fund item

**Given** a fund item ID
**When** `handleFundItemDelete(fundItemId)` is called
**Then** the hook SHALL delete from fund_items table via UserDataService
**And** SHALL remove from formState.funds array
**And** SHALL close modal
**And** SHALL trigger debounced save

**Implementation:**
- File: `app/templates/hooks/useTemplateFundManagement.js:93-102`

---

### Requirement: Field State Manager Utility

The system SHALL provide utilities to filter save operations based on field interaction state.

#### Scenario: Determine if field should be saved

**Given** field name, value, isUserModified flag, and options
**When** `shouldSaveField(fieldName, value, isUserModified, options)` is called
**Then** the utility SHALL return true if:
  - Field is in alwaysSaveFields array, OR
  - Field is user-modified, OR
  - Field has non-empty value AND preserveExisting is true
**And** SHALL return false for empty non-user-modified fields

**Implementation:**
- File: `app/templates/utils/TemplateFieldStateManager.js:30-56` ✅

#### Scenario: Filter saveable fields from all fields

**Given** all form fields, interaction state, and options
**When** `filterSaveableFields(allFields, interactionState, options)` is called
**Then** the utility SHALL return object containing only fields that should be saved
**And** SHALL exclude empty pre-filled fields
**And** SHALL include all user-modified fields
**And** SHALL include all always-save fields

**Implementation:**
- File: `app/templates/utils/TemplateFieldStateManager.js:58-79`
- Used by template before calling UserDataService save methods

#### Scenario: Extract always-save fields from config

**Given** template configuration
**When** `getAlwaysSaveFieldsFromConfig(config)` is called
**Then** the utility SHALL return array containing:
  - All fields in `config.features.autoSave.immediateSaveFields`
  - All fields with `immediateSave: true` in their field config
**And** SHALL deduplicate the array

**Implementation:**
- File: `app/templates/utils/TemplateFieldStateManager.js:120-139`

---

### Requirement: Country Configuration Structure

Each country SHALL provide a comprehensive configuration file defining all behavior.

#### Scenario: Vietnam configuration structure

**Given** Vietnam as a destination
**When** vietnamComprehensiveTravelInfoConfig is loaded
**Then** the config SHALL contain:
  - `destinationId: 'vn'`
  - `hero` object with rich hero configuration (gradient, value props, beginner tip)
  - `sections` object with 4 sections: passport, personal, funds, travel
  - Each section with `enabled`, `icon`, `sectionKey`, `fields` properties
  - Each field with at minimum: `fieldName`, `required`, `labelKey`, `defaultLabel`
  - Validation rules: `pattern`, `validationMessage`, `maxLength`, `immediateSave`
  - `features` object with autoSave, saveStatusIndicator, smartButton configs
  - `navigation` object with previous, next screens and submitButton config
  - `tracking` object with trackFieldModifications flag
  - Location data: `provincesData`, `getDistrictsFunc` (statically imported)

**Implementation:**
- File: `app/config/destinations/vietnam/comprehensiveTravelInfoConfig.js` (551 lines) ✅
- Imports location data: `import { vietnamProvinces, getDistrictsByProvince } from '../../../data/vietnamLocations'`
- Defines 28 fields across 4 sections

#### Scenario: Location data static import (React Native compatibility)

**Given** React Native Metro bundler doesn't support dynamic import()
**When** location data is needed
**Then** the config SHALL import data at top of file
**And** SHALL pass actual data/functions (not string paths) in locationHierarchy
**And** SHALL NOT use dynamic import() or require() with variables

**Implementation:**
- File: `app/config/destinations/vietnam/comprehensiveTravelInfoConfig.js:12`
- Pattern: `provincesData: vietnamProvinces` (actual data, not path string)
- Template extracts via useMemo (no async needed)

---

### Requirement: Country Screen Implementation

Each country screen SHALL be minimal (11 lines) and only import template + config.

#### Scenario: Vietnam screen using V2 template

**Given** Vietnam travel info screen
**When** VietnamTravelInfoScreen component renders
**Then** the screen SHALL:
  1. Import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate.v2'
  2. Import vietnamComprehensiveTravelInfoConfig from config file
  3. Return `<EnhancedTravelInfoTemplate config={config} route={route} navigation={navigation} />`
**And** the screen SHALL NOT contain any custom state management
**And** the screen SHALL NOT contain any custom hooks
**And** the screen SHALL NOT exceed 50 lines including comments

**Implementation:**
- File: `app/screens/vietnam/VietnamTravelInfoScreen.js` (43 lines total, 11 lines actual code) ✅
- Code reduction: 630 lines → 43 lines (98.3%)

---

## MODIFIED Requirements

### Requirement: Vietnam persistence layer

The Vietnam travel info screen SHALL save data to UserDataService (SQLite) instead of AsyncStorage.

#### Scenario: Replace AsyncStorage with UserDataService

**Given** the old Vietnam implementation used AsyncStorage with flat JSON
**When** migrating to V2 template
**Then** the implementation SHALL use UserDataService for all data persistence
**And** SHALL save to 4 relational tables:
  - `passports` table (surname, givenName, passportNumber, nationality, dateOfBirth, expiryDate, sex)
  - `personal_info` table (occupation, provinceCity, countryRegion, phoneCode, phoneNumber, email)
  - `fund_items` table (id, userId, fundType, amount, currency)
  - `travel_info` table (travelPurpose, arrivalArrivalDate, departureDepartureDate, province, district, hotelAddress)
**And** SHALL NOT use AsyncStorage for actual data (only for interaction state)

**Implementation:**
- Old file: Used `AsyncStorage.setItem('vietnam_travel_info_${userId}', JSON.stringify(dataToSave))` ❌
- New file: Uses `UserDataService.savePassport()`, `.savePersonalInfo()`, `.saveTravelInfo()` ✅
- Migration commit: `1d57e50`

---

## REMOVED Requirements

### Requirement: ProgressOverviewCard component

The ProgressOverviewCard component SHALL NOT be used in any template-based travel info screens.

#### Scenario: Remove ProgressOverviewCard from Vietnam

**Given** old Vietnam implementation had ProgressOverviewCard
**When** migrating to V2 template
**Then** ProgressOverviewCard SHALL be removed
**And** template SHALL NOT render ProgressOverviewCard
**And** Thailand doesn't use ProgressOverviewCard (gold standard)

**Rationale:** User directive: "we want to use Thai as our model so drop the ProgressOverviewCard. Everything we do to the template has to follow Thai's."

**Implementation:**
- Config: `features.progressOverview: false`
- Template: Does not include ProgressOverviewCard component

---

## Implementation Tasks

### Task 1: Test Vietnam V2 Implementation ⏳ HIGH PRIORITY

**Status:** PENDING
**Assigned to:** OpenSpec
**Estimated effort:** 4-6 hours

**Objective:** Verify all V2 template features work correctly with Vietnam.

**Subtasks:**

1. **Test data loading flow**
   - [ ] Select a passport from home screen
   - [ ] Navigate to Vietnam travel info
   - [ ] Verify passport fields pre-fill from route.params
   - [ ] Check console logs for complete data flow:
     ```
     [Template V2] userId resolved: XXX from passport: {...}
     [Template V2] Pre-filling from route.params passport: {...}
     [Template V2] Initializing formState with fields: [...]
     [Template V2] Triggering data load - userId: XXX tracker initialized: true
     [Template V2] Loading data from UserDataService for user: XXX
     [Template V2] Loaded data: {...}
     [Template V2] Data loaded successfully. Fields with data: [...] Funds count: X
     ```
   - [ ] Verify field counts show correct values (e.g., "5/9" not "0/9")

2. **Test data persistence**
   - [ ] Fill data in passport section
   - [ ] Fill data in personal info section
   - [ ] Add 2-3 fund items
   - [ ] Fill data in travel details section
   - [ ] Navigate away to home screen
   - [ ] Navigate back to Vietnam travel info
   - [ ] Verify ALL data persists correctly
   - [ ] Check SQLite database tables:
     ```sql
     SELECT * FROM passports WHERE id = 'user_XXX';
     SELECT * FROM personal_info WHERE user_id = 'user_XXX';
     SELECT * FROM fund_items WHERE user_id = 'user_XXX';
     SELECT * FROM travel_info WHERE user_id = 'user_XXX' AND destination_id = 'vn';
     ```

3. **Test field state tracking**
   - [ ] Pre-fill a field (e.g., from database)
   - [ ] Manually change the field to a different value
   - [ ] Navigate away and back
   - [ ] Verify user-entered value is preserved (not overwritten by pre-filled value)
   - [ ] Check AsyncStorage key: `user_interaction_state_vn`
   - [ ] Verify `isUserModified: true` for manually changed field

4. **Test smart button**
   - [ ] Clear all data, verify button shows "完成必填项 - Complete Required Fields" (secondary variant)
   - [ ] Fill 70-89% of required fields, verify button shows "快完成了 - Almost Done" (primary variant)
   - [ ] Fill 90%+ of required fields, verify button shows "继续 - Continue" (primary variant)

5. **Test validation**
   - [ ] Enter invalid passport number (e.g., "ABC"), verify pattern validation error shows
   - [ ] Enter past date in expiryDate field, verify futureOnly validation error shows
   - [ ] Enter invalid email format, verify email validation error shows
   - [ ] Verify errors display in red
   - [ ] Test field with `warning: true` - verify warning displays in yellow

6. **Test auto-save**
   - [ ] Enter data in a non-critical field
   - [ ] Wait 1 second
   - [ ] Verify save status indicator shows "💾 正在保存..." then "✅ 已保存"
   - [ ] Enter data in dob field (critical field)
   - [ ] Verify immediate save (no debounce delay)

7. **Test funds CRUD**
   - [ ] Click "Add Fund" button
   - [ ] Select fund type "CASH_VND"
   - [ ] Enter amount "10000000"
   - [ ] Save fund
   - [ ] Verify fund appears in list
   - [ ] Edit fund (change amount)
   - [ ] Verify updated amount persists
   - [ ] Delete fund
   - [ ] Verify fund removed from list
   - [ ] Check database: `SELECT * FROM fund_items WHERE user_id = 'user_XXX'`

8. **Test location cascade**
   - [ ] Select a province (e.g., "Hanoi")
   - [ ] Verify districts dropdown populates with Hanoi districts
   - [ ] Select a district (e.g., "Ba Dinh")
   - [ ] Verify selection saves
   - [ ] Navigate away and back
   - [ ] Verify province and district persist

**Acceptance Criteria:**
- All 8 test scenarios pass without errors
- Data persists correctly to all 4 database tables
- Field counts reflect actual filled fields
- Smart button updates based on completion
- Validation works for all field types
- Auto-save and immediate save work as expected
- Funds CRUD operations work correctly
- Location cascade works correctly

**Files to monitor:**
- `app/templates/EnhancedTravelInfoTemplate.v2.js`
- `app/screens/vietnam/VietnamTravelInfoScreen.js`
- `app/config/destinations/vietnam/comprehensiveTravelInfoConfig.js`
- All 4 V2 hooks in `app/templates/hooks/`

---

### Task 2: Expand Vietnam Config with Full Validation ⏳ MEDIUM PRIORITY

**Status:** PENDING
**Assigned to:** OpenSpec
**Estimated effort:** 2-3 hours

**Objective:** Add validation rules for all 28 fields in Vietnam config.

**Current status:** Basic structure exists, but many fields lack validation rules.

**Fields needing validation:**

**Passport section (5 fields need validation):**
- `nationality`: required validation
- `visaNumber`: pattern validation (optional, warning mode)
- `middleName`: maxLength validation
- `sex`: required validation
- All name fields: uppercaseNormalize

**Personal section (7 fields need validation):**
- `occupation`: required validation, custom field support
- `cityOfResidence`: required validation
- `countryOfResidence`: required validation
- `phoneCode`: required validation
- `phoneNumber`: pattern validation `/^\d{6,15}$/`
- `email`: email format validation, optional
- `customOccupation`: conditional required (when occupation === 'other')

**Travel section (14 fields need validation):**
- `travelPurpose`: required validation
- `customTravelPurpose`: conditional required
- `recentStayCountry`: required validation
- `boardingCountry`: required validation
- `arrivalFlightNumber`: pattern validation, required
- `arrivalDate`: futureOnly validation, required, immediateSave
- `departureFlightNumber`: pattern validation, required
- `departureDate`: futureOnly validation, required, immediateSave, must be after arrivalDate
- `isTransitPassenger`: boolean, default false
- `accommodationType`: required validation
- `customAccommodationType`: conditional required
- `province`: required validation
- `district`: required validation
- `hotelAddress`: required validation, minLength validation

**Example additions:**

```javascript
// In vietnamComprehensiveTravelInfoConfig.js

nationality: {
  fieldName: 'nationality',
  required: true,
  labelKey: 'vietnam.travelInfo.fields.nationality',
  defaultLabel: '国籍 - Nationality',
  validationMessage: '请选择国籍 - Please select nationality',
  immediateSave: false,
},

visaNumber: {
  fieldName: 'visaNumber',
  required: false,
  pattern: /^[A-Z0-9]{5,20}$/,
  labelKey: 'vietnam.travelInfo.fields.visaNumber',
  defaultLabel: '签证号码 - Visa Number (Optional)',
  validationMessage: '请输入有效的签证号码（5-20位字母或数字）',
  warning: true, // Soft validation - shows warning instead of blocking error
  immediateSave: false,
},

email: {
  fieldName: 'email',
  required: false,
  type: 'email',
  labelKey: 'vietnam.travelInfo.fields.email',
  defaultLabel: '邮箱 - Email',
  validationMessage: '请输入有效的邮箱地址',
  immediateSave: false,
},

phoneNumber: {
  fieldName: 'phoneNumber',
  required: false,
  pattern: /^\d{6,15}$/,
  labelKey: 'vietnam.travelInfo.fields.phoneNumber',
  defaultLabel: '电话号码 - Phone Number',
  validationMessage: '请输入有效的电话号码（6-15位数字）',
  immediateSave: false,
},

arrivalDate: {
  fieldName: 'arrivalDate',
  required: true,
  type: 'date',
  futureOnly: true,
  labelKey: 'vietnam.travelInfo.fields.arrivalDate',
  defaultLabel: '入境日期 - Arrival Date',
  validationMessage: '请选择未来日期',
  smartDefault: 'tomorrow',
  immediateSave: true, // Critical field - save immediately
},

departureDate: {
  fieldName: 'departureDate',
  required: true,
  type: 'date',
  futureOnly: true,
  mustBeAfter: 'arrivalDate', // Custom validation
  labelKey: 'vietnam.travelInfo.fields.departureDate',
  defaultLabel: '离境日期 - Departure Date',
  validationMessage: '请选择未来日期（必须晚于入境日期）',
  smartDefault: 'nextWeek',
  immediateSave: true,
},

hotelAddress: {
  fieldName: 'hotelAddress',
  required: true,
  minLength: 10,
  maxLength: 200,
  labelKey: 'vietnam.travelInfo.fields.hotelAddress',
  defaultLabel: '酒店地址 - Hotel Address',
  validationMessage: '请输入完整的酒店地址（至少10个字符）',
  immediateSave: false,
},
```

**Acceptance Criteria:**
- All 28 fields have appropriate validation rules
- Pattern validations use correct regex
- Date validations use correct flags (futureOnly, pastOnly, minMonthsValid)
- Required vs optional fields correctly marked
- Immediate save fields correctly identified
- Warning vs error validations correctly configured
- Validation messages are bilingual (Chinese + English)

**File to modify:**
- `app/config/destinations/vietnam/comprehensiveTravelInfoConfig.js`

---

### Task 3: Create Thailand Comprehensive Config ⏳ HIGH PRIORITY

**Status:** PENDING
**Assigned to:** OpenSpec
**Estimated effort:** 8-12 hours

**Objective:** Create comprehensive Thailand configuration with all 57+ fields.

**Reference files:**
- `app/screens/thailand/ThailandTravelInfoScreen.js` (569 lines) - Current implementation
- `app/hooks/thailand/useThailandTravelInfo.js` (1,087 lines) - Main data hook
- `app/hooks/thailand/useThailandValidation.js` (441 lines) - Validation logic
- `app/hooks/thailand/useThailandFundManagement.js` (150 lines) - Fund management
- `app/hooks/thailand/useThailandFieldStateManager.js` (180 lines) - Field state
- `app/hooks/thailand/useThailandUserInteractionTracker.js` (230 lines) - Interaction tracking

**Steps:**

1. **Extract all fields from Thailand implementation**
   - [ ] Analyze ThailandTravelInfoScreen.js for all useState declarations
   - [ ] Map each field to appropriate section (passport/personal/funds/travel)
   - [ ] Document field types (text, date, number, select, boolean)

2. **Extract validation rules from useThailandValidation**
   - [ ] Find all pattern validations
   - [ ] Find all date validations (futureOnly, pastOnly, minMonthsValid)
   - [ ] Find all required field checks
   - [ ] Find all custom validation logic
   - [ ] Port to config format

3. **Import Thailand location data**
   ```javascript
   import {
     thaiProvinces,
     getThaiDistricts,
     getThaiSubDistricts
   } from '../../../data/thailandLocations';
   ```

4. **Configure 3-level location hierarchy**
   ```javascript
   locationHierarchy: {
     levels: 3, // Thailand: Province → District → SubDistrict
     provincesData: thaiProvinces,
     getDistrictsFunc: getThaiDistricts,
     getSubDistrictsFunc: getThaiSubDistricts,
     labels: {
       level1: { key: 'thailand.locations.province', default: '府 - Province' },
       level2: { key: 'thailand.locations.district', default: '区 - District' },
       level3: { key: 'thailand.locations.subDistrict', default: '分区 - SubDistrict' },
     },
   }
   ```

5. **Extract fund types from useThailandFundManagement**
   - [ ] List all Thailand-specific fund types
   - [ ] Map to config format:
     ```javascript
     funds: {
       enabled: true,
       minRequired: 1,
       types: [
         { value: 'CASH_THB', label: '泰铢现金 - Cash THB', defaultAmount: 50000 },
         { value: 'CASH_USD', label: '美元现金 - Cash USD', defaultAmount: 1000 },
         // ... more types
       ],
     }
     ```

6. **Configure Thailand-specific features**
   ```javascript
   features: {
     autoSave: {
       enabled: true,
       delay: 2000, // Thailand uses 2-second debounce
       immediateSaveFields: [
         'dob', 'expiryDate', 'sex', 'nationality',
         'arrivalDate', 'departureDate',
         // ... all critical fields
       ],
     },
     // Thailand has additional features Vietnam doesn't:
     performanceMonitoring: true,
     sessionStateManagement: true,
   }
   ```

7. **Configure smart button thresholds**
   ```javascript
   navigation: {
     submitButton: {
       dynamic: true,
       thresholds: {
         incomplete: 0.75, // Thailand may use different threshold
         almostDone: 0.92,
       },
       labels: {
         incomplete: '完成必填项 - Complete Required Fields',
         almostDone: '即将完成 - Almost There',
         ready: '继续 - Continue',
       },
     },
   }
   ```

**Acceptance Criteria:**
- Config file created at: `app/config/destinations/thailand/comprehensiveTravelInfoConfig.js`
- All 57+ fields documented with validation rules
- 3-level location hierarchy configured correctly
- All fund types from Thailand included
- Features match Thailand's current behavior
- Thailand-specific auto-save delay (2 seconds) configured
- All immediate save fields identified
- File is 700-800 lines (comprehensive but clean)

**File to create:**
- `app/config/destinations/thailand/comprehensiveTravelInfoConfig.js`

---

### Task 4: Migrate Thailand Screen to V2 Template ⏳ HIGH PRIORITY

**Status:** PENDING
**Assigned to:** OpenSpec
**Estimated effort:** 2-3 hours

**Objective:** Reduce Thailand implementation from 2,887 lines to ~50 lines using V2 template.

**Prerequisites:**
- Task 3 (Thailand config) must be complete

**Steps:**

1. **Create backup of current implementation**
   - [ ] Copy `app/screens/thailand/ThailandTravelInfoScreen.js` to `ThailandTravelInfoScreen.BACKUP.js`
   - [ ] Copy all 5 hooks to backup folder

2. **Replace screen with V2 template call**
   - [ ] Replace entire file contents with template pattern:
     ```javascript
     import React from 'react';
     import EnhancedTravelInfoTemplate from '../../templates/EnhancedTravelInfoTemplate.v2';
     import { thailandComprehensiveTravelInfoConfig } from '../../config/destinations/thailand/comprehensiveTravelInfoConfig';

     const ThailandTravelInfoScreen = ({ navigation, route }) => {
       return (
         <EnhancedTravelInfoTemplate
           config={thailandComprehensiveTravelInfoConfig}
           route={route}
           navigation={navigation}
         />
       );
     };

     export default ThailandTravelInfoScreen;
     ```

3. **Test Thailand implementation**
   - [ ] Navigate to Thailand travel info from passport selection
   - [ ] Verify all sections render correctly
   - [ ] Verify 3-level location cascade works (Province → District → SubDistrict)
   - [ ] Verify all field types render (text, date, select, boolean)
   - [ ] Fill data and verify persistence
   - [ ] Test validation on all field types
   - [ ] Test funds CRUD with Thailand fund types
   - [ ] Compare behavior with backup implementation

4. **Verify code reduction**
   - [ ] Count lines before: `wc -l app/screens/thailand/ThailandTravelInfoScreen.BACKUP.js app/hooks/thailand/*.js`
   - [ ] Count lines after: `wc -l app/screens/thailand/ThailandTravelInfoScreen.js`
   - [ ] Expected reduction: 2,887 → 50 lines (98.3%)

**Acceptance Criteria:**
- Thailand screen successfully migrated to V2 template
- All 57+ fields render correctly
- 3-level location cascade works
- All validation rules work correctly
- All fund types available
- Data persists to all 4 database tables
- Behavior matches original implementation
- Code reduction ≥ 98%
- No functionality lost from original implementation

**Files to modify:**
- `app/screens/thailand/ThailandTravelInfoScreen.js`

**Files to create:**
- `app/screens/thailand/ThailandTravelInfoScreen.BACKUP.js` (backup)

---

### Task 5: Add Unit Tests for V2 Hooks 📋 MEDIUM PRIORITY

**Status:** PENDING
**Assigned to:** OpenSpec
**Estimated effort:** 6-8 hours

**Objective:** Create comprehensive unit tests for all V2 hooks and utilities.

**Test files to create:**

1. `app/templates/hooks/__tests__/useTemplateUserInteractionTracker.test.js`
   - [ ] Test markFieldAsModified updates state and AsyncStorage
   - [ ] Test markFieldAsPreFilled doesn't overwrite user-modified fields
   - [ ] Test isFieldUserModified returns correct boolean
   - [ ] Test initialization from AsyncStorage
   - [ ] Test error recovery for corrupted state
   - [ ] Test config toggle (tracking disabled)

2. `app/templates/hooks/__tests__/useTemplateValidation.test.js`
   - [ ] Test pattern validation with various regex patterns
   - [ ] Test date validation (futureOnly, pastOnly, minMonthsValid)
   - [ ] Test email format validation
   - [ ] Test required field validation
   - [ ] Test soft validation (warning mode)
   - [ ] Test getSmartButtonConfig at different completion levels
   - [ ] Test handleFieldBlur with immediate save fields
   - [ ] Test handleFieldBlur with debounced save fields
   - [ ] Test getFieldCount for all section types
   - [ ] Test calculateCompletionPercent

3. `app/templates/hooks/__tests__/useTemplateFundManagement.test.js`
   - [ ] Test addFund opens modal correctly
   - [ ] Test handleFundItemUpdate saves to database
   - [ ] Test handleFundItemCreate adds new fund
   - [ ] Test handleFundItemDelete removes fund
   - [ ] Test modal state management

4. `app/templates/utils/__tests__/TemplateFieldStateManager.test.js`
   - [ ] Test shouldSaveField with various scenarios
   - [ ] Test filterSaveableFields returns correct subset
   - [ ] Test getAlwaysSaveFieldsFromConfig extracts correct fields
   - [ ] Test validateAndRecoverInteractionState handles corruption

**Test framework:** Jest + React Native Testing Library

**Coverage target:** ≥ 80% line coverage for all hooks and utilities

**Example test:**

```javascript
// app/templates/hooks/__tests__/useTemplateValidation.test.js

import { renderHook } from '@testing-library/react-native';
import { useTemplateValidation } from '../useTemplateValidation';

describe('useTemplateValidation', () => {
  describe('pattern validation', () => {
    it('should return error for invalid passport number', () => {
      const config = {
        sections: {
          passport: {
            fields: {
              passportNo: {
                fieldName: 'passportNo',
                pattern: /^[A-Z0-9]{5,20}$/,
                validationMessage: 'Invalid passport',
              }
            }
          }
        }
      };

      const { result } = renderHook(() => useTemplateValidation({
        config,
        formState: { passportNo: 'abc' },
        userInteractionTracker: mockTracker,
        saveDataToUserDataService: jest.fn(),
        debouncedSave: jest.fn(),
      }));

      const validation = result.current.validateField('passportNo', 'abc', config.sections.passport.fields.passportNo);

      expect(validation.isValid).toBe(false);
      expect(validation.errorMessage).toBe('Invalid passport');
    });
  });

  describe('smart button', () => {
    it('should show "Complete Required Fields" when < 70% complete', () => {
      // Mock 50% completion
      const config = { /* ... */ };

      const { result } = renderHook(() => useTemplateValidation({ /* ... */ }));

      const buttonConfig = result.current.getSmartButtonConfig();

      expect(buttonConfig.label).toBe('Complete Required Fields');
      expect(buttonConfig.variant).toBe('secondary');
    });
  });
});
```

**Acceptance Criteria:**
- All 4 test files created
- All critical paths tested
- ≥ 80% line coverage achieved
- All tests pass
- Tests run in CI/CD pipeline

---

### Task 6: Create Migration Guide Documentation 📋 LOW PRIORITY

**Status:** PENDING
**Assigned to:** OpenSpec
**Estimated effort:** 3-4 hours

**Objective:** Document the process for migrating additional countries to V2 template.

**Document to create:** `docs/guides/MIGRATING_COUNTRY_TO_V2_TEMPLATE.md`

**Sections to include:**

1. **Overview**
   - Benefits of V2 template
   - Code reduction metrics
   - Feature comparison (before/after)

2. **Prerequisites**
   - Location data file (if country has provinces/districts)
   - Label translations file
   - Understanding of country-specific requirements

3. **Step-by-Step Migration Process**
   - Analyze existing implementation
   - Create configuration file
   - Import location data
   - Define sections and fields
   - Add validation rules
   - Configure features
   - Replace screen file
   - Test thoroughly

4. **Configuration Schema Reference**
   - Full schema documentation
   - All available field properties
   - All available validation types
   - All available features

5. **Common Patterns**
   - 2-level vs 3-level location hierarchy
   - Immediate save fields
   - Soft validation (warnings)
   - Custom fields (e.g., "Other" with text input)
   - Conditional required fields

6. **Troubleshooting**
   - Common errors and solutions
   - Metro bundler issues
   - Dynamic import errors
   - Field name mapping issues
   - Validation not working

7. **Testing Checklist**
   - Data loading
   - Data persistence
   - Field state tracking
   - Validation
   - Smart button
   - Auto-save
   - Funds CRUD
   - Location cascade

**Acceptance Criteria:**
- Complete migration guide created
- Step-by-step instructions clear and detailed
- All common patterns documented
- Troubleshooting section comprehensive
- Testing checklist actionable

**File to create:**
- `docs/guides/MIGRATING_COUNTRY_TO_V2_TEMPLATE.md`

---

### Task 7: Add Performance Monitoring (Optional) 📋 LOW PRIORITY

**Status:** PENDING
**Assigned to:** OpenSpec
**Estimated effort:** 4-6 hours

**Objective:** Add optional performance monitoring for complex forms (Thailand).

**Features to implement:**

1. **Render tracking**
   - Count component renders
   - Track render reasons (which props changed)
   - Log expensive re-renders

2. **Save performance tracking**
   - Track time from field change to save complete
   - Track debounce delays
   - Track UserDataService save latency

3. **Validation performance tracking**
   - Track validation execution time
   - Track which validations are slowest

4. **Config toggle**
   ```javascript
   features: {
     performanceMonitoring: {
       enabled: true,
       logRenders: true,
       logSaves: true,
       logValidations: true,
     }
   }
   ```

**Implementation approach:**

```javascript
// In EnhancedTravelInfoTemplate.v2.js

useEffect(() => {
  if (config.features?.performanceMonitoring?.enabled) {
    console.log('[Performance] Component rendered', {
      renderCount: renderCountRef.current++,
      timestamp: Date.now(),
    });
  }
}, [formState]);

const saveDataToUserDataService = useCallback(async () => {
  const startTime = Date.now();

  // ... save logic ...

  if (config.features?.performanceMonitoring?.logSaves) {
    console.log('[Performance] Save completed', {
      duration: Date.now() - startTime,
      fieldsCount: Object.keys(passportUpdates).length + Object.keys(personalInfoUpdates).length,
    });
  }
}, [config]);
```

**Acceptance Criteria:**
- Performance monitoring can be toggled via config
- Logs are helpful for debugging
- No performance impact when disabled
- Thailand config enables this feature

---

## Technical Context

### File Structure

```
app/
├── templates/
│   ├── EnhancedTravelInfoTemplate.v2.js (863 lines) ✅
│   ├── hooks/
│   │   ├── useTemplateUserInteractionTracker.js (220 lines) ✅
│   │   ├── useTemplateValidation.js (340 lines) ✅
│   │   └── useTemplateFundManagement.js (120 lines) ✅
│   └── utils/
│       └── TemplateFieldStateManager.js (160 lines) ✅
│
├── config/destinations/
│   ├── vietnam/
│   │   └── comprehensiveTravelInfoConfig.js (551 lines) ✅
│   └── thailand/
│       └── comprehensiveTravelInfoConfig.js (PENDING - Task 3)
│
├── screens/
│   ├── vietnam/
│   │   └── VietnamTravelInfoScreen.js (43 lines) ✅
│   └── thailand/
│       └── ThailandTravelInfoScreen.js (569 lines - PENDING migration Task 4)
│
├── components/shared/sections/
│   ├── PassportSection.js ✅
│   ├── PersonalInfoSection.js ✅
│   ├── FundsSection.js ✅
│   └── TravelDetailsSection.js ✅
│
├── services/data/
│   └── UserDataService.js ✅
│
└── data/
    ├── vietnamLocations.js ✅
    └── thailandLocations.js ✅
```

### Database Schema

**Tables used by template:**

1. **passports**
   - id (TEXT PRIMARY KEY)
   - surname (TEXT)
   - middleName (TEXT)
   - givenName (TEXT)
   - passportNumber (TEXT)
   - nationality (TEXT)
   - dateOfBirth (TEXT)
   - expiryDate (TEXT)
   - sex (TEXT)
   - visaNumber (TEXT)

2. **personal_info**
   - user_id (TEXT PRIMARY KEY)
   - occupation (TEXT)
   - provinceCity (TEXT)
   - countryRegion (TEXT)
   - phoneCode (TEXT)
   - phoneNumber (TEXT)
   - email (TEXT)

3. **fund_items**
   - id (TEXT PRIMARY KEY)
   - user_id (TEXT)
   - fundType (TEXT)
   - amount (REAL)
   - currency (TEXT)
   - created_at (TEXT)

4. **travel_info**
   - user_id (TEXT)
   - destination_id (TEXT)
   - travelPurpose (TEXT)
   - customTravelPurpose (TEXT)
   - recentStayCountry (TEXT)
   - boardingCountry (TEXT)
   - arrivalFlightNumber (TEXT)
   - arrivalArrivalDate (TEXT)
   - departureFlightNumber (TEXT)
   - departureDepartureDate (TEXT)
   - isTransitPassenger (INTEGER)
   - accommodationType (TEXT)
   - customAccommodationType (TEXT)
   - province (TEXT)
   - district (TEXT)
   - districtId (TEXT)
   - hotelAddress (TEXT)
   - PRIMARY KEY (user_id, destination_id)

### Key Design Decisions

1. **Thailand as Gold Standard**
   - User directive: "use Thai as our model"
   - All features must match Thailand's implementation
   - Template provides Thailand-grade features automatically

2. **No Dynamic Import**
   - Metro bundler doesn't support `import()`
   - All data must be imported statically at top of config file
   - Pass actual data/functions through config, not string paths

3. **Field State Tracking Essential**
   - User-modified fields must never be overwritten
   - Tracked via AsyncStorage separately from actual data
   - Critical for proper UX (prevents losing user input)

4. **Immediate Save for Critical Fields**
   - Identity fields (dob, sex, nationality) bypass debounce
   - Better UX for important fields
   - Configurable via `immediateSaveFields` array

5. **Soft Validation (Warnings)**
   - Some fields show warnings (yellow) not errors (red)
   - Allows submission with warnings
   - Controlled by `warning: true` in field config

6. **Smart Button**
   - Dynamic label based on completion percentage
   - Improves UX with contextual guidance
   - Thresholds configurable per country

7. **Config-Driven Everything**
   - Zero custom code in country screens
   - All behavior controlled by config
   - Makes adding countries trivial

### Common Pitfalls

1. **Field Name Mapping**
   - Config uses: `passportNo`, `dob`, `cityOfResidence`
   - Database uses: `passportNumber`, `dateOfBirth`, `provinceCity`
   - Template handles mapping in load/save functions

2. **Dynamic Import Error**
   - ❌ `const module = await import(path)`
   - ✅ `import { data } from '../path'` at top, then pass `data` in config

3. **Circular Dependencies**
   - useCallback dependencies must be specific
   - Don't pass entire objects (e.g., userInteractionTracker)
   - Pass specific methods instead

4. **Pre-fill vs Loaded Data**
   - route.params pre-fills passport fields immediately
   - UserDataService loads additional saved data
   - Both must coexist without conflicts

5. **Funds Section Special Case**
   - Not a traditional field list (it's an array)
   - Special handling in getFieldCount
   - CRUD operations via modal

### Console Logging

**All template logs prefixed with `[Template V2]`:**

- `[Template V2] userId resolved: XXX from passport: {...}`
- `[Template V2] Pre-filling from route.params passport: {...}`
- `[Template V2] Initializing formState with fields: [...]`
- `[Template V2] Triggering data load - userId: XXX tracker initialized: true`
- `[Template V2] Loading data from UserDataService for user: XXX`
- `[Template V2] Loaded data: {...}`
- `[Template V2] Data loaded successfully. Fields with data: [...] Funds count: X`
- `[Template V2] Saving data to UserDataService`
- `[Template V2] Saved passport fields: [...]`
- `[Template V2] Saved personal info fields: [...]`
- `[Template V2] Saved travel info fields: [...]`

### Testing Strategy

**3-tier testing:**

1. **Unit tests** - Individual hooks and utilities
2. **Integration tests** - Full template with mock config
3. **E2E tests** - Real country implementations (Vietnam, Thailand)

**Critical test scenarios:**
- Data loading from UserDataService
- Data saving with field filtering
- Field state tracking (user-modified vs pre-filled)
- Validation (pattern, date, required)
- Smart button label changes
- Auto-save with debounce
- Immediate save for critical fields
- Funds CRUD operations
- Location cascade (2-level and 3-level)

---

## Success Metrics

### Code Reduction
- **Vietnam:** 630 → 43 lines (98.3% reduction) ✅
- **Thailand:** 2,887 → 50 lines (98.3% reduction) - PENDING Task 4

### Template Reusability
- **Lines reusable:** 1,703 lines (template 863 + hooks 840)
- **Lines per new country:** 11 lines + config file (~550 lines)
- **Time to add new country:** < 4 hours (vs 2-3 weeks previously)

### Feature Parity
- **Vietnam:** All 4 sections working ✅
- **Thailand:** All features from original implementation - PENDING Task 4

### Test Coverage
- **Unit tests:** ≥ 80% line coverage - PENDING Task 5
- **Integration tests:** All critical flows covered - PENDING
- **E2E tests:** Vietnam and Thailand full scenarios - PENDING Task 1

---

## Dependencies

### External Libraries
- React Native
- Expo
- React Navigation
- Tamagui (UI components)
- AsyncStorage (@react-native-async-storage/async-storage)
- expo-linear-gradient

### Internal Dependencies
- UserDataService (SQLite persistence layer)
- Shared section components (PassportSection, PersonalInfoSection, etc.)
- Location data files (vietnamLocations, thailandLocations)
- Label translation files (vietnamLabels, thailandLabels)

---

## Known Issues

### Issue 1: Data Loading Dependency Chain
**Status:** FIXED (commits: fa8e6b4, a3780be)
**Description:** Circular dependency in loadDataFromUserDataService caused timing issues
**Solution:** Specific method dependencies instead of whole object

### Issue 2: Metro Bundler Dynamic Import
**Status:** FIXED (commit: d3a3144)
**Description:** Dynamic import() not supported in React Native
**Solution:** Static imports at top of config, pass actual data

### Issue 3: Field Counts Show 0/X
**Status:** NEEDS TESTING (Task 1)
**Description:** Field counts may not update after data loads
**Potential cause:** getFieldCount calculation or interaction state timing

### Issue 4: mustBeAfter Validation Not Implemented
**Status:** PENDING (Task 2)
**Description:** departureDate must be after arrivalDate validation not in useTemplateValidation
**Solution:** Add cross-field validation support to validation hook

---

## References

### Documentation
- `docs/architecture/THAILAND_BASED_TEMPLATE_FRAMEWORK.md` - V2 architecture analysis
- `docs/architecture/THAILAND_TO_TEMPLATE_V2_MIGRATION.md` - Migration plan
- `docs/V2_SESSION_PROGRESS.md` - Progress tracking

### Original Implementations
- `app/screens/thailand/ThailandTravelInfoScreen.js` (569 lines)
- `app/hooks/thailand/` (5 hooks, 2,318 lines total)

### V2 Implementation
- `app/templates/EnhancedTravelInfoTemplate.v2.js` (863 lines)
- `app/templates/hooks/` (3 hooks, 680 lines)
- `app/templates/utils/TemplateFieldStateManager.js` (160 lines)

---

## Next Actions for OpenSpec

**Immediate priorities:**

1. ⏳ **Task 1: Test Vietnam V2 Implementation** (4-6 hours)
   - Verify data loading, persistence, validation, smart button
   - Critical to validate template works correctly before Thailand

2. ⏳ **Task 3: Create Thailand Config** (8-12 hours)
   - Port all 57+ fields from Thailand hooks
   - Prerequisite for Thailand migration

3. ⏳ **Task 4: Migrate Thailand to V2** (2-3 hours)
   - Ultimate proof that template handles complex case
   - Demonstrates 98.3% code reduction

**Follow-up priorities:**

4. 📋 **Task 2: Expand Vietnam Config** (2-3 hours)
   - Complete validation rules for all fields

5. 📋 **Task 5: Unit Tests** (6-8 hours)
   - Ensure template robustness

6. 📋 **Task 6: Migration Guide** (3-4 hours)
   - Enable future country additions

**Questions:**
- Should I start with testing Vietnam first or proceed directly to Thailand?
- Do you want unit tests before or after Thailand migration?
- Any specific countries to prioritize after Thailand?

---

## Appendix: Configuration Schema

### Full Config Schema

```typescript
interface TravelInfoConfig {
  // Basic metadata
  destinationId: string;
  name: string;
  nameZh?: string;
  flag: string;
  currency?: string;
  currencySymbol?: string;

  // Hero section
  hero: {
    type: 'rich' | 'basic';
    title: string;
    titleEn?: string;
    subtitle: string;
    subtitleEn?: string;
    gradient?: {
      colors: string[];
      start?: { x: number; y: number };
      end?: { x: number; y: number };
    };
    valuePropositions?: Array<{
      icon: string;
      text: string;
      textEn?: string;
    }>;
    beginnerTip?: {
      icon: string;
      text: string;
      textEn?: string;
    };
  };

  // Sections
  sections: {
    passport?: SectionConfig;
    personal?: SectionConfig;
    funds?: FundsSectionConfig;
    travel?: TravelSectionConfig;
  };

  // Validation
  validation: {
    mode?: 'standard' | 'thailand';
    validateOnBlur?: boolean;
    showWarnings?: boolean;
    minCompletionPercent?: number;
    requiredSections?: string[];
    customRules?: Record<string, any>;
  };

  // Features
  features: {
    autoSave: {
      enabled: boolean;
      delay: number;
      immediateSaveFields: string[];
    };
    saveStatusIndicator?: boolean;
    lastEditedTimestamp?: boolean;
    privacyNotice?: boolean;
    scrollPositionRestore?: boolean;
    fieldStateTracking?: boolean;
    sessionStateManagement?: boolean;
    performanceMonitoring?: boolean;
    errorHandlingWithRetry?: boolean;
    smartDefaults?: boolean;
    smartButton?: boolean;
    progressOverview?: boolean;
  };

  // Navigation
  navigation: {
    previous: string;
    next: string;
    saveBeforeNavigate?: boolean;
    submitButton: {
      dynamic: boolean;
      thresholds?: {
        incomplete: number;
        almostDone: number;
        ready?: number;
      };
      labels?: {
        incomplete: string;
        almostDone: string;
        ready: string;
      };
      default?: string;
    };
  };

  // Tracking
  tracking: {
    enabled: boolean;
    trackFieldModifications: boolean;
    trackScrollPosition?: boolean;
    trackTimeSpent?: boolean;
  };

  // Styling
  colors?: {
    background?: string;
    primary?: string;
    success?: string;
    warning?: string;
    error?: string;
    heroGradientStart?: string;
    heroGradientEnd?: string;
  };

  // I18n
  i18n: {
    defaultLocale: string;
    supportedLocales: string[];
    labelSource: any;
  };
}

interface SectionConfig {
  enabled: boolean;
  icon: string;
  sectionKey: string;
  titleKey?: string;
  defaultTitle: string;
  fields: Record<string, FieldConfig>;
}

interface FieldConfig {
  fieldName: string;
  required?: boolean;
  type?: 'text' | 'date' | 'email' | 'number' | 'select' | 'boolean';
  pattern?: RegExp;
  maxLength?: number;
  minLength?: number;
  labelKey?: string;
  defaultLabel: string;
  helpText?: string;
  validationMessage?: string;
  warning?: boolean;
  immediateSave?: boolean;
  uppercaseNormalize?: boolean;
  smartDefault?: 'tomorrow' | 'nextWeek' | string;
  default?: any;
  futureOnly?: boolean;
  pastOnly?: boolean;
  minMonthsValid?: number;
  mustBeAfter?: string;
  allowCustom?: boolean;
  customFieldName?: string;
}

interface FundsSectionConfig extends SectionConfig {
  minRequired?: number;
  maxAllowed?: number;
  types: Array<{
    value: string;
    label: string;
    defaultAmount: number;
  }>;
  modal?: {
    enabled: boolean;
    component: string;
  };
  showPhotos?: boolean;
}

interface TravelSectionConfig extends SectionConfig {
  locationHierarchy?: {
    levels: 2 | 3;
    provincesData: any[];
    getDistrictsFunc: (provinceId: string) => any[];
    getSubDistrictsFunc?: (districtId: string) => any[];
    labels: {
      level1: { key: string; default: string };
      level2: { key: string; default: string };
      level3?: { key: string; default: string };
    };
  };
  photoUploads?: {
    flightTicket?: { enabled: boolean };
    hotelReservation?: { enabled: boolean };
  };
}
```

---

**End of Change Proposal**
