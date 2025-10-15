# Batch Operations Demo

## Quick Start Guide

### 1. Batch Loading (Automatic)

The fastest way to load all user data:

```javascript
import PassportDataService from './app/services/data/PassportDataService';

// Initialize service
await PassportDataService.initialize('user_123');

// Load all data in one transaction (FAST!)
const userData = await PassportDataService.getAllUserData('user_123');

console.log('Passport:', userData.passport);
console.log('Personal Info:', userData.personalInfo);
console.log('Funding Proof:', userData.fundingProof);
console.log('Load time:', userData.loadDurationMs, 'ms');
```

**Expected Output:**
```
Loading all user data for user user_123 (batch: true)
Batch load completed in 15ms
Passport: { passportNumber: 'E12345678', fullName: 'ZHANG, WEI', ... }
Personal Info: { email: 'test@example.com', phoneNumber: '+86 123456789', ... }
Funding Proof: { cashAmount: '10000 THB', ... }
Load time: 15 ms
```

### 2. Batch Update (Atomic)

Update multiple fields across different data types atomically:

```javascript
// Update multiple data types in one transaction
const result = await PassportDataService.batchUpdate('user_123', {
  passport: {
    fullName: 'ZHANG, WEI (UPDATED)',
    gender: 'Male'
  },
  personalInfo: {
    email: 'newemail@example.com',
    phoneNumber: '+86 987654321'
  },
  fundingProof: {
    cashAmount: '20000 THB',
    bankCards: 'CMB Visa (****5678)'
  }
});

console.log('Update completed!');
console.log('Updated passport:', result.passport);
console.log('Updated personal info:', result.personalInfo);
console.log('Updated funding proof:', result.fundingProof);
```

**Expected Output:**
```
Starting batch update for user user_123
Loading all user data for user user_123 (batch: true)
Batch load completed in 12ms
Starting batch save with 3 operations
Batch save completed in 18ms
Batch update completed in 35ms
Update completed!
Updated passport: { fullName: 'ZHANG, WEI (UPDATED)', gender: 'Male', ... }
Updated personal info: { email: 'newemail@example.com', ... }
Updated funding proof: { cashAmount: '20000 THB', ... }
```

### 3. Partial Update

Update only specific fields:

```javascript
// Only update passport, leave other data unchanged
const result = await PassportDataService.batchUpdate('user_123', {
  passport: {
    fullName: 'ZHANG, WEI'
  }
  // personalInfo and fundingProof not included = not updated
});
```

### 4. Performance Comparison

Compare batch vs parallel loading:

```javascript
// Test batch loading
console.log('Testing batch loading...');
PassportDataService.clearCache();
const batchStart = Date.now();
const batchData = await PassportDataService.getAllUserData('user_123', {
  useBatchLoad: true
});
const batchTime = Date.now() - batchStart;

// Test parallel loading
console.log('Testing parallel loading...');
PassportDataService.clearCache();
const parallelStart = Date.now();
const parallelData = await PassportDataService.getAllUserData('user_123', {
  useBatchLoad: false
});
const parallelTime = Date.now() - parallelStart;

console.log('=== Performance Comparison ===');
console.log(`Batch loading: ${batchTime}ms`);
console.log(`Parallel loading: ${parallelTime}ms`);
console.log(`Improvement: ${((parallelTime - batchTime) / parallelTime * 100).toFixed(1)}%`);
```

**Expected Output:**
```
Testing batch loading...
Loading all user data for user user_123 (batch: true)
Batch load completed in 15ms

Testing parallel loading...
Loading all user data for user user_123 (batch: false)
[CACHE MISS] passport for user user_123
[CACHE MISS] personalInfo for user user_123
[CACHE MISS] fundingProof for user user_123
All user data loaded in 48ms using parallel loading

=== Performance Comparison ===
Batch loading: 15ms
Parallel loading: 48ms
Improvement: 68.8%
```

## Real-World Usage Examples

### Example 1: Screen Load (ThailandTravelInfoScreen)

```javascript
// In ThailandTravelInfoScreen.js
useEffect(() => {
  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load all data efficiently with batch loading
      const userData = await PassportDataService.getAllUserData(userId);
      
      // Populate form fields
      if (userData.passport) {
        setPassportNumber(userData.passport.passportNumber);
        setFullName(userData.passport.fullName);
        setGender(userData.passport.gender);
        // ... more fields
      }
      
      if (userData.personalInfo) {
        setEmail(userData.personalInfo.email);
        setPhoneNumber(userData.personalInfo.phoneNumber);
        // ... more fields
      }
      
      if (userData.fundingProof) {
        setCashAmount(userData.fundingProof.cashAmount);
        // ... more fields
      }
      
      console.log(`Data loaded in ${userData.loadDurationMs}ms`);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  loadUserData();
}, [userId]);
```

### Example 2: Form Submission with Multiple Updates

```javascript
// In ProfileScreen.js
const handleSaveAll = async () => {
  try {
    setSaving(true);
    
    // Collect all changes
    const updates = {};
    
    if (passportChanged) {
      updates.passport = {
        fullName: fullName,
        gender: gender,
        passportNumber: passportNumber
      };
    }
    
    if (personalInfoChanged) {
      updates.personalInfo = {
        email: email,
        phoneNumber: phoneNumber,
        occupation: occupation
      };
    }
    
    if (fundingProofChanged) {
      updates.fundingProof = {
        cashAmount: cashAmount,
        bankCards: bankCards
      };
    }
    
    // Save all changes atomically
    const result = await PassportDataService.batchUpdate(userId, updates);
    
    Alert.alert('Success', 'All changes saved successfully!');
  } catch (error) {
    Alert.alert('Error', 'Failed to save changes: ' + error.message);
  } finally {
    setSaving(false);
  }
};
```

### Example 3: Transaction Safety Demo

```javascript
// Demonstrate transaction rollback
const testTransactionSafety = async () => {
  console.log('Testing transaction safety...');
  
  // Load current data
  const before = await PassportDataService.getAllUserData('user_123');
  console.log('Before:', before.passport.fullName);
  
  try {
    // Try to update with invalid data
    await PassportDataService.batchUpdate('user_123', {
      passport: {
        passportNumber: null // Invalid - will cause error
      },
      personalInfo: {
        email: 'valid@example.com' // Valid, but won't be saved
      }
    });
  } catch (error) {
    console.log('Update failed as expected:', error.message);
  }
  
  // Verify data is unchanged (transaction rolled back)
  const after = await PassportDataService.getAllUserData('user_123');
  console.log('After:', after.passport.fullName);
  console.log('Data unchanged:', before.passport.fullName === after.passport.fullName);
};
```

**Expected Output:**
```
Testing transaction safety...
Before: ZHANG, WEI
Batch update transaction failed: Validation error
Update failed as expected: Validation error
After: ZHANG, WEI
Data unchanged: true
```

## Performance Tips

### 1. Use Batch Loading for Initial Screen Load
```javascript
// ✅ GOOD: Load all data at once
const userData = await PassportDataService.getAllUserData(userId);

// ❌ BAD: Load data separately
const passport = await PassportDataService.getPassport(userId);
const personalInfo = await PassportDataService.getPersonalInfo(userId);
const fundingProof = await PassportDataService.getFundingProof(userId);
```

### 2. Use Batch Update for Multiple Changes
```javascript
// ✅ GOOD: Update all at once
await PassportDataService.batchUpdate(userId, {
  passport: { fullName: 'NEW NAME' },
  personalInfo: { email: 'new@email.com' }
});

// ❌ BAD: Update separately
await PassportDataService.updatePassport(passportId, { fullName: 'NEW NAME' });
await PassportDataService.updatePersonalInfo(personalId, { email: 'new@email.com' });
```

### 3. Let Cache Work for You
```javascript
// First load: Cache miss, loads from database
const data1 = await PassportDataService.getAllUserData(userId);
// Load time: ~15ms

// Second load within 5 minutes: Cache hit!
const data2 = await PassportDataService.getAllUserData(userId);
// Load time: ~1ms (from cache)
```

## Troubleshooting

### Issue: Slow Loading
**Solution**: Make sure batch loading is enabled (it's default)
```javascript
// Check if batch loading is being used
const data = await PassportDataService.getAllUserData(userId);
console.log('Load time:', data.loadDurationMs); // Should be < 30ms
```

### Issue: Partial Updates
**Solution**: Use batch update to ensure atomicity
```javascript
// This ensures all updates succeed or all fail
await PassportDataService.batchUpdate(userId, updates);
```

### Issue: Stale Cache
**Solution**: Clear cache when needed
```javascript
// Clear cache for specific user
PassportDataService.refreshCache(userId);

// Or clear all cache
PassportDataService.clearCache();
```

## Summary

- ✅ **Batch Loading**: 3-5x faster than parallel loading
- ✅ **Batch Update**: Atomic operations, all succeed or all fail
- ✅ **Transaction Safety**: No partial updates possible
- ✅ **Cache Integration**: Automatic cache management
- ✅ **Backward Compatible**: Existing code works without changes

**Default behavior is optimized** - just use `getAllUserData()` and `batchUpdate()` for best performance!
