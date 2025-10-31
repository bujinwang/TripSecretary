# Task 1: Test Vietnam V2 Implementation - Test Plan

**Status**: IN PROGRESS
**Estimated Time**: 4-6 hours
**Objective**: Verify all V2 template features work correctly with Vietnam

---

## Prerequisites

- [ ] Metro bundler running with cleared cache
- [ ] Fix applied to EntryFlowScreenTemplate.js (null safety for allUserData)
- [ ] iOS simulator or device ready
- [ ] Database inspector ready (for SQLite verification)

---

## Test Scenario 1: Data Loading Flow

**Objective**: Verify passport pre-fill from route.params and UserDataService data loading

### Steps:
1. Navigate to Home screen
2. Select a passport from the passport list
3. Navigate to Vietnam → Travel Information
4. Monitor console logs

### Expected Console Output:
```
[Template V2] userId resolved: user_XXX from passport: {...}
[Template V2] Pre-filling from route.params passport: {...}
[Template V2] Initializing formState with fields: [...]
[Template V2] Triggering data load - userId: XXX tracker initialized: true
[Template V2] Loading data from UserDataService for user: XXX
[Template V2] Loaded data: {...}
[Template V2] Data loaded successfully. Fields with data: [...] Funds count: X
```

### Acceptance Criteria:
- ✅ Passport fields (surname, givenName, passportNo, etc.) show data immediately
- ✅ Field counts display correctly (e.g., "5/9" not "0/9")
- ✅ No console errors during load
- ✅ Loading state transitions properly (spinner → content)
- ✅ UserDataService loads from all 4 tables in parallel

### Files to Monitor:
- `app/templates/EnhancedTravelInfoTemplate.v2.js:166-202` (pre-fill logic)
- `app/templates/EnhancedTravelInfoTemplate.v2.js:215-284` (loadDataFromUserDataService)

---

## Test Scenario 2: Data Persistence

**Objective**: Verify all 4 SQLite tables save correctly

### Steps:
1. Fill out all sections:
   - **Passport Section**: surname, givenName, passportNo, dob, expiryDate, nationality, sex
   - **Personal Info Section**: occupation, cityOfResidence, countryOfResidence, phoneCode, phoneNumber, email
   - **Funds Section**: Add 2-3 fund items (CASH_VND, CASH_USD, CREDIT_CARD)
   - **Travel Details Section**: travelPurpose, arrivalDate, departureDate, province, district, hotelAddress
2. Navigate away from the screen (press back)
3. Navigate back to Vietnam Travel Info
4. Verify all data is still present

### Database Verification:
```sql
-- Check passports table
SELECT * FROM passports WHERE id = 'user_XXX';

-- Check personal_info table
SELECT * FROM personal_info WHERE user_id = 'user_XXX';

-- Check fund_items table
SELECT * FROM fund_items WHERE user_id = 'user_XXX';

-- Check travel_info table
SELECT * FROM travel_info WHERE user_id = 'user_XXX' AND destination_id = 'vn';
```

### Acceptance Criteria:
- ✅ All passport fields persisted to `passports` table
- ✅ All personal info fields persisted to `personal_info` table
- ✅ All fund items persisted to `fund_items` table with correct user_id
- ✅ All travel details persisted to `travel_info` table with destination_id = 'vn'
- ✅ Data reloads correctly after navigation
- ✅ No data loss or overwrites

### Files to Monitor:
- `app/templates/EnhancedTravelInfoTemplate.v2.js:289-398` (saveDataToUserDataService)

---

## Test Scenario 3: Field State Tracking

**Objective**: Verify user-modified fields are preserved over pre-filled values

### Steps:
1. Start with fresh data (clear database for test user)
2. Navigate to Vietnam Travel Info with passport that has:
   - surname: "WANG"
   - givenName: "BRADY"
   - passportNo: "A12343437"
3. Observe fields are pre-filled from route.params
4. Change surname to "SMITH" (user modification)
5. Navigate away and come back
6. Verify surname is still "SMITH" (user modification preserved)
7. Add new passport data without surname
8. Navigate back to Vietnam Travel Info
9. Verify surname is still "SMITH" (not overwritten by empty pre-fill)

### AsyncStorage Verification:
Check `user_interaction_state_vn` key:
```json
{
  "surname": {
    "value": "SMITH",
    "isUserModified": true,
    "lastModifiedAt": "2025-10-31T..."
  }
}
```

### Acceptance Criteria:
- ✅ User-modified fields marked with `isUserModified: true`
- ✅ Pre-filled fields marked with `isUserModified: false`
- ✅ User modifications preserved on subsequent loads
- ✅ Pre-filled values don't overwrite user modifications
- ✅ Field state correctly stored in AsyncStorage

### Files to Monitor:
- `app/templates/hooks/useTemplateUserInteractionTracker.js` (all functions)
- `app/templates/utils/TemplateFieldStateManager.js:30-56` (shouldSaveField)

---

## Test Scenario 4: Smart Button

**Objective**: Verify dynamic button labels based on completion percentage

### Steps:
1. Start with empty form (0% complete)
2. Observe button label
3. Fill 70% of fields (passport + personal info)
4. Observe button label changes
5. Fill 90%+ of fields (add funds + travel details)
6. Observe button label changes to "Submit"

### Expected Button States:
| Completion | Button Label | Color |
|------------|-------------|-------|
| 0-69% | "Continue Filling (XX%)" | Secondary |
| 70-89% | "Almost Done (XX%)" | Warning |
| 90-100% | "Submit Vietnam Entry Info" | Primary |

### Acceptance Criteria:
- ✅ Button label updates in real-time as fields are filled
- ✅ Completion percentage accurate (counts filled fields / total fields)
- ✅ Button style changes based on completion thresholds
- ✅ Button disabled when < 70% complete
- ✅ Button enabled when ≥ 70% complete

### Files to Monitor:
- `app/templates/hooks/useTemplateValidation.js:325-352` (getSmartButtonConfig)
- `app/templates/EnhancedTravelInfoTemplate.v2.js:705-745` (submit button rendering)

---

## Test Scenario 5: Validation

**Objective**: Test pattern, date, and email validation with errors and warnings

### Test Cases:

#### 5.1: Pattern Validation
- **Field**: Passport Number
- **Rule**: `/^[A-Z0-9]{6,9}$/` (uppercase letters/numbers, 6-9 chars)
- **Test**: Enter "abc123" → expect error "Must be 6-9 uppercase characters"
- **Test**: Enter "ABC123" → expect validation passes

#### 5.2: Date Validation (Future Only)
- **Field**: Arrival Date
- **Rule**: `futureOnly: true`
- **Test**: Enter yesterday's date → expect error "Date must be in the future"
- **Test**: Enter tomorrow's date → expect validation passes

#### 5.3: Date Validation (Min Months Valid)
- **Field**: Passport Expiry Date
- **Rule**: `minMonthsValid: 6`
- **Test**: Enter date 3 months from now → expect error "Must be valid for at least 6 months"
- **Test**: Enter date 8 months from now → expect validation passes

#### 5.4: Email Validation
- **Field**: Email
- **Rule**: Standard email regex
- **Test**: Enter "invalid" → expect error "Invalid email format"
- **Test**: Enter "test@example.com" → expect validation passes

#### 5.5: Soft Validation (Warnings)
- **Field**: Flight Number
- **Rule**: Pattern warning (not error)
- **Test**: Enter "123456" → expect yellow warning "Suggest format: XX1234"
- **Test**: Should still allow save/submit

### Acceptance Criteria:
- ✅ Pattern validation enforced correctly
- ✅ Date validation (future, past, minMonthsValid) works
- ✅ Email validation enforced
- ✅ Warnings displayed in yellow, don't block submission
- ✅ Errors displayed in red, prevent submission
- ✅ Validation triggered on field blur

### Files to Monitor:
- `app/templates/hooks/useTemplateValidation.js:80-232` (validation logic)
- `app/config/destinations/vietnam/comprehensiveTravelInfoConfig.js` (validation rules)

---

## Test Scenario 6: Auto-Save

**Objective**: Verify 1-second debounce and immediate save for critical fields

### Test Cases:

#### 6.1: Debounced Save (Normal Fields)
- **Field**: Hotel Address
- **Steps**:
  1. Type "123 SUKHUMVIT"
  2. Observe console - should NOT save immediately
  3. Wait 1 second
  4. Observe console log: `[Template V2] Auto-saving data...`
  5. Verify data saved to database

#### 6.2: Immediate Save (Critical Fields)
- **Fields**: surname, givenName, passportNo, nationality
- **Steps**:
  1. Change surname from "WANG" to "SMITH"
  2. Blur field
  3. Observe console log: `[Template V2] Immediate save for critical field: surname`
  4. Verify data saved immediately (< 100ms)

#### 6.3: Debounce Cancellation
- **Steps**:
  1. Type in hotelAddress field
  2. Within 1 second, type more
  3. Verify save timer resets (previous pending save cancelled)
  4. Wait 1 second after last keystroke
  5. Verify only 1 save occurs

### Expected Console Logs:
```
[Template V2] Field blurred: hotelAddress
[Template V2] Debouncing save... (1000ms)
[Template V2] Auto-saving data...
[Template V2] Save successful

[Template V2] Field blurred: surname
[Template V2] Immediate save for critical field: surname
[Template V2] Save successful
```

### Acceptance Criteria:
- ✅ Normal fields debounce for 1 second
- ✅ Critical fields save immediately on blur
- ✅ Debounce timer resets on subsequent input
- ✅ No excessive save calls
- ✅ LastEditedAt timestamp updates correctly

### Files to Monitor:
- `app/templates/hooks/useTemplateValidation.js:176-232` (handleFieldBlur)
- `app/templates/EnhancedTravelInfoTemplate.v2.js:401-442` (debouncedSave)

---

## Test Scenario 7: Funds CRUD

**Objective**: Verify add, edit, delete fund items via modal

### Test Cases:

#### 7.1: Add Fund Item
- **Steps**:
  1. Click "Add Proof of Funds" button
  2. Select fund type: "Cash (VND)"
  3. Enter amount: 50000000
  4. Enter details: "Cash for hotel"
  5. Click Save
  6. Verify fund item appears in list
  7. Check database: `SELECT * FROM fund_items WHERE user_id = 'user_XXX'`

#### 7.2: Edit Fund Item
- **Steps**:
  1. Click existing fund item
  2. Change amount from 50000000 to 60000000
  3. Click Save
  4. Verify amount updated in list
  5. Check database for updated amount

#### 7.3: Delete Fund Item
- **Steps**:
  1. Click existing fund item
  2. Click Delete button
  3. Confirm deletion
  4. Verify fund item removed from list
  5. Check database: fund item should be deleted

### Expected Console Logs:
```
[Template V2] Opening fund modal - mode: create, type: CASH_VND
[Template V2] Fund item saved: {id: "...", type: "CASH_VND", amount: 50000000}
[Template V2] Fund item updated: {id: "...", amount: 60000000}
[Template V2] Fund item deleted: "..."
```

### Acceptance Criteria:
- ✅ Can add new fund items via modal
- ✅ Can edit existing fund items
- ✅ Can delete fund items
- ✅ Fund items persist to `fund_items` table
- ✅ Funds count updates in field tracker (e.g., "2 funds added")
- ✅ Modal shows correct mode (create vs edit)

### Files to Monitor:
- `app/templates/hooks/useTemplateFundManagement.js` (all CRUD functions)
- `app/components/FundItemDetailModal.js` (modal UI)

---

## Test Scenario 8: Location Cascade

**Objective**: Verify province → district dropdown population

### Steps:
1. Observe District dropdown is disabled initially
2. Select Province: "Hanoi"
3. Observe District dropdown becomes enabled
4. Verify District dropdown shows only Hanoi districts:
   - Ba Dinh
   - Hoan Kiem
   - Dong Da
   - Hai Ba Trung
   - (etc.)
5. Select District: "Ba Dinh"
6. Verify district saved to database
7. Change Province to "Ho Chi Minh City"
8. Verify District dropdown:
   - Resets to empty
   - Shows only HCMC districts
   - Previously selected "Ba Dinh" cleared

### Expected Console Logs:
```
[Template V2] Province selected: Hanoi
[Template V2] Loading districts for province: Hanoi
[Template V2] Districts loaded: 12 districts
[Template V2] District selected: Ba Dinh
```

### Acceptance Criteria:
- ✅ District dropdown disabled until province selected
- ✅ District options filtered by selected province
- ✅ Changing province clears district selection
- ✅ District data loads from config's `getDistrictsFunc`
- ✅ Location data saved correctly to travel_info table

### Files to Monitor:
- `app/config/destinations/vietnam/comprehensiveTravelInfoConfig.js:410-439` (locationHierarchy)
- `app/components/shared/sections/TravelDetailsSection.js` (location selectors)

---

## Test Completion Checklist

- [ ] All 8 scenarios tested
- [ ] All acceptance criteria met
- [ ] No console errors
- [ ] Database integrity verified
- [ ] AsyncStorage state correct
- [ ] Performance acceptable (< 100ms for saves)
- [ ] UI responsive during operations
- [ ] Data persistence across navigation
- [ ] No memory leaks or excessive re-renders

---

## Known Issues to Watch For

1. **Metro cache**: Clear with `--clear` flag if changes don't apply
2. **AsyncStorage race conditions**: Ensure debounce cancellation works
3. **Null safety**: Verify all `route.params` accesses use optional chaining
4. **Field state overwrites**: User modifications should NEVER be overwritten by pre-fills

---

## Success Criteria

Task 1 is complete when:
- ✅ All 8 test scenarios pass
- ✅ No critical bugs found
- ✅ Vietnam V2 implementation validated as production-ready
- ✅ Ready to proceed to Task 3 (Thailand config creation)

---

**Next Tasks After Completion:**
- Task 2: Expand Vietnam Config with Full Validation (2-3 hours)
- Task 3: Create Thailand Comprehensive Config (8-12 hours) - HIGH PRIORITY
- Task 4: Migrate Thailand Screen to V2 Template (2-3 hours) - HIGH PRIORITY
