# Critical Bug Fixes for Thailand Screens

## Overview
This document contains detailed fix proposals for critical issues found during the code review.

---

## 🔴 **Fix #1: Memory Leak in TDACSelectionScreen**

### Problem
**File**: `app/screens/thailand/TDACSelectionScreen.js:105-124`

The event listener subscription has a potential memory leak and missing dependencies.

```javascript
React.useEffect(() => {
  const UserDataService = require('../../services/data/UserDataService').default;

  const unsubscribe = UserDataService.addDataChangeListener((event) => {
    console.log('📡 TDAC submission event received:', event.type);

    if (event.type === 'TDAC_SUBMISSION_SUCCESS') {
      console.log('🎉 TDAC submission event received:', event.data);
      handleTDACSubmissionSuccess(event.data);
    }
  });

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}, []); // ⚠️ Empty dependency array but uses handleTDACSubmissionSuccess
```

**Issues:**
1. `handleTDACSubmissionSuccess` is not in dependency array but used in effect
2. This can cause stale closures and reference outdated `travelerInfo`
3. If component re-renders, new function references won't be used

### Solution

```javascript
// Move UserDataService import to top of file
import UserDataService from '../../services/data/UserDataService';

// Inside component:
const handleTDACSubmissionSuccess = useCallback(async (submissionData) => {
  const result = await TDACSubmissionService.handleTDACSubmissionSuccess(
    submissionData,
    travelerInfo
  );

  if (!result.success) {
    TDACSubmissionService.showErrorDialog(
      result.errorResult,
      () => console.log('User chose to retry later'),
      () => console.log('User chose to continue despite error'),
      async () => console.log('User chose to contact support')
    );
  }
}, [travelerInfo]); // Add travelerInfo as dependency

// Event-driven TDAC submission listener
useEffect(() => {
  const unsubscribe = UserDataService.addDataChangeListener((event) => {
    console.log('📡 TDAC submission event received:', event.type);

    if (event.type === 'TDAC_SUBMISSION_SUCCESS') {
      console.log('🎉 TDAC submission event received:', event.data);
      handleTDACSubmissionSuccess(event.data);
    }
  });

  return () => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  };
}, [handleTDACSubmissionSuccess]); // Add handleTDACSubmissionSuccess to dependencies
```

### Verification Steps
1. Component unmounts correctly without errors
2. Event listener is properly cleaned up
3. No console warnings about missing dependencies
4. Stale closure issues are resolved

---

## 🔴 **Fix #2: Async Cleanup in ImmigrationOfficerViewScreen**

### Problem
**File**: `app/screens/thailand/ImmigrationOfficerViewScreen.js:149-174`

Async cleanup in useEffect cleanup function is not awaited, which can cause:
- State updates on unmounted components
- Incomplete cleanup operations
- Potential crashes

```javascript
return () => {
  // Restore original settings on exit
  const cleanup = async () => {
    try {
      if (originalOrientation) {
        await ScreenOrientation.unlockAsync();
      }

      StatusBar.setHidden(false);
      deactivateKeepAwake('ImmigrationOfficerView');

      if (originalBrightness !== null) {
        await Brightness.setBrightnessAsync(originalBrightness);
      }
    } catch (error) {
      console.warn('Failed to cleanup presentation mode:', error);
    }
  };

  cleanup(); // ⚠️ Not awaited! Will continue after component unmounts
};
```

### Solution

**Option 1: Use ref-based cleanup (Recommended)**

```javascript
const ImmigrationOfficerViewScreen = ({ navigation, route }) => {
  // ... existing code ...

  const isMountedRef = useRef(true);
  const cleanupRef = useRef(null);

  useEffect(() => {
    const setupPresentationMode = async () => {
      try {
        // ... existing setup code ...

        // Store cleanup function in ref
        cleanupRef.current = {
          orientation: originalOrientation,
          brightness: originalBrightness,
        };
      } catch (error) {
        console.warn('Failed to set up presentation mode:', error);
      }
    };

    setupPresentationMode();

    // Synchronous cleanup
    return () => {
      isMountedRef.current = false;

      // Cleanup synchronously to avoid async issues
      try {
        if (cleanupRef.current?.orientation) {
          ScreenOrientation.unlockAsync().catch(err =>
            console.warn('Failed to unlock orientation:', err)
          );
        }

        StatusBar.setHidden(false);
        deactivateKeepAwake('ImmigrationOfficerView');

        if (cleanupRef.current?.brightness !== null) {
          Brightness.setBrightnessAsync(cleanupRef.current.brightness).catch(err =>
            console.warn('Failed to restore brightness:', err)
          );
        }
      } catch (error) {
        console.warn('Failed to cleanup presentation mode:', error);
      }
    };
  }, []); // Dependencies properly managed

  // ... rest of component ...
};
```

**Option 2: Use navigation listener (Alternative)**

```javascript
useEffect(() => {
  const unsubscribe = navigation.addListener('beforeRemove', async (e) => {
    // Prevent default behavior
    e.preventDefault();

    // Perform async cleanup
    try {
      if (originalOrientation) {
        await ScreenOrientation.unlockAsync();
      }

      StatusBar.setHidden(false);
      deactivateKeepAwake('ImmigrationOfficerView');

      if (originalBrightness !== null) {
        await Brightness.setBrightnessAsync(originalBrightness);
      }
    } catch (error) {
      console.warn('Failed to cleanup presentation mode:', error);
    }

    // Allow navigation to proceed
    navigation.dispatch(e.data.action);
  });

  return unsubscribe;
}, [navigation, originalOrientation, originalBrightness]);
```

### Verification Steps
1. Component unmounts cleanly without console warnings
2. Screen orientation is properly restored
3. Brightness returns to original value
4. StatusBar and KeepAwake are properly cleaned up
5. No state updates on unmounted component errors

---

## 🟡 **Fix #3: Remove Deprecated Code**

### Problem
**File**: `app/screens/thailand/constants.js:29-72`

Deprecated exports are still present in the codebase and may cause confusion.

```javascript
/**
 * @deprecated Use getTravelPurposeOptions(t) for i18n support
 */
export const PREDEFINED_TRAVEL_PURPOSES = [
  'HOLIDAY',
  'MEETING',
  // ...
];

/**
 * @deprecated Use getAccommodationTypeOptions(t) for i18n support
 */
export const PREDEFINED_ACCOMMODATION_TYPES = [
  'HOTEL',
  'HOSTEL',
  // ...
];

/**
 * @deprecated Use getOccupationOptions(t) instead
 */
export const OCCUPATION_OPTIONS = [
  { value: 'SOFTWARE ENGINEER', label: '软件工程师', icon: '💻' },
  // ...
];
```

### Solution

**Step 1: Find all usages**
```bash
# Search for deprecated constant usage
grep -r "PREDEFINED_TRAVEL_PURPOSES" app/
grep -r "PREDEFINED_ACCOMMODATION_TYPES" app/
grep -r "OCCUPATION_OPTIONS" app/
```

**Step 2: Update usages**
```javascript
// Before (deprecated)
import { PREDEFINED_TRAVEL_PURPOSES } from './constants';

const options = PREDEFINED_TRAVEL_PURPOSES;

// After (using i18n function)
import { getTravelPurposeOptions } from './constants';
import { useLocale } from '../../i18n/LocaleContext';

const { t } = useLocale();
const options = getTravelPurposeOptions(t);
```

**Step 3: Remove deprecated exports**
```javascript
// Remove these from constants.js after all usages are updated:
// - PREDEFINED_TRAVEL_PURPOSES
// - PREDEFINED_ACCOMMODATION_TYPES
// - OCCUPATION_OPTIONS

// Keep only the i18n-enabled versions
export const getTravelPurposeOptions = (t) => [
  { value: 'HOLIDAY', label: t('thailand.travelPurposes.HOLIDAY') },
  // ...
];
```

**Step 4: Add migration note in CHANGELOG**
```markdown
## Breaking Changes
- Removed deprecated constants: `PREDEFINED_TRAVEL_PURPOSES`, `PREDEFINED_ACCOMMODATION_TYPES`, `OCCUPATION_OPTIONS`
- Use i18n-enabled functions instead: `getTravelPurposeOptions(t)`, `getAccommodationTypeOptions(t)`, `getOccupationOptions(t)`
```

---

## 🟡 **Fix #4: Extract Magic Numbers to Constants**

### Problem
**File**: `app/screens/thailand/ImmigrationOfficerViewScreen.js`

Magic numbers scattered throughout make the code hard to maintain.

```javascript
// Lines 1237-1239
width: Math.min(screenHeight * 0.5, screenWidth * 0.4, 400),
height: Math.min(screenHeight * 0.5, screenWidth * 0.4, 400),

// Line 1267
letterSpacing: 3,

// Line 1291
width: 120,
height: 150,
```

### Solution

Create a configuration constants file:

```javascript
// app/screens/thailand/immigrationOfficerViewConstants.js

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Configuration constants for Immigration Officer View Screen
 */

// QR Code Display
export const QR_CODE_CONFIG = {
  // Responsive sizing: 50% of screen height, 40% of width, max 400px
  MAX_SIZE: 400,
  HEIGHT_FACTOR: 0.5,
  WIDTH_FACTOR: 0.4,
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 2.0,
  ZOOM_SNAP_THRESHOLD_LOW: 0.8,
  ZOOM_SNAP_THRESHOLD_HIGH: 1.8,
};

// Typography
export const TYPOGRAPHY_CONFIG = {
  ENTRY_CARD_NUMBER: {
    SIZE: 40,
    LETTER_SPACING: 3,
    FONT_FAMILY_IOS: 'Courier New',
    FONT_FAMILY_ANDROID: 'monospace',
  },
  PASSPORT_NUMBER: {
    SIZE: 20,
    LETTER_SPACING: 1,
  },
};

// Image Sizes
export const IMAGE_CONFIG = {
  PASSPORT_PHOTO: {
    WIDTH: 120,
    HEIGHT: 150,
    BORDER_RADIUS: 8,
    BORDER_WIDTH: 2,
  },
  FUND_PHOTO: {
    WIDTH: 120,
    HEIGHT: 80,
    BORDER_RADIUS: 8,
  },
  DOCUMENT_PHOTO: {
    HEIGHT: 200,
    BORDER_RADIUS: 8,
  },
};

// Gesture Configuration
export const GESTURE_CONFIG = {
  LONG_PRESS_DURATION: 800,
  DOUBLE_TAP_DELAY: 300,
  SWIPE_DOWN_THRESHOLD: 50,
  SWIPE_DOWN_TOP_ZONE: 100,
};

// Animation
export const ANIMATION_CONFIG = {
  HIGHLIGHT_DURATION: 2000,
  ZOOM_SPRING_CONFIG: { damping: 15, stiffness: 150 },
};

// Computed values
export const getQRCodeSize = () => Math.min(
  SCREEN_HEIGHT * QR_CODE_CONFIG.HEIGHT_FACTOR,
  SCREEN_WIDTH * QR_CODE_CONFIG.WIDTH_FACTOR,
  QR_CODE_CONFIG.MAX_SIZE
);

export default {
  QR_CODE_CONFIG,
  TYPOGRAPHY_CONFIG,
  IMAGE_CONFIG,
  GESTURE_CONFIG,
  ANIMATION_CONFIG,
  getQRCodeSize,
};
```

**Usage in component:**

```javascript
import {
  QR_CODE_CONFIG,
  TYPOGRAPHY_CONFIG,
  IMAGE_CONFIG,
  getQRCodeSize,
} from './immigrationOfficerViewConstants';

// In styles:
qrCode: {
  width: getQRCodeSize(),
  height: getQRCodeSize(),
},
entryCardNumber: {
  fontSize: TYPOGRAPHY_CONFIG.ENTRY_CARD_NUMBER.SIZE,
  letterSpacing: TYPOGRAPHY_CONFIG.ENTRY_CARD_NUMBER.LETTER_SPACING,
  fontFamily: Platform.OS === 'ios'
    ? TYPOGRAPHY_CONFIG.ENTRY_CARD_NUMBER.FONT_FAMILY_IOS
    : TYPOGRAPHY_CONFIG.ENTRY_CARD_NUMBER.FONT_FAMILY_ANDROID,
},
passportPhoto: {
  width: IMAGE_CONFIG.PASSPORT_PHOTO.WIDTH,
  height: IMAGE_CONFIG.PASSPORT_PHOTO.HEIGHT,
  borderRadius: IMAGE_CONFIG.PASSPORT_PHOTO.BORDER_RADIUS,
  borderWidth: IMAGE_CONFIG.PASSPORT_PHOTO.BORDER_WIDTH,
},
```

---

## 🟡 **Fix #5: Add Null Safety Checks**

### Problem
**File**: `app/screens/thailand/ImmigrationOfficerViewScreen.js:486`

Missing null safety can cause crashes.

```javascript
{passportData?.fullName || passportData?.firstName + ' ' + passportData?.lastName || 'N/A'}
```

**Issue**: If `firstName` exists but `lastName` is `undefined`, will concatenate 'John undefined'

### Solution

```javascript
// Create a helper function
const getFullName = (passportData) => {
  if (!passportData) return 'N/A';

  if (passportData.fullName) {
    return passportData.fullName;
  }

  const firstName = passportData.firstName || '';
  const lastName = passportData.lastName || '';

  const combined = `${firstName} ${lastName}`.trim();
  return combined || 'N/A';
};

// Usage in render:
<Text style={styles.infoValue}>
  {getFullName(passportData)}
</Text>
```

**Apply this pattern throughout:**

```javascript
// Create helper functions file
// app/screens/thailand/helpers.js

/**
 * Safely get full name from passport data
 */
export const getFullName = (passportData) => {
  if (!passportData) return 'N/A';

  if (passportData.fullName) {
    return passportData.fullName;
  }

  const parts = [
    passportData.firstName,
    passportData.middleName,
    passportData.lastName,
  ].filter(Boolean);

  return parts.join(' ') || 'N/A';
};

/**
 * Safely format currency amount
 */
export const formatCurrency = (amount, currency = 'THB') => {
  if (amount === null || amount === undefined) {
    return `0 ${currency}`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount) + ` ${currency}`;
  } catch (error) {
    console.warn('Failed to format currency:', error);
    return `${amount} ${currency}`;
  }
};

/**
 * Safely get nested property
 */
export const safeGet = (obj, path, defaultValue = 'N/A') => {
  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }

  return result !== null && result !== undefined ? result : defaultValue;
};
```

---

## Testing Checklist

### Before Applying Fixes
- [ ] Create a feature branch: `git checkout -b fix/thailand-critical-bugs`
- [ ] Document current behavior with screenshots/videos
- [ ] Run existing tests: `npm test`
- [ ] Create test cases for regression testing

### After Applying Fixes
- [ ] All existing tests pass
- [ ] No new console warnings or errors
- [ ] Manual testing of affected screens
- [ ] Memory profiling shows no leaks
- [ ] Performance remains acceptable

### Specific Test Cases

**Fix #1 (Memory Leak):**
- [ ] Mount/unmount TDACSelectionScreen 10 times
- [ ] Check for memory leaks using React DevTools Profiler
- [ ] Verify event listener is cleaned up (check listeners count)

**Fix #2 (Async Cleanup):**
- [ ] Navigate to ImmigrationOfficerView and back 5 times
- [ ] Verify screen orientation restored correctly
- [ ] Verify brightness restored correctly
- [ ] No "Can't perform React state update on unmounted component" warnings

**Fix #3 (Deprecated Code):**
- [ ] Search codebase to ensure no usages of deprecated constants
- [ ] All i18n translations render correctly
- [ ] No missing translation keys

**Fix #4 (Magic Numbers):**
- [ ] QR code displays at correct size on different devices
- [ ] Typography remains consistent
- [ ] Images display at correct dimensions

**Fix #5 (Null Safety):**
- [ ] Test with incomplete passport data
- [ ] Test with null/undefined values
- [ ] No crashes or "undefined" text displayed

---

## Rollback Plan

If issues arise after applying fixes:

1. **Immediate Rollback**
   ```bash
   git revert <commit-sha>
   git push
   ```

2. **Partial Rollback** (if only one fix is problematic)
   ```bash
   git revert <specific-commit-sha>
   # Or manually revert specific changes
   ```

3. **Emergency Hotfix**
   - Identify problematic fix
   - Create hotfix branch from main
   - Apply only safe fixes
   - Deploy hotfix

---

## Implementation Priority

1. **Fix #2 (Async Cleanup)** - Can cause crashes
2. **Fix #1 (Memory Leak)** - Can cause performance issues
3. **Fix #5 (Null Safety)** - Can cause crashes
4. **Fix #4 (Magic Numbers)** - Code quality improvement
5. **Fix #3 (Deprecated Code)** - Technical debt cleanup

---

## Estimated Effort

- **Fix #1**: 1 hour
- **Fix #2**: 2 hours
- **Fix #3**: 3 hours (includes search and replace)
- **Fix #4**: 2 hours
- **Fix #5**: 1 hour
- **Testing**: 3 hours

**Total**: ~12 hours (1.5 days)
