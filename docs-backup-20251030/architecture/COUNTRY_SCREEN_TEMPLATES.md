# Country Screen Templates Architecture

## Overview

This document describes the templating system for creating country-specific screens with minimal code duplication. The goal is to allow adding a new country with just configuration, not code.

## Problem Statement

Currently, each country requires implementing 3+ screens from scratch:
- **ThailandTravelInfoScreen**: 569 lines, complex hooks and state management
- **ThailandEntryFlowScreen**: 1196 lines, status tracking and completion
- Similar complexity for Malaysia, Singapore, etc.

**Pain points:**
- 90% of code is identical across countries
- Only differences: country metadata, validation rules, location hierarchy
- Adding a new country requires copying 1500+ lines of code
- Bug fixes must be replicated across all countries

## Solution: Template Components

Extract common patterns into reusable templates with "slots" for country-specific content.

---

## Architecture: Compound Component Pattern

### Template 1: `TravelInfoScreenTemplate`

**Purpose**: Form screen for collecting travel information

**Structure:**
```jsx
<TravelInfoScreenTemplate
  config={vietnamConfig}
  passport={passport}
  destination={destination}
>
  <TravelInfoScreenTemplate.Header />
  <TravelInfoScreenTemplate.HeroSection />
  <TravelInfoScreenTemplate.StatusIndicator />
  <TravelInfoScreenTemplate.PrivacyNotice />

  <TravelInfoScreenTemplate.Section name="passport">
    {/* Country can customize fields */}
    <PassportFields />
  </TravelInfoScreenTemplate.Section>

  <TravelInfoScreenTemplate.Section name="personal">
    <PersonalInfoFields />
  </TravelInfoScreenTemplate.Section>

  <TravelInfoScreenTemplate.Section name="funds">
    <FundsFields />
  </TravelInfoScreenTemplate.Section>

  <TravelInfoScreenTemplate.Section name="travel">
    <TravelDetailsFields />
  </TravelInfoScreenTemplate.Section>

  <TravelInfoScreenTemplate.SubmitButton />
</TravelInfoScreenTemplate>
```

**What's templatized:**
- ✅ Header with back button + title
- ✅ Save status indicator (pending, saving, saved, error)
- ✅ Section collapsing/expanding logic
- ✅ Field count badges
- ✅ Scroll position tracking
- ✅ Auto-save with debouncing
- ✅ Form validation framework
- ✅ Data persistence hooks
- ✅ Loading states
- ✅ Smart button (enabled/disabled based on validation)

**What's configurable:**
- 🎨 Country metadata (flag, name, colors)
- 🎨 Validation rules (via config)
- 🎨 Field definitions (passport, personal, travel sections)
- 🎨 Location hierarchy (2-level vs 3-level)
- 🎨 i18n keys

---

### Template 2: `EntryFlowScreenTemplate`

**Purpose**: Status dashboard showing entry preparation progress

**Structure:**
```jsx
<EntryFlowScreenTemplate
  config={vietnamConfig}
  passport={passport}
  destination={destination}
>
  <EntryFlowScreenTemplate.Header />
  <EntryFlowScreenTemplate.StatusBanner />
  <EntryFlowScreenTemplate.CompletionCard />

  <EntryFlowScreenTemplate.Categories>
    <EntryFlowScreenTemplate.Category name="passport" />
    <EntryFlowScreenTemplate.Category name="personal" />
    <EntryFlowScreenTemplate.Category name="funds" />
    <EntryFlowScreenTemplate.Category name="travel" />
  </EntryFlowScreenTemplate.Categories>

  <EntryFlowScreenTemplate.SubmissionCountdown />
  <EntryFlowScreenTemplate.ActionButtons />
</EntryFlowScreenTemplate>
```

**What's templatized:**
- ✅ Completion percentage calculation
- ✅ Category status (complete/incomplete/in-progress)
- ✅ Field counting per category
- ✅ Submission window countdown
- ✅ Data change detection
- ✅ Refresh on focus
- ✅ Loading/refreshing states

**What's configurable:**
- 🎨 Submission window rules (e.g., 72 hours for Thailand)
- 🎨 Category definitions
- 🎨 Completion criteria
- 🎨 Action buttons (Submit TDAC, Continue editing, etc.)

---

### Template 3: `InfoScreenTemplate` & `RequirementsScreenTemplate`

**Purpose**: Static information screens (already mostly consistent)

**Structure:**
```jsx
<InfoScreenTemplate config={vietnamConfig}>
  <InfoScreenTemplate.Header />
  <InfoScreenTemplate.Hero flag="🇻🇳" />
  <InfoScreenTemplate.InfoCard section="visa" />
  <InfoScreenTemplate.InfoCard section="onsite" />
  <InfoScreenTemplate.InfoCard section="appFeatures" />
  <InfoScreenTemplate.ContinueButton />
</InfoScreenTemplate>
```

---

## Configuration-Driven Approach

### Country Config Structure

```javascript
// app/config/destinations/vietnam/travelInfoConfig.js
export const vietnamTravelInfoConfig = {
  // Metadata
  destinationId: 'vn',
  flag: '🇻🇳',
  name: 'Vietnam',

  // Sections to display
  sections: {
    passport: {
      enabled: true,
      fields: ['surname', 'givenName', 'passportNo', 'nationality', 'dob', 'expiryDate', 'sex'],
      icon: '📘',
      titleKey: 'vietnam.travelInfo.sections.passport.title',
    },
    personal: {
      enabled: true,
      fields: ['occupation', 'cityOfResidence', 'phoneNumber', 'email'],
      icon: '👤',
      titleKey: 'vietnam.travelInfo.sections.personal.title',
    },
    funds: {
      enabled: true,
      minRequired: 1,
      icon: '💰',
      titleKey: 'vietnam.travelInfo.sections.funds.title',
    },
    travel: {
      enabled: true,
      fields: ['travelPurpose', 'arrivalFlightNumber', 'arrivalDate', 'accommodationType', 'province', 'district', 'hotelAddress'],
      icon: '✈️',
      titleKey: 'vietnam.travelInfo.sections.travel.title',

      // Location cascade config
      locationHierarchy: {
        levels: 2, // province -> district (no sub-district)
        provinceKey: 'province',
        districtKey: 'district',
      },
    },
  },

  // Validation rules
  validation: {
    passport: {
      passportNo: { required: true, pattern: /^[A-Z0-9]{5,20}$/ },
      expiryDate: { required: true, minMonthsValid: 6 },
    },
    personal: {
      email: { required: false, format: 'email' },
      phoneNumber: { required: true },
    },
    travel: {
      arrivalDate: { required: true, futureOnly: true },
      province: { required: true },
      district: { required: false },
    },
  },

  // Submission rules
  submission: {
    minCompletionPercent: 80,
    windowHours: null, // No submission window for Vietnam
  },

  // Feature flags
  features: {
    photoUpload: true,
    locationAutoComplete: true,
    multiLanguage: true,
  },
};
```

---

## Implementation Plan

### Phase 1: Create Base Templates (Priority: HIGH)
1. **`TravelInfoScreenTemplate.js`** - Extract common logic from ThailandTravelInfoScreen
2. **`EntryFlowScreenTemplate.js`** - Extract common logic from ThailandEntryFlowScreen
3. **Shared hooks:**
   - `useFormState(config)` - Generic form state management
   - `useDataPersistence(config)` - Generic data saving/loading
   - `useValidation(config)` - Config-driven validation
   - `useLocationCascade(config)` - Dynamic location hierarchy

### Phase 2: Create Section Components (Priority: HIGH)
1. **`CollapsibleSection.js`** - Reusable collapsible section with field count
2. **`StatusIndicator.js`** - Save status (pending, saving, saved, error)
3. **`SmartButton.js`** - Button that changes based on form state
4. **`CompletionCard.js`** - Already exists, enhance for templates

### Phase 3: Refactor Existing Countries (Priority: MEDIUM)
1. Refactor ThailandTravelInfoScreen to use template
2. Refactor MalaysiaTravelInfoScreen to use template
3. Refactor Singapore screens

### Phase 4: New Country Implementation (Priority: HIGH)
1. Implement VietnamTravelInfoScreen using template (prove it works!)
2. Document process for adding new countries

---

## Example: Vietnam Using Templates

### Before (Traditional Approach): ~500 lines

```javascript
// app/screens/vietnam/VietnamTravelInfoScreen.js
import React, { useState, useEffect, ... } from 'react';
// ... 50+ lines of imports

const VietnamTravelInfoScreen = ({ navigation, route }) => {
  // 100+ lines of state declarations
  const [surname, setSurname] = useState('');
  const [givenName, setGivenName] = useState('');
  // ... 50+ more useState declarations

  // 50+ lines of useEffect for data loading
  // 100+ lines of handlers
  // 200+ lines of JSX

  return (
    <SafeAreaView>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text>Vietnam Entry Info</Text>
      </View>

      {/* Passport Section */}
      <CollapsibleSection title="Passport" isExpanded={...}>
        <Input label="Surname" value={surname} onChangeText={setSurname} />
        {/* ... 20+ fields */}
      </CollapsibleSection>

      {/* Personal Section */}
      {/* ... another 100 lines */}

      {/* Funds Section */}
      {/* ... another 100 lines */}

      {/* Travel Section */}
      {/* ... another 100 lines */}

      <Button onPress={handleSubmit}>Continue</Button>
    </SafeAreaView>
  );
};
```

### After (Template Approach): ~50 lines

```javascript
// app/screens/vietnam/VietnamTravelInfoScreen.js
import React from 'react';
import { TravelInfoScreenTemplate } from '../../templates';
import { vietnamTravelInfoConfig } from '../../config/destinations/vietnam';

const VietnamTravelInfoScreen = ({ navigation, route }) => {
  return (
    <TravelInfoScreenTemplate
      config={vietnamTravelInfoConfig}
      navigation={navigation}
      route={route}
    />
  );
};

export default VietnamTravelInfoScreen;
```

**That's it!** All logic handled by template.

---

## Benefits

### For Developers:
- ✅ Add new country in **<100 lines** vs 1500+ lines
- ✅ Bug fixes propagate to all countries automatically
- ✅ Consistent UX across all countries
- ✅ Easy to test (test template once, not every country)

### For Maintenance:
- ✅ Single source of truth for business logic
- ✅ Configuration changes don't require code changes
- ✅ Easier onboarding (understand template = understand all screens)

### For Users:
- ✅ Consistent experience across countries
- ✅ Faster development = more countries supported

---

## Trade-offs

### Pros:
- Massive code reduction (10x less code per country)
- Easier maintenance
- Consistent behavior

### Cons:
- Initial template development is complex
- Country-specific features need "escape hatches"
- Template must be generic enough for all countries

### Mitigation:
- Use render props/slots for customization
- Support `customFields` prop for country-specific fields
- Provide hooks for extending behavior

---

## Success Criteria

**Template is successful if:**
1. ✅ Adding Vietnam takes <2 hours (vs current ~2 days)
2. ✅ Vietnam screen has <100 lines of code (vs current ~500 lines)
3. ✅ Bug fix in template fixes all countries simultaneously
4. ✅ No loss of functionality compared to current implementation
5. ✅ Tests cover template, not individual country screens

---

## Next Steps

1. **Create `TravelInfoScreenTemplate` MVP** ← Start here
2. Validate with Vietnam implementation
3. Refactor Thailand to use template
4. Expand to other countries
5. Document configuration API

**Estimated effort:**
- Template creation: 3-5 days
- Vietnam validation: 1 day
- Thailand refactor: 2 days
- Documentation: 1 day
- **Total: ~1 week**

**ROI:**
- Saves 1-2 days per new country (5+ countries planned)
- Reduces maintenance burden by 70%
- **Payback in 2-3 countries**
