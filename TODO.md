# TODO List - 入境通 (Trip Secretary)

## Critical - Before Production Release

### Security
- [ ] **Re-enable encryption in SecureStorageService**
  - Location: `app/services/security/SecureStorageService.js`
  - Set `ENCRYPTION_ENABLED = true` in constructor
  - Test all encryption/decryption flows
  - Verify EncryptionService initialization works properly
  - Test with real user data
  - Files affected:
    - `app/services/security/SecureStorageService.js` (multiple methods)
    - `app/services/security/EncryptionService.js`

- [ ] **Implement biometric authentication (PIN/Fingerprint/Face ID)**
  - Add app lock screen on launch
  - Support multiple authentication methods:
    - PIN code (4-6 digits)
    - Fingerprint (Touch ID/Android Fingerprint)
    - Face recognition (Face ID/Android Face Unlock)
  - Use `expo-local-authentication` for biometric support
  - Fallback to PIN if biometrics unavailable
  - Settings to enable/disable and choose auth method
  - Lock app after X minutes of inactivity
  - Require auth when returning from background
  - Store PIN securely using `expo-secure-store`
  - Implementation steps:
    1. Create `AuthLockScreen.js` component
    2. Create `BiometricService.js` for biometric handling
    3. Add auth state management (Context/Redux)
    4. Integrate with app navigation
    5. Add settings UI for auth preferences
    6. Test on both iOS and Android
  - Files to create:
    - `app/screens/auth/AuthLockScreen.js`
    - `app/services/security/BiometricService.js`
    - `app/contexts/AuthContext.js`
    - `app/screens/settings/SecuritySettingsScreen.js`

## Development Notes

### Encryption Temporarily Disabled
Encryption has been temporarily disabled to simplify debugging during development. All sensitive data (passport numbers, personal info, funding proof) is currently stored in plaintext in the SQLite database.

**Why disabled:**
- Encryption service initialization was causing errors during progressive form filling
- Needed to focus on core functionality first

**What needs to be done:**
1. Fix EncryptionService initialization flow
2. Ensure encryption keys are properly set up before any save operations
3. Test progressive form filling with encryption enabled
4. Verify all decrypt operations work correctly
5. Test data export/import with encryption

### Search for TODOs
All encryption-related TODOs are marked with:
```
// TODO: Re-enable encryption before production release
```

Use this command to find all instances:
```bash
grep -r "TODO: Re-enable encryption" app/
```
