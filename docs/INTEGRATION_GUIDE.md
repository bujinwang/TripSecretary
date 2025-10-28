# Thailand Travel Info Screen - Integration Guide

## Overview

This guide provides step-by-step instructions for integrating the extracted hooks and components back into `ThailandTravelInfoScreen.js`.

**⚠️ IMPORTANT**: This is a complex integration that should be done incrementally with testing at each step. Do NOT attempt to do all changes at once.

## Current Status

- ✅ Phase 1: Custom hooks extracted (3 hooks created)
- ✅ Phase 2: UI sections extracted (5 components created)
- 🔄 Phase 3: Integration (IN PROGRESS - Use this guide)

## Files Created

### Hooks (`app/hooks/thailand/`)
1. `useThailandFormState.js` - All form state management
2. `useThailandDataPersistence.js` - Data loading/saving
3. `useThailandValidation.js` - Validation and completion tracking

### Components (`app/components/thailand/sections/`)
1. `HeroSection.js` - Welcome hero section
2. `PassportSection.js` - Passport information form
3. `PersonalInfoSection.js` - Personal information form
4. `FundsSection.js` - Funds management
5. `TravelDetailsSection.js` - Travel details and accommodation

## Integration Steps

### Step 1: Add New Imports

**Location**: Top of `ThailandTravelInfoScreen.js` (after existing imports)

```javascript
// Import custom hooks
import {
  useThailandFormState,
  useThailandDataPersistence,
  useThailandValidation
} from '../../hooks/thailand';

// Import section components
import {
  HeroSection,
  PassportSection,
  PersonalInfoSection,
  FundsSection,
  TravelDetailsSection
} from '../../components/thailand/sections';
```

### Step 2: Replace State Management

**Location**: After `const userId = useMemo(...)` (around line 69)

**Remove** all 57 useState declarations (lines 72-233)

**Add**:
```javascript
// Initialize form state hook
const formState = useThailandFormState(passport);

// User interaction tracking
const userInteractionTracker = useUserInteractionTracker('thailand_travel_info');
```

### Step 3: Initialize Validation Hook

**Location**: After formState initialization

**Add**:
```javascript
// Initialize validation hook
const validation = useThailandValidation({
  formState,
  userInteractionTracker,
  saveDataToSecureStorageWithOverride,  // Defined later
  debouncedSaveData,  // Defined later
});
```

### Step 4: Keep performSaveOperation Function

**Location**: Keep as-is (lines 1377-1825)

**Note**: This function is complex and tightly coupled. It will be refactored in Phase 4.

### Step 5: Add saveDataToSecureStorageWithOverride

**Location**: After performSaveOperation function

**Add** (simplified version that uses formState):
```javascript
const saveDataToSecureStorageWithOverride = async (fieldOverrides = {}) => {
  try {
    const saveResults = {};
    const saveErrors = [];

    const currentState = {
      ...formState.getFormValues(),
      existingPassport: formState.passportData,
      interactionState: {/* interaction state logic */},
      destination,
      ...fieldOverrides
    };

    await performSaveOperation(userId, fieldOverrides, saveResults, saveErrors, currentState);

    if (saveErrors.length > 0) {
      console.error('Save errors:', saveErrors);
      // Handle errors...
    }
  } catch (error) {
    console.error('Failed to save:', error);
    throw error;
  }
};
```

### Step 6: Initialize Persistence Hook

**Location**: After saveDataToSecureStorageWithOverride

**Add**:
```javascript
// Initialize persistence hook
const persistence = useThailandDataPersistence({
  passport,
  destination,
  userId,
  formState,
  userInteractionTracker,
  navigation
});
```

### Step 7: Keep Screen-Specific Handlers

**Location**: Keep these functions as-is (they're screen-specific):

1. `resetDistrictSelection` (line 1317)
2. `handleProvinceSelect` (line 1326)
3. `handleDistrictSelect` (line 1343)
4. `handleSubDistrictSelect` (line 1362)
5. `handleFlightTicketPhotoUpload` (line 1917)
6. `handleHotelReservationPhotoUpload` (line 1957)
7. `addFund` (line 1996)
8. `handleFundItemPress` (line 2002)
9. `handleFundItemModalClose` (line 2007)
10. `handleFundItemUpdate` (line 2012)
11. `handleFundItemCreate` (line 2028)
12. `handleFundItemDelete` (line 2043)
13. `handleContinue` (line 2066)
14. `handleGoBack` (line 2077)

**Modify these handlers** to use `formState.setX()` instead of `setX()`:
- Replace `setProvince(...)` with `formState.setProvince(...)`
- Replace `setDistrict(...)` with `formState.setDistrict(...)`
- etc.

### Step 8: Load Data on Mount

**Location**: Replace existing useEffect for data loading

**Remove**: Lines 635-850 (complex data loading logic)

**Add**:
```javascript
// Load data when component mounts
useEffect(() => {
  persistence.loadData();
}, [persistence.loadData]);
```

### Step 9: Replace JSX - Hero Section

**Location**: Inside return statement, after ScrollView starts (around line 2161)

**Remove**: Lines 2162-2198 (LinearGradient hero section)

**Add**:
```javascript
<HeroSection t={t} />
```

### Step 10: Replace JSX - Progress Card

**Location**: After HeroSection (around line 2200)

**Keep** the progress overview card as-is (uses validation.totalCompletionPercent)

**Modify** to use `formState.totalCompletionPercent`:
```javascript
<View style={styles.progressStep, formState.totalCompletionPercent >= 25 && ...}>
```

### Step 11: Replace JSX - Passport Section

**Location**: Around line 2280

**Remove**: Lines 2280-2389 (entire CollapsibleSection for passport)

**Add**:
```javascript
<PassportSection
  t={t}
  isExpanded={formState.expandedSection === 'passport'}
  onToggle={() => formState.setExpandedSection(
    formState.expandedSection === 'passport' ? null : 'passport'
  )}
  fieldCount={validation.getFieldCount('passport')}
  // Form state
  surname={formState.surname}
  middleName={formState.middleName}
  givenName={formState.givenName}
  nationality={formState.nationality}
  passportNo={formState.passportNo}
  visaNumber={formState.visaNumber}
  dob={formState.dob}
  expiryDate={formState.expiryDate}
  sex={formState.sex}
  // Setters
  setSurname={formState.setSurname}
  setMiddleName={formState.setMiddleName}
  setGivenName={formState.setGivenName}
  setNationality={formState.setNationality}
  setPassportNo={formState.setPassportNo}
  setVisaNumber={formState.setVisaNumber}
  setDob={formState.setDob}
  setExpiryDate={formState.setExpiryDate}
  setSex={formState.setSex}
  // Validation
  errors={formState.errors}
  warnings={formState.warnings}
  handleFieldBlur={validation.handleFieldBlur}
  lastEditedField={formState.lastEditedField}
  // Actions
  debouncedSaveData={persistence.debouncedSaveData}
  saveDataToSecureStorageWithOverride={saveDataToSecureStorageWithOverride}
  setLastEditedAt={formState.setLastEditedAt}
  // Styles
  styles={styles}
/>
```

### Step 12: Replace JSX - Personal Info Section

**Location**: Around line 2391

**Remove**: Lines 2391-2510

**Add**:
```javascript
<PersonalInfoSection
  t={t}
  isExpanded={formState.expandedSection === 'personal'}
  onToggle={() => formState.setExpandedSection(
    formState.expandedSection === 'personal' ? null : 'personal'
  )}
  fieldCount={validation.getFieldCount('personal')}
  // Form state
  occupation={formState.occupation}
  customOccupation={formState.customOccupation}
  cityOfResidence={formState.cityOfResidence}
  residentCountry={formState.residentCountry}
  phoneCode={formState.phoneCode}
  phoneNumber={formState.phoneNumber}
  email={formState.email}
  // Computed values
  cityOfResidenceLabel={formState.cityOfResidenceLabel}
  cityOfResidenceHelpText={formState.cityOfResidenceHelpText}
  cityOfResidencePlaceholder={formState.cityOfResidencePlaceholder}
  // Setters
  setOccupation={formState.setOccupation}
  setCustomOccupation={formState.setCustomOccupation}
  setCityOfResidence={formState.setCityOfResidence}
  setResidentCountry={formState.setResidentCountry}
  setPhoneCode={formState.setPhoneCode}
  setPhoneNumber={formState.setPhoneNumber}
  setEmail={formState.setEmail}
  // Validation
  errors={formState.errors}
  warnings={formState.warnings}
  handleFieldBlur={validation.handleFieldBlur}
  lastEditedField={formState.lastEditedField}
  // Actions
  debouncedSaveData={persistence.debouncedSaveData}
  // Styles
  styles={styles}
/>
```

### Step 13: Replace JSX - Funds Section

**Location**: Around line 2512

**Remove**: Lines 2512-2631

**Add**:
```javascript
<FundsSection
  t={t}
  isExpanded={formState.expandedSection === 'funds'}
  onToggle={() => formState.setExpandedSection(
    formState.expandedSection === 'funds' ? null : 'funds'
  )}
  fieldCount={validation.getFieldCount('funds')}
  // Form state
  funds={formState.funds}
  // Actions
  addFund={addFund}
  handleFundItemPress={handleFundItemPress}
  // Styles
  styles={styles}
/>
```

### Step 14: Replace JSX - Travel Details Section

**Location**: Around line 2633

**Remove**: Lines 2633-3030 (large travel section)

**Add**:
```javascript
<TravelDetailsSection
  t={t}
  isExpanded={formState.expandedSection === 'travel'}
  onToggle={() => formState.setExpandedSection(
    formState.expandedSection === 'travel' ? null : 'travel'
  )}
  fieldCount={validation.getFieldCount('travel')}
  // Form state - Travel purpose
  travelPurpose={formState.travelPurpose}
  customTravelPurpose={formState.customTravelPurpose}
  recentStayCountry={formState.recentStayCountry}
  boardingCountry={formState.boardingCountry}
  // Form state - Arrival
  arrivalFlightNumber={formState.arrivalFlightNumber}
  arrivalArrivalDate={formState.arrivalArrivalDate}
  flightTicketPhoto={formState.flightTicketPhoto}
  // Form state - Departure
  departureFlightNumber={formState.departureFlightNumber}
  departureDepartureDate={formState.departureDepartureDate}
  // Form state - Accommodation
  isTransitPassenger={formState.isTransitPassenger}
  accommodationType={formState.accommodationType}
  customAccommodationType={formState.customAccommodationType}
  province={formState.province}
  district={formState.district}
  districtId={formState.districtId}
  subDistrict={formState.subDistrict}
  subDistrictId={formState.subDistrictId}
  postalCode={formState.postalCode}
  hotelAddress={formState.hotelAddress}
  hotelReservationPhoto={formState.hotelReservationPhoto}
  // Setters
  setTravelPurpose={formState.setTravelPurpose}
  setCustomTravelPurpose={formState.setCustomTravelPurpose}
  setRecentStayCountry={formState.setRecentStayCountry}
  setBoardingCountry={formState.setBoardingCountry}
  setArrivalFlightNumber={formState.setArrivalFlightNumber}
  setArrivalArrivalDate={formState.setArrivalArrivalDate}
  setDepartureFlightNumber={formState.setDepartureFlightNumber}
  setDepartureDepartureDate={formState.setDepartureDepartureDate}
  setIsTransitPassenger={formState.setIsTransitPassenger}
  setAccommodationType={formState.setAccommodationType}
  setCustomAccommodationType={formState.setCustomAccommodationType}
  setProvince={formState.setProvince}
  setDistrict={formState.setDistrict}
  setDistrictId={formState.setDistrictId}
  setSubDistrict={formState.setSubDistrict}
  setSubDistrictId={formState.setSubDistrictId}
  setPostalCode={formState.setPostalCode}
  setHotelAddress={formState.setHotelAddress}
  // Validation
  errors={formState.errors}
  warnings={formState.warnings}
  handleFieldBlur={validation.handleFieldBlur}
  lastEditedField={formState.lastEditedField}
  // Actions
  debouncedSaveData={persistence.debouncedSaveData}
  saveDataToSecureStorageWithOverride={saveDataToSecureStorageWithOverride}
  setLastEditedAt={formState.setLastEditedAt}
  handleProvinceSelect={handleProvinceSelect}
  handleDistrictSelect={handleDistrictSelect}
  handleSubDistrictSelect={handleSubDistrictSelect}
  handleFlightTicketPhotoUpload={handleFlightTicketPhotoUpload}
  handleHotelReservationPhotoUpload={handleHotelReservationPhotoUpload}
  // Styles
  styles={styles}
/>
```

### Step 15: Keep Fund Modal

**Location**: After all sections, before closing ScrollView

**Keep**: FundItemDetailModal as-is (lines 3032-3050)

### Step 16: Testing Checklist

After integration, test these features:

- [ ] Form loads with saved data
- [ ] All fields are editable
- [ ] Validation works on blur
- [ ] Errors and warnings display correctly
- [ ] Collapsible sections work
- [ ] Progress tracking updates
- [ ] Save status indicator works
- [ ] Photo uploads work
- [ ] Fund items CRUD works
- [ ] Province/district/sub-district selection works
- [ ] Transit passenger checkbox works
- [ ] Navigation works (back and continue)
- [ ] Session state persists (scroll position, expanded section)

## Expected Results

### Before Integration
- File size: 3,930 lines
- useState calls: 57
- Complexity: Very high

### After Integration
- File size: ~800-1,000 lines (75% reduction)
- useState calls: 0 (all in hooks)
- Complexity: Much lower
- Maintainability: Much higher

## Rollback Plan

If integration fails:
1. `git checkout ThailandTravelInfoScreen.js` (restore from git)
2. Or copy from `ThailandTravelInfoScreen.original.js` (backup)

## Notes

- **Do incrementally**: Test after each major step
- **Watch console**: Check for errors after each change
- **Test thoroughly**: Use the testing checklist
- **Commit often**: Commit after each successful step

## Next Phase (Phase 4)

After successful integration:
1. Extract styles to separate file
2. Move `performSaveOperation` to service
3. Further optimize TravelDetailsSection (split into sub-components)
4. Add comprehensive tests

## Questions?

If you encounter issues:
1. Check the original file backup
2. Review console errors carefully
3. Verify all imports are correct
4. Ensure props are passed correctly to components
5. Test one section at a time
