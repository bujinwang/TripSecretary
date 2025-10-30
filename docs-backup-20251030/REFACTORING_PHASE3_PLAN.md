# Phase 3 Refactoring Plan: ThailandTravelInfoScreen Integration

## Current State
- **File size**: 3,930 lines
- **useState calls**: 57
- **React hooks**: 84 total
- **Inline functions**: ~30
- **JSX sections**: ~1,500 lines

## Target State
- **File size**: ~800-1,000 lines (75% reduction)
- **useState calls**: 0 (all in useThailandFormState)
- **Custom hooks**: 3 (formState, persistence, validation)
- **Section components**: 5 (all extracted)
- **Inline functions**: ~10 (only screen-specific)

## Refactoring Strategy

### 1. Replace State Management
**Before**:
```javascript
const [passportNo, setPassportNo] = useState('');
const [surname, setSurname] = useState('');
// ... 55 more useState declarations
```

**After**:
```javascript
const formState = useThailandFormState(passport);
// Access: formState.passportNo, formState.setPassportNo, etc.
```

### 2. Replace Data Persistence
**Before**:
```javascript
// 500+ lines of data loading logic
useEffect(() => {
  const loadData = async () => {
    // Complex loading logic
  };
  loadData();
}, []);

// 300+ lines of save logic
const saveDataToSecureStorage = async () => {
  // Complex save logic
};
```

**After**:
```javascript
const persistence = useThailandDataPersistence({
  passport, destination, userId, formState,
  userInteractionTracker, navigation
});

useEffect(() => {
  persistence.loadData();
}, []);
```

### 3. Replace Validation Logic
**Before**:
```javascript
// Field count calculation (100+ lines)
const getFieldCount = (section) => {
  // Complex logic
};

// Validation (200+ lines)
const handleFieldBlur = async (fieldName, fieldValue) => {
  // Complex validation
};
```

**After**:
```javascript
const validation = useThailandValidation({
  formState, userInteractionTracker,
  saveDataToSecureStorageWithOverride,
  debouncedSaveData
});

// Use: validation.handleFieldBlur(), validation.getFieldCount(), etc.
```

### 4. Replace JSX Sections
**Before** (~1,500 lines of JSX):
```javascript
<LinearGradient ...>
  <View style={styles.heroContent}>
    {/* 100+ lines of hero section JSX */}
  </View>
</LinearGradient>

<CollapsibleSection title="👤 护照信息" ...>
  {/* 200+ lines of passport form JSX */}
</CollapsibleSection>

{/* Similar for other sections */}
```

**After** (~100 lines of JSX):
```javascript
<HeroSection t={t} />

<PassportSection
  t={t}
  isExpanded={formState.expandedSection === 'passport'}
  onToggle={() => formState.setExpandedSection(...)}
  fieldCount={validation.getFieldCount('passport')}
  // Pass all necessary props
  {...passportProps}
/>

{/* Similar for other sections */}
```

## Functions to Keep in Main Component

### Screen-Specific Handlers (Cannot be extracted)
1. `handleProvinceSelect` - Manages province selection cascade
2. `handleDistrictSelect` - Manages district selection cascade
3. `handleSubDistrictSelect` - Manages sub-district selection cascade
4. `handleFlightTicketPhotoUpload` - Photo picker for flight ticket
5. `handleHotelReservationPhotoUpload` - Photo picker for hotel reservation
6. `handleFundItemPress` - Opens fund item modal
7. `handleFundItemModalClose` - Closes fund item modal
8. `handleFundItemUpdate` - Updates fund item after edit
9. `handleFundItemCreate` - Refreshes after fund item creation
10. `handleFundItemDelete` - Deletes fund item
11. `addFund` - Adds new fund item
12. `handleContinue` - Navigation to next screen
13. `handleGoBack` - Navigation back
14. `performSaveOperation` - Complex save logic (could be moved to service later)

### Functions to Remove (Now in Hooks)
- `getFieldCount` → `validation.getFieldCount()`
- `calculateCompletionMetrics` → `validation.calculateCompletionMetrics()`
- `isFormValid` → `validation.isFormValid()`
- `getSmartButtonConfig` → `validation.getSmartButtonConfig()`
- `getProgressText` → `validation.getProgressText()`
- `getProgressColor` → `validation.getProgressColor()`
- `handleFieldBlur` → `validation.handleFieldBlur()`
- `handleUserInteraction` → `validation.handleUserInteraction()`
- `loadData` → `persistence.loadData()`
- `saveDataToSecureStorage` → `persistence.saveDataToSecureStorage()`
- `debouncedSaveData` → `persistence.debouncedSaveData()`
- `refreshFundItems` → `persistence.refreshFundItems()`
- `initializeEntryInfo` → `persistence.initializeEntryInfo()`
- All session state management → `persistence.saveSessionState()`, etc.

## Expected Line Count Reduction

| Section | Before | After | Reduction |
|---------|--------|-------|-----------|
| Imports | 52 | 30 | -22 |
| State declarations | 150 | 15 | -135 |
| Helper functions | 800 | 200 | -600 |
| useEffect hooks | 400 | 50 | -350 |
| JSX (Hero) | 100 | 10 | -90 |
| JSX (Passport) | 200 | 20 | -180 |
| JSX (Personal) | 150 | 20 | -130 |
| JSX (Funds) | 200 | 20 | -180 |
| JSX (Travel) | 700 | 40 | -660 |
| Other JSX | 200 | 100 | -100 |
| Styles | 800 | 800 | 0 |
| **Total** | **3,930** | **~1,305** | **~2,625** |

Note: Styles will be extracted in Phase 4.

## Implementation Steps

1. ✅ Backup original file
2. Replace imports with hooks and sections
3. Replace state management with useThailandFormState
4. Replace persistence logic with useThailandDataPersistence
5. Replace validation logic with useThailandValidation
6. Replace JSX sections with section components
7. Update prop passing to section components
8. Test the refactored component
9. Commit and push

## Risk Mitigation

- Original file backed up as `ThailandTravelInfoScreen.original.js`
- Can revert by restoring backup
- Tests should catch any behavioral changes
- Incremental testing after each major change

## Success Criteria

- [ ] File size reduced to under 1,500 lines
- [ ] All hooks properly integrated
- [ ] All section components rendering correctly
- [ ] All event handlers working
- [ ] All validation working
- [ ] All data persistence working
- [ ] No console errors
- [ ] Existing tests pass
