# Data Consistency Validation - Usage Examples

## Overview
This document provides practical examples of how to use the data consistency validation features in PassportDataService.

## Example 1: Validate User Data Before Saving

```javascript
import PassportDataService from './app/services/data/PassportDataService';

async function saveUserPassport(userId, passportData) {
  try {
    // Save the passport data
    await PassportDataService.savePassport(passportData, userId);
    
    // Validate consistency after saving
    const validation = await PassportDataService.validateDataConsistency(userId);
    
    if (!validation.isConsistent) {
      console.error('Data validation failed:', validation);
      
      // Show errors to user
      if (!validation.passport.valid) {
        alert(`Passport errors: ${validation.passport.errors.join(', ')}`);
      }
      
      return false;
    }
    
    console.log('Passport saved and validated successfully');
    return true;
    
  } catch (error) {
    console.error('Failed to save passport:', error);
    return false;
  }
}
```

## Example 2: Detect and Resolve Conflicts on App Startup

```javascript
import PassportDataService from './app/services/data/PassportDataService';

async function initializeUserData(userId) {
  try {
    // Initialize the service
    await PassportDataService.initialize(userId);
    
    // Check for conflicts between AsyncStorage and SQLite
    const conflicts = await PassportDataService.detectDataConflicts(userId);
    
    if (conflicts.hasConflicts) {
      console.warn('Data conflicts detected:', conflicts);
      
      // Resolve conflicts (SQLite wins)
      const resolution = await PassportDataService.resolveDataConflicts(userId);
      
      console.log('Conflicts resolved:', resolution);
      
      // Optionally notify user
      if (resolution.hadConflicts) {
        showNotification('Your data has been synchronized');
      }
    }
    
    // Load user data
    const userData = await PassportDataService.getAllUserData(userId);
    return userData;
    
  } catch (error) {
    console.error('Failed to initialize user data:', error);
    throw error;
  }
}
```

## Example 3: Validate Before Form Submission

```javascript
import PassportDataService from './app/services/data/PassportDataService';

// In a React Native screen component
const ThailandTravelInfoScreen = () => {
  const [passportData, setPassportData] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  
  const handleSubmit = async () => {
    try {
      const userId = getCurrentUserId();
      
      // Save the data
      await PassportDataService.updatePassport(passportData.id, passportData);
      
      // Validate consistency
      const validation = await PassportDataService.validateDataConsistency(userId);
      
      if (!validation.isConsistent) {
        // Collect all errors
        const allErrors = [
          ...validation.passport.errors,
          ...validation.personalInfo.errors,
          ...validation.fundingProof.errors,
          ...validation.crossFieldValidation.errors
        ];
        
        setValidationErrors(allErrors);
        return;
      }
      
      // Clear errors and proceed
      setValidationErrors([]);
      navigation.navigate('NextScreen');
      
    } catch (error) {
      console.error('Submission failed:', error);
      Alert.alert('Error', 'Failed to save your information');
    }
  };
  
  return (
    <View>
      {/* Form fields */}
      
      {validationErrors.length > 0 && (
        <View style={styles.errorContainer}>
          {validationErrors.map((error, index) => (
            <Text key={index} style={styles.errorText}>{error}</Text>
          ))}
        </View>
      )}
      
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
};
```

## Example 4: Periodic Data Consistency Check

```javascript
import PassportDataService from './app/services/data/PassportDataService';

// Run periodic consistency checks
async function runDataConsistencyCheck(userId) {
  try {
    console.log('Running data consistency check...');
    
    const validation = await PassportDataService.validateDataConsistency(userId);
    
    if (!validation.isConsistent) {
      // Log to analytics/monitoring service
      logToAnalytics('data_consistency_failure', {
        userId,
        errors: {
          passport: validation.passport.errors,
          personalInfo: validation.personalInfo.errors,
          fundingProof: validation.fundingProof.errors,
          crossField: validation.crossFieldValidation.errors
        }
      });
      
      // Optionally notify user
      showNotification('Please review your profile information');
    }
    
    return validation;
    
  } catch (error) {
    console.error('Consistency check failed:', error);
    return null;
  }
}

// Run check every 24 hours
setInterval(() => {
  const userId = getCurrentUserId();
  if (userId) {
    runDataConsistencyCheck(userId);
  }
}, 24 * 60 * 60 * 1000);
```

## Example 5: Manual Conflict Resolution

```javascript
import PassportDataService from './app/services/data/PassportDataService';

async function manualConflictResolution(userId) {
  try {
    // Detect conflicts
    const conflicts = await PassportDataService.detectDataConflicts(userId);
    
    if (!conflicts.hasConflicts) {
      console.log('No conflicts found');
      return;
    }
    
    // Show conflicts to user
    console.log('Conflicts detected:');
    
    if (conflicts.conflicts.passport) {
      console.log('Passport conflicts:');
      conflicts.conflicts.passport.differences.forEach(diff => {
        console.log(`  ${diff.field}:`);
        console.log(`    SQLite: ${diff.sqliteValue}`);
        console.log(`    AsyncStorage: ${diff.asyncStorageValue}`);
      });
    }
    
    if (conflicts.conflicts.personalInfo) {
      console.log('Personal Info conflicts:');
      conflicts.conflicts.personalInfo.differences.forEach(diff => {
        console.log(`  ${diff.field}:`);
        console.log(`    SQLite: ${diff.sqliteValue}`);
        console.log(`    AsyncStorage: ${diff.asyncStorageValue}`);
      });
    }
    
    if (conflicts.conflicts.fundingProof) {
      console.log('Funding Proof conflicts:');
      conflicts.conflicts.fundingProof.differences.forEach(diff => {
        console.log(`  ${diff.field}:`);
        console.log(`    SQLite: ${diff.sqliteValue}`);
        console.log(`    AsyncStorage: ${diff.asyncStorageValue}`);
      });
    }
    
    // Ask user for confirmation
    const shouldResolve = await confirmWithUser(
      'Data conflicts detected. Use the latest data from the database?'
    );
    
    if (shouldResolve) {
      const resolution = await PassportDataService.resolveDataConflicts(userId);
      console.log('Conflicts resolved:', resolution);
      showNotification('Data synchronized successfully');
    }
    
  } catch (error) {
    console.error('Failed to resolve conflicts:', error);
  }
}
```

## Example 6: Validation in Profile Screen

```javascript
import PassportDataService from './app/services/data/PassportDataService';

const ProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [validationStatus, setValidationStatus] = useState(null);
  
  useEffect(() => {
    loadAndValidateData();
  }, []);
  
  const loadAndValidateData = async () => {
    try {
      const userId = getCurrentUserId();
      
      // Load all user data
      const data = await PassportDataService.getAllUserData(userId);
      setUserData(data);
      
      // Validate consistency
      const validation = await PassportDataService.validateDataConsistency(userId);
      setValidationStatus(validation);
      
      // Show warning if data is inconsistent
      if (!validation.isConsistent) {
        Alert.alert(
          'Data Validation',
          'Some of your information needs attention. Please review and update.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };
  
  const renderValidationStatus = () => {
    if (!validationStatus) return null;
    
    if (validationStatus.isConsistent) {
      return (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>✓ All information is valid</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.warningBanner}>
        <Text style={styles.warningText}>⚠ Please review your information</Text>
        {!validationStatus.passport.valid && (
          <Text style={styles.errorDetail}>Passport: {validationStatus.passport.errors.join(', ')}</Text>
        )}
        {!validationStatus.personalInfo.valid && (
          <Text style={styles.errorDetail}>Personal Info: {validationStatus.personalInfo.errors.join(', ')}</Text>
        )}
        {!validationStatus.fundingProof.valid && (
          <Text style={styles.errorDetail}>Funding Proof: {validationStatus.fundingProof.errors.join(', ')}</Text>
        )}
      </View>
    );
  };
  
  return (
    <ScrollView>
      {renderValidationStatus()}
      {/* Rest of profile UI */}
    </ScrollView>
  );
};
```

## Validation Result Structure

```javascript
{
  isConsistent: true/false,
  userId: "user-123",
  validatedAt: "2024-01-15T10:30:00Z",
  
  passport: {
    valid: true/false,
    errors: [
      "Missing required field: passportNumber",
      "Invalid date of birth format",
      "Issue date must be before expiry date"
    ]
  },
  
  personalInfo: {
    valid: true/false,
    errors: [
      "Invalid email format",
      "Invalid phone number length"
    ]
  },
  
  fundingProof: {
    valid: true/false,
    errors: [
      "At least one funding proof field must be provided"
    ]
  },
  
  crossFieldValidation: {
    valid: true/false,
    errors: [
      "Inconsistent userId across data types: user-1, user-2",
      "Nationality mismatch: passport=CHN, personalInfo=USA"
    ]
  }
}
```

## Conflict Detection Result Structure

```javascript
{
  hasConflicts: true/false,
  userId: "user-123",
  detectedAt: "2024-01-15T10:30:00Z",
  resolution: "SQLite data takes precedence",
  
  conflicts: {
    passport: {
      hasDifferences: true/false,
      differences: [
        {
          field: "passportNumber",
          sqliteValue: "E12345678",
          asyncStorageValue: "E87654321"
        }
      ]
    },
    
    personalInfo: {
      hasDifferences: true/false,
      differences: [
        {
          field: "email",
          sqliteValue: "new@example.com",
          asyncStorageValue: "old@example.com"
        }
      ]
    },
    
    fundingProof: {
      hasDifferences: true/false,
      differences: [
        {
          field: "cashAmount",
          sqliteValue: "10000 THB",
          asyncStorageValue: "5000 THB"
        }
      ]
    }
  }
}
```

## Best Practices

1. **Validate After Every Save**: Always validate data consistency after saving to catch issues early
2. **Check Conflicts on Startup**: Run conflict detection when the app starts to ensure data integrity
3. **Show User-Friendly Errors**: Convert validation errors into user-friendly messages
4. **Log for Monitoring**: Log validation failures and conflicts for monitoring and debugging
5. **Periodic Checks**: Run periodic consistency checks to catch data corruption
6. **Cache Refresh**: Always refresh cache after resolving conflicts
7. **Non-Blocking**: Run validation asynchronously to avoid blocking the UI

## Error Handling

```javascript
try {
  const validation = await PassportDataService.validateDataConsistency(userId);
  // Handle validation result
} catch (error) {
  if (error.message.includes('not found')) {
    // Handle missing data
    console.log('No data found for user');
  } else if (error.message.includes('database')) {
    // Handle database errors
    console.error('Database error:', error);
    showError('Failed to validate data. Please try again.');
  } else {
    // Handle other errors
    console.error('Validation error:', error);
    showError('An unexpected error occurred');
  }
}
```
