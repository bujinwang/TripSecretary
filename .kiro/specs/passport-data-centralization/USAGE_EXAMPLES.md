# PassportDataService Usage Examples

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Screen Integration](#screen-integration)
3. [Form Handling](#form-handling)
4. [Migration Scenarios](#migration-scenarios)
5. [Error Handling](#error-handling)
6. [Performance Optimization](#performance-optimization)

## Basic Usage

### Initialize and Load Data

```javascript
import PassportDataService from './services/data/PassportDataService';

// Initialize service
await PassportDataService.initialize('user_123');

// Load all user data
const userData = await PassportDataService.getAllUserData('user_123');
console.log('Passport:', userData.passport);
console.log('Personal Info:', userData.personalInfo);
console.log('Funding Proof:', userData.fundingProof);
```

### Save New Data

```javascript
// Save passport
const passport = await PassportDataService.savePassport({
  passportNumber: 'E12345678',
  fullName: 'ZHANG, WEI',
  dateOfBirth: '1988-01-22',
  nationality: 'CHN',
  gender: 'Male',
  expiryDate: '2030-12-31',
  issueDate: '2020-12-31',
  issuePlace: 'Shanghai'
}, 'user_123');

// Save personal info
const personalInfo = await PassportDataService.savePersonalInfo({
  phoneNumber: '+86 13812345678',
  email: 'traveler@example.com',
  occupation: 'BUSINESS MAN',
  provinceCity: 'ANHUI',
  countryRegion: 'CHN'
}, 'user_123');

// Save funding proof
const fundingProof = await PassportDataService.saveFundingProof({
  cashAmount: '10,000 THB equivalent',
  bankCards: 'CMB Visa (****1234)',
  supportingDocs: 'Bank app screenshots'
}, 'user_123');
```

### Update Existing Data

```javascript
// Update single field
await PassportDataService.updatePassport('user_123', {
  expiryDate: '2031-12-31'
});

// Update multiple fields
await PassportDataService.updatePersonalInfo('user_123', {
  phoneNumber: '+86 13987654321',
  email: 'newemail@example.com',
  occupation: 'ENGINEER'
});
```

## Screen Integration

### Entry Form Screen (e.g., ThailandTravelInfoScreen)

```javascript
import React, { useState, useEffect } from 'react';
import PassportDataService from '../services/data/PassportDataService';

const ThailandTravelInfoScreen = () => {
  const [passportData, setPassportData] = useState({});
  const [personalInfo, setPersonalInfo] = useState({});
  const [fundingProof, setFundingProof] = useState({});
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userId = 'user_123'; // Get from auth context
      
      // Initialize service
      await PassportDataService.initialize(userId);
      
      // Load all data
      const userData = await PassportDataService.getAllUserData(userId);
      
      // Populate state
      if (userData.passport) {
        setPassportData({
          passportNumber: userData.passport.passportNumber,
          fullName: userData.passport.fullName,
          dateOfBirth: userData.passport.dateOfBirth,
          nationality: userData.passport.nationality,
          gender: userData.passport.gender,
          expiryDate: userData.passport.expiryDate
        });
      }
      
      if (userData.personalInfo) {
        setPersonalInfo({
          phoneNumber: userData.personalInfo.phoneNumber,
          email: userData.personalInfo.email,
          occupation: userData.personalInfo.occupation
        });
      }
      
      if (userData.fundingProof) {
        setFundingProof({
          cashAmount: userData.fundingProof.cashAmount,
          bankCards: userData.fundingProof.bankCards
        });
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePassportFieldChange = async (field, value) => {
    try {
      // Update local state
      setPassportData(prev => ({ ...prev, [field]: value }));
      
      // Save to database
      const userId = 'user_123';
      await PassportDataService.updatePassport(userId, {
        [field]: value
      });
    } catch (error) {
      console.error('Failed to update passport:', error);
    }
  };

  return (
    // Your UI components
    <View>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <TextInput
            value={passportData.passportNumber}
            onChangeText={(value) => handlePassportFieldChange('passportNumber', value)}
          />
          {/* More fields */}
        </>
      )}
    </View>
  );
};
```

### Profile Screen

```javascript
import React, { useState, useEffect } from 'react';
import PassportDataService from '../services/data/PassportDataService';

const ProfileScreen = () => {
  const [userData, setUserData] = useState({
    passport: {},
    personalInfo: {},
    fundingProof: {}
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userId = 'user_123';
      await PassportDataService.initialize(userId);
      const data = await PassportDataService.getAllUserData(userId);
      setUserData(data);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleSaveAll = async () => {
    try {
      const userId = 'user_123';
      
      // Use batch update for efficiency
      await PassportDataService.batchUpdate(userId, {
        passport: userData.passport,
        personalInfo: userData.personalInfo,
        fundingProof: userData.fundingProof
      });
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Failed to save:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  return (
    // Your UI components
    <View>
      {/* Passport fields */}
      {/* Personal info fields */}
      {/* Funding proof fields */}
      <Button title="Save All" onPress={handleSaveAll} />
    </View>
  );
};
```

## Form Handling

### Auto-save on Field Change

```javascript
const [passport, setPassport] = useState({});
const [saveTimeout, setSaveTimeout] = useState(null);

const handleFieldChange = (field, value) => {
  // Update local state immediately
  setPassport(prev => ({ ...prev, [field]: value }));
  
  // Debounce save
  if (saveTimeout) clearTimeout(saveTimeout);
  
  const timeout = setTimeout(async () => {
    try {
      await PassportDataService.updatePassport('user_123', {
        [field]: value
      });
      console.log('Auto-saved:', field);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, 1000); // Save after 1 second of no changes
  
  setSaveTimeout(timeout);
};
```

### Validation Before Save

```javascript
const handleSavePassport = async () => {
  try {
    // Validate locally first
    if (!passport.passportNumber || passport.passportNumber.length < 6) {
      Alert.alert('Error', 'Invalid passport number');
      return;
    }
    
    if (!passport.fullName || passport.fullName.trim().length === 0) {
      Alert.alert('Error', 'Full name is required');
      return;
    }
    
    // Save to database
    await PassportDataService.updatePassport('user_123', passport);
    Alert.alert('Success', 'Passport saved successfully');
  } catch (error) {
    if (error.name === 'ValidationError') {
      Alert.alert('Validation Error', error.message);
    } else {
      Alert.alert('Error', 'Failed to save passport');
    }
  }
};
```

## Migration Scenarios

### Check and Trigger Migration

```javascript
const initializeApp = async (userId) => {
  try {
    // Initialize service (automatically checks migration)
    await PassportDataService.initialize(userId);
    
    // Check if user has data
    const hasData = await PassportDataService.hasUserData(userId);
    
    if (!hasData) {
      console.log('New user - no data to migrate');
    } else {
      console.log('User has data');
    }
  } catch (error) {
    console.error('Initialization failed:', error);
  }
};
```

### Manual Migration with Progress

```javascript
const performMigration = async (userId) => {
  try {
    setMigrationStatus('Starting migration...');
    
    const result = await PassportDataService.migrateFromAsyncStorage(userId);
    
    if (result.alreadyMigrated) {
      setMigrationStatus('Already migrated');
      return;
    }
    
    if (result.success) {
      let message = 'Migration completed:\n';
      if (result.passport) message += '✓ Passport\n';
      if (result.personalInfo) message += '✓ Personal Info\n';
      if (result.fundingProof) message += '✓ Funding Proof\n';
      
      if (result.errors.length > 0) {
        message += '\nErrors:\n' + result.errors.join('\n');
      }
      
      setMigrationStatus(message);
    }
  } catch (error) {
    setMigrationStatus('Migration failed: ' + error.message);
  }
};
```

## Error Handling

### Comprehensive Error Handling

```javascript
const saveUserData = async (data, userId) => {
  try {
    await PassportDataService.savePassport(data, userId);
    return { success: true };
  } catch (error) {
    console.error('Save failed:', error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return {
        success: false,
        error: 'Please check your input',
        details: error.message
      };
    }
    
    if (error.name === 'StorageError') {
      return {
        success: false,
        error: 'Database error - please try again',
        details: error.message
      };
    }
    
    // Generic error
    return {
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    };
  }
};
```

### Retry Logic

```javascript
const saveWithRetry = async (data, userId, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await PassportDataService.savePassport(data, userId);
      console.log('Save successful on attempt', attempt);
      return true;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw new Error('Failed after ' + maxRetries + ' attempts');
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};
```

## Performance Optimization

### Batch Operations

```javascript
// Good: Single transaction
const updateAllData = async (userId, updates) => {
  await PassportDataService.batchUpdate(userId, {
    passport: updates.passport,
    personalInfo: updates.personalInfo,
    fundingProof: updates.fundingProof
  });
};

// Avoid: Multiple separate transactions
const updateAllDataSlow = async (userId, updates) => {
  await PassportDataService.updatePassport(userId, updates.passport);
  await PassportDataService.updatePersonalInfo(userId, updates.personalInfo);
  await PassportDataService.updateFundingProof(userId, updates.fundingProof);
};
```

### Cache Management

```javascript
// Monitor cache performance
const checkCachePerformance = () => {
  const stats = PassportDataService.getCacheStats();
  console.log('Cache hit rate:', stats.hitRate, '%');
  
  if (stats.hitRate < 50) {
    console.warn('Low cache hit rate - consider adjusting TTL');
  }
};

// Clear cache on logout
const handleLogout = () => {
  PassportDataService.clearCache();
  // Other logout logic
};

// Refresh cache after external update
const handleExternalUpdate = async (userId) => {
  await PassportDataService.refreshCache(userId);
  // Reload UI
};
```

### Lazy Loading

```javascript
// Load only what's needed
const loadPassportOnly = async (userId) => {
  const passport = await PassportDataService.getPassport(userId);
  return passport;
};

// Load all data when needed
const loadAllData = async (userId) => {
  const userData = await PassportDataService.getAllUserData(userId);
  return userData;
};
```

### Optimistic Updates

```javascript
const optimisticUpdate = async (field, value) => {
  // Update UI immediately
  setPassportData(prev => ({ ...prev, [field]: value }));
  
  try {
    // Save to database in background
    await PassportDataService.updatePassport('user_123', {
      [field]: value
    });
  } catch (error) {
    // Revert on error
    console.error('Update failed, reverting:', error);
    await loadUserData(); // Reload from database
    Alert.alert('Error', 'Failed to save changes');
  }
};
```
