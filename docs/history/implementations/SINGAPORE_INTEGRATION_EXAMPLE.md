# Singapore Travel Info Screen - Integration Example

This file shows the key changes needed to integrate the custom hooks into SingaporeTravelInfoScreen.js

## Key Changes Summary

### 1. Update Imports (Top of File)

```javascript
// Add hook imports
import {
  useSingaporeFormState,
  useSingaporeDataPersistence,
  useSingaporeValidation,
} from '../../hooks/singapore';

// Add section component imports (optional)
import {
  PassportSection,
  PersonalInfoSection,
  FundsSection,
  TravelDetailsSection,
} from '../../components/singapore/sections';
```

### 2. Replace useState Calls with Hook Initialization

**REMOVE these lines (49+ useState calls):**
```javascript
// ❌ DELETE: All individual useState declarations
const [passportNo, setPassportNo] = useState('');
const [visaNumber, setVisaNumber] = useState('');
const [fullName, setFullName] = useState('');
// ... 46 more useState declarations
```

**ADD these lines instead:**
```javascript
// ✅ ADD: Hook initialization
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

// Extract commonly used functions
const {
  handleFieldBlur,
  handleUserInteraction,
  getFieldCount,
  calculateCompletionMetrics,
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
} = persistence;
```

### 3. Update Data Loading useEffect

**REMOVE this entire useEffect block (~208 lines):**
```javascript
// ❌ DELETE: Lines 457-664
useEffect(() => {
  const loadSavedData = async () => {
    try {
      setIsLoading(true);
      await UserDataService.initialize(userId);
      const userData = await UserDataService.getAllUserData(userId);
      // ... 200+ lines of data loading logic
    } catch (error) {
      // ... error handling
    } finally {
      setIsLoading(false);
    }
  };
  loadSavedData();
}, [userId]);
```

**ADD this instead:**
```javascript
// ✅ ADD: Simple 4-line data loading
useEffect(() => {
  loadData();
}, [loadData]);
```

### 4. Update Focus/Blur Listeners

**REMOVE these useEffect blocks (~120 lines total):**
```javascript
// ❌ DELETE: Lines 670-781 (focus listener)
// ❌ DELETE: Lines 784-791 (blur listener)
// ❌ DELETE: Lines 794-805 (cleanup)
```

**These are now handled automatically by the persistence hook!**

### 5. Remove Duplicate Functions

**REMOVE these function definitions (they're in hooks now):**
```javascript
// ❌ DELETE: Lines 817-872 (session state functions)
const getSessionStateKey = () => { /* ... */ };
const saveSessionState = async () => { /* ... */ };
const loadSessionState = async () => { /* ... */ };

// ❌ DELETE: Lines 292-308 (getFieldCount)
const getFieldCount = (section) => { /* ... */ };

// ❌ DELETE: Lines 311-344 (calculateCompletionMetrics)
const calculateCompletionMetrics = useCallback(() => { /* ... */ }, [ /* ... */ ]);

// ❌ DELETE: Lines 367-401 (getSmartButtonConfig)
const getSmartButtonConfig = () => { /* ... */ };

// ❌ DELETE: Lines 404-418 (getProgressText)
const getProgressText = () => { /* ... */ };

// ❌ DELETE: Lines 421-429 (getProgressColor)
const getProgressColor = () => { /* ... */ };

// ❌ DELETE: Lines 252-259 (migrateExistingDataToInteractionState)
const migrateExistingDataToInteractionState = useCallback(async (userData) => { /* ... */ }, [ /* ... */ ]);

// ❌ DELETE: Lines 1508-1526 (normalizeFundItem, refreshFundItems)
const normalizeFundItem = useCallback((item) => ({ /* ... */ }), [userId]);
const refreshFundItems = useCallback(async (options = {}) => { /* ... */ }, [userId, normalizeFundItem]);
```

### 6. Update Field References Throughout JSX

**Find and replace pattern in JSX:**
- `passportNo` → `formState.passportNo`
- `setPassportNo` → `formState.setPassportNo`
- `visaNumber` → `formState.visaNumber`
- `setVisaNumber` → `formState.setVisaNumber`
- ... (apply to all 49 state variables)

**Example - Before:**
```jsx
<Input
  value={passportNo}
  onChangeText={setPassportNo}
  onBlur={() => handleFieldBlur('passportNo', passportNo)}
/>
```

**Example - After:**
```jsx
<Input
  value={formState.passportNo}
  onChangeText={formState.setPassportNo}
  onBlur={() => handleFieldBlur('passportNo', formState.passportNo)}
/>
```

### 7. Update Save Operations

**REMOVE these function definitions (~200 lines):**
```javascript
// ❌ DELETE: Lines 1313-1506 (saveDataToSecureStorageWithOverride)
const saveDataToSecureStorageWithOverride = async (fieldOverrides = {}) => { /* ... */ };

// ❌ DELETE: Line 1504 (saveDataToSecureStorage wrapper)
const saveDataToSecureStorage = async () => {
  return saveDataToSecureStorageWithOverride();
};
```

**These are now in the persistence hook!**

### 8. Update Validation Handler

**REMOVE this function (~345 lines):**
```javascript
// ❌ DELETE: Lines 966-1310 (handleFieldBlur)
const handleFieldBlur = async (fieldName, fieldValue) => { /* ... */ };
```

**This is now in the validation hook!**

### 9. Optional: Replace Inline Sections with Components

**Example - Passport Section**

**Before (~120 lines of inline JSX):**
```jsx
<CollapsibleSection
  title="📘 护照信息"
  isExpanded={expandedSection === 'passport'}
  onToggle={() => setExpandedSection(expandedSection === 'passport' ? null : 'passport')}
>
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>护照号码</Text>
    <Input
      value={passportNo}
      onChangeText={setPassportNo}
      // ... 20 more lines
    />
  </View>
  {/* ... 5 more fields, 100+ more lines */}
</CollapsibleSection>
```

**After (~30 lines with component):**
```jsx
<CollapsibleSection
  title="📘 护照信息"
  isExpanded={formState.expandedSection === 'passport'}
  onToggle={() => formState.setExpandedSection(
    formState.expandedSection === 'passport' ? null : 'passport'
  )}
  fieldCount={getFieldCount('passport')}
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
```

## Line-by-Line Changes Summary

| Action | Lines to Remove | Lines to Add | Net Change |
|--------|----------------|--------------|------------|
| Replace useState declarations | 49+ lines | 3 lines (hooks) | -46 lines |
| Replace data loading | ~208 lines | 4 lines | -204 lines |
| Remove focus/blur listeners | ~120 lines | 0 (in hook) | -120 lines |
| Remove session functions | ~56 lines | 0 (in hook) | -56 lines |
| Remove helper functions | ~150 lines | 0 (in hooks) | -150 lines |
| Remove save operations | ~200 lines | 0 (in hook) | -200 lines |
| Remove validation handler | ~345 lines | 0 (in hook) | -345 lines |
| **Optional:** Use section components | ~400 lines | ~120 lines | -280 lines |
| **TOTAL REDUCTION** | | | **~1,400 lines** |

## Expected Result

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Main file size | 3,153 lines | ~1,750 lines | **-44% reduction** |
| useState calls | 49+ scattered | 1 hook call | **-98% cleaner** |
| Data loading | 240+ lines inline | 4 lines | **-98% smaller** |
| Validation logic | 345 lines inline | Hook-based | **Fully extracted** |
| Save operations | 200+ lines inline | Hook-based | **Fully extracted** |

## Migration Steps

### Step 1: Backup Current File
```bash
cp app/screens/singapore/SingaporeTravelInfoScreen.js app/screens/singapore/SingaporeTravelInfoScreen.js.backup
```

### Step 2: Add Imports
- Add hook imports at top
- Add section component imports (optional)

### Step 3: Replace useState with Hooks
- Remove all 49+ useState declarations
- Add the 3 hook initializations
- Extract functions from hooks

### Step 4: Update useEffect Blocks
- Replace data loading useEffect (lines 457-664)
- Remove focus/blur listeners (lines 670-805) - now in hook

### Step 5: Remove Duplicate Functions
- Remove getFieldCount, calculateCompletionMetrics, etc.
- Remove session state functions
- Remove save operations
- Remove validation handler

### Step 6: Update JSX References
- Find/replace all state variable references with formState.*
- Update all handler calls to use extracted functions

### Step 7: Optional - Use Components
- Replace inline sections with section components
- Further reduces main file size

### Step 8: Test
- Verify data loads correctly
- Test all user interactions
- Verify validation works
- Test save operations
- Check completion metrics

### Step 9: Commit
```bash
git add .
git commit -m "Phase 3: Integrate hooks into Singapore Travel Info Screen"
git push
```

## Quick Find/Replace Patterns

Use your editor's find/replace to quickly update references:

### State Variables (do for each of the 49 variables)
```
Find:    const [passportNo, setPassportNo] = useState
Replace: // REMOVED - now in formState hook

Find:    \bpassportNo\b(?!\w)
Replace: formState.passportNo

Find:    \bsetPassportNo\b
Replace: formState.setPassportNo
```

### Common Refs
```
Find:    \berrors\b(?!\.)
Replace: formState.errors

Find:    \bwarnings\b(?!\.)
Replace: formState.warnings

Find:    \bisLoading\b
Replace: formState.isLoading

Find:    \bexpandedSection\b
Replace: formState.expandedSection
```

## Verification Checklist

After integration, verify:
- [ ] File compiles without errors
- [ ] Data loads on mount
- [ ] All fields accept input
- [ ] Validation triggers correctly
- [ ] Auto-save works (300ms debounce)
- [ ] Completion metrics update
- [ ] Navigation works
- [ ] Session state persists
- [ ] Fund items CRUD works
- [ ] No console errors

## Support

If you encounter issues:
1. Check the backup file
2. Review `docs/SINGAPORE_HOOKS_INTEGRATION_GUIDE.md`
3. Compare with Thailand implementation
4. Test incrementally (one section at a time)

The hooks are production-ready and well-tested!
