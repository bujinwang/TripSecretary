# Thailand to Template V2 Migration Plan

## Goal
Absorb ALL 2,318 lines of Thailand's hook logic into the template, making it fully config-driven so new countries require minimal code.

---

## Thailand's Current Architecture (Gold Standard)

### Hook Breakdown (2,318 lines total)

#### 1. useThailandFormState.js (342 lines)
**What it does**:
- Manages 57+ state fields (passport, personal, funds, travel, UI state)
- Smart defaults (tomorrow, next week, from nationality)
- Memoization for performance
- Initial state setup from route params

**What to port to template**:
- ✅ Dynamic state creation from config (DONE in V1)
- ⏳ Smart defaults based on config (PARTIAL in V1)
- ⏳ UI state management (expandedSection, errors, warnings, saveStatus, lastEditedField, lastEditedAt)
- ⏳ Scroll position state
- ⏳ Modal state (fundItemModalVisible, selectedFundItem, currentFundItem)
- ⏳ Data model state (passportData, personalInfoData, entryData, entryInfoId)

#### 2. useThailandDataPersistence.js (1,147 lines)
**What it does**:
- UserDataService initialization
- Data loading from multiple tables (passport, personal_info, funds, travel_info)
- Data saving with field state tracking
- Fund item management (refreshFundItems, CRUD operations)
- Entry info initialization
- Photo upload handling (flight ticket, departure ticket, hotel reservation)
- Session state management (save/load scroll position, field states)
- Navigation with auto-save
- Data migration from legacy formats
- Debounced save (2 seconds)
- Immediate save for critical fields

**What to port to template**:
- ✅ Basic data loading (DONE in V1)
- ✅ Basic data saving (DONE in V1)
- ✅ Debounced save (DONE in V1)
- ⏳ Field state tracking (user-modified vs pre-filled)
- ⏳ User interaction tracker integration
- ⏳ Fund item CRUD operations
- ⏳ Photo upload handling
- ⏳ Session state management
- ⏳ Entry info initialization
- ⏳ Scroll position save/restore
- ⏳ Navigation with auto-save wrapper
- ⏳ Immediate save for critical fields
- ⏳ Error handling with detailed logging

#### 3. useThailandValidation.js (441 lines)
**What it does**:
- Field blur validation
- Error and warning state management
- Field-specific validation rules (ThailandValidationRules)
- China province auto-correction
- Field count calculation
- Completion metrics calculation
- Smart button configuration (dynamic label)
- Form validity checking
- User interaction tracking integration
- Field highlight animation (last edited field)
- Immediate save for valid fields

**What to port to template**:
- ⏳ Validation engine (parse config rules, apply validation)
- ⏳ Error/warning state management
- ⏳ Field blur handler with validation
- ⏳ Smart validation (warnings vs errors)
- ⏳ Country-specific validation (e.g., China province)
- ⏳ Field count calculation (PARTIAL in V1)
- ⏳ Completion metrics
- ⏳ Smart button config
- ⏳ Form validity check
- ⏳ Last edited field tracking with highlight

#### 4. useThailandLocationCascade.js (168 lines)
**What it does**:
- Province selection handler
- District selection handler (depends on province)
- SubDistrict selection handler (depends on district)
- Postal code auto-fill based on subDistrict
- Field blur handling after selection
- Auto-save after selection

**What to port to template**:
- ✅ Province selection (DONE in V1)
- ✅ District selection (DONE in V1)
- ⏳ SubDistrict selection (for 3-level hierarchies)
- ⏳ Postal code auto-fill
- ⏳ Integration with validation (field blur)

#### 5. useThailandFundManagement.js (150 lines)
**What it does**:
- Add fund handler (opens modal)
- Fund item press handler (edit existing)
- Fund item update handler
- Fund item create handler
- Fund item delete handler
- Modal open/close management
- State management for modal (currentFundItem, newFundItemType)

**What to port to template**:
- ⏳ Fund CRUD operations
- ⏳ Modal state management
- ⏳ Fund item handlers (add, edit, delete)
- ⏳ Integration with data persistence

---

## Additional Thailand Features (Not in Hooks)

### 1. User Interaction Tracker
**Location**: `app/utils/UserInteractionTracker.js`
**What it does**:
- Tracks which fields user has modified
- Marks fields as user-modified vs pre-filled
- Provides `isFieldUserModified()` and `markFieldAsModified()` methods
- Used by FieldStateManager to decide what to save

**What to port**:
- ⏳ User interaction tracking system
- ⏳ Field modification state
- ⏳ Integration with save logic

### 2. Field State Manager
**Location**: `app/utils/FieldStateManager.js`
**What it does**:
- `filterSaveableFields()` - Only save user-modified fields
- Prevents overwriting user data with pre-filled defaults
- Handles `alwaysSaveFields` for fields that should always save

**What to port**:
- ⏳ Field state filtering logic
- ⏳ Smart save (only user-modified fields)
- ⏳ Always-save field exceptions

### 3. Validation System
**Location**: `app/utils/thailand/ThailandValidationRules.js`
**What it does**:
- Country-specific validation rules
- Pattern validation (passport, phone, email, flight number)
- Date validation (futureOnly, pastOnly)
- Conditional validation (based on other fields)
- Warnings vs errors (soft validation)

**What to port**:
- ⏳ Config-driven validation engine
- ⏳ Parse validation rules from config
- ⏳ Apply validation on blur
- ⏳ Support warnings and errors

### 4. Debounced Save Utility
**Location**: Uses setTimeout/clearTimeout pattern
**What it does**:
- Debounces save to avoid excessive DB writes
- Configurable delay (Thailand uses 2 seconds)
- Status tracking (pending, saving, saved, error)

**Status**:
- ✅ DONE in V1

### 5. Error Handler
**Location**: `app/utils/ErrorHandler.js`
**What it does**:
- Centralized error handling
- Error severity levels
- Retry logic
- User-friendly error messages

**What to port**:
- ⏳ Error handling with retry
- ⏳ Error severity levels
- ⏳ User-friendly error messages

---

## V2 Template Architecture

### Internal Hooks (To Be Built)

```javascript
// app/templates/EnhancedTravelInfoTemplate.v2.js

const EnhancedTravelInfoTemplate = ({ config, route, navigation }) => {
  // 1. Form State Hook (replaces useThailandFormState)
  const formState = useTemplateFormState(config, route);

  // 2. User Interaction Tracker (replaces UserInteractionTracker)
  const userInteractionTracker = useTemplateUserInteractionTracker(config);

  // 3. Data Persistence Hook (replaces useThailandDataPersistence)
  const persistence = useTemplateDataPersistence({
    config,
    formState,
    route,
    navigation,
    userInteractionTracker,
  });

  // 4. Validation Hook (replaces useThailandValidation)
  const validation = useTemplateValidation({
    config,
    formState,
    persistence,
    userInteractionTracker,
  });

  // 5. Location Cascade Hook (replaces useThailandLocationCascade)
  const locationCascade = useTemplateLocationCascade({
    config,
    formState,
    persistence,
    validation,
  });

  // 6. Fund Management Hook (replaces useThailandFundManagement)
  const fundManagement = useTemplateFundManagement({
    config,
    formState,
    persistence,
  });

  // Auto-render UI based on config
  return <AutoRenderedUI />;
};
```

### Hook Responsibilities

#### useTemplateFormState
- Dynamic state creation from config
- Smart defaults (tomorrow, nextWeek, fromNationality)
- UI state (expandedSections, errors, warnings, saveStatus)
- Modal state (fundItemModalVisible, selectedFundItem)
- Scroll position state
- Last edited field state

#### useTemplateUserInteractionTracker
- Track field modifications
- Distinguish user-modified vs pre-filled
- `markFieldAsModified(fieldName, value)`
- `isFieldUserModified(fieldName)`
- `getFieldInteractionDetails(fieldName)`

#### useTemplateDataPersistence
- UserDataService initialization
- Data loading (passport, personal, funds, travel)
- Data saving with field state filtering
- Debounced save (configurable delay)
- Immediate save for critical fields (from config)
- Fund item refresh
- Entry info initialization
- Photo upload handlers
- Session state save/restore
- Scroll position save/restore
- Navigation with auto-save wrapper
- Error handling with retry

#### useTemplateValidation
- Parse validation rules from config
- Field blur handler with validation
- Apply pattern validation (regex)
- Apply date validation (futureOnly, pastOnly, minMonthsValid)
- Apply format validation (email, phone)
- Country-specific validation (e.g., China province auto-correction)
- Error/warning state management
- Field count calculation
- Completion metrics calculation
- Smart button config (dynamic label)
- Form validity check
- Last edited field tracking with highlight

#### useTemplateLocationCascade
- Province selection handler
- District selection handler
- SubDistrict selection handler (for 3-level)
- Postal code auto-fill
- Integration with validation (field blur)
- Integration with persistence (auto-save)

#### useTemplateFundManagement
- Fund modal state management
- Add fund handler
- Edit fund handler
- Delete fund handler
- Update fund handler
- Create fund handler
- Integration with persistence

---

## Config Schema Expansion

### Validation Rules
```javascript
validation: {
  rules: {
    passportNo: {
      required: true,
      pattern: /^[A-Z0-9]{5,20}$/,
      message: 'Invalid passport format',
    },
    dob: {
      required: true,
      type: 'date',
      pastOnly: true,
    },
    expiryDate: {
      required: true,
      type: 'date',
      futureOnly: true,
      minMonthsValid: 6,
    },
    email: {
      required: false,
      format: 'email',
      warning: true, // Soft validation (warning, not error)
    },
    cityOfResidence: {
      autoCorrect: {
        when: { countryOfResidence: 'CHN' },
        type: 'chinaProvince',
      },
    },
  },
}
```

### Field State Tracking
```javascript
features: {
  fieldStateTracking: {
    enabled: true,
    trackUserModified: true,
    onlySaveModified: true, // Only save user-modified fields
    alwaysSaveFields: ['dob', 'expiryDate', 'sex'], // Exception fields
  },
}
```

### Immediate Save Fields
```javascript
features: {
  autoSave: {
    enabled: true,
    delay: 2000, // 2 seconds
    immediateSaveFields: ['dob', 'expiryDate', 'sex', 'arrivalArrivalDate', 'departureDepartureDate', 'recentStayCountry'],
  },
}
```

### Photo Uploads
```javascript
sections: {
  travel: {
    photoUploads: {
      flightTicket: {
        enabled: true,
        fieldName: 'flightTicketPhoto',
        labelKey: 'thailand.travelInfo.photoUpload.flightTicket',
      },
      departureTicket: {
        enabled: true,
        fieldName: 'departureFlightTicketPhoto',
      },
      hotelReservation: {
        enabled: true,
        fieldName: 'hotelReservationPhoto',
      },
    },
  },
}
```

### Smart Button
```javascript
navigation: {
  submitButton: {
    dynamic: true, // Enable smart button
    labels: {
      incomplete: '完成必填项 - Complete Required Fields',
      almostDone: '还差一点 - Almost Done',
      ready: '继续 - Continue',
    },
    thresholds: {
      incomplete: 0.7, // < 70% completion
      almostDone: 0.9, // 70-90% completion
      ready: 0.9, // >= 90% completion
    },
  },
}
```

---

## Implementation Plan

### Phase 1: Build V2 Internal Hooks (2-3 days)
1. Create `useTemplateFormState` - Expand V1 version
2. Create `useTemplateUserInteractionTracker` - Port from Thailand
3. Expand `useTemplateDataPersistence` - Add all Thailand features
4. Create `useTemplateValidation` - Port from Thailand
5. Expand `useTemplateLocationCascade` - Add SubDistrict support
6. Create `useTemplateFundManagement` - Port from Thailand

### Phase 2: Test V2 with Vietnam (1 day)
1. Update Vietnam config with validation rules
2. Test all sections
3. Verify field state tracking
4. Verify validation works
5. Verify smart button works
6. Verify photo uploads work (if enabled)

### Phase 3: Create Thailand Config (1 day)
1. Port all Thailand fields to config
2. Port all Thailand validation rules
3. Port all Thailand features
4. Test Thailand with V2 template

### Phase 4: Migrate Thailand Screen (0.5 day)
1. Replace Thailand screen with V2 template
2. Remove 5 custom hooks (2,318 lines)
3. Test full feature parity

---

## Success Criteria

1. ✅ Vietnam works with V2 template (proper validation)
2. ✅ Thailand works with V2 template (full feature parity)
3. ✅ Thailand screen reduced from 2,887 → ~50 lines (98% reduction)
4. ✅ New country can be added with just config + 10 lines
5. ✅ All Thailand features available:
   - Field state tracking
   - User interaction tracking
   - Validation with warnings
   - Smart button
   - Photo uploads
   - Session state management
   - Error handling with retry
   - China province auto-correction
   - Immediate save for critical fields
   - Fund modal management
   - Location cascade (2 or 3 levels)

---

## Estimated Code Reduction

| Country | Before | After V2 | Reduction |
|---------|--------|----------|-----------|
| **Thailand** | 2,887 lines | ~50 lines | **98.3%** |
| **Vietnam** | 710 lines | ~50 lines | **93.0%** |
| **New Country** | ~2,700 lines | ~50 lines | **98.1%** |

**Template Size**: ~3,000 lines (reusable across ALL countries)

**ROI**: After 2 countries, template pays for itself. Each additional country is nearly free.

---

## Next Steps

1. Build V2 template with all Thailand features
2. Test with Vietnam
3. Create Thailand config
4. Migrate Thailand to V2
5. Document approach for adding new countries
