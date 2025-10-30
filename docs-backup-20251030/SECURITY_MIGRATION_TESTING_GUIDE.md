# Security Migration Testing Guide

**Purpose**: Test the migration of sensitive data from AsyncStorage to SecureStore
**Priority**: 🚨 **CRITICAL** - Must test before production deployment
**Estimated Time**: 30-45 minutes

---

## 📋 Pre-Testing Setup

### 1. Build the App

```bash
# Clear any cached builds
rm -rf node_modules/.cache
rm -rf .expo

# Start fresh
npx expo start --clear
```

### 2. Prepare Test Devices

**Required Platforms:**
- ✅ iOS device or simulator (iOS 12+)
- ✅ Android device or emulator (API 23+)

**Why both?**
- iOS: Uses Keychain (hardware-backed encryption)
- Android: Uses EncryptedSharedPreferences (AES-256)

---

## 🧪 Test Scenarios

### Scenario 1: Fresh Install (New User)

**Purpose**: Verify SecureStore works correctly for new users

**Steps:**
1. Uninstall app completely from device
2. Reinstall and launch app
3. Login with valid credentials
4. Check console logs for:
   ```
   ℹ️  No value to migrate for auth_token
   ✅ Auth token saved securely
   ```
5. Close app completely
6. Reopen app
7. Verify you're still logged in (token persisted)

**Expected Results:**
- ✅ Login successful
- ✅ Token saved to SecureStore
- ✅ Token persists after app restart
- ✅ No migration messages (no old data)

**Failure Indicators:**
- ❌ Login fails
- ❌ Token not persisted
- ❌ Must login again after restart

---

### Scenario 2: Existing User (Migration)

**Purpose**: Verify automatic migration from AsyncStorage to SecureStore

**Steps:**

1. **Setup old data** (simulate existing user):
   ```javascript
   // Run this in React Native debugger console or add temporarily to App.js
   import AsyncStorage from '@react-native-async-storage/async-storage';

   // Set old-style tokens
   await AsyncStorage.setItem('auth_token', 'test_auth_token_12345');
   await AsyncStorage.setItem('qwen_api_key', 'sk-test-key-67890');

   console.log('Old tokens set in AsyncStorage');
   ```

2. **Restart app** (force close and reopen)

3. **Check console logs** for migration messages:
   ```
   ✅ Migrated auth_token → secure_auth_token
   ✅ Auth token migrated from AsyncStorage to SecureStore
   ✅ Migrated qwen_api_key → secure_qwen_api_key
   ✅ Qwen API key migrated from AsyncStorage to SecureStore
   ```

4. **Verify AsyncStorage cleanup**:
   ```javascript
   // Check that old keys are removed
   const oldAuthToken = await AsyncStorage.getItem('auth_token');
   const oldApiKey = await AsyncStorage.getItem('qwen_api_key');

   console.log('Old auth_token:', oldAuthToken); // Should be null
   console.log('Old qwen_api_key:', oldApiKey); // Should be null
   ```

5. **Verify SecureStore has data**:
   - User should still be logged in
   - API calls should work
   - Qwen AI features should work

6. **Restart app again**:
   - Should see: `ℹ️  No value to migrate for auth_token` (migration only runs once)
   - Should still be logged in

**Expected Results:**
- ✅ Migration runs automatically on first launch
- ✅ Old AsyncStorage keys deleted
- ✅ Data available in SecureStore
- ✅ No data loss
- ✅ Migration runs only once
- ✅ User remains logged in

**Failure Indicators:**
- ❌ Migration doesn't run
- ❌ Old keys still in AsyncStorage
- ❌ User must login again
- ❌ Data lost

---

### Scenario 3: Login/Logout Flow

**Purpose**: Verify token management works correctly

**Steps:**

1. **Login:**
   - Login with valid credentials
   - Check console: `✅ Auth token saved securely`
   - Verify you're logged in

2. **Close and Reopen App:**
   - Force close app
   - Reopen
   - Should still be logged in (token retrieved from SecureStore)
   - Check console: `✅ Auth token retrieved securely`

3. **Logout:**
   - Tap logout button
   - Check console: `✅ Auth token deleted securely`
   - Verify you're logged out

4. **Close and Reopen App:**
   - Should be on login screen (token deleted)
   - Check console: `ℹ️  No auth token found`

**Expected Results:**
- ✅ Token persists across app restarts
- ✅ Logout deletes token completely
- ✅ After logout, user must login again

**Failure Indicators:**
- ❌ Token doesn't persist
- ❌ Token not deleted on logout
- ❌ Still logged in after logout

---

### Scenario 4: Qwen API Key

**Purpose**: Verify API key storage works correctly

**Steps:**

1. **Set API Key:**
   - Go to AI settings
   - Enter Qwen API key
   - Save
   - Check console: `✅ Qwen API key saved securely`

2. **Use AI Feature:**
   - Test any AI-powered feature
   - Should work correctly with saved key

3. **Close and Reopen App:**
   - API key should still be set
   - Check console: `✅ Qwen API key retrieved securely`

4. **Clear API Key:**
   - Go to AI settings
   - Clear/delete API key
   - Check console: `✅ Qwen API key deleted securely`

5. **Close and Reopen App:**
   - API key should be empty
   - Check console: `ℹ️  No Qwen API key found`

**Expected Results:**
- ✅ API key saved to SecureStore
- ✅ Key persists across restarts
- ✅ Key deleted correctly

**Failure Indicators:**
- ❌ Key doesn't persist
- ❌ Key not deleted
- ❌ AI features don't work

---

### Scenario 5: Platform-Specific Testing

**Purpose**: Verify SecureStore works on both iOS and Android

#### iOS Specific

**Steps:**
1. Complete all above scenarios on iOS device
2. Check Keychain Access (Mac only, for simulator):
   - Open Keychain Access app
   - Search for app bundle ID
   - Verify entries exist

**Expected:**
- ✅ Data stored in iOS Keychain
- ✅ Hardware-backed encryption (if device supports)

#### Android Specific

**Steps:**
1. Complete all above scenarios on Android device
2. Check encrypted shared preferences:
   ```bash
   # If using emulator with root access
   adb shell
   run-as com.your.app.bundle.id
   cd shared_prefs
   ls -la
   cat *encrypted*
   ```

**Expected:**
- ✅ Data stored in EncryptedSharedPreferences
- ✅ Data is encrypted (not plain text)

---

### Scenario 6: Error Handling

**Purpose**: Verify graceful degradation if SecureStore fails

**Steps:**

1. **Test SecureStore availability:**
   ```javascript
   const available = await SecureTokenService.isAvailable();
   console.log('SecureStore available:', available);
   ```

2. **Expected on normal devices:**
   - iOS: `true`
   - Android: `true`

3. **If unavailable:**
   - Check console for error messages
   - App should not crash
   - User should see appropriate error message

---

## 📊 Test Results Checklist

### Fresh Install
- [ ] Token saved to SecureStore
- [ ] No migration messages
- [ ] Token persists after restart
- [ ] Login works correctly

### Existing User Migration
- [ ] Migration runs automatically
- [ ] Console shows migration success
- [ ] Old AsyncStorage keys deleted
- [ ] User still logged in after migration
- [ ] Migration only runs once

### Login/Logout
- [ ] Login saves token
- [ ] Token persists across restarts
- [ ] Logout deletes token
- [ ] Must login again after logout

### API Key Management
- [ ] API key saved securely
- [ ] Key persists across restarts
- [ ] Key deleted correctly
- [ ] AI features work with saved key

### iOS Testing
- [ ] All scenarios pass on iOS
- [ ] Keychain storage verified

### Android Testing
- [ ] All scenarios pass on Android
- [ ] EncryptedSharedPreferences verified

---

## 🐛 Debugging Tips

### Console Logs to Watch For

**Successful Migration:**
```
✅ Migrated auth_token → secure_auth_token
✅ Auth token migrated from AsyncStorage to SecureStore
```

**No Migration Needed:**
```
ℹ️  No value to migrate for auth_token
```

**Token Operations:**
```
✅ Auth token saved securely
✅ Auth token retrieved securely
✅ Auth token deleted securely
```

**Errors:**
```
❌ Failed to save auth token: [error details]
❌ Migration failed (auth_token): [error details]
❌ SecureStore not available: [error details]
```

### Common Issues

**Issue 1: Migration runs every time**
- **Symptom**: Migration message on every app launch
- **Cause**: Old AsyncStorage key not deleted
- **Fix**: Verify AsyncStorage.removeItem() is called

**Issue 2: Token doesn't persist**
- **Symptom**: Must login on every app launch
- **Cause**: SecureStore not saving
- **Fix**: Check SecureStore.isAvailable(), check device encryption settings

**Issue 3: Migration fails silently**
- **Symptom**: No migration message, but old data exists
- **Cause**: Try-catch swallowing error
- **Fix**: Check console for error messages

**Issue 4: SecureStore unavailable**
- **Symptom**: "SecureStore not available" error
- **Cause**: Device doesn't support SecureStore
- **Fix**: Implement fallback to encrypted AsyncStorage (future enhancement)

---

## 🔍 Manual Inspection

### Check AsyncStorage (Should be empty of sensitive data)

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check all keys
const keys = await AsyncStorage.getAllKeys();
console.log('AsyncStorage keys:', keys);

// Verify auth_token is NOT present
const authToken = await AsyncStorage.getItem('auth_token');
console.log('auth_token in AsyncStorage:', authToken); // Should be null

// Verify qwen_api_key is NOT present
const apiKey = await AsyncStorage.getItem('qwen_api_key');
console.log('qwen_api_key in AsyncStorage:', apiKey); // Should be null
```

### Check SecureStore (Should contain migrated data)

```javascript
import SecureTokenService from './app/services/security/SecureTokenService';

// Check availability
const available = await SecureTokenService.isAvailable();
console.log('SecureStore available:', available);

// Check auth token exists
const authToken = await SecureTokenService.getAuthToken();
console.log('Auth token exists:', !!authToken);

// Check API key exists
const apiKey = await SecureTokenService.getQwenAPIKey();
console.log('API key exists:', !!apiKey);
```

---

## ✅ Success Criteria

**All tests must pass:**

- ✅ Fresh install works correctly
- ✅ Migration runs automatically for existing users
- ✅ Old AsyncStorage keys deleted after migration
- ✅ Tokens persist across app restarts
- ✅ Login/logout flow works correctly
- ✅ API key management works correctly
- ✅ Works on both iOS and Android
- ✅ No crashes or errors
- ✅ No data loss during migration
- ✅ Console logs show expected messages

**Zero tolerance failures:**

- ❌ Data loss during migration
- ❌ User must re-enter credentials after update
- ❌ App crashes
- ❌ Sensitive data still in AsyncStorage after migration

---

## 📝 Test Report Template

```
=== SECURITY MIGRATION TEST REPORT ===

Date: _________________
Tester: _______________
Device: iOS / Android (circle one)
OS Version: ___________
App Version: __________

SCENARIO 1: Fresh Install
[ ] Pass  [ ] Fail
Notes: ________________________________

SCENARIO 2: Existing User Migration
[ ] Pass  [ ] Fail
Notes: ________________________________

SCENARIO 3: Login/Logout Flow
[ ] Pass  [ ] Fail
Notes: ________________________________

SCENARIO 4: Qwen API Key
[ ] Pass  [ ] Fail
Notes: ________________________________

SCENARIO 5: Platform-Specific
[ ] Pass  [ ] Fail
Notes: ________________________________

SCENARIO 6: Error Handling
[ ] Pass  [ ] Fail
Notes: ________________________________

OVERALL RESULT:
[ ] All tests passed - Ready for production
[ ] Some tests failed - Needs fixes
[ ] Critical failures - Do not deploy

Critical Issues Found:
________________________________
________________________________

Non-Critical Issues Found:
________________________________
________________________________

Recommendations:
________________________________
________________________________
```

---

## 🚀 After Testing

### If All Tests Pass:

1. Mark testing task as complete
2. Prepare production deployment
3. Create release notes mentioning security improvements
4. Monitor error logs after deployment

### If Tests Fail:

1. Document all failures
2. Fix issues identified
3. Retest all scenarios
4. Do not deploy until all tests pass

---

**Last Updated**: 2025-10-28
**Status**: Ready for testing
