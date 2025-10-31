# Thailand-Based Enhanced Template Framework

## Vision: Thailand is the Gold Standard

**Principle**: Thailand is our most sophisticated, production-proven implementation. The enhanced template should replicate Thailand's architecture and make it reusable via configuration.

**Thailand's Current Architecture**:
- Screen: 569 lines
- Custom hooks: 2,318 lines (5 hooks)
- Total: **2,887 lines of custom code**

**Target**: Reduce to ~50 lines + 1 config file by absorbing Thailand's patterns into template

---

## Thailand's Architecture Analysis

### What Thailand Has (Our Model)

**1. Custom Hooks (2,318 lines)**
```
useThailandFormState.js       (342 lines)  - Manages 57+ state fields
useThailandValidation.js      (441 lines)  - Field validation, errors, warnings
useThailandDataPersistence.js (1,147 lines)- UserDataService integration, auto-save
useThailandLocationCascade.js (168 lines)  - Province→District→SubDistrict logic
useThailandFundManagement.js  (150 lines)  - Funds CRUD operations
useThailandPrimaryButton.js   (124 lines)  - Smart button config
```

**2. UI Components Thailand Uses**
```javascript
// Section components (thailand-specific)
<HeroSection t={t} />                          // LinearGradient with value props
<PassportSection {...57 props} />              // From thailand/sections
<PersonalInfoSection {...48 props} />          // From thailand/sections
<FundsSection {...props} />                    // From thailand/sections
<TravelDetailsSection {...72 props} />         // From thailand/sections

// UI elements
<SaveStatusIndicator />                        // ⏳💾✅❌ inline status
<LastEditedTimestamp />                        // Last edited: HH:MM:SS
<PrivacyNotice />                              // 💾 Data stored locally
<SmartSubmitButton />                          // Dynamic label based on completion
<FundItemDetailModal />                        // Modal for fund CRUD
```

**3. Advanced Features Thailand Has**
- ✅ UserDataService integration (proper DB persistence)
- ✅ Field state tracking (user-modified vs. pre-filled)
- ✅ Auto-save with debouncing (2 seconds)
- ✅ Immediate save for critical fields (dates)
- ✅ Scroll position restoration
- ✅ Navigation with auto-save
- ✅ Photo uploads (flight ticket, departure ticket, hotel reservation)
- ✅ Location hierarchy (3-level: province→district→subDistrict)
- ✅ Soft validation (warnings vs. errors)
- ✅ Smart defaults (tomorrow for arrival, next week for departure)
- ✅ Session state management
- ✅ Data migration (legacy → new format)
- ✅ Performance monitoring
- ✅ Error handling with retry
- ✅ Field interaction tracking

**4. What Thailand Does NOT Have**
- ❌ ProgressOverviewCard (drops this component)
- ❌ Config-driven approach (hardcoded logic)

---

## Revised Enhanced Template Design

### Core Principle
**Absorb ALL of Thailand's 2,318 lines of hook logic into the template, make it config-driven**

### Template Internal Architecture

```javascript
// app/templates/EnhancedTravelInfoTemplate.js (~2000 lines)

const EnhancedTravelInfoTemplate = ({ config, route, navigation, children }) => {
  // ============================================
  // INTERNAL HOOKS (absorbed from Thailand)
  // ============================================

  // 1. Form State (replaces useThailandFormState)
  const formState = useTemplateFormState(config, route);

  // 2. Data Persistence (replaces useThailandDataPersistence)
  const persistence = useTemplateDataPersistence(config, formState, route);

  // 3. Validation (replaces useThailandValidation)
  const validation = useTemplateValidation(config, formState, persistence);

  // 4. Location Cascade (replaces useThailandLocationCascade)
  const locationCascade = useTemplateLocationCascade(config, formState);

  // 5. Fund Management (replaces useThailandFundManagement)
  const fundManagement = useTemplateFundManagement(config, formState, persistence);

  // ============================================
  // AUTOMATIC RENDERING
  // ============================================

  if (children) {
    // Custom render mode (for advanced users)
    return (
      <TemplateContext.Provider value={{...formState, ...persistence, ...validation}}>
        {children}
      </TemplateContext.Provider>
    );
  }

  // Default auto-render mode (for new countries)
  return (
    <SafeAreaView>
      <ScrollView ref={persistence.scrollViewRef}>
        {/* Auto-render based on config */}
        {renderHeroSection(config)}
        {renderSaveStatus(formState)}
        {renderLastEdited(formState)}
        {renderPrivacyNotice(config)}
        {renderSections(config, formState, persistence, validation)}
        {renderSmartButton(config, validation, persistence)}
      </ScrollView>
      {renderFundModal(formState, fundManagement)}
    </SafeAreaView>
  );
};

// ============================================
// SUB-COMPONENTS (Thailand-style)
// ============================================

EnhancedTravelInfoTemplate.HeroSection = ({ type, gradient, valueProps, tip }) => {
  // Renders Thailand-style LinearGradient hero
};

EnhancedTravelInfoTemplate.PassportSection = () => {
  // Automatically wired to template's internal state
  const { formState, persistence, validation } = useTemplateContext();
  return <PassportSection {...autoWiredProps} />;
};

EnhancedTravelInfoTemplate.PersonalInfoSection = () => {
  // Automatically wired to template's internal state
};

EnhancedTravelInfoTemplate.FundsSection = () => {
  // Automatically wired to template's internal state
};

EnhancedTravelInfoTemplate.TravelDetailsSection = () => {
  // Automatically wired to template's internal state
};

EnhancedTravelInfoTemplate.SaveStatusIndicator = () => {
  // Thailand-style inline status
};

EnhancedTravelInfoTemplate.SmartSubmitButton = () => {
  // Thailand-style dynamic button
};
```

---

## Configuration Schema (Thailand as Model)

Countries provide comprehensive config modeled after Thailand:

```javascript
// app/config/destinations/thailand/travelInfoConfig.js

export const thailandTravelInfoConfig = {
  // ============================================
  // BASIC METADATA
  // ============================================
  destinationId: 'th',
  name: 'Thailand',
  flag: '🇹🇭',

  // ============================================
  // HERO SECTION (Thailand-style)
  // ============================================
  hero: {
    type: 'rich', // Render Thailand-style LinearGradient hero
    title: '泰国入境准备指南',
    titleEn: 'Thailand Entry Preparation Guide',
    subtitle: '别担心，我们来帮你！',
    gradient: {
      colors: ['#1a3568', '#102347'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    valuePropositions: [
      { icon: '⏱️', text: '3分钟完成' },
      { icon: '🔒', text: '100%隐私保护' },
      { icon: '🎯', text: '避免通关延误' },
    ],
    beginnerTip: {
      icon: '💡',
      text: '第一次过泰国海关？我们会一步步教你准备所有必需文件，确保顺利通关！',
    },
  },

  // ============================================
  // SECTIONS & FIELDS (all 57+ fields)
  // ============================================
  sections: {
    passport: {
      enabled: true,
      icon: '📘',
      component: 'thailand', // Use Thailand-specific PassportSection
      titleKey: 'thailand.travelInfo.sections.passport.title',
      defaultTitle: 'Passport Information',
      fields: {
        surname: {
          required: true,
          maxLength: 50,
          immediateSave: false,
        },
        middleName: { required: false, maxLength: 50 },
        givenName: { required: true, maxLength: 50 },
        passportNo: {
          required: true,
          pattern: /^[A-Z0-9]{5,20}$/,
          validationMessage: 'Invalid passport format',
        },
        nationality: { required: true },
        dob: {
          required: true,
          type: 'date',
          immediateSave: true, // Save immediately without debounce
        },
        expiryDate: {
          required: true,
          type: 'date',
          futureOnly: true,
          immediateSave: true,
        },
        sex: {
          required: true,
          type: 'select',
          options: ['M', 'F'],
          immediateSave: true, // Save on change
        },
        visaNumber: { required: false, maxLength: 20 },
      },
    },

    personal: {
      enabled: true,
      icon: '👤',
      component: 'thailand',
      titleKey: 'thailand.travelInfo.sections.personal.title',
      defaultTitle: 'Personal Information',
      fields: {
        occupation: {
          required: true,
          type: 'select',
          options: ['STUDENT', 'BUSINESS', 'RETIRED', 'OTHER'],
          allowCustom: true,
          customFieldName: 'customOccupation',
        },
        cityOfResidence: {
          required: true,
          maxLength: 100,
          // Special handling for China provinces
          autoCorrect: {
            when: { residentCountry: 'CHN' },
            type: 'chinaProvince',
          },
        },
        residentCountry: { required: true, type: 'countrySelect' },
        phoneCode: {
          required: false,
          type: 'phoneCode',
          smartDefault: 'fromNationality', // Auto-fill from nationality
        },
        phoneNumber: { required: false, pattern: /^\d{7,15}$/ },
        email: { required: false, format: 'email' },
      },
    },

    funds: {
      enabled: true,
      icon: '💰',
      component: 'thailand',
      titleKey: 'thailand.travelInfo.sections.funds.title',
      defaultTitle: 'Proof of Funds',
      minRequired: 1,
      maxAllowed: 10,
      types: ['CASH_THB', 'CASH_USD', 'CASH_CNY', 'CARD', 'TRAVELER_CHECK', 'OTHER'],
      modal: {
        enabled: true,
        component: 'FundItemDetailModal',
      },
    },

    travel: {
      enabled: true,
      icon: '✈️',
      component: 'thailand',
      titleKey: 'thailand.travelInfo.sections.travel.title',
      defaultTitle: 'Travel Details',
      fields: {
        travelPurpose: {
          required: true,
          type: 'select',
          options: ['HOLIDAY', 'BUSINESS', 'FAMILY_VISIT', 'EDUCATION', 'MEDICAL', 'OTHER'],
          allowCustom: true,
          customFieldName: 'customTravelPurpose',
          smartDefault: 'HOLIDAY',
        },
        recentStayCountry: {
          required: false,
          immediateSave: true,
        },
        boardingCountry: {
          required: true,
          smartDefault: 'fromNationality', // Auto-fill from nationality
        },
        arrivalFlightNumber: {
          required: true,
          pattern: /^[A-Z0-9]{2,8}$/,
        },
        arrivalArrivalDate: {
          required: true,
          type: 'datetime',
          futureOnly: true,
          immediateSave: true,
          smartDefault: 'tomorrow',
        },
        departureFlightNumber: { required: false, pattern: /^[A-Z0-9]{2,8}$/ },
        departureDepartureDate: {
          required: false,
          type: 'datetime',
          immediateSave: true,
          smartDefault: 'nextWeek',
        },
        isTransitPassenger: {
          required: false,
          type: 'boolean',
          default: false,
        },
        accommodationType: {
          required: true,
          type: 'select',
          options: ['HOTEL', 'HOSTEL', 'GUESTHOUSE', 'PRIVATE_RESIDENCE', 'OTHER'],
          allowCustom: true,
          customFieldName: 'customAccommodationType',
          smartDefault: 'HOTEL',
        },

        // Location hierarchy (Thailand-specific: 3-level)
        province: {
          required: true,
          type: 'location',
          level: 1,
        },
        district: {
          required: true,
          type: 'location',
          level: 2,
        },
        subDistrict: {
          required: true,
          type: 'location',
          level: 3,
        },
        postalCode: {
          required: false,
          pattern: /^\d{5}$/,
        },
        hotelAddress: { required: true, maxLength: 200 },
      },

      // Location data configuration
      locationHierarchy: {
        levels: 3, // Thailand uses 3-level
        dataSource: 'thailandLocations', // Import from app/data/thailandLocations
        labels: {
          level1: { key: 'thailand.locations.province', default: 'Province' },
          level2: { key: 'thailand.locations.district', default: 'District' },
          level3: { key: 'thailand.locations.subDistrict', default: 'Sub-District' },
        },
        getLevel2: 'getDistricts', // Function name in data source
        getLevel3: 'getSubDistricts',
      },

      // Photo uploads (Thailand-specific)
      photoUploads: {
        flightTicket: {
          enabled: true,
          fieldName: 'flightTicketPhoto',
          labelKey: 'thailand.travelInfo.photoUpload.flightTicket',
        },
        departureTicket: {
          enabled: true,
          fieldName: 'departureFlightTicketPhoto',
          labelKey: 'thailand.travelInfo.photoUpload.departureTicket',
        },
        hotelReservation: {
          enabled: true,
          fieldName: 'hotelReservationPhoto',
          labelKey: 'thailand.travelInfo.photoUpload.hotelReservation',
        },
      },
    },
  },

  // ============================================
  // VALIDATION RULES
  // ============================================
  validation: {
    mode: 'thailand', // Use Thailand-specific validation rules
    validateOnBlur: true,
    showWarnings: true, // Soft warnings vs hard errors

    // Completion requirements
    minCompletionPercent: 70,
    requiredSections: ['passport', 'travel'],

    // Custom validation rules
    customRules: {
      cityOfResidence: {
        when: { residentCountry: 'CHN' },
        validator: 'chinaProvinceValidator',
      },
    },
  },

  // ============================================
  // FEATURES (Thailand-style)
  // ============================================
  features: {
    // Data persistence
    autoSave: true,
    autoSaveDelay: 2000, // 2 seconds (Thailand's setting)
    immediateSaveFields: ['dob', 'expiryDate', 'arrivalArrivalDate', 'departureDepartureDate', 'recentStayCountry', 'sex'],

    // UI features
    saveStatusIndicator: true, // ⏳💾✅❌
    lastEditedTimestamp: true,
    privacyNotice: true,

    // Advanced features
    scrollPositionRestore: true,
    fieldStateTracking: true, // Track user-modified vs. pre-filled
    sessionStateManagement: true,
    performanceMonitoring: true,
    errorHandlingWithRetry: true,

    // Smart features
    smartDefaults: true, // Auto-fill common fields
    smartButton: true, // Dynamic button based on completion

    // Data migration
    dataMigration: {
      enabled: true,
      legacyFormats: ['v1', 'v2'],
    },
  },

  // ============================================
  // NAVIGATION
  // ============================================
  navigation: {
    previous: 'ThailandRequirements',
    next: 'ThailandEntryFlow',
    saveBeforeNavigate: true, // Auto-save before navigation
    submitButtonLabel: {
      key: 'thailand.travelInfo.submitButton',
      default: 'Continue',
      dynamic: true, // Change based on completion
    },
  },

  // ============================================
  // STYLING (Thailand colors)
  // ============================================
  colors: {
    background: '#F9FAFB',
    primary: '#2196F3',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    heroGradientStart: '#1a3568',
    heroGradientEnd: '#102347',
  },

  // ============================================
  // DATA MODELS
  // ============================================
  dataModels: {
    passport: 'Passport',
    personalInfo: 'PersonalInfo',
    travelInfo: 'EntryData',
    entryInfo: 'EntryInfo',
  },

  // ============================================
  // USER INTERACTION TRACKING
  // ============================================
  tracking: {
    enabled: true,
    trackFieldModifications: true,
    trackScrollPosition: true,
    trackTimeSpent: true,
  },
};
```

---

## Country Implementation (Simplified)

### Mode 1: Auto-Render (Recommended for New Countries)

```javascript
// app/screens/vietnam/VietnamTravelInfoScreen.js (~10 lines!)

import React from 'react';
import { EnhancedTravelInfoTemplate } from '../../templates';
import { vietnamTravelInfoConfig } from '../../config/destinations/vietnam/travelInfoConfig';

const VietnamTravelInfoScreen = ({ navigation, route }) => {
  return (
    <EnhancedTravelInfoTemplate
      config={vietnamTravelInfoConfig}
      route={route}
      navigation={navigation}
      // That's it! Template auto-renders everything
    />
  );
};

export default VietnamTravelInfoScreen;
```

**Template automatically**:
- Loads data from UserDataService
- Saves to database (passports, personal_info, travel_info)
- Renders Thailand-style hero section
- Renders all sections with proper state management
- Handles validation
- Handles auto-save
- Handles photo uploads
- Handles location hierarchy
- Renders smart submit button
- Shows save status indicator

### Mode 2: Custom Render (For Thailand - Maintain Full Control)

```javascript
// app/screens/thailand/ThailandTravelInfoScreen.js (~100 lines)

import React from 'react';
import { EnhancedTravelInfoTemplate } from '../../templates';
import { thailandTravelInfoConfig } from '../../config/destinations/thailand/travelInfoConfig';
import { HeroSection, PassportSection, PersonalInfoSection, FundsSection, TravelDetailsSection } from '../../components/thailand/sections';

const ThailandTravelInfoScreen = ({ navigation, route }) => {
  return (
    <EnhancedTravelInfoTemplate
      config={thailandTravelInfoConfig}
      route={route}
      navigation={navigation}
    >
      {({ formState, persistence, validation, locationCascade, fundManagement }) => (
        <ScrollView ref={persistence.scrollViewRef}>
          {/* Custom Thailand render */}
          <HeroSection t={t} />

          <EnhancedTravelInfoTemplate.SaveStatusIndicator />
          <EnhancedTravelInfoTemplate.LastEditedTimestamp />
          <EnhancedTravelInfoTemplate.PrivacyNotice />

          <PassportSection
            // All 57 props automatically available from template context
            {...formState.passportFields}
            {...validation.passportValidation}
            {...persistence.passportPersistence}
          />

          <PersonalInfoSection {...autoProps} />
          <FundsSection {...autoProps} />
          <TravelDetailsSection {...autoProps} />

          <EnhancedTravelInfoTemplate.SmartSubmitButton />
        </ScrollView>
      )}
    </EnhancedTravelInfoTemplate>
  );
};

export default ThailandTravelInfoScreen;
```

---

## Benefits & ROI

### Before (Current State)
| Country | Screen Code | Custom Hooks | Config | Total | Time |
|---------|------------|--------------|--------|-------|------|
| Thailand | 569 lines | 2,318 lines | 0 | **2,887 lines** | 10 days |
| Vietnam | 510 lines | 0 (broken) | 200 | **710 lines** | 5 days |
| New Country | 500 lines | 2,000 lines | 200 | **2,700 lines** | 8-10 days |

### After (Enhanced Template)
| Country | Screen Code | Custom Hooks | Config | Total | Time |
|---------|------------|--------------|--------|-------|------|
| Thailand | 100 lines | 0 (in template) | 500 | **600 lines** | - |
| Vietnam | 10 lines | 0 (in template) | 400 | **410 lines** | - |
| New Country | 10 lines | 0 (in template) | 400 | **410 lines** | **4-6 hours** |

### ROI Summary
- **Code reduction**: 85% (2,700 → 410 lines per country)
- **Time reduction**: 95% (8-10 days → 4-6 hours)
- **Thailand hooks**: Absorbed into template, reusable for all countries
- **Maintenance**: Fix once in template, all countries benefit
- **New countries**: Just config + 10 lines of code

---

## Implementation Plan

### Phase 1: Build Enhanced Template Core (~3 days)

**File**: `app/templates/EnhancedTravelInfoTemplate.js` (~2,500 lines)

**Tasks**:
1. Port useThailandFormState → useTemplateFormState (config-driven)
2. Port useThailandDataPersistence → useTemplateDataPersistence (config-driven)
3. Port useThailandValidation → useTemplateValidation (config-driven)
4. Port useThailandLocationCascade → useTemplateLocationCascade (config-driven)
5. Port useThailandFundManagement → useTemplateFundManagement (config-driven)
6. Create auto-render engine
7. Create template context
8. Create sub-components (HeroSection, SaveStatus, SmartButton, etc.)

### Phase 2: Create Thailand Config (~4 hours)

**File**: `app/config/destinations/thailand/travelInfoConfig.js` (~500 lines)

**Tasks**:
1. Define all 57+ fields from Thailand
2. Define all validation rules
3. Define all features
4. Define hero section config
5. Define location hierarchy config
6. Define photo upload config

### Phase 3: Test Thailand with Config (~2 hours)

**Tasks**:
1. Switch Thailand to use EnhancedTravelInfoTemplate
2. Verify all features work
3. Verify data persistence
4. Verify validation
5. Verify auto-save
6. Verify photo uploads

### Phase 4: Migrate Vietnam (~2 hours)

**Tasks**:
1. Create comprehensive vietnamTravelInfoConfig.js
2. Simplify VietnamTravelInfoScreen.js to 10 lines
3. Test end-to-end
4. Verify data saves to database (not AsyncStorage)

### Phase 5: Documentation (~4 hours)

**Files**:
- `docs/guides/ADD_NEW_COUNTRY_THAILAND_WAY.md`
- `docs/CONFIG_SCHEMA_REFERENCE.md`
- `docs/examples/PhilippinesExample.js`

**Total Timeline**: 4-5 days

---

## Success Criteria

1. ✅ Thailand migrated to template with full feature parity
2. ✅ Thailand screen reduced from 2,887 → ~600 lines
3. ✅ Vietnam screen reduced from 710 → ~410 lines
4. ✅ Vietnam saves to database properly (not AsyncStorage)
5. ✅ All Thailand features work: auto-save, validation, photos, locations
6. ✅ New country (Philippines) can be added in 4-6 hours
7. ✅ No ProgressOverviewCard (following Thailand model)
8. ✅ Thailand-style hero with LinearGradient
9. ✅ Save status indicator like Thailand
10. ✅ Smart submit button like Thailand

---

## Key Differences from Previous Proposal

| Aspect | Previous (WRONG) | Revised (THAILAND-BASED) |
|--------|------------------|--------------------------|
| **Model** | Generic template | **Thailand as gold standard** |
| **ProgressOverviewCard** | ✅ Included | **❌ Dropped (Thailand doesn't use it)** |
| **HeroSection** | Basic | **Rich LinearGradient (like Thailand)** |
| **Hooks** | Minimal | **Full 2,318 lines absorbed from Thailand** |
| **Features** | Basic | **All Thailand features (57+)** |
| **Save** | AsyncStorage | **UserDataService (like Thailand)** |
| **Validation** | Simple | **Thailand-style soft validation** |
| **Smart Defaults** | None | **Thailand-style smart defaults** |
| **Photo Uploads** | Optional | **Thailand-style photo uploads** |
| **Location** | 2-level | **Supports 2-level or 3-level (like Thailand)** |

---

## Next Steps

**Awaiting your approval to**:
1. Build `EnhancedTravelInfoTemplate.js` based on Thailand's patterns
2. Create comprehensive `thailandTravelInfoConfig.js`
3. Test Thailand migration first (proof-of-concept)
4. Then migrate Vietnam with proper database persistence
5. Document the approach for adding new countries

**This approach follows Thailand's architecture exactly, just makes it config-driven.**
