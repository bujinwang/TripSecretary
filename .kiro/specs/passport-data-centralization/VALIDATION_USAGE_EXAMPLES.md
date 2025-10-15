# Data Consistency Validation - Usage Examples

This document provides practical examples of how to use the data consistency validation methods in your screens and components.

## Basic Usage

### 1. Validate All User Data

```javascript
import PassportDataService from '../services/data/PassportDataService';

// In your component or service
const validateUserData = async (userId) => {
  try {
    const result = await PassportDataService.validateDataConsistency(userId);
    
    if (result.isConsistent) {
      console.log('✅ All data is valid and consistent');
      return true;
    } else {
      console.log('❌ Validation failed');
      
      // Log specific errors
      if (!result.passport.valid) {
        console.log('Passport errors:', result.passport.errors);
      }
      if (!result.personalInfo.valid) {
        console.log('Personal info errors:', result.personalInfo.errors);
      }
      if (!result.fundingProof.valid) {
        console.log('Funding proof errors:', result.fundingProof.errors);
      }
      if (!result.crossFieldValidation.valid) {
        console.log('Cross-field errors:', result.crossFieldValidation.errors);
      }
      
      return false;
    }
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
};
```

## Screen Integration Examples

### 2. ProfileScreen - Validate Before Save

```javascript
// In ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import PassportDataService from '../services/data/PassportDataService';

const ProfileScreen = () => {
  const [userId] = useState('user-123');
  const [validationErrors, setValidationErrors] = useState(null);

  const handleSaveProfile = async () => {
    try {
      // Save the data first
      await PassportDataService.updatePassport(passportId, passportUpdates);
      await PassportDataService.updatePersonalInfo(personalInfoId, personalInfoUpdates);
      
      // Validate after save
      const validation = await PassportDataService.validateDataConsistency(userId);
      
      if (validation.isConsistent) {
        Alert.alert('Success', 'Profile saved successfully');
        setValidationErrors(null);
      } else {
        // Show validation errors to user
        const errorMessages = [];
        
        if (!validation.passport.valid) {
          errorMessages.push('Passport: ' + validation.passport.errors.join(', '));
        }
        if (!validation.personalInfo.valid) {
          errorMessages.push('Personal Info: ' + validation.personalInfo.errors.join(', '));
        }
        
        setValidationErrors(errorMessages);
        Alert.alert('Validation Warning', errorMessages.join('\n'));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  return (
    <View>
      {/* Your form fields */}
      
      {validationErrors && (
        <View style={{ backgroundColor: '#fff3cd', padding: 10 }}>
          <Text style={{ color: '#856404' }}>
            Please fix the following issues:
          </Text>
          {validationErrors.map((error, index) => (
            <Text key={index} style={{ color: '#856404' }}>
              • {error}
            </Text>
          ))}
        </View>
      )}
      
      <Button title="Save Profile" onPress={handleSaveProfile} />
    </View>
  );
};
```

### 3. ThailandTravelInfoScreen - Validate on Load

```javascript
// In ThailandTravelInfoScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import PassportDataService from '../services/data/PassportDataService';

const ThailandTravelInfoScreen = () => {
  const [userId] = useState('user-123');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [hasValidationIssues, setHasValidationIssues] = useState(false);

  useEffect(() => {
    loadAndValidateData();
  }, []);

  const loadAndValidateData = async () => {
    try {
      // Load all user data
      const userData = await PassportDataService.getAllUserData(userId);
      
      // Populate form fields
      setPassportData(userData.passport);
      setPersonalInfo(userData.personalInfo);
      setFundingProof(userData.fundingProof);
      
      // Validate the loaded data
      const validation = await PassportDataService.validateDataConsistency(userId);
      
      if (!validation.isConsistent) {
        console.warn('Data validation issues detected:', validation);
        setHasValidationIssues(true);
        
        // Optionally show a warning to the user
        Alert.alert(
          'Data Validation',
          'Some of your saved data may need to be updated. Please review your information.',
          [{ text: 'OK' }]
        );
      }
      
      setDataLoaded(true);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load your data');
    }
  };

  return (
    <View>
      {hasValidationIssues && (
        <View style={{ backgroundColor: '#fff3cd', padding: 10, marginBottom: 10 }}>
          <Text style={{ color: '#856404', fontWeight: 'bold' }}>
            ⚠️ Please review your information
          </Text>
          <Text style={{ color: '#856404' }}>
            Some fields may need to be updated
          </Text>
        </View>
      )}
      
      {/* Your form fields */}
    </View>
  );
};
```

### 4. Real-time Field Validation

```javascript
// Validate individual fields as user types
const PassportNumberInput = ({ value, onChange, userId }) => {
  const [error, setError] = useState(null);

  const handleChange = async (newValue) => {
    onChange(newValue);
    
    // Create a temporary passport object for validation
    const tempPassport = {
      passportNumber: newValue,
      fullName: 'TEMP',
      nationality: 'CHN',
      dateOfBirth: '1990-01-01',
      expiryDate: '2030-01-01',
      userId: userId
    };
    
    // Validate
    const validation = PassportDataService.validatePassportData(tempPassport);
    
    if (!validation.valid) {
      const passportNumberErrors = validation.errors.filter(e => 
        e.includes('passportNumber')
      );
      setError(passportNumberErrors[0] || null);
    } else {
      setError(null);
    }
  };

  return (
    <View>
      <TextInput
        value={value}
        onChangeText={handleChange}
        placeholder="Passport Number"
      />
      {error && (
        <Text style={{ color: 'red', fontSize: 12 }}>{error}</Text>
      )}
    </View>
  );
};
```

### 5. Batch Validation Before Submission

```javascript
// Validate all data before submitting a form
const handleSubmitTravelForm = async () => {
  try {
    // First, save all the data
    await PassportDataService.updatePassport(passportId, passportData);
    await PassportDataService.updatePersonalInfo(personalInfoId, personalInfoData);
    await PassportDataService.updateFundingProof(fundingProofId, fundingProofData);
    
    // Then validate everything
    const validation = await PassportDataService.validateDataConsistency(userId);
    
    if (!validation.isConsistent) {
      // Collect all errors
      const allErrors = [
        ...validation.passport.errors,
        ...validation.personalInfo.errors,
        ...validation.fundingProof.errors,
        ...validation.crossFieldValidation.errors
      ];
      
      // Show errors to user
      Alert.alert(
        'Please Fix These Issues',
        allErrors.join('\n'),
        [{ text: 'OK' }]
      );
      
      return false;
    }
    
    // Proceed with form submission
    console.log('✅ All data validated, proceeding with submission');
    return true;
    
  } catch (error) {
    console.error('Submission error:', error);
    Alert.alert('Error', 'Failed to submit form');
    return false;
  }
};
```

### 6. Background Validation on App Startup

```javascript
// In App.js or main navigation component
import React, { useEffect } from 'react';
import PassportDataService from './app/services/data/PassportDataService';

const App = () => {
  useEffect(() => {
    performStartupValidation();
  }, []);

  const performStartupValidation = async () => {
    try {
      const userId = await getCurrentUserId(); // Your auth method
      
      if (!userId) return;
      
      // Validate data consistency on startup
      const validation = await PassportDataService.validateDataConsistency(userId);
      
      if (!validation.isConsistent) {
        console.warn('Data consistency issues detected on startup:', validation);
        
        // Log for analytics/debugging
        logAnalyticsEvent('data_validation_failed', {
          userId,
          errors: validation
        });
        
        // Optionally notify user or trigger data repair flow
      } else {
        console.log('✅ Data consistency check passed on startup');
      }
    } catch (error) {
      console.error('Startup validation error:', error);
    }
  };

  return (
    // Your app components
  );
};
```

### 7. Validation Helper Hook

```javascript
// Create a custom hook for easy validation
import { useState, useCallback } from 'react';
import PassportDataService from '../services/data/PassportDataService';

export const useDataValidation = (userId) => {
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async () => {
    setIsValidating(true);
    try {
      const result = await PassportDataService.validateDataConsistency(userId);
      setValidationResult(result);
      return result;
    } catch (error) {
      console.error('Validation error:', error);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [userId]);

  const getErrorMessages = useCallback(() => {
    if (!validationResult || validationResult.isConsistent) {
      return [];
    }

    const messages = [];
    if (!validationResult.passport.valid) {
      messages.push(...validationResult.passport.errors);
    }
    if (!validationResult.personalInfo.valid) {
      messages.push(...validationResult.personalInfo.errors);
    }
    if (!validationResult.fundingProof.valid) {
      messages.push(...validationResult.fundingProof.errors);
    }
    if (!validationResult.crossFieldValidation.valid) {
      messages.push(...validationResult.crossFieldValidation.errors);
    }

    return messages;
  }, [validationResult]);

  return {
    validate,
    validationResult,
    isValidating,
    isValid: validationResult?.isConsistent ?? true,
    errorMessages: getErrorMessages()
  };
};

// Usage in a component
const MyScreen = () => {
  const userId = 'user-123';
  const { validate, isValid, errorMessages, isValidating } = useDataValidation(userId);

  useEffect(() => {
    validate();
  }, [validate]);

  return (
    <View>
      {isValidating && <Text>Validating...</Text>}
      {!isValid && (
        <View>
          <Text>Validation Errors:</Text>
          {errorMessages.map((msg, i) => (
            <Text key={i}>• {msg}</Text>
          ))}
        </View>
      )}
    </View>
  );
};
```

## Best Practices

1. **Validate After Save**: Always validate data after saving to ensure consistency
2. **Show User-Friendly Errors**: Convert technical validation errors to user-friendly messages
3. **Don't Block User**: Use warnings instead of blocking the user from proceeding
4. **Log Validation Issues**: Log validation failures for debugging and analytics
5. **Validate on Load**: Check data consistency when loading to detect issues early
6. **Periodic Validation**: Consider running validation checks periodically in the background
7. **Handle Errors Gracefully**: Always wrap validation calls in try-catch blocks

## Error Message Mapping

```javascript
// Helper to convert technical errors to user-friendly messages
const getUserFriendlyError = (technicalError) => {
  const errorMap = {
    'Missing required field: passportNumber': 'Please enter your passport number',
    'Missing required field: fullName': 'Please enter your full name',
    'Invalid date of birth format': 'Please enter a valid date of birth',
    'Invalid email format': 'Please enter a valid email address',
    'Invalid phone number length': 'Please enter a valid phone number',
    'Issue date must be before expiry date': 'Your passport issue date must be before the expiry date',
    'At least one funding proof field must be provided': 'Please provide at least one proof of funds'
  };

  return errorMap[technicalError] || technicalError;
};
```

## Testing Validation

```javascript
// Example test for validation in your component
describe('ProfileScreen Validation', () => {
  it('should show validation errors when data is invalid', async () => {
    // Mock invalid data
    PassportDataService.validateDataConsistency = jest.fn().mockResolvedValue({
      isConsistent: false,
      passport: {
        valid: false,
        errors: ['Missing required field: passportNumber']
      }
    });

    const { getByText } = render(<ProfileScreen />);
    
    // Trigger save
    fireEvent.press(getByText('Save Profile'));
    
    // Wait for validation
    await waitFor(() => {
      expect(getByText(/Please fix the following issues/)).toBeTruthy();
    });
  });
});
```
