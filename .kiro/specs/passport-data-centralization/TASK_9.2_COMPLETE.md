# Task 9.2 Complete: Error Handling for Data Conflicts

## Summary

Successfully implemented comprehensive error handling for data conflicts between AsyncStorage and SQLite. The implementation includes:

1. **Conflict Detection** - Detects when AsyncStorage and SQLite have different data
2. **Conflict Resolution** - Implements resolution strategy (SQLite wins)
3. **Detailed Logging** - Logs conflicts for debugging with comprehensive details
4. **Error Categorization** - Categorizes errors and provides actionable suggestions

## Implementation Details

### 1. Enhanced Conflict Detection

The existing `detectDataConflicts()` method was already implemented and compares data between AsyncStorage and SQLite for:
- Passport data (passportNumber, fullName, dateOfBirth, nationality, gender, etc.)
- Personal info (phoneNumber, email, homeAddress, occupation, etc.)
- Funding proof (cashAmount, bankCards, supportingDocs)

### 2. Conflict Resolution

The existing `resolveDataConflicts()` method was already implemented and:
- Prioritizes SQLite data as the source of truth
- Logs conflicts with detailed information
- Clears cache to force reload from SQLite
- Returns resolution result with conflict details

### 3. New Error Handling Methods

Added the following new methods to `PassportDataService`:

#### `getAllUserDataWithConflictHandling(userId, options)`
Wrapper around `getAllUserData()` that adds automatic conflict detection and resolution:
- Loads data from SQLite (source of truth)
- Optionally detects conflicts with AsyncStorage
- Optionally resolves conflicts automatically
- Returns data with conflict handling metadata
- Handles errors gracefully with fallback to SQLite data

**Options:**
- `detectConflicts` (default: true) - Enable/disable conflict detection
- `resolveConflicts` (default: true) - Enable/disable automatic resolution

**Return format:**
```javascript
{
  passport: {...},
  personalInfo: {...},
  fundingProof: {...},
  userId: 'user-123',
  loadedAt: '2024-01-15T10:30:00Z',
  conflictHandling: {
    enabled: true,
    hasConflicts: true/false,
    resolved: true/false,
    conflicts: {...},
    resolution: {...},
    message: 'Conflicts detected and resolved (SQLite wins)'
  }
}
```

#### `checkAndLogConflicts(userId)`
Checks for conflicts and logs them in detail without loading all data:
- Useful for background conflict checking
- Logs detailed conflict report to console
- Shows field-by-field differences
- Compares SQLite vs AsyncStorage values

**Console output format:**
```
=== DATA CONFLICT DETECTED ===
User ID: user-123
Detected at: 2024-01-15T10:30:00Z
Resolution strategy: SQLite data takes precedence

Passport conflicts:
  - passportNumber:
    SQLite: E12345678
    AsyncStorage: E87654321
  - fullName:
    SQLite: ZHANG, WEI
    AsyncStorage: WANG, LI

Personal Info conflicts:
  - phoneNumber:
    SQLite: +86 12345678901
    AsyncStorage: +86 98765432109

=== END CONFLICT REPORT ===
```

#### `handleDataOperationError(error, operation, userId)`
Categorizes errors and provides actionable suggestions:

**Error Categories:**
- `NOT_FOUND` - Data not found for user
- `VALIDATION_ERROR` - Data validation failed
- `CONFLICT_ERROR` - Data conflict detected
- `DATABASE_ERROR` - SQLite operation failed
- `ASYNCSTORAGE_ERROR` - AsyncStorage operation failed
- `UNKNOWN_ERROR` - Unrecognized error

**Return format:**
```javascript
{
  success: false,
  operation: 'getPassport',
  userId: 'user-123',
  error: {
    message: 'Passport not found: test-id',
    name: 'Error',
    stack: '...'
  },
  category: 'NOT_FOUND',
  suggestions: [
    'Check if data exists for this user',
    'Try running migration if this is an existing user'
  ],
  timestamp: '2024-01-15T10:30:00Z'
}
```

**Console output format:**
```
=== DATA OPERATION ERROR ===
Operation: getPassport
User ID: user-123
Category: NOT_FOUND
Error: Passport not found: test-id
Suggestions:
  - Check if data exists for this user
  - Try running migration if this is an existing user
=== END ERROR REPORT ===
```

#### `safeLoadUserData(userId, options)`
Safely loads user data with comprehensive error handling:
- Wraps `getAllUserDataWithConflictHandling()`
- Catches and categorizes all errors
- Returns success/error result
- Never throws exceptions

**Return format (success):**
```javascript
{
  success: true,
  data: {
    passport: {...},
    personalInfo: {...},
    fundingProof: {...},
    conflictHandling: {...}
  },
  timestamp: '2024-01-15T10:30:00Z'
}
```

**Return format (error):**
```javascript
{
  success: false,
  error: {
    operation: 'safeLoadUserData',
    userId: 'user-123',
    category: 'DATABASE_ERROR',
    error: {...},
    suggestions: [...]
  },
  timestamp: '2024-01-15T10:30:00Z'
}
```

## Usage Examples

### Example 1: Load Data with Automatic Conflict Handling

```javascript
import PassportDataService from './services/data/PassportDataService';

// Load data with automatic conflict detection and resolution
const userData = await PassportDataService.getAllUserDataWithConflictHandling(userId);

if (userData.conflictHandling.hasConflicts) {
  console.log('Conflicts were detected and resolved');
  console.log('Conflicts:', userData.conflictHandling.conflicts);
}

// Use the data (SQLite is source of truth)
setPassportData(userData.passport);
setPersonalInfo(userData.personalInfo);
setFundingProof(userData.fundingProof);
```

### Example 2: Load Data Without Conflict Detection

```javascript
// Skip conflict detection for performance
const userData = await PassportDataService.getAllUserDataWithConflictHandling(
  userId,
  { detectConflicts: false }
);

// No conflict checking performed
console.log(userData.conflictHandling.enabled); // false
```

### Example 3: Check for Conflicts Without Loading Data

```javascript
// Background conflict check
const result = await PassportDataService.checkAndLogConflicts(userId);

if (result.hasConflicts) {
  console.log('Conflicts detected!');
  console.log('Conflicts:', result.conflicts);
  // Detailed log already written to console
}
```

### Example 4: Safe Data Loading with Error Handling

```javascript
// Load data with comprehensive error handling
const result = await PassportDataService.safeLoadUserData(userId);

if (result.success) {
  // Data loaded successfully
  const userData = result.data;
  setPassportData(userData.passport);
} else {
  // Error occurred
  const error = result.error;
  console.error(`Error: ${error.category}`);
  console.error('Suggestions:', error.suggestions);
  
  // Show user-friendly error message
  showError(`Failed to load data: ${error.error.message}`);
}
```

### Example 5: Manual Conflict Resolution

```javascript
// Detect conflicts
const conflictResult = await PassportDataService.detectDataConflicts(userId);

if (conflictResult.hasConflicts) {
  console.log('Conflicts detected:', conflictResult.conflicts);
  
  // Resolve conflicts (SQLite wins)
  const resolution = await PassportDataService.resolveDataConflicts(userId);
  
  console.log('Resolution:', resolution.resolution);
  console.log('Conflicts resolved:', resolution.resolved);
}
```

### Example 6: Error Handling in Screen Components

```javascript
// In ThailandTravelInfoScreen or ProfileScreen
useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load data with conflict handling
      const result = await PassportDataService.safeLoadUserData(userId);
      
      if (result.success) {
        const userData = result.data;
        
        // Check for conflicts
        if (userData.conflictHandling.hasConflicts) {
          console.warn('Data conflicts were resolved');
          // Optionally show user notification
          showNotification('Your data was synchronized');
        }
        
        // Update state
        setPassportData(userData.passport);
        setPersonalInfo(userData.personalInfo);
        setFundingProof(userData.fundingProof);
      } else {
        // Handle error
        const error = result.error;
        console.error('Failed to load data:', error);
        
        // Show user-friendly error based on category
        switch (error.category) {
          case 'NOT_FOUND':
            showError('No saved data found. Please enter your information.');
            break;
          case 'DATABASE_ERROR':
            showError('Database error. Please try again.');
            break;
          default:
            showError('Failed to load data. Please try again.');
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      showError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  loadData();
}, [userId]);
```

## Testing

Created comprehensive test suite in `app/services/data/__tests__/PassportDataService.conflicts.test.js` covering:

1. **Conflict Detection Tests**
   - No conflicts when data matches
   - Detect passport data conflicts
   - Detect personal info conflicts
   - Detect funding proof conflicts

2. **Conflict Resolution Tests**
   - Resolve conflicts by prioritizing SQLite
   - Handle no conflicts scenario

3. **Conflict Handling Tests**
   - Load data with conflict detection
   - Automatic conflict resolution
   - Skip conflict detection when disabled
   - Handle detection errors gracefully

4. **Logging Tests**
   - Log conflicts in detail
   - Handle no conflicts scenario

5. **Error Handling Tests**
   - Categorize NOT_FOUND errors
   - Categorize VALIDATION_ERROR
   - Categorize CONFLICT_ERROR
   - Categorize DATABASE_ERROR
   - Categorize ASYNCSTORAGE_ERROR
   - Categorize UNKNOWN_ERROR

6. **Safe Loading Tests**
   - Successfully load data
   - Handle errors gracefully

## Requirements Satisfied

✅ **Requirement 5.5**: IF passport data conflicts exist between AsyncStorage and SQLite THEN the system SHALL prioritize SQLite as the source of truth

✅ **Requirement 10.5**: IF SQLite operations fail THEN the system SHALL provide graceful error handling and user-friendly error messages

## Key Features

1. **Automatic Conflict Detection** - Compares AsyncStorage and SQLite data automatically
2. **SQLite Priority** - Always uses SQLite as source of truth
3. **Detailed Logging** - Logs all conflicts with field-by-field comparison
4. **Error Categorization** - Categorizes errors for better handling
5. **Actionable Suggestions** - Provides suggestions for each error type
6. **Graceful Degradation** - Continues operation even if conflict detection fails
7. **Flexible Options** - Can enable/disable conflict detection and resolution
8. **Safe Loading** - Never throws exceptions, always returns result object

## Benefits

1. **Data Integrity** - Ensures SQLite is always the source of truth
2. **Debugging** - Detailed logs help identify and fix data issues
3. **User Experience** - Graceful error handling prevents app crashes
4. **Developer Experience** - Clear error categories and suggestions
5. **Performance** - Optional conflict detection for performance-critical paths
6. **Reliability** - Comprehensive error handling prevents data loss

## Files Modified

- `app/services/data/PassportDataService.js` - Added error handling methods

## Files Created

- `app/services/data/__tests__/PassportDataService.conflicts.test.js` - Test suite

## Next Steps

This task is complete. The conflict detection and error handling system is fully implemented and ready for use. Screens can now use the new methods to safely load data with automatic conflict resolution.

Recommended integration:
1. Update `ThailandTravelInfoScreen` to use `safeLoadUserData()`
2. Update `ProfileScreen` to use `safeLoadUserData()`
3. Add background conflict checking on app startup
4. Add user notifications when conflicts are resolved
