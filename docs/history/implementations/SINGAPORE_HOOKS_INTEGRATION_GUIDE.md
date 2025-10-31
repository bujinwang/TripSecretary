# Singapore Travel Info Screen - Hooks Integration Guide

This guide demonstrates how to integrate the custom hooks into the Singapore Travel Info Screen.

## Overview

Three custom hooks have been created to refactor the Singapore Travel Info Screen:
- `useSingaporeFormState` - Manages all form state (replaces 49+ useState calls)
- `useSingaporeDataPersistence` - Handles data loading, saving, and session management
- `useSingaporeValidation` - Manages validation, completion tracking, and field interactions

## Integration Pattern

### Step 1: Update Imports

**Before:**
```javascript
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// ... many more imports
```

**After - Add Hook Imports:**
```javascript
import React, { useEffect, useMemo } from 'react'; // Reduced React imports
import {
  useSingaporeFormState,
  useSingaporeDataPersistence,
  useSingaporeValidation,
} from '../../hooks/singapore';

// Optional: Import PassportSection as example
import PassportSection from '../../components/singapore/sections/PassportSection';
```

### Step 2: Replace useState Declarations

**Before (49+ individual useState calls):**
```javascript
const SingaporeTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const { t } = useLocale();

  // Passport State
  const [passportNo, setPassportNo] = useState('');
  const [visaNumber, setVisaNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // ... 43 more useState declarations ...

  const userId = useMemo(() => passport?.id || 'user_001', [passport?.id]);
  // ... rest of component
};
```

**After (Single hook initialization):**
```javascript
const SingaporeTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const { t } = useLocale();

  // Memoize passport
  const passport = useMemo(() => {
    return UserDataService.toSerializablePassport(rawPassport);
  }, [rawPassport?.id, rawPassport?.passportNo, rawPassport?.name, rawPassport?.nameEn]);

  const userId = useMemo(() => passport?.id || 'user_001', [passport?.id]);

  // Travel info form utilities
  const travelInfoForm = useTravelInfoForm('singapore');

  // ============================================
  // INITIALIZE CUSTOM HOOKS (Replaces 49+ useState calls)
  // ============================================

  // 1. Form State Hook - Manages all form state
  const formState = useSingaporeFormState(passport);

  // 2. Data Persistence Hook - Handles loading, saving, session management
  const persistence = useSingaporeDataPersistence({
    passport,
    destination,
    userId,
    formState,
    travelInfoForm,
    navigation,
  });

  // 3. Validation Hook - Handles validation and completion tracking
  const validation = useSingaporeValidation({
    formState,
    travelInfoForm,
    saveDataToSecureStorage: persistence.saveDataToSecureStorage,
    debouncedSaveData: persistence.debouncedSaveData,
  });

  // Extract commonly used functions
  const {
    handleFieldBlur,
    handleUserInteraction,
    getFieldCount,
    calculateCompletionMetrics,
    isFormValid,
    getSmartButtonConfig,
    getProgressText,
    getProgressColor,
  } = validation;

  const {
    loadData,
    saveDataToSecureStorage,
    debouncedSaveData,
    refreshFundItems,
    normalizeFundItem,
    scrollViewRef,
    shouldRestoreScrollPosition,
  } = persistence;

  // Now all form state is accessed via formState object:
  // formState.passportNo, formState.setPassportNo, etc.
};
```

### Step 3: Update Data Loading

**Before (240+ lines of complex loading logic in useEffect):**
```javascript
useEffect(() => {
  const loadSavedData = async () => {
    try {
      setIsLoading(true);
      await UserDataService.initialize(userId);
      const userData = await UserDataService.getAllUserData(userId);
      // ... 200+ lines of data loading and state updates
    } catch (error) {
      // ... error handling
    } finally {
      setIsLoading(false);
    }
  };
  loadSavedData();
}, [userId]);
```

**After (4 lines calling hook's loadData):**
```javascript
useEffect(() => {
  loadData();
}, [loadData]);
```

### Step 4: Update Field References

**Before:**
```javascript
// Direct state access
<Input
  value={passportNo}
  onChangeText={setPassportNo}
  onBlur={() => handleFieldBlur('passportNo', passportNo)}
/>
```

**After:**
```javascript
// Access via formState
<Input
  value={formState.passportNo}
  onChangeText={formState.setPassportNo}
  onBlur={() => handleFieldBlur('passportNo', formState.passportNo)}
/>
```

### Step 5: Optional - Use Section Components

**Replace inline JSX with component:**

**Before (100+ lines of inline passport fields):**
```javascript
<View style={styles.sectionContent}>
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>护照号码</Text>
    <Input
      value={passportNo}
      onChangeText={setPassportNo}
      // ... 15+ more lines
    />
  </View>
  {/* ... 5 more fields, 80+ more lines */}
</View>
```

**After (Clean component usage):**
```javascript
<PassportSection
  // Form state
  passportNo={formState.passportNo}
  visaNumber={formState.visaNumber}
  fullName={formState.fullName}
  nationality={formState.nationality}
  dob={formState.dob}
  expiryDate={formState.expiryDate}
  sex={formState.sex}

  // Setters
  setPassportNo={formState.setPassportNo}
  setVisaNumber={formState.setVisaNumber}
  setFullName={formState.setFullName}
  setNationality={formState.setNationality}
  setDob={formState.setDob}
  setExpiryDate={formState.setExpiryDate}
  setSex={formState.setSex}

  // Validation
  errors={formState.errors}
  warnings={formState.warnings}
  handleFieldBlur={handleFieldBlur}
  lastEditedField={formState.lastEditedField}

  // Styles
  styles={styles}
/>
```

### Step 6: Update Completion Metrics

**Before:**
```javascript
useEffect(() => {
  if (!isLoading) {
    // Manual completion calculation
    const passportCount = getFieldCount('passport');
    // ... complex calculation logic
  }
}, [isLoading, passportNo, fullName, /* ... 40+ dependencies */]);
```

**After:**
```javascript
useEffect(() => {
  if (!formState.isLoading) {
    calculateCompletionMetrics();
  }
}, [formState.isLoading, calculateCompletionMetrics]);
```

### Step 7: Update Fund Item Handlers

**Before:**
```javascript
const handleFundItemUpdate = async (updatedItem) => {
  try {
    if (updatedItem) {
      setSelectedFundItem(normalizeFundItem(updatedItem));
    }
    await refreshFundItems({ forceRefresh: true });
  } catch (error) {
    console.error('Failed to update fund item state:', error);
  }
};
```

**After:**
```javascript
const handleFundItemUpdate = async (updatedItem) => {
  try {
    if (updatedItem) {
      formState.setSelectedFundItem(normalizeFundItem(updatedItem));
    }
    await refreshFundItems({ forceRefresh: true });
  } catch (error) {
    console.error('Failed to update fund item state:', error);
  }
};
```

## Benefits of This Integration

### ✅ Code Organization
- **Before**: 3,153 lines in single file with 49+ useState calls scattered throughout
- **After**: Clean hook-based architecture with clear separation of concerns

### ✅ Maintainability
- All state management in one hook (`useSingaporeFormState`)
- All data operations in one hook (`useSingaporeDataPersistence`)
- All validation logic in one hook (`useSingaporeValidation`)

### ✅ Reusability
- Hooks can be used in other screens (e.g., review screen, preview screen)
- Section components can be reused across the app

### ✅ Testability
- Each hook can be tested in isolation
- Mock data easier to provide to hooks
- Section components testable independently

### ✅ Performance
- Reduced re-renders through proper memoization
- Debounced saves handled in persistence hook
- Optimized dependency arrays

## Migration Strategy

### Phase 1: Hooks Only (Current State) ✅
- Created three custom hooks
- No changes to main screen yet
- Hooks ready to use

### Phase 2: Minimal Integration (This Guide)
- Update imports to use hooks
- Replace useState with formState
- Update data loading to use loadData()
- Keep existing JSX mostly intact

### Phase 3: Full Refactoring (Optional)
- Create all section components (Passport, Personal, Funds, Travel)
- Replace all inline JSX with components
- Extract styles to separate file
- Expected result: ~1,500 lines (from 3,153 lines, -52% reduction)

## Testing Checklist

After integration, verify:
- [ ] Data loads correctly on mount
- [ ] All fields accept and display input
- [ ] Validation triggers on blur
- [ ] Auto-save works (300ms debounce)
- [ ] Completion metrics update correctly
- [ ] Navigation back/forward works
- [ ] Session state persists (scroll position, expanded sections)
- [ ] Fund items CRUD operations work
- [ ] Error handling displays correctly

## Example: Complete Hook Integration in Screen

```javascript
const SingaporeTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const { t } = useLocale();

  const passport = useMemo(() => {
    return UserDataService.toSerializablePassport(rawPassport);
  }, [rawPassport?.id, rawPassport?.passportNo, rawPassport?.name, rawPassport?.nameEn]);

  const userId = useMemo(() => passport?.id || 'user_001', [passport?.id]);
  const travelInfoForm = useTravelInfoForm('singapore');

  // Initialize all three hooks
  const formState = useSingaporeFormState(passport);
  const persistence = useSingaporeDataPersistence({
    passport,
    destination,
    userId,
    formState,
    travelInfoForm,
    navigation,
  });
  const validation = useSingaporeValidation({
    formState,
    travelInfoForm,
    saveDataToSecureStorage: persistence.saveDataToSecureStorage,
    debouncedSaveData: persistence.debouncedSaveData,
  });

  // Extract functions
  const { handleFieldBlur, calculateCompletionMetrics, getSmartButtonConfig } = validation;
  const { loadData, refreshFundItems, scrollViewRef } = persistence;

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate completion metrics
  useEffect(() => {
    if (!formState.isLoading) {
      calculateCompletionMetrics();
    }
  }, [formState.isLoading, calculateCompletionMetrics]);

  // Monitor save status
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = DebouncedSave.getSaveState('singapore_travel_info');
      formState.setSaveStatus(currentStatus);
    }, 100);
    return () => clearInterval(interval);
  }, [formState]);

  // Rest of handlers (now much simpler)
  const handleFundItemPress = (fund) => {
    formState.setSelectedFundItem(fund);
    formState.setIsCreatingFundItem(false);
    formState.setNewFundItemType(null);
    formState.setFundItemModalVisible(true);
  };

  const handleContinue = async () => {
    await DebouncedSave.flushPendingSave('singapore_travel_info');
    navigation.navigate('SingaporeEntryFlow', { passport, destination });
  };

  // JSX now uses formState.* instead of individual state variables
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView ref={scrollViewRef}>
        {/* Hero section with progress */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Singapore Travel Info - {formState.totalCompletionPercent}%
          </Text>
        </View>

        {/* Passport Section - can use component or inline JSX */}
        <CollapsibleSection
          title="📘 Passport Information"
          isExpanded={formState.expandedSection === 'passport'}
          onToggle={() => formState.setExpandedSection(
            formState.expandedSection === 'passport' ? null : 'passport'
          )}
          fieldCount={validation.getFieldCount('passport')}
        >
          <PassportSection
            passportNo={formState.passportNo}
            visaNumber={formState.visaNumber}
            fullName={formState.fullName}
            nationality={formState.nationality}
            dob={formState.dob}
            expiryDate={formState.expiryDate}
            sex={formState.sex}
            setPassportNo={formState.setPassportNo}
            setVisaNumber={formState.setVisaNumber}
            setFullName={formState.setFullName}
            setNationality={formState.setNationality}
            setDob={formState.setDob}
            setExpiryDate={formState.setExpiryDate}
            setSex={formState.setSex}
            errors={formState.errors}
            warnings={formState.warnings}
            handleFieldBlur={handleFieldBlur}
            lastEditedField={formState.lastEditedField}
            styles={styles}
          />
        </CollapsibleSection>

        {/* Other sections follow the same pattern... */}

      </ScrollView>
    </SafeAreaView>
  );
};
```

## Next Steps

1. **Try the hooks**: Update a few fields in the main screen to use `formState.*` instead of individual state
2. **Test the integration**: Verify data loading and saving still works
3. **Gradually migrate**: Replace more sections with the hook-based approach
4. **Create more components**: Build out PersonalInfoSection, FundsSection, etc. as needed
5. **Full refactoring**: Eventually migrate entire screen to use hooks + components

## Support

The hooks are fully functional and production-ready. They can be integrated incrementally without breaking existing functionality.

For questions or issues, refer to:
- `docs/TRAVEL_INFO_SCREEN_REFACTORING_GUIDE.md` - Complete refactoring methodology
- Thailand implementation as reference (already refactored with this pattern)
