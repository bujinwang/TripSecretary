# 入境通 (Trip Secretary) - TODO List

## 🔄 Backup and Restore Features

### High Priority

#### Data Backup
- [ ] **Automatic Backup System**
  - [ ] Implement scheduled automatic backups (daily/weekly)
  - [ ] Store backups in device local storage
  - [ ] Compress backup files to save space
  - [ ] Include timestamp in backup filename
  - [ ] Limit number of stored backups (e.g., keep last 5)

- [ ] **Manual Backup**
  - [ ] Add "Backup Now" button in settings
  - [ ] Show backup progress indicator
  - [ ] Display success/failure notification
  - [ ] Allow user to choose backup location (local/cloud)

- [ ] **Backup Content**
  - [ ] Passport information
  - [ ] Personal information
  - [ ] Travel history
  - [ ] Entry data (funding proof, travel info)
  - [ ] User preferences and settings
  - [ ] App configuration

#### Data Restore
- [ ] **Restore from Backup**
  - [ ] List available backups with dates
  - [ ] Preview backup contents before restore
  - [ ] Confirm restore action with warning dialog
  - [ ] Show restore progress
  - [ ] Validate backup integrity before restore

- [ ] **Restore Options**
  - [ ] Full restore (replace all data)
  - [ ] Selective restore (choose specific data types)
  - [ ] Merge restore (keep existing + add from backup)

#### Cloud Backup (Optional)
- [ ] **iCloud Integration (iOS)**
  - [ ] Enable iCloud backup option
  - [ ] Sync backups to iCloud Drive
  - [ ] Auto-restore from iCloud on new device

- [ ] **Google Drive Integration (Android)**
  - [ ] Enable Google Drive backup option
  - [ ] Sync backups to Google Drive
  - [ ] Auto-restore from Drive on new device

### Medium Priority

#### Backup Management
- [ ] **Backup Settings Screen**
  - [ ] Toggle automatic backup on/off
  - [ ] Set backup frequency (daily/weekly/monthly)
  - [ ] Choose backup location
  - [ ] Set maximum number of backups to keep
  - [ ] Enable/disable cloud backup

- [ ] **Backup History**
  - [ ] Display list of all backups
  - [ ] Show backup size and date
  - [ ] Allow deletion of old backups
  - [ ] Export backup file to share

#### Security
- [ ] **Encrypted Backups**
  - [ ] Encrypt backup files with user password
  - [ ] Use AES-256 encryption for backup data
  - [ ] Secure key storage for backup encryption
  - [ ] Password protection for restore

- [ ] **Backup Verification**
  - [ ] Generate checksum for each backup
  - [ ] Verify backup integrity on restore
  - [ ] Detect corrupted backups
  - [ ] Alert user if backup is invalid

### Low Priority

#### Advanced Features
- [ ] **Incremental Backups**
  - [ ] Only backup changed data
  - [ ] Reduce backup size and time
  - [ ] Maintain backup chain

- [ ] **Cross-Platform Sync**
  - [ ] Sync data between iOS and Android
  - [ ] Use common backup format
  - [ ] Handle platform-specific differences

- [ ] **Backup Analytics**
  - [ ] Track backup success rate
  - [ ] Monitor backup storage usage
  - [ ] Alert when storage is low

#### UI/UX Improvements
- [ ] **Backup Wizard**
  - [ ] First-time backup setup guide
  - [ ] Explain backup importance
  - [ ] Help user choose backup settings

- [ ] **Restore Wizard**
  - [ ] Step-by-step restore process
  - [ ] Preview what will be restored
  - [ ] Confirm each step

## 📋 Other TODO Items

### Bug Fixes
- [x] Fix expo-sqlite v16 API compatibility
- [x] Update SecureStorageService to use async API
- [x] Fix name field not loading from saved data
- [x] Fix fund items persistence (now using individual database rows)
- [x] Fix travel info destination persistence (using destination.id)
- [ ] Verify photo persistence across app restarts
- [ ] Test gender field consistency across screens

### Features
- [x] Fund items management (add, update, delete)
- [x] Travel info persistence per destination
- [x] Collapsible sections with completion badges
- [x] Auto-save on field blur
- [x] Data reload on screen focus
- [ ] Add passport scanning with OCR
- [ ] Add flight ticket scanning
- [ ] Add hotel booking scanning
- [ ] Photo compression/resizing for fund items
- [ ] Multi-language support improvements
- [ ] Offline mode enhancements

### Security
- [ ] Re-enable encryption before production release
- [ ] Implement proper key management
- [ ] Add biometric authentication
- [ ] Secure data deletion

### Performance
- [ ] Optimize database queries
- [ ] Reduce app startup time
- [ ] Lazy load heavy components
- [ ] Cache frequently accessed data

### Testing
- [ ] Add unit tests for models
- [ ] Add integration tests for storage
- [ ] Test backup/restore functionality
- [ ] Test on various devices

---

## Notes
- Backup files should be in JSON format for portability
- Consider GDPR compliance for backup data
- Ensure backups don't contain sensitive data in plaintext
- Test restore process thoroughly to prevent data loss
