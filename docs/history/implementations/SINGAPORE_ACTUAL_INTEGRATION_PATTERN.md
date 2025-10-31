# Singapore Travel Info Screen - Actual Integration Pattern

This document shows the EXACT changes to make in SingaporeTravelInfoScreen.js.

## File: app/screens/singapore/SingaporeTravelInfoScreen.js

### CHANGE 1: Update Imports (Lines 1-60)

**ADD after line 59 (after UserDataService import):**
```javascript
// Import custom hooks for state management
import {
  useSingaporeFormState,
  useSingaporeDataPersistence,
  useSingaporeValidation,
} from '../../hooks/singapore';

// Import section components (optional - for Phase 2 of integration)
import {
  PassportSection,
  PersonalInfoSection,
  FundsSection,
  TravelDetailsSection,
} from '../../components/singapore/sections';
```

### CHANGE 2: Replace State Declarations (Lines 182-246)

**REMOVE these lines (183-246):**
```javascript
  // DELETE: All these useState declarations
  const [passportData, setPassportData] = useState(null);
  const [personalInfoData, setPersonalInfoData] = useState(null);
  const [entryData, setEntryData] = useState(null);

  const [passportNo, setPassportNo] = useState('');
  const [visaNumber, setVisaNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const [sex, setSex] = useState('');
  const [occupation, setOccupation] = useState('');
  const [cityOfResidence, setCityOfResidence] = useState('');
  const [residentCountry, setResidentCountry] = useState('');
  const [phoneCode, setPhoneCode] = useState(getPhoneCode(passport?.nationality || ''));
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  const [funds, setFunds] = useState([]);
  const [fundItemModalVisible, setFundItemModalVisible] = useState(false);
  const [selectedFundItem, setSelectedFundItem] = useState(null);
  const [isCreatingFundItem, setIsCreatingFundItem] = useState(false);
  const [newFundItemType, setNewFundItemType] = useState(null);

  const [travelPurpose, setTravelPurpose] = useState('');
  const [customTravelPurpose, setCustomTravelPurpose] = useState('');
  const [boardingCountry, setBoardingCountry] = useState('');
  const [arrivalFlightNumber, setArrivalFlightNumber] = useState('');
  const [arrivalArrivalDate, setArrivalArrivalDate] = useState('');
  const [previousArrivalDate, setPreviousArrivalDate] = useState('');
  const [departureFlightNumber, setDepartureFlightNumber] = useState('');
  const [departureDepartureDate, setDepartureDepartureDate] = useState('');
  const [isTransitPassenger, setIsTransitPassenger] = useState(false);
  const [accommodationType, setAccommodationType] = useState('');
  const [customAccommodationType, setCustomAccommodationType] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');

  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);

  const [saveStatus, setSaveStatus] = useState(null);
  const [lastEditedAt, setLastEditedAt] = useState(null);

  const [lastEditedField, setLastEditedField] = useState(null);
  const scrollViewRef = useRef(null);
  const shouldRestoreScrollPosition = useRef(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  const [completionMetrics, setCompletionMetrics] = useState(null);
  const [totalCompletionPercent, setTotalCompletionPercent] = useState(0);
```

**ADD instead (after line 249 - after travelInfoForm):**
```javascript
  // ===================================================================
  // CUSTOM HOOKS INTEGRATION - Replaces 49+ useState declarations
  // ===================================================================

  // Initialize form state hook - manages all form state
  const formState = useSingaporeFormState(passport);

  // Initialize data persistence hook - handles loading, saving, session management
  const persistence = useSingaporeDataPersistence({
    passport,
    destination,
    userId,
    formState,
    travelInfoForm,
    navigation,
  });

  // Initialize validation hook - handles validation, completion tracking
  const validation = useSingaporeValidation({
    formState,
    travelInfoForm,
    saveDataToSecureStorage: persistence.saveDataToSecureStorage,
    debouncedSaveData: persistence.debouncedSaveData,
  });

  // Extract commonly used functions from hooks
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

  // ===================================================================
  // END CUSTOM HOOKS INTEGRATION
  // ===================================================================
```

### CHANGE 3: Remove Migration Function (Lines 251-259)

**REMOVE:**
```javascript
  // DELETE: This function - now in persistence hook
  const migrateExistingDataToInteractionState = useCallback(async (userData) => {
    if (!userData || !travelInfoForm.isInitialized) {
      return;
    }

    console.log('=== MIGRATING EXISTING DATA TO INTERACTION STATE (SINGAPORE) ===');
    await travelInfoForm.initializeWithExistingData(userData);
  }, [travelInfoForm]);
```

### CHANGE 4: Remove handleUserInteraction (Lines 262-289)

**REMOVE:**
```javascript
  // DELETE: This function - now in validation hook
  const handleUserInteraction = useCallback((fieldName, value) => {
    travelInfoForm.handleUserInteraction(fieldName, value);
    // ... implementation
  }, [travelInfoForm.handleUserInteraction]);
```

### CHANGE 5: Remove getFieldCount (Lines 292-308)

**REMOVE:**
```javascript
  // DELETE: This function - now in validation hook
  const getFieldCount = (section) => {
    // ... implementation
  };
```

### CHANGE 6: Remove calculateCompletionMetrics (Lines 311-344)

**REMOVE:**
```javascript
  // DELETE: This function - now in validation hook
  const calculateCompletionMetrics = useCallback(() => {
    // ... implementation
  }, [ /* dependencies */ ]);
```

### CHANGE 7: Remove isFormValid (Lines 347-364)

**REMOVE:**
```javascript
  // DELETE: This function - now in validation hook
  const isFormValid = () => {
    // ... implementation
  };
```

### CHANGE 8: Remove getSmartButtonConfig (Lines 367-401)

**REMOVE:**
```javascript
  // DELETE: This function - now in validation hook
  const getSmartButtonConfig = () => {
    // ... implementation
  };
```

### CHANGE 9: Remove getProgressText and getProgressColor (Lines 404-429)

**REMOVE:**
```javascript
  // DELETE: These functions - now in validation hook
  const getProgressText = () => {
    // ... implementation
  };

  const getProgressColor = () => {
    // ... implementation
  };
```

### CHANGE 10: Keep clearUserData as-is (Lines 432-454)
**NO CHANGE** - This debug function can stay

### CHANGE 11: Replace Data Loading useEffect (Lines 457-667)

**REMOVE entire useEffect block (lines 457-667):**
```javascript
  // DELETE: This entire useEffect - replace with hook's loadData
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        setIsLoading(true);
        // ... 200+ lines of loading logic ...
      } catch (error) {
        // ... error handling ...
      } finally {
        setIsLoading(false);
      }
    };
    loadSavedData();
  }, [userId]);
```

**ADD instead:**
```javascript
  // ===================================================================
  // DATA LOADING - Using persistence hook (replaces 200+ lines)
  // ===================================================================
  useEffect(() => {
    loadData();
  }, [loadData]);
```

### CHANGE 12: Remove Focus/Blur/Cleanup Listeners (Lines 670-805)

**REMOVE these three useEffect blocks:**
```javascript
  // DELETE: Lines 670-781 - Focus listener (now in persistence hook)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // ... 100+ lines ...
    });
    return unsubscribe;
  }, [navigation, userId]);

  // DELETE: Lines 784-791 - Blur listener (now in persistence hook)
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // ...
    });
    return unsubscribe;
  }, [navigation]);

  // DELETE: Lines 794-805 - Cleanup (now in persistence hook)
  useEffect(() => {
    return () => {
      // ...
    };
  }, []);
```

### CHANGE 13: Keep Save Status Monitoring (Lines 808-815)

**MODIFY to use formState:**
```javascript
  // Monitor save status changes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentStatus = DebouncedSave.getSaveState('singapore_travel_info');
      formState.setSaveStatus(currentStatus);  // CHANGE: Use formState
    }, 100);

    return () => clearInterval(interval);
  }, [formState]);  // CHANGE: Add formState to deps
```

### CHANGE 14: Remove Session State Functions (Lines 818-872)

**REMOVE:**
```javascript
  // DELETE: These functions - now in persistence hook
  const getSessionStateKey = () => { /* ... */ };
  const saveSessionState = async () => { /* ... */ };
  const loadSessionState = async () => { /* ... */ };
```

### CHANGE 15: Remove Session State useEffects (Lines 875-905)

**REMOVE these useEffect blocks:**
```javascript
  // DELETE: Now handled by persistence hook
  useEffect(() => {
    if (!isLoading) {
      saveSessionState();
    }
  }, [expandedSection, lastEditedField]);

  useEffect(() => {
    loadSessionState();
  }, []);

  useEffect(() => {
    // Scroll restoration logic
  }, [isLoading, scrollPosition]);
```

### CHANGE 16: Update Completion Metrics useEffect (Lines 908-912)

**MODIFY:**
```javascript
  // Recalculate completion metrics when data changes
  useEffect(() => {
    if (!formState.isLoading) {  // CHANGE: Use formState
      calculateCompletionMetrics();
    }
  }, [formState.isLoading, calculateCompletionMetrics]);  // CHANGE: Use formState
```

### CHANGE 17: Keep handleNavigationWithSave (Lines 915-953)
**KEEP as-is** - This function is fine

### CHANGE 18: Remove debouncedSaveData (Lines 956-963)

**REMOVE:**
```javascript
  // DELETE: This function - now provided by persistence hook
  const debouncedSaveData = DebouncedSave.debouncedSave(
    'singapore_travel_info',
    async () => {
      await saveDataToSecureStorage();
      setLastEditedAt(new Date());
    },
    300
  );
```

### CHANGE 19: Remove handleFieldBlur (Lines 966-1310)

**REMOVE entire function (~345 lines):**
```javascript
  // DELETE: This entire function - now in validation hook
  const handleFieldBlur = async (fieldName, fieldValue) => {
    // ... 345 lines of validation logic ...
  };
```

### CHANGE 20: Remove Save Operations (Lines 1313-1506)

**REMOVE:**
```javascript
  // DELETE: These functions - now in persistence hook
  const saveDataToSecureStorageWithOverride = async (fieldOverrides = {}) => {
    // ... ~200 lines ...
  };

  const saveDataToSecureStorage = async () => {
    return saveDataToSecureStorageWithOverride();
  };
```

### CHANGE 21: Remove normalizeFundItem and refreshFundItems (Lines 1508-1526)

**REMOVE:**
```javascript
  // DELETE: These functions - now in persistence hook
  const normalizeFundItem = useCallback((item) => ({
    // ...
  }), [userId]);

  const refreshFundItems = useCallback(async (options = {}) => {
    // ...
  }, [userId, normalizeFundItem]);
```

### CHANGE 22: Keep addFund function (Line 1528-1533)

**MODIFY to use formState:**
```javascript
  const addFund = (type) => {
    formState.setNewFundItemType(type);  // CHANGE
    formState.setIsCreatingFundItem(true);  // CHANGE
    formState.setSelectedFundItem(null);  // CHANGE
    formState.setFundItemModalVisible(true);  // CHANGE
  };
```

### CHANGE 23: Update Fund Item Handlers (Lines 1535-1579)

**MODIFY all to use formState:**
```javascript
  const handleFundItemPress = (fund) => {
    formState.setSelectedFundItem(fund);  // CHANGE
    formState.setIsCreatingFundItem(false);  // CHANGE
    formState.setNewFundItemType(null);  // CHANGE
    formState.setFundItemModalVisible(true);  // CHANGE
  };

  const handleFundItemModalClose = () => {
    formState.setFundItemModalVisible(false);  // CHANGE
    formState.setSelectedFundItem(null);  // CHANGE
    formState.setIsCreatingFundItem(false);  // CHANGE
    formState.setNewFundItemType(null);  // CHANGE
  };

  const handleFundItemUpdate = async (updatedItem) => {
    try {
      if (updatedItem) {
        formState.setSelectedFundItem(normalizeFundItem(updatedItem));  // CHANGE
      }
      await refreshFundItems({ forceRefresh: true });
    } catch (error) {
      console.error('Failed to update fund item state:', error);
    }
  };

  // ... similar updates for other fund handlers
```

### CHANGE 24: Keep OCR Functions (Lines 1604-1870)
**NO CHANGES** - Keep all OCR processing functions as-is

### CHANGE 25: Update JSX - All State References

**In the return statement (starting line 1874), find and replace:**

Pattern: Replace all state variable references with `formState.` prefix

Examples:
- `passportNo` → `formState.passportNo`
- `setPassportNo` → `formState.setPassportNo`
- `visaNumber` → `formState.visaNumber`
- `fullName` → `formState.fullName`
- `errors` → `formState.errors`
- `warnings` → `formState.warnings`
- `isLoading` → `formState.isLoading`
- `expandedSection` → `formState.expandedSection`
- `setExpandedSection` → `formState.setExpandedSection`
- `lastEditedField` → `formState.lastEditedField`
- `totalCompletionPercent` → `formState.totalCompletionPercent`
- ... etc for all 49 state variables

### CHANGE 26: Keep Styles Section (Lines ~2500-3153)
**NO CHANGES** - Keep all styles as-is

## Summary of Changes

| Section | Lines | Action |
|---------|-------|--------|
| Imports | Add after line 59 | Add hook imports |
| useState declarations | Remove 183-246 | Replace with hooks |
| Helper functions | Remove 251-429 | Now in hooks |
| Data loading | Remove 457-667 | Use loadData() |
| Nav listeners | Remove 670-805 | In persistence hook |
| Session functions | Remove 818-905 | In persistence hook |
| Validation | Remove 966-1310 | In validation hook |
| Save operations | Remove 1313-1526 | In persistence hook |
| Fund handlers | Modify 1528-1579 | Use formState.* |
| OCR functions | Keep 1604-1870 | No changes |
| JSX | Modify 1874-end | Use formState.* |
| Styles | Keep as-is | No changes |

## Expected Result

- **Before**: 3,153 lines
- **After**: ~1,750-1,900 lines
- **Reduction**: ~1,250-1,400 lines (-40-44%)

## Testing After Integration

1. Run syntax check: `node -c SingaporeTravelInfoScreen.js`
2. Test data loading
3. Test field input and validation
4. Test save operations
5. Test fund items CRUD
6. Test navigation
7. Test completion metrics

## Need Help?

- Reference: `docs/SINGAPORE_HOOKS_INTEGRATION_GUIDE.md`
- Thailand example: `app/screens/thailand/ThailandTravelInfoScreen.js`
- Backup available: `SingaporeTravelInfoScreen.js.backup`
