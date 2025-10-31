# Enhanced Configuration-Driven Template Framework

## Vision

**Goal**: Adding a new country should require ONLY a configuration file, zero custom code.

**Current State**:
- Thailand: 569 lines of screen code + 90KB of custom hooks
- Vietnam: 510 lines of screen code + manual AsyncStorage (broken)
- **Problem**: Countries need to implement data persistence, hooks, validation, field tracking themselves

**Target State**:
- New country: **~50 lines of screen code** + **1 comprehensive config file**
- **100% reduction in custom code per country**
- All complexity absorbed by the template

---

## Architecture Design

### 1. Enhanced TravelInfoScreenTemplate

The template should handle **ALL** complexity internally:

#### Template Responsibilities (BUILT-IN):

**✅ Data Persistence Layer**
- UserDataService integration (passports, personal_info, travel_info tables)
- AsyncStorage for form state recovery
- Auto-save with debouncing (configurable delay)
- Entry info initialization and completion tracking
- Field state management (user-modified vs. pre-filled)
- Scroll position restoration

**✅ Form State Management**
- Internal state for ALL common fields (passport, personal, funds, travel)
- Automatic state initialization from UserDataService
- Automatic data loading on mount
- Automatic data refresh on screen focus

**✅ Validation Engine**
- Field-level validation based on config rules
- Section completion calculation
- Required field checking
- Format validation (email, phone, passport number patterns)
- Soft warnings vs. hard errors

**✅ UI Components (Built-in)**
- `<Template.ProgressOverview />` - Auto-calculates from form state
- `<Template.RichHero />` - LinearGradient with value props (configurable)
- `<Template.BasicHero />` - Simple flag + title (configurable)
- `<Template.SaveStatusIndicator />` - Already exists
- `<Template.PrivacyNotice />` - Already exists
- `<Template.SmartSubmitButton />` - Auto-validates before navigation

**✅ Section Management**
- `<Template.PassportSection />` - Wired to template's internal state
- `<Template.PersonalInfoSection />` - Wired to template's internal state
- `<Template.FundsSection />` - Wired to template's internal state
- `<Template.TravelDetailsSection />` - Wired to template's internal state
- Auto-collapse/expand logic
- Field count calculation

**✅ Advanced Features**
- Photo upload handling (flight tickets, hotel reservations)
- Location hierarchy (2-level, 3-level based on config)
- Transit passenger logic
- Custom field types (occupation, accommodation)
- Phone code selector
- Nationality selector with search

---

### 2. Country Configuration Schema

Countries provide a **single comprehensive config file**:

```javascript
export const vietnamTravelInfoConfig = {
  // ============================================
  // BASIC METADATA
  // ============================================
  destinationId: 'vn',
  name: 'Vietnam',
  flag: '🇻🇳',

  // ============================================
  // HERO SECTION
  // ============================================
  hero: {
    type: 'rich', // 'rich' | 'basic'
    title: '越南入境准备指南',
    titleEn: 'Vietnam Entry Preparation Guide',
    subtitle: '别担心，我们来帮你！',

    // Only for type: 'rich'
    gradient: ['#1a3568', '#102347'],
    valuePropositions: [
      { icon: '⏱️', text: '3分钟完成' },
      { icon: '🔒', text: '100%隐私保护' },
      { icon: '🎯', text: '避免通关延误' },
    ],
    beginnerTip: {
      icon: '💡',
      text: '第一次过越南海关？我们会一步步教你准备所有必需文件，确保顺利通关！',
    },
  },

  // ============================================
  // SECTIONS & FIELDS
  // ============================================
  sections: {
    passport: {
      enabled: true,
      icon: '📘',
      titleKey: 'vietnam.travelInfo.sections.passport.title',
      defaultTitle: 'Passport Information',
      fields: {
        surname: { required: true, maxLength: 50 },
        middleName: { required: false, maxLength: 50 },
        givenName: { required: true, maxLength: 50 },
        passportNo: {
          required: true,
          pattern: /^[A-Z0-9]{5,20}$/,
          validationMessage: 'Invalid passport format',
        },
        nationality: { required: true },
        dob: { required: true, type: 'date' },
        expiryDate: { required: true, type: 'date', futureOnly: true },
        sex: { required: true, options: ['M', 'F'] },
        visaNumber: { required: false, maxLength: 20 },
      },
    },

    personal: {
      enabled: true,
      icon: '👤',
      titleKey: 'vietnam.travelInfo.sections.personal.title',
      defaultTitle: 'Personal Information',
      fields: {
        occupation: {
          required: true,
          type: 'select',
          options: ['student', 'business', 'tourism', 'other'],
          allowCustom: true,
        },
        cityOfResidence: { required: true, maxLength: 100 },
        countryOfResidence: { required: true, type: 'countrySelect' },
        phoneCode: { required: false, type: 'phoneCode' },
        phoneNumber: { required: false, pattern: /^\d{7,15}$/ },
        email: { required: false, format: 'email' },
      },
    },

    funds: {
      enabled: true,
      icon: '💰',
      titleKey: 'vietnam.travelInfo.sections.funds.title',
      defaultTitle: 'Proof of Funds',
      minRequired: 1,
      maxAllowed: 10,
      types: ['cash', 'card', 'travelerCheck', 'other'],
    },

    travel: {
      enabled: true,
      icon: '✈️',
      titleKey: 'vietnam.travelInfo.sections.travel.title',
      defaultTitle: 'Travel Details',
      fields: {
        travelPurpose: {
          required: true,
          type: 'select',
          options: ['tourism', 'business', 'family', 'other'],
          allowCustom: true,
        },
        recentStayCountry: { required: false },
        boardingCountry: { required: true },
        arrivalFlightNumber: { required: true, pattern: /^[A-Z0-9]{2,8}$/ },
        arrivalDate: { required: true, type: 'datetime', futureOnly: true },
        departureFlightNumber: { required: false, pattern: /^[A-Z0-9]{2,8}$/ },
        departureDate: { required: false, type: 'datetime' },
        isTransitPassenger: { required: false, type: 'boolean' },
        accommodationType: {
          required: true,
          type: 'select',
          options: ['hotel', 'hostel', 'guesthouse', 'private', 'other'],
          allowCustom: true,
        },
        // Location hierarchy
        province: { required: true, type: 'location', level: 1 },
        district: { required: true, type: 'location', level: 2 },
        hotelAddress: { required: true, maxLength: 200 },
      },

      // Location data configuration
      locationHierarchy: {
        levels: 2, // Vietnam uses province → district (2 levels)
        dataSource: 'vietnamLocations', // Import from app/data/vietnamLocations
        labels: {
          level1: { key: 'vietnam.locations.province', default: 'Province' },
          level2: { key: 'vietnam.locations.district', default: 'District' },
        },
      },

      // Photo uploads
      photoUploads: {
        flightTicket: { enabled: false },
        departureTicket: { enabled: false },
        hotelReservation: { enabled: false },
      },
    },
  },

  // ============================================
  // VALIDATION RULES
  // ============================================
  validation: {
    // Global validation settings
    validateOnBlur: true,
    showWarnings: true,

    // Completion requirements
    minCompletionPercent: 70,
    requiredSections: ['passport'],
  },

  // ============================================
  // FEATURES
  // ============================================
  features: {
    autoSave: true,
    autoSaveDelay: 1000, // ms
    progressOverview: true, // Show ProgressOverviewCard
    privacyNotice: true,
    scrollPositionRestore: true,
    fieldStateTracking: true, // Track user-modified vs. pre-filled
    offlineMode: true,
  },

  // ============================================
  // NAVIGATION
  // ============================================
  navigation: {
    previous: 'VietnamRequirements',
    next: 'VietnamEntryFlow',
    submitButtonLabel: { key: 'common.continue', default: 'Continue' },
  },

  // ============================================
  // STYLING
  // ============================================
  colors: {
    background: '#F9FAFB',
    primary: '#2196F3',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
  },
};
```

---

### 3. Country Implementation (ULTRA-SIMPLIFIED)

With the enhanced template, Vietnam screen becomes **~50 lines**:

```javascript
import React from 'react';
import { TravelInfoScreenTemplate } from '../../templates';
import { vietnamTravelInfoConfig } from '../../config/destinations/vietnam/travelInfoConfig';

const VietnamTravelInfoScreen = ({ navigation, route }) => {
  return (
    <TravelInfoScreenTemplate
      config={vietnamTravelInfoConfig}
      route={route}
      navigation={navigation}
    >
      {/* That's it! Everything else is handled by the template */}
    </TravelInfoScreenTemplate>
  );
};

export default VietnamTravelInfoScreen;
```

**The template automatically renders**:
- Header with back button
- Hero section (rich or basic based on config)
- Privacy notice (if enabled in config)
- Progress overview card (if enabled in config)
- Passport section (all fields from config)
- Personal section (all fields from config)
- Funds section (if enabled in config)
- Travel section (all fields from config)
- Smart submit button (validates based on config rules)

**The template automatically handles**:
- Loading data from UserDataService
- Saving to database (passports, personal_info, travel_info tables)
- Field validation based on config rules
- Auto-save with debouncing
- Section collapse/expand
- Field count calculation
- Progress percentage
- Form state management
- Scroll position
- Photo uploads (if enabled)
- Location hierarchy (2-level or 3-level)

---

### 4. Implementation Plan

#### Phase 1: Create Enhanced Template Core (Priority 1)

**File**: `app/templates/EnhancedTravelInfoTemplate.js` (~1500 lines)

**Includes**:
- Internal hooks (form state, persistence, validation)
- UserDataService integration
- All UI components (sections, hero, progress)
- Configuration parser
- Smart rendering engine

#### Phase 2: Create Configuration Schema & Parser (Priority 2)

**File**: `app/templates/core/ConfigurationSchema.js`

**Includes**:
- JSON schema for validation
- Config parser
- Default value provider
- Config validator

#### Phase 3: Migrate Vietnam to Enhanced Template (Priority 3)

**Changes**:
- Update `vietnamTravelInfoConfig.js` to comprehensive format
- Simplify `VietnamTravelInfoScreen.js` to ~50 lines
- Remove manual AsyncStorage code
- Remove manual state management
- Test end-to-end

#### Phase 4: Documentation & Examples (Priority 4)

**Files**:
- `docs/guides/ADD_NEW_COUNTRY.md` - Step-by-step guide
- `docs/examples/PhilippinesExample.js` - Complete example for Philippines
- `docs/CONFIG_SCHEMA_REFERENCE.md` - Complete config options

#### Phase 5: Migrate Thailand (Priority 5)

**Changes**:
- Create comprehensive `thailandTravelInfoConfig.js`
- Simplify `ThailandTravelInfoScreen.js` from 569 → ~50 lines
- Remove 5 custom hooks (90KB)
- Validate all features still work

---

## Benefits

### Before (Current)
| Aspect | Lines of Code | Custom Files | Time to Add Country |
|--------|--------------|--------------|---------------------|
| Screen | 500-600 lines | 1 screen file | 2-3 days |
| Hooks | 90KB (5 files) | 5 hook files | 3-4 days |
| Config | 200 lines | 1 config file | 1 day |
| Testing | - | - | 2 days |
| **Total** | **~3000 lines** | **7 files** | **8-10 days** |

### After (Enhanced Template)
| Aspect | Lines of Code | Custom Files | Time to Add Country |
|--------|--------------|--------------|---------------------|
| Screen | ~50 lines | 1 screen file | 30 minutes |
| Hooks | 0 (in template) | 0 files | 0 minutes |
| Config | 300 lines | 1 config file | 2-3 hours |
| Testing | - | - | 2 hours |
| **Total** | **~350 lines** | **2 files** | **4-6 hours** |

### ROI
- **88% code reduction** per country
- **95% time reduction** per country
- **71% fewer files** per country
- **Single source of truth** for all logic (template)
- **Maintenance**: Fix once in template, all countries benefit

---

## Technical Challenges & Solutions

### Challenge 1: Field State Management
**Solution**: Template maintains internal state object with all common fields, dynamically creates state based on config.

### Challenge 2: Location Hierarchy Variations
**Solution**: Config specifies levels (2 or 3) and data source, template renders appropriate cascade selectors.

### Challenge 3: Custom Fields
**Solution**: Config allows `allowCustom: true` for fields, template renders conditional input.

### Challenge 4: Photo Uploads
**Solution**: Config specifies which photo types are enabled, template renders upload buttons conditionally.

### Challenge 5: Validation Complexity
**Solution**: Template includes validation engine that parses config rules and applies them automatically.

### Challenge 6: Performance with Large Config
**Solution**: Config parsing happens once on mount, memoized for re-renders.

---

## Success Criteria

1. ✅ Vietnam screen reduced from 510 → ~50 lines
2. ✅ No custom hooks required per country
3. ✅ Full UserDataService integration automatic
4. ✅ Data saves to proper database tables
5. ✅ Entry info completion tracking automatic
6. ✅ All sections render based on config
7. ✅ Validation works based on config rules
8. ✅ New country can be added in 4-6 hours
9. ✅ Philippines can be added using only config
10. ✅ Thailand can be migrated to enhanced template

---

## Next Steps

**Immediate Actions**:
1. Get approval for this architecture
2. Create `EnhancedTravelInfoTemplate.js` with full functionality
3. Create comprehensive `vietnamTravelInfoConfig.js`
4. Refactor Vietnam to use enhanced template (proof-of-concept)
5. Test end-to-end with database persistence
6. Document the approach
7. Plan Thailand migration

**Timeline**: 2-3 days for complete enhanced template system
**Risk**: Medium (significant refactoring but clear benefits)
**Impact**: High (100x easier to add new countries)
