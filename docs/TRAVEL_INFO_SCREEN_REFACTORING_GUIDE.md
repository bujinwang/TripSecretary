# Travel Info Screen Refactoring Methodology

## Overview

This guide documents the systematic approach for refactoring large Travel Info screens (e.g., Thailand, Malaysia, Singapore) from monolithic components into maintainable, well-architected React Native applications.

**Reference Implementation**: ThailandTravelInfoScreen
- **Original**: 3,930 lines (monolithic)
- **Final**: 2,274 lines (-42%)
- **Extracted**: ~3,000 lines into organized, reusable modules

## Why Refactor?

### Problems with Monolithic Screens
- **Massive file sizes** (3,000-4,000+ lines)
- **57+ individual useState calls** scattered throughout
- **Complex data loading logic** (200-300 lines of useEffect code)
- **Inline JSX bloat** (500-800 lines of form fields)
- **Inline styles** (500-800 lines of StyleSheet definitions)
- **Difficult to maintain, test, and debug**
- **Poor developer experience** (hard to locate specific functionality)

### Benefits of Refactoring
- ✅ **Separation of concerns** (logic, UI, styles)
- ✅ **Single Responsibility Principle**
- ✅ **Reusable custom hooks**
- ✅ **Focused, testable components**
- ✅ **Easier to locate and modify specific functionality**
- ✅ **Better code organization and readability**
- ✅ **Improved developer experience**

---

## The 5-Phase Refactoring Approach

### Phase 1: Custom Hooks Extraction

**Goal**: Extract all stateful logic into reusable custom hooks.

#### Create Three Core Hooks:

##### 1. `useCountryFormState.js` (~380 lines)
**Purpose**: Consolidate all useState declarations into a single hook.

```javascript
// Before: 57+ individual useState calls scattered in component
const [surname, setSurname] = useState('');
const [givenNames, setGivenNames] = useState('');
const [passportNumber, setPassportNumber] = useState('');
// ... 54 more useState calls

// After: Single hook with consolidated state
const formState = useThailandFormState(passport);
// Returns object with all state and setters:
// {
//   surname, setSurname,
//   givenNames, setGivenNames,
//   passportNumber, setPassportNumber,
//   // ... all other state and setters
// }
```

**Implementation Steps**:
1. Identify all useState declarations in the screen
2. Group them by category (passport, personal info, travel, funds, etc.)
3. Create the hook file: `app/hooks/[country]/useCountryFormState.js`
4. Move all useState declarations into the hook
5. Return an object with all state variables and setters
6. Accept initial values from props (e.g., passport data)

**Example Structure**:
```javascript
import { useState, useCallback } from 'react';

export const useThailandFormState = (passport) => {
  // Passport section state
  const [surname, setSurname] = useState(passport?.surname || '');
  const [givenNames, setGivenNames] = useState(passport?.givenNames || '');
  const [passportNumber, setPassportNumber] = useState(passport?.passportNumber || '');
  // ... more passport fields

  // Personal info section state
  const [occupation, setOccupation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  // ... more personal info fields

  // Travel details section state
  const [travelPurpose, setTravelPurpose] = useState('');
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  // ... more travel fields

  // Funds section state
  const [fundItems, setFundItems] = useState([]);
  // ... more fund fields

  // UI state
  const [expandedSection, setExpandedSection] = useState(null);
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [lastEditedField, setLastEditedField] = useState(null);

  // Return all state and setters
  return {
    // Passport section
    surname, setSurname,
    givenNames, setGivenNames,
    passportNumber, setPassportNumber,
    // ... all other getters and setters

    // Helper methods can also be included
    resetForm: useCallback(() => {
      setSurname('');
      setGivenNames('');
      // ... reset all fields
    }, []),
  };
};
```

##### 2. `useCountryDataPersistence.js` (~475 lines)
**Purpose**: Handle all data loading, saving, and persistence logic.

```javascript
// Before: 240 lines of complex useEffect for data loading
useEffect(() => {
  const loadData = async () => {
    try {
      // 240 lines of data loading logic
      // - Load from UserDataService
      // - Restore session state
      // - Handle funds data
      // - Initialize entry info
      // - Complex error handling
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };
  loadData();
}, [passport, destination, userId]);

// After: 4 lines calling hook's loadData()
const persistence = useThailandDataPersistence({
  passport, destination, userId, formState,
  userInteractionTracker, navigation
});

useEffect(() => {
  persistence.loadData();
}, [persistence.loadData]);
```

**Responsibilities**:
- Load data from UserDataService on mount
- Restore session state from AsyncStorage
- Save data to backend with debouncing
- Handle auto-save functionality
- Manage retry logic for failed saves
- Provide data refresh methods

**Example Structure**:
```javascript
import { useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserDataService from '../../services/data/UserDataService';

export const useThailandDataPersistence = ({
  passport,
  destination,
  userId,
  formState,
  userInteractionTracker,
  navigation,
}) => {
  const saveTimeoutRef = useRef(null);

  // Main data loading function
  const loadData = useCallback(async () => {
    try {
      // 1. Load from UserDataService
      const travelInfoData = await UserDataService.loadTravelInfoByPassportAndDestination(
        passport.id,
        destination.id
      );

      if (travelInfoData) {
        // Populate formState with loaded data
        formState.setSurname(travelInfoData.surname || '');
        formState.setGivenNames(travelInfoData.givenNames || '');
        // ... set all other fields
      }

      // 2. Restore session state
      const sessionStateJson = await AsyncStorage.getItem(
        `thailand_session_${passport.id}_${destination.id}`
      );
      if (sessionStateJson) {
        const sessionState = JSON.parse(sessionStateJson);
        // Restore session-specific state
      }

      // 3. Load funds data
      await refreshFundItems();

      // 4. Initialize entry info
      await initializeEntryInfo();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [passport, destination, userId, formState]);

  // Save data to backend
  const saveDataToSecureStorage = useCallback(async (overrides = {}) => {
    try {
      const dataToSave = {
        surname: formState.surname,
        givenNames: formState.givenNames,
        // ... all form fields
        ...overrides,
      };

      await UserDataService.saveTravelInfo({
        passportId: passport.id,
        destinationId: destination.id,
        data: dataToSave,
      });

      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  }, [passport, destination, formState]);

  // Debounced save (auto-save on user input)
  const debouncedSaveData = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveDataToSecureStorage();
    }, 1000); // 1 second debounce
  }, [saveDataToSecureStorage]);

  // Refresh fund items from backend
  const refreshFundItems = useCallback(async () => {
    // Load fund items from UserDataService
    const funds = await UserDataService.loadFundsByPassport(passport.id);
    formState.setFundItems(funds || []);
  }, [passport.id, formState]);

  // Initialize entry info
  const initializeEntryInfo = useCallback(async () => {
    // Initialize entry-specific data
  }, []);

  return {
    loadData,
    saveDataToSecureStorage,
    debouncedSaveData,
    refreshFundItems,
    initializeEntryInfo,
  };
};
```

##### 3. `useCountryValidation.js` (~370 lines)
**Purpose**: Handle all validation, completion tracking, and field blur logic.

**Responsibilities**:
- Validate individual fields on blur
- Track completion metrics (field counts, percentages)
- Manage errors and warnings state
- Provide form validity checking
- Handle user interaction tracking

**Example Structure**:
```javascript
import { useCallback, useMemo } from 'react';

export const useThailandValidation = ({
  formState,
  userInteractionTracker,
  saveDataToSecureStorageWithOverride,
  debouncedSaveData,
}) => {
  // Validate individual field
  const validateField = useCallback((fieldName, value) => {
    const newErrors = { ...formState.errors };
    const newWarnings = { ...formState.warnings };

    // Field-specific validation
    switch (fieldName) {
      case 'surname':
        if (!value || value.trim() === '') {
          newErrors.surname = '姓氏不能为空';
        } else {
          delete newErrors.surname;
        }
        break;

      case 'passportNumber':
        if (!value || value.trim() === '') {
          newErrors.passportNumber = '护照号码不能为空';
        } else if (!/^[A-Z0-9]{5,20}$/.test(value)) {
          newWarnings.passportNumber = '请检查护照号码格式';
        } else {
          delete newErrors.passportNumber;
          delete newWarnings.passportNumber;
        }
        break;

      // ... more field validations
    }

    formState.setErrors(newErrors);
    formState.setWarnings(newWarnings);

    return Object.keys(newErrors).length === 0;
  }, [formState]);

  // Handle field blur
  const handleFieldBlur = useCallback((fieldName, value) => {
    // Validate the field
    validateField(fieldName, value);

    // Track user interaction
    userInteractionTracker.trackFieldEdit(fieldName);

    // Mark last edited field for UI highlighting
    formState.setLastEditedField(fieldName);
    setTimeout(() => formState.setLastEditedField(null), 2000);

    // Auto-save
    debouncedSaveData();
  }, [validateField, userInteractionTracker, formState, debouncedSaveData]);

  // Handle user interaction (for fields that don't blur)
  const handleUserInteraction = useCallback((fieldName) => {
    userInteractionTracker.trackFieldEdit(fieldName);
    debouncedSaveData();
  }, [userInteractionTracker, debouncedSaveData]);

  // Get field count for a section
  const getFieldCount = useCallback((section) => {
    const fieldMapping = {
      passport: ['surname', 'givenNames', 'passportNumber', 'dateOfBirth', 'nationality', 'gender'],
      personal: ['occupation', 'phoneNumber', 'email', 'emergencyContact'],
      travel: ['travelPurpose', 'arrivalFlightNumber', 'arrivalArrivalDate', 'accommodationType', 'hotelAddress'],
      funds: ['fundItems'],
    };

    const fields = fieldMapping[section] || [];
    const filledCount = fields.filter(field => {
      const value = formState[field];
      if (Array.isArray(value)) return value.length > 0;
      return value && value !== '';
    }).length;

    return { total: fields.length, filled: filledCount };
  }, [formState]);

  // Calculate completion metrics
  const calculateCompletionMetrics = useCallback(() => {
    const sections = ['passport', 'personal', 'travel', 'funds'];
    let totalFields = 0;
    let filledFields = 0;

    sections.forEach(section => {
      const { total, filled } = getFieldCount(section);
      totalFields += total;
      filledFields += filled;
    });

    const percentage = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

    return {
      totalFields,
      filledFields,
      percentage,
      isComplete: percentage === 100,
    };
  }, [getFieldCount]);

  // Check if form is valid for submission
  const isFormValid = useMemo(() => {
    return Object.keys(formState.errors).length === 0;
  }, [formState.errors]);

  return {
    validateField,
    handleFieldBlur,
    handleUserInteraction,
    getFieldCount,
    calculateCompletionMetrics,
    isFormValid,
  };
};
```

---

### Phase 2: Section Components Extraction

**Goal**: Extract large inline JSX sections into focused, reusable components.

#### Identify Sections

Typical sections in Travel Info screens:
1. **HeroSection** - Header with country info, progress, navigation
2. **PassportSection** - Passport information form
3. **PersonalInfoSection** - Personal details (occupation, contact)
4. **FundsSection** - Proof of funds management
5. **TravelDetailsSection** - Flight, accommodation, travel purpose

#### Create Section Components

**Example: PassportSection.js**

```javascript
import React from 'react';
import { View, Text } from 'react-native';
import CollapsibleSection from '../../common/CollapsibleSection';
import InputWithValidation from '../../common/InputWithValidation';
import DateTimeInput from '../../common/DateTimeInput';
import NationalitySelector from '../../common/NationalitySelector';
import GenderSelector from '../../common/GenderSelector';

const PassportSection = ({
  // Expanded state
  isExpanded,
  onToggle,

  // Form state
  surname,
  givenNames,
  passportNumber,
  dateOfBirth,
  nationality,
  gender,

  // Setters
  setSurname,
  setGivenNames,
  setPassportNumber,
  setDateOfBirth,
  setNationality,
  setGender,

  // Validation
  errors,
  warnings,
  handleFieldBlur,
  lastEditedField,

  // Styles
  styles,

  // i18n
  t,
}) => {
  return (
    <CollapsibleSection
      title="📘 护照信息"
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <InputWithValidation
        label="姓氏"
        value={surname}
        onChangeText={setSurname}
        onBlur={() => handleFieldBlur('surname', surname)}
        error={errors.surname}
        warning={warnings.surname}
        isLastEdited={lastEditedField === 'surname'}
        placeholder="请输入姓氏"
        styles={styles}
      />

      <InputWithValidation
        label="名字"
        value={givenNames}
        onChangeText={setGivenNames}
        onBlur={() => handleFieldBlur('givenNames', givenNames)}
        error={errors.givenNames}
        warning={warnings.givenNames}
        isLastEdited={lastEditedField === 'givenNames'}
        placeholder="请输入名字"
        styles={styles}
      />

      <InputWithValidation
        label="护照号码"
        value={passportNumber}
        onChangeText={setPassportNumber}
        onBlur={() => handleFieldBlur('passportNumber', passportNumber)}
        error={errors.passportNumber}
        warning={warnings.passportNumber}
        isLastEdited={lastEditedField === 'passportNumber'}
        placeholder="请输入护照号码"
        styles={styles}
      />

      <DateTimeInput
        label="出生日期"
        value={dateOfBirth}
        onChange={setDateOfBirth}
        onBlur={() => handleFieldBlur('dateOfBirth', dateOfBirth)}
        error={errors.dateOfBirth}
        styles={styles}
      />

      <NationalitySelector
        label="国籍"
        value={nationality}
        onChange={setNationality}
        onBlur={() => handleFieldBlur('nationality', nationality)}
        error={errors.nationality}
        styles={styles}
      />

      <GenderSelector
        label="性别"
        value={gender}
        onChange={setGender}
        onBlur={() => handleFieldBlur('gender', gender)}
        error={errors.gender}
        styles={styles}
      />
    </CollapsibleSection>
  );
};

export default PassportSection;
```

**Key Principles**:
- **Single Responsibility**: Each section handles one logical group of fields
- **Props-based**: All data and handlers passed via props (no internal state)
- **Reusable**: Can be used in other screens or contexts
- **Testable**: Easy to test in isolation
- **Clear Interface**: Props clearly define what the component needs

---

### Phase 3: Integration & State Consolidation

**Goal**: Integrate custom hooks and section components into the main screen.

#### Phase 3a: Imports + Hook Initialization

**Step 1: Update imports**
```javascript
// Remove individual useState imports if needed
import React, { useEffect, useRef, useState } from 'react';

// Add custom hook imports
import { useThailandFormState } from '../../hooks/thailand/useThailandFormState';
import { useThailandDataPersistence } from '../../hooks/thailand/useThailandDataPersistence';
import { useThailandValidation } from '../../hooks/thailand/useThailandValidation';

// Add section component imports
import PassportSection from '../../components/thailand/sections/PassportSection';
import PersonalInfoSection from '../../components/thailand/sections/PersonalInfoSection';
import FundsSection from '../../components/thailand/sections/FundsSection';
import TravelDetailsSection from '../../components/thailand/sections/TravelDetailsSection';
```

**Step 2: Initialize hooks**
```javascript
const ThailandTravelInfoScreen = ({ route, navigation }) => {
  const { passport, destination } = route.params;

  // Initialize form state hook
  const formState = useThailandFormState(passport);

  // Initialize persistence hook
  const persistence = useThailandDataPersistence({
    passport,
    destination,
    userId,
    formState,
    userInteractionTracker,
    navigation,
  });

  // Initialize validation hook
  const validation = useThailandValidation({
    formState,
    userInteractionTracker,
    saveDataToSecureStorageWithOverride: persistence.saveDataToSecureStorage,
    debouncedSaveData: persistence.debouncedSaveData,
  });

  // Extract functions from hooks
  const {
    handleFieldBlur,
    handleUserInteraction,
    getFieldCount,
    calculateCompletionMetrics,
    isFormValid,
  } = validation;

  const {
    loadData,
    saveDataToSecureStorage: saveDataToSecureStorageWithOverride,
    debouncedSaveData,
    refreshFundItems,
    initializeEntryInfo,
  } = persistence;

  // ... rest of component
};
```

#### Phase 3b: Replace Data Loading & Update Handlers

**Step 1: Replace data loading useEffect**
```javascript
// Before: 240 lines of complex data loading logic
useEffect(() => {
  const loadData = async () => {
    try {
      // 240 lines of complex logic
    } catch (error) {
      console.error('Error:', error);
    }
  };
  loadData();
}, [passport, destination, userId]);

// After: 4 lines calling hook's loadData()
useEffect(() => {
  loadData();
}, [loadData]);
```

**Step 2: Update all setState calls to use formState**
```javascript
// Before: Individual setters
setSurname(value);
setGivenNames(value);
setPassportNumber(value);

// After: formState setters
formState.setSurname(value);
formState.setGivenNames(value);
formState.setPassportNumber(value);
```

**Step 3: Update completion metrics monitoring**
```javascript
// Before: Manual calculation logic scattered throughout
useEffect(() => {
  // Complex completion calculation
}, [surname, givenNames, passportNumber, /* ... 50+ dependencies */]);

// After: Use hook's calculateCompletionMetrics()
useEffect(() => {
  const metrics = calculateCompletionMetrics();
  setCompletionMetrics(metrics);
}, [calculateCompletionMetrics]);
```

#### Phase 3c: Replace JSX Sections

**Replace each inline section with component usage:**

```javascript
// Before: 110 lines of inline PassportSection JSX
<View style={styles.section}>
  <Text style={styles.sectionTitle}>📘 护照信息</Text>
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>姓氏</Text>
    <TextInput
      value={surname}
      onChangeText={setSurname}
      // ... 20+ more lines
    />
  </View>
  {/* ... 90+ more lines */}
</View>

// After: 37 lines using PassportSection component
<PassportSection
  t={t}
  isExpanded={expandedSection === 'passport'}
  onToggle={() => setExpandedSection(expandedSection === 'passport' ? null : 'passport')}
  surname={formState.surname}
  setSurname={formState.setSurname}
  givenNames={formState.givenNames}
  setGivenNames={formState.setGivenNames}
  passportNumber={formState.passportNumber}
  setPassportNumber={formState.setPassportNumber}
  dateOfBirth={formState.dateOfBirth}
  setDateOfBirth={formState.setDateOfBirth}
  nationality={formState.nationality}
  setNationality={formState.setNationality}
  gender={formState.gender}
  setGender={formState.setGender}
  errors={formState.errors}
  warnings={formState.warnings}
  handleFieldBlur={handleFieldBlur}
  lastEditedField={formState.lastEditedField}
  styles={styles}
/>
```

**Repeat for all sections**:
- PassportSection: ~110 lines → ~37 lines (-73 lines)
- PersonalInfoSection: ~119 lines → ~35 lines (-84 lines)
- FundsSection: ~119 lines → ~14 lines (-105 lines)
- TravelDetailsSection: ~400 lines → ~67 lines (-333 lines)

**Total JSX reduction**: ~748 lines → ~153 lines (**-595 lines, -80%**)

---

### Phase 4: Styles Extraction

**Goal**: Extract inline styles to a separate file for better organization.

#### Create Styles File

**File**: `app/screens/[country]/CountryTravelInfoScreen.styles.js`

```javascript
import { StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    backgroundColor: colors.primary,
  },

  headerTitle: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },

  scrollContent: {
    paddingHorizontal: spacing.medium,
    paddingBottom: spacing.large,
  },

  section: {
    marginVertical: spacing.small,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: typography.sizes.medium,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.small,
  },

  fieldContainer: {
    marginVertical: spacing.small,
  },

  fieldLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xsmall,
    color: colors.textSecondary,
  },

  // ... 100+ more style definitions
});

export default styles;
```

#### Update Main Screen

```javascript
// Remove inline styles from main screen file (lines 2270-3062, ~790 lines)
// Add import at top
import styles from './ThailandTravelInfoScreen.styles';

// Now all style references use imported styles
<View style={styles.container}>
  <View style={styles.header}>
    <Text style={styles.headerTitle}>Thailand Travel Info</Text>
  </View>
  {/* ... */}
</View>
```

**Result**:
- Main file: 3,064 → 2,274 lines (-790 lines)
- Styles file: 533 lines (new file)
- Better organization: styles can be modified independently

---

### Phase 5 (Optional): Break Down Large Sections

**Goal**: If any section component is still too large (>500 lines), break it down further.

**Example: TravelDetailsSection (730 lines)**

#### Identify Sub-Sections

TravelDetailsSection contains:
1. Travel Purpose (116 lines)
2. Flight Information (189 lines)
3. Accommodation (325 lines)

#### Create Sub-Components

**Create directory**: `app/components/[country]/sections/subsections/`

**1. TravelPurposeSubSection.js**
```javascript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import NationalitySelector from '../../../common/NationalitySelector';
import InputWithValidation from '../../../common/InputWithValidation';

const TravelPurposeSubSection = ({
  travelPurpose,
  customTravelPurpose,
  recentStayCountry,
  boardingCountry,
  setTravelPurpose,
  setCustomTravelPurpose,
  setRecentStayCountry,
  setBoardingCountry,
  handleFieldBlur,
  debouncedSaveData,
  styles,
}) => {
  const travelPurposeOptions = [
    { value: 'HOLIDAY', label: '度假旅游', icon: '🏖️' },
    { value: 'MEETING', label: '会议', icon: '👔' },
    { value: 'BUSINESS', label: '商务', icon: '💼' },
    // ... more options
  ];

  return (
    <>
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>为什么来泰国？</Text>
        <View style={styles.optionsContainer}>
          {travelPurposeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                travelPurpose === option.value && styles.optionButtonActive,
              ]}
              onPress={() => {
                setTravelPurpose(option.value);
                if (option.value !== 'OTHER') setCustomTravelPurpose('');
                debouncedSaveData();
              }}
            >
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <Text style={styles.optionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {travelPurpose === 'OTHER' && (
          <InputWithValidation
            label="请说明"
            value={customTravelPurpose}
            onChangeText={setCustomTravelPurpose}
            onBlur={() => handleFieldBlur('customTravelPurpose', customTravelPurpose)}
            styles={styles}
          />
        )}
      </View>

      <NationalitySelector
        label="最近30天去过哪些国家？"
        value={recentStayCountry}
        onChange={setRecentStayCountry}
        onBlur={() => handleFieldBlur('recentStayCountry', recentStayCountry)}
        styles={styles}
      />

      <NationalitySelector
        label="从哪个国家登机来泰国？"
        value={boardingCountry}
        onChange={setBoardingCountry}
        onBlur={() => handleFieldBlur('boardingCountry', boardingCountry)}
        styles={styles}
      />
    </>
  );
};

export default TravelPurposeSubSection;
```

**2. FlightInfoSubSection.js** (189 lines) - Similar structure for flight details

**3. AccommodationSubSection.js** (325 lines) - Similar structure for accommodation

**4. Create barrel export**: `subsections/index.js`
```javascript
export { default as TravelPurposeSubSection } from './TravelPurposeSubSection';
export { default as FlightInfoSubSection } from './FlightInfoSubSection';
export { default as AccommodationSubSection } from './AccommodationSubSection';
```

#### Update Parent Section

**TravelDetailsSection.js** (730 → 307 lines)
```javascript
import React from 'react';
import { View } from 'react-native';
import CollapsibleSection from '../../../common/CollapsibleSection';
import {
  TravelPurposeSubSection,
  FlightInfoSubSection,
  AccommodationSubSection,
} from './subsections';

const TravelDetailsSection = ({
  isExpanded,
  onToggle,
  // ... all props
  styles,
}) => {
  return (
    <CollapsibleSection
      title="✈️ 旅行计划"
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <TravelPurposeSubSection
        travelPurpose={travelPurpose}
        customTravelPurpose={customTravelPurpose}
        recentStayCountry={recentStayCountry}
        boardingCountry={boardingCountry}
        setTravelPurpose={setTravelPurpose}
        setCustomTravelPurpose={setCustomTravelPurpose}
        setRecentStayCountry={setRecentStayCountry}
        setBoardingCountry={setBoardingCountry}
        handleFieldBlur={handleFieldBlur}
        debouncedSaveData={debouncedSaveData}
        styles={styles}
      />

      <FlightInfoSubSection
        arrivalFlightNumber={arrivalFlightNumber}
        arrivalArrivalDate={arrivalArrivalDate}
        flightTicketPhoto={flightTicketPhoto}
        departureFlightNumber={departureFlightNumber}
        departureDepartureDate={departureDepartureDate}
        setArrivalFlightNumber={setArrivalFlightNumber}
        setArrivalArrivalDate={setArrivalArrivalDate}
        setDepartureFlightNumber={setDepartureFlightNumber}
        setDepartureDepartureDate={setDepartureDepartureDate}
        errors={errors}
        warnings={warnings}
        handleFieldBlur={handleFieldBlur}
        lastEditedField={lastEditedField}
        handleFlightTicketPhotoUpload={handleFlightTicketPhotoUpload}
        styles={styles}
      />

      <AccommodationSubSection
        isTransitPassenger={isTransitPassenger}
        accommodationType={accommodationType}
        province={province}
        district={district}
        hotelAddress={hotelAddress}
        hotelReservationPhoto={hotelReservationPhoto}
        setIsTransitPassenger={setIsTransitPassenger}
        setAccommodationType={setAccommodationType}
        setHotelAddress={setHotelAddress}
        handleProvinceSelect={handleProvinceSelect}
        handleDistrictSelect={handleDistrictSelect}
        handleHotelReservationPhotoUpload={handleHotelReservationPhotoUpload}
        errors={errors}
        warnings={warnings}
        handleFieldBlur={handleFieldBlur}
        styles={styles}
      />
    </CollapsibleSection>
  );
};

export default TravelDetailsSection;
```

**Result**:
- TravelDetailsSection: 730 → 307 lines (-423 lines)
- Total distributed: 944 lines across 4 focused files
- Better organization and easier to maintain

---

## Implementation Checklist

Use this checklist when refactoring a new country's Travel Info screen:

### Pre-Refactoring
- [ ] **Analyze the screen file**
  - [ ] Count total lines
  - [ ] Count useState declarations
  - [ ] Identify logical sections
  - [ ] Measure inline styles (line count)
  - [ ] Document current file size

### Phase 1: Custom Hooks
- [ ] **Create useCountryFormState hook**
  - [ ] Move all useState declarations
  - [ ] Group by category (passport, personal, travel, funds, UI)
  - [ ] Return object with all state and setters
  - [ ] Test hook initialization

- [ ] **Create useCountryDataPersistence hook**
  - [ ] Extract data loading logic
  - [ ] Implement loadData() method
  - [ ] Implement saveDataToSecureStorage() method
  - [ ] Implement debouncedSaveData() method
  - [ ] Add refresh methods (funds, entry info, etc.)
  - [ ] Test data loading and saving

- [ ] **Create useCountryValidation hook**
  - [ ] Extract validation logic
  - [ ] Implement validateField() method
  - [ ] Implement handleFieldBlur() method
  - [ ] Implement getFieldCount() method
  - [ ] Implement calculateCompletionMetrics() method
  - [ ] Test validation flows

- [ ] **Commit Phase 1**
  - [ ] Run tests
  - [ ] Verify no functionality broken
  - [ ] Commit with message: "Phase 1: Extract custom hooks for [Country]"

### Phase 2: Section Components
- [ ] **Create section components**
  - [ ] HeroSection (~130 lines)
  - [ ] PassportSection (~310 lines)
  - [ ] PersonalInfoSection (~210 lines)
  - [ ] FundsSection (~200 lines)
  - [ ] TravelDetailsSection (~300-700 lines)

- [ ] **For each section component**
  - [ ] Identify all required props
  - [ ] Extract JSX to component file
  - [ ] Pass formState and handlers via props
  - [ ] Test component in isolation

- [ ] **Commit Phase 2**
  - [ ] Run tests
  - [ ] Verify components render correctly
  - [ ] Commit with message: "Phase 2: Extract section components for [Country]"

### Phase 3: Integration
- [ ] **Phase 3a: Imports + Hook Initialization**
  - [ ] Add custom hook imports
  - [ ] Add section component imports
  - [ ] Initialize formState hook
  - [ ] Initialize persistence hook
  - [ ] Initialize validation hook
  - [ ] Extract functions from hooks
  - [ ] Test hook integration

- [ ] **Phase 3b: Replace Data Loading & Update Handlers**
  - [ ] Replace data loading useEffect with loadData()
  - [ ] Update all setState calls to use formState
  - [ ] Update completion metrics monitoring
  - [ ] Update save status monitoring
  - [ ] Update session state restoration
  - [ ] Test data flows

- [ ] **Phase 3c: Replace JSX Sections**
  - [ ] Replace PassportSection JSX with component
  - [ ] Replace PersonalInfoSection JSX with component
  - [ ] Replace FundsSection JSX with component
  - [ ] Replace TravelDetailsSection JSX with component
  - [ ] Replace HeroSection JSX with component
  - [ ] Test all sections render correctly

- [ ] **Commit Phase 3**
  - [ ] Run full app test
  - [ ] Verify all functionality works
  - [ ] Commit with message: "Phase 3: Integrate hooks and components for [Country]"

### Phase 4: Styles Extraction
- [ ] **Create styles file**
  - [ ] Create CountryTravelInfoScreen.styles.js
  - [ ] Copy all StyleSheet definitions
  - [ ] Export styles object

- [ ] **Update main screen**
  - [ ] Import styles from new file
  - [ ] Remove inline StyleSheet definitions
  - [ ] Verify all style references work

- [ ] **Commit Phase 4**
  - [ ] Run visual regression tests
  - [ ] Verify styling unchanged
  - [ ] Commit with message: "Phase 4: Extract styles to separate file for [Country]"

### Phase 5 (Optional): Break Down Large Sections
- [ ] **Identify large sections** (>500 lines)
  - [ ] Usually TravelDetailsSection is the largest

- [ ] **Create sub-components**
  - [ ] Create subsections directory
  - [ ] Extract sub-sections (e.g., TravelPurpose, FlightInfo, Accommodation)
  - [ ] Create barrel export (index.js)

- [ ] **Update parent section**
  - [ ] Import sub-components
  - [ ] Replace inline JSX with sub-component usage
  - [ ] Test parent component

- [ ] **Commit Phase 5**
  - [ ] Run tests
  - [ ] Verify all sections work
  - [ ] Commit with message: "Phase 5: Break down TravelDetailsSection for [Country]"

### Post-Refactoring
- [ ] **Final verification**
  - [ ] Run full test suite
  - [ ] Test all user interactions
  - [ ] Verify data loading and saving
  - [ ] Verify validation works
  - [ ] Check completion metrics
  - [ ] Test navigation flows

- [ ] **Documentation**
  - [ ] Update file size metrics
  - [ ] Document reduction percentages
  - [ ] Add to refactoring tracking doc

- [ ] **Push to remote**
  - [ ] Push all commits to feature branch
  - [ ] Create pull request (if applicable)

---

## File Structure After Refactoring

```
app/
├── screens/
│   └── [country]/
│       ├── CountryTravelInfoScreen.js         # Main screen (2,000-2,500 lines)
│       └── CountryTravelInfoScreen.styles.js  # Styles (500-600 lines)
├── hooks/
│   └── [country]/
│       ├── useCountryFormState.js             # Form state (~380 lines)
│       ├── useCountryDataPersistence.js       # Data loading/saving (~475 lines)
│       └── useCountryValidation.js            # Validation (~370 lines)
└── components/
    └── [country]/
        └── sections/
            ├── HeroSection.js                 # Header (~130 lines)
            ├── PassportSection.js             # Passport form (~310 lines)
            ├── PersonalInfoSection.js         # Personal info (~210 lines)
            ├── FundsSection.js                # Funds (~200 lines)
            ├── TravelDetailsSection.js        # Travel details (~307 lines)
            └── subsections/                   # (Optional Phase 5)
                ├── TravelPurposeSubSection.js # (~116 lines)
                ├── FlightInfoSubSection.js    # (~189 lines)
                ├── AccommodationSubSection.js # (~325 lines)
                └── index.js                   # Barrel export
```

---

## Expected Results

### File Size Reduction
- **Original**: 3,500-4,000 lines (monolithic)
- **Final main screen**: 2,000-2,500 lines (-40% to -45%)
- **Total extracted**: ~3,000 lines into organized modules

### Code Organization
- ✅ **3 custom hooks** (~1,225 lines of reusable logic)
- ✅ **5 section components** (~1,160 lines of focused UI)
- ✅ **1 styles file** (~530 lines of styles)
- ✅ **3 sub-components** (optional, ~630 lines)

### Developer Experience
- ✅ **Easier to navigate** - Find specific functionality quickly
- ✅ **Easier to modify** - Change one section without affecting others
- ✅ **Easier to test** - Test components and hooks in isolation
- ✅ **Better readability** - Smaller, focused files
- ✅ **Reusable code** - Hooks can be used in other screens

---

## Common Pitfalls & Solutions

### Pitfall 1: Prop Drilling Hell
**Problem**: Passing 20+ props to each section component.

**Solution**:
- Group related props into objects
- Use spread operator for common prop groups
```javascript
const validationProps = {
  errors: formState.errors,
  warnings: formState.warnings,
  handleFieldBlur,
  lastEditedField: formState.lastEditedField,
};

<PassportSection
  {...formState}
  {...validationProps}
  styles={styles}
/>
```

### Pitfall 2: Circular Dependencies
**Problem**: Hooks depending on each other's return values.

**Solution**:
- Design hooks to be independent
- Pass required functions via parameters
```javascript
// useCountryValidation needs debouncedSaveData from persistence
const validation = useThailandValidation({
  formState,
  userInteractionTracker,
  debouncedSaveData: persistence.debouncedSaveData,  // Pass as parameter
});
```

### Pitfall 3: Lost State on Refactoring
**Problem**: State gets reset or lost during refactoring.

**Solution**:
- Refactor one phase at a time
- Test thoroughly after each phase
- Commit after each successful phase
- Keep old code commented out until fully tested

### Pitfall 4: Breaking Validation Logic
**Problem**: Field validation stops working after extracting to hook.

**Solution**:
- Ensure all field names match exactly
- Pass all dependencies to validation hook
- Test validation flows thoroughly
- Add console logs to debug validation

### Pitfall 5: Performance Issues
**Problem**: Too many re-renders after introducing hooks.

**Solution**:
- Use `useCallback` for all functions
- Use `useMemo` for computed values
- Avoid creating new objects/arrays in render
```javascript
// Bad
const validationProps = {
  errors: formState.errors,  // New object every render
};

// Good
const validationProps = useMemo(() => ({
  errors: formState.errors,
}), [formState.errors]);
```

---

## Testing Strategy

### Unit Testing

**Test custom hooks**:
```javascript
import { renderHook, act } from '@testing-library/react-hooks';
import { useThailandFormState } from '../useThailandFormState';

describe('useThailandFormState', () => {
  it('should initialize with passport data', () => {
    const passport = { surname: 'Smith', givenNames: 'John' };
    const { result } = renderHook(() => useThailandFormState(passport));

    expect(result.current.surname).toBe('Smith');
    expect(result.current.givenNames).toBe('John');
  });

  it('should update surname', () => {
    const { result } = renderHook(() => useThailandFormState({}));

    act(() => {
      result.current.setSurname('Johnson');
    });

    expect(result.current.surname).toBe('Johnson');
  });
});
```

**Test section components**:
```javascript
import { render, fireEvent } from '@testing-library/react-native';
import PassportSection from '../PassportSection';

describe('PassportSection', () => {
  it('should render all fields', () => {
    const { getByPlaceholderText } = render(
      <PassportSection
        surname=""
        setSurname={jest.fn()}
        // ... other props
      />
    );

    expect(getByPlaceholderText('请输入姓氏')).toBeTruthy();
  });

  it('should call setSurname on text change', () => {
    const setSurname = jest.fn();
    const { getByPlaceholderText } = render(
      <PassportSection
        surname=""
        setSurname={setSurname}
        // ... other props
      />
    );

    fireEvent.changeText(getByPlaceholderText('请输入姓氏'), 'Smith');
    expect(setSurname).toHaveBeenCalledWith('Smith');
  });
});
```

### Integration Testing

**Test data flow**:
```javascript
import { render, waitFor } from '@testing-library/react-native';
import ThailandTravelInfoScreen from '../ThailandTravelInfoScreen';

describe('ThailandTravelInfoScreen Integration', () => {
  it('should load data on mount', async () => {
    const mockPassport = { id: 1, surname: 'Smith' };
    const mockDestination = { id: 1, name: 'Thailand' };

    const { getByDisplayValue } = render(
      <ThailandTravelInfoScreen
        route={{ params: { passport: mockPassport, destination: mockDestination } }}
        navigation={{ navigate: jest.fn() }}
      />
    );

    await waitFor(() => {
      expect(getByDisplayValue('Smith')).toBeTruthy();
    });
  });
});
```

### Manual Testing Checklist

- [ ] **Data Loading**: Screen loads data correctly on mount
- [ ] **User Input**: All fields accept and display input
- [ ] **Validation**: Errors/warnings show on blur
- [ ] **Auto-save**: Data saves after 1 second of inactivity
- [ ] **Completion Metrics**: Progress bar updates correctly
- [ ] **Navigation**: Back button works, forward navigation works
- [ ] **Photo Upload**: Image picker works, photos persist
- [ ] **Section Collapse**: Sections expand/collapse correctly
- [ ] **Error Handling**: Error messages display correctly
- [ ] **Session Restore**: Session state restores on app resume

---

## Maintenance & Best Practices

### Updating Form Fields

**To add a new field**:
1. Add state to `useCountryFormState.js`
2. Add field to relevant section component
3. Add validation to `useCountryValidation.js` (if needed)
4. Add field to save logic in `useCountryDataPersistence.js`
5. Update field count in `getFieldCount()` method

### Updating Validation Rules

**To change validation for a field**:
1. Update validation logic in `useCountryValidation.js`
2. Update error messages
3. Test validation thoroughly

### Adding New Sections

**To add a new section**:
1. Create new section component: `NewSection.js`
2. Add state for section fields to `useCountryFormState.js`
3. Add validation for section to `useCountryValidation.js`
4. Add section to main screen JSX
5. Add field count for section to `getFieldCount()`

---

## Country-Specific Adaptations

### Thailand
- **Key sections**: Passport, Personal, Travel, Funds
- **Special fields**: Transit passenger, accommodation type, boarding country
- **Data service**: `UserDataService` with Thailand-specific endpoints

### Malaysia (To Be Refactored)
- **Key sections**: Similar to Thailand
- **Special fields**: Entry point, Malaysian address
- **Data service**: `UserDataService` with Malaysia-specific endpoints

### Singapore (To Be Refactored)
- **Key sections**: Similar to Thailand
- **Special fields**: SG Arrival Card number, local contact
- **Data service**: `UserDataService` with Singapore-specific endpoints

---

## Conclusion

This refactoring methodology provides a systematic, proven approach to transforming monolithic Travel Info screens into maintainable, well-architected React Native applications.

**Key Takeaways**:
- ✅ **5-phase approach** ensures systematic refactoring
- ✅ **Custom hooks** separate logic from UI
- ✅ **Section components** improve organization and reusability
- ✅ **Styles extraction** enables independent style management
- ✅ **Sub-components** (optional) further improve organization
- ✅ **40-45% reduction** in main file size
- ✅ **Dramatically improved** maintainability and developer experience

**Next Steps**:
1. Apply this methodology to Malaysia Travel Info Screen
2. Apply this methodology to Singapore Travel Info Screen
3. Create shared components for common patterns
4. Develop automated refactoring scripts (if applicable)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-27
**Reference Implementation**: ThailandTravelInfoScreen (3,930 → 2,274 lines, -42%)
