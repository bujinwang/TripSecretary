# AsyncStorage Usage Audit

**Date**: 2025-10-28
**Purpose**: Document all AsyncStorage usage across the application
**Status**: Active usage identified, deprecation candidates highlighted

---

## 📊 Overview

AsyncStorage is currently used for **multiple purposes** across the application. This audit categorizes all usage and identifies which should be migrated to database.

---

## 🗂️ Categories of AsyncStorage Usage

### 1. Entry Guide Progress (7 countries)

**Purpose:** Track user progress through entry guide questions

**Keys:**
- `canada_entry_progress`
- `vietnam_entry_progress`
- `japan_entry_progress`
- `thailand_entry_progress`
- `usa_entry_progress`
- `malaysia_entry_progress`
- `singapore_entry_progress`
- `korea_entry_progress`

**Files:**
- `app/services/entryGuide/CanadaEntryGuideService.js:391`
- `app/services/entryGuide/VietnamEntryGuideService.js:307`
- `app/services/entryGuide/JapanEntryGuideService.js:218`
- `app/services/entryGuide/ThailandEntryGuideService.js:208`
- `app/services/entryGuide/USEntryGuideService.js:311`
- `app/services/entryGuide/MalaysiaEntryGuideService.js:279`
- `app/services/entryGuide/SingaporeEntryGuideService.js:273`
- `app/services/entryGuide/KoreaEntryGuideService.js:270`

**Data Structure:**
```javascript
{
  currentStep: 0,
  totalSteps: 10,
  completedSteps: [],
  answers: {},
  lastUpdated: '2025-10-28T...'
}
```

**Migration Status:** ⚠️ **Consider migrating to database**
- Benefits: Better querying, data integrity, cross-device sync
- Current: Simple progress tracking, local only
- Priority: Medium

---

### 2. Biometric Authentication

**Purpose:** Store biometric authentication settings and lockout status

**Keys:**
- `biometric_settings` - User preferences for biometric auth
- `biometric_auth_attempts` - Recent authentication attempts
- `biometric_lockout` - Lockout timestamp after failed attempts

**File:** `app/services/security/BiometricAuthService.js`

**Lines:**
- Settings: Line 324
- Auth attempts: Line 494
- Lockout: Line 552

**Data Structure:**
```javascript
// biometric_settings
{
  enabled: true,
  biometricType: 'FaceID', // or 'TouchID', 'Fingerprint'
  requireBiometricForSensitiveData: true,
  lastEnabledAt: '2025-10-28T...'
}

// biometric_auth_attempts (last 10 attempts)
[
  { timestamp: '2025-10-28T...', success: true, type: 'FaceID' },
  { timestamp: '2025-10-28T...', success: false, type: 'FaceID' }
]

// biometric_lockout
1730123456789  // Unix timestamp when lockout expires
```

**Migration Status:** ✅ **Keep in AsyncStorage**
- Reason: Security-related, needs to be accessible before database unlock
- Performance: Fast access needed for auth flow
- Priority: N/A (should not migrate)

---

### 3. Error Logging

**Purpose:** Store error logs for debugging

**Keys:**
- `tdac_error_log` - General TDAC error log
- `tdac_submission_failure_{errorId}` - Specific submission failures
- `snapshot_creation_failures` - Entry info snapshot failures
- `entry_info_status_update_failures` - Entry status update failures

**Files:**
- `app/services/error/TDACErrorHandler.js:382`
- `app/services/thailand/TDACSubmissionService.js:312`
- `app/services/thailand/TDACSubmissionService.js:428`
- `app/services/thailand/TDACSubmissionService.js:461`

**Data Structure:**
```javascript
// tdac_error_log (array of recent errors)
[
  {
    errorId: 'err_abc123',
    category: 'network',
    timestamp: '2025-10-28T...',
    message: 'Failed to connect to TDAC API',
    stackTrace: '...',
    context: { ... }
  }
]

// tdac_submission_failure_{errorId}
{
  timestamp: '2025-10-28T...',
  errorId: 'err_abc123',
  category: 'validation',
  userMessage: 'Submission failed',
  technicalMessage: 'Invalid passport format',
  submissionData: { arrCardNo: 'TH****45' },  // Sanitized
  suggestions: ['Check passport number', 'Retry']
}
```

**Migration Status:** ⚠️ **Consider migrating to database**
- Benefits: Better querying, filtering, error analytics
- Current: Simple logging, developer debugging
- Priority: Low (works fine for current needs)

---

### 4. Backup & Recovery

**Purpose:** Store backup settings, schedule, and status

**Keys:**
- `last_backup_info` - Info about last successful backup
- `backup_settings` - User backup preferences
- `backup_schedule` - Next scheduled backup time
- `cloud_backup_status` - Cloud backup sync status
- `recovery_statistics` - Recovery operation stats

**File:** `app/services/backup/BackupService.js`

**Lines:**
- Last backup: 190
- Settings: 428
- Schedule: 460
- Cloud status: 917
- Recovery stats: 1634

**Data Structure:**
```javascript
// last_backup_info
{
  backupId: 'backup_abc123',
  createdAt: '2025-10-28T...',
  fileSize: 1024567,
  dataTypes: ['passports', 'entry_info', 'digital_arrival_cards']
}

// backup_settings
{
  autoBackup: true,
  backupInterval: 'daily',  // daily, weekly, monthly
  includePhotos: false,
  includePassports: true,
  cloudSync: false
}

// backup_schedule
{
  nextBackupTime: 1730456789123,
  interval: 'daily',
  lastBackup: '2025-10-28T...'
}
```

**Migration Status:** ⚠️ **Consider database for settings, keep schedule in AsyncStorage**
- Settings: Could be in database for cross-device sync
- Schedule: Keep in AsyncStorage (needs to persist before DB unlock)
- Priority: Low

---

### 5. Authentication Tokens

**Purpose:** Store API authentication token

**Keys:**
- `auth_token` - User authentication token for API

**File:** `app/services/api.js:27`

**Data Structure:**
```javascript
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Migration Status:** ✅ **Keep in AsyncStorage**
- Reason: Must be accessible before database unlock
- Security: Should use SecureStore instead (TODO)
- Priority: High (migrate to SecureStore, not database)

**⚠️ SECURITY CONCERN:** Should use `expo-secure-store` instead of AsyncStorage for tokens!

---

### 6. TDAC Submission Logs

**Purpose:** Detailed logging for TDAC submissions (debugging)

**Keys:**
- `tdac_submission_log_hybrid_{timestamp}` - Hybrid submission logs
- `tdac_submission_log_api_{timestamp}` - API submission logs
- `tdac_submission_log_webview_{timestamp}` - WebView submission logs

**File:** `app/services/tdac/TDACSubmissionLogger.js:379`

**Data Structure:**
```javascript
{
  method: 'hybrid',
  timestamp: '2025-10-28T...',
  arrCardNo: 'TH12345',
  travelerData: { ... },  // Complete submission data
  fieldMappings: { ... },
  validationResults: { ... }
}
```

**Migration Status:** ⚠️ **Consider migrating to database**
- Benefits: Better querying, filtering, analytics
- Current: Debugging tool, stored indefinitely
- Priority: Medium (could fill up AsyncStorage over time)

---

### 7. AI/Qwen API Key

**Purpose:** Store Qwen AI service API key

**Keys:**
- `qwen_api_key` - User's Qwen API key

**File:** `app/services/ai/QwenService.js:35`

**Data Structure:**
```javascript
"sk-abc123def456..."
```

**Migration Status:** ❌ **Should use SecureStore**
- Current: AsyncStorage (not secure)
- Should: Use `expo-secure-store` for API keys
- Priority: **HIGH - SECURITY RISK**

---

### 8. ~~TDAC Submissions~~ (DEPRECATED)

**Keys:**
- ~~`tdac_{arrCardNo}`~~ - Individual TDAC submission
- ~~`recent_tdac_submission`~~ - Most recent submission

**Status:** ✅ **Removed in recent refactoring**
- Reason: Data duplicated in database
- Migration: Use `digital_arrival_cards` table instead
- Date removed: 2025-10-28

---

## 📋 Summary Table

| Category | Keys Count | Migration Status | Priority | Security Risk |
|----------|-----------|------------------|----------|---------------|
| Entry Guide Progress | 8 | ⚠️ Consider DB | Medium | Low |
| Biometric Auth | 3 | ✅ Keep AsyncStorage | N/A | None |
| Error Logging | 4+ | ⚠️ Consider DB | Low | Low |
| Backup & Recovery | 5 | ⚠️ Partial migration | Low | Low |
| Auth Tokens | 1 | ❌ Use SecureStore | **HIGH** | **HIGH** |
| TDAC Logs | Many | ⚠️ Consider DB | Medium | Low |
| AI API Keys | 1 | ❌ Use SecureStore | **HIGH** | **HIGH** |
| ~~TDAC Submissions~~ | ~~2~~ | ✅ Removed | N/A | N/A |

---

## 🚨 Security Recommendations

### Critical (Immediate Action Required)

1. **Auth Tokens** - Migrate from AsyncStorage to SecureStore
   ```javascript
   // CURRENT (INSECURE)
   await AsyncStorage.setItem('auth_token', token);

   // RECOMMENDED (SECURE)
   import * as SecureStore from 'expo-secure-store';
   await SecureStore.setItemAsync('auth_token', token);
   ```

2. **AI API Keys** - Migrate from AsyncStorage to SecureStore
   ```javascript
   // CURRENT (INSECURE)
   await AsyncStorage.setItem('qwen_api_key', apiKey);

   // RECOMMENDED (SECURE)
   import * as SecureStore from 'expo-secure-store';
   await SecureStore.setItemAsync('qwen_api_key', apiKey);
   ```

**Why:** AsyncStorage is **not encrypted** - any app with file system access can read these values!

---

## 💾 Database Migration Candidates

### High Priority

None currently

### Medium Priority

1. **Entry Guide Progress** (8 keys)
   - Benefits: Cross-device sync, better querying
   - Migration effort: Medium
   - Breaking changes: None (can keep AsyncStorage fallback)

2. **TDAC Submission Logs** (Many keys)
   - Benefits: Better analytics, prevent AsyncStorage bloat
   - Migration effort: Low
   - Breaking changes: None

### Low Priority

1. **Error Logs** (4+ keys)
   - Benefits: Better error analytics
   - Migration effort: Low
   - Breaking changes: None

2. **Backup Settings** (Partial)
   - Benefits: Cross-device sync
   - Migration effort: Low
   - Breaking changes: Schedule must stay in AsyncStorage

---

## 🔧 Recommended Actions

### Immediate (Security)

```javascript
// 1. Create SecureTokenService
class SecureTokenService {
  static async saveAuthToken(token) {
    await SecureStore.setItemAsync('auth_token', token);
  }

  static async getAuthToken() {
    return await SecureStore.getItemAsync('auth_token');
  }

  static async saveAPIKey(key, value) {
    await SecureStore.setItemAsync(key, value);
  }

  static async getAPIKey(key) {
    return await SecureStore.getItemAsync(key);
  }
}

// 2. Update api.js
// Before:
await AsyncStorage.setItem('auth_token', token);

// After:
await SecureTokenService.saveAuthToken(token);

// 3. Update QwenService.js
// Before:
await AsyncStorage.setItem('qwen_api_key', apiKey);

// After:
await SecureTokenService.saveAPIKey('qwen_api_key', apiKey);
```

### Short Term (1-2 weeks)

1. Implement `EntryGuideProgressRepository` in database
2. Migrate TDAC submission logs to database table
3. Add AsyncStorage cleanup utility (delete old logs)

### Long Term (1-2 months)

1. Implement error logging database table
2. Consider cross-device sync for settings
3. Add AsyncStorage monitoring (track usage, warn on bloat)

---

## 📐 AsyncStorage Best Practices

### When to Use AsyncStorage ✅

1. **App preferences** (theme, language, small settings)
2. **Temporary cache** (with expiration)
3. **Auth state** (logged in/out, but use SecureStore for tokens)
4. **Onboarding progress** (one-time, small data)

### When to Use Database ✅

1. **Structured data** (passports, entry info, travel records)
2. **Relational data** (needs joins, foreign keys)
3. **Large datasets** (many records)
4. **Query requirements** (filtering, sorting, aggregation)
5. **Data integrity** (transactions, validation)

### When to Use SecureStore ✅

1. **Auth tokens**
2. **API keys**
3. **Passwords** (if stored locally)
4. **Sensitive user data** (SSN, passport numbers if cached)
5. **Encryption keys**

---

## 🧹 Cleanup Opportunities

### Keys to Remove

None currently - all active keys serve a purpose

### Keys to Monitor

1. **TDAC submission logs** - Could accumulate over time
   - Add cleanup after 30 days
   - Or migrate to database

2. **Error logs** - Could accumulate
   - Keep only last 100 errors
   - Or migrate to database

### Suggested Cleanup Utility

```javascript
class AsyncStorageCleanup {
  static async cleanupOldLogs() {
    const keys = await AsyncStorage.getAllKeys();

    // Find old TDAC logs (> 30 days)
    const oldLogs = keys.filter(key => {
      if (key.startsWith('tdac_submission_log_')) {
        const timestamp = parseInt(key.split('_').pop());
        const age = Date.now() - timestamp;
        return age > 30 * 24 * 60 * 60 * 1000; // 30 days
      }
      return false;
    });

    if (oldLogs.length > 0) {
      await AsyncStorage.multiRemove(oldLogs);
      console.log(`🧹 Cleaned up ${oldLogs.length} old log entries`);
    }
  }

  static async getStorageSize() {
    const keys = await AsyncStorage.getAllKeys();
    let totalSize = 0;

    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      totalSize += value ? value.length : 0;
    }

    return totalSize;
  }
}
```

---

## 📊 Storage Comparison

| Storage Type | Capacity | Speed | Security | Use Case |
|--------------|----------|-------|----------|----------|
| **AsyncStorage** | ~10 MB | Fast | ❌ None | Simple key-value, non-sensitive |
| **SecureStore** | ~2 KB/item | Medium | ✅ Encrypted | Tokens, keys, passwords |
| **SQLite** | ~1 GB+ | Fast | ✅ App sandbox | Structured data, queries |

---

## ✅ Current State Summary

**Total AsyncStorage Keys:** ~25-30 active keys

**Breakdown:**
- Entry guides: 8 keys
- Biometric auth: 3 keys
- Backup/recovery: 5 keys
- Error logs: 4+ keys
- TDAC logs: 0-10+ keys (varies)
- Other: 4 keys

**Security Issues:** 2 (auth tokens, API keys)
**Migration Candidates:** 3 categories (entry guides, logs, errors)
**Already Migrated:** 1 (TDAC submissions → database)

---

**Next Steps:**
1. ⚠️ **Immediate:** Migrate auth_token and qwen_api_key to SecureStore
2. **Short-term:** Implement database tables for logs
3. **Long-term:** Add AsyncStorage monitoring and cleanup

**Last Updated:** 2025-10-28
