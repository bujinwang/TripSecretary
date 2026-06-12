# 入境通 (Trip Secretary) — TODO List

> Updated: 2026-06-10 | Branch: `feat-i18n-dynamic-labels-f9a5a`

---

## ✅ Completed

### Backup & Restore
- [x] Automatic daily backup system (`BackupService.ts`, 2,295 lines)
- [x] Manual backup with progress indicator (`BackupSettingsScreen.tsx`, 460 lines)
- [x] Backup verification with checksums (`BackupService.verifyBackup()`)
- [x] Encrypted backups with AES-256 (`DataEncryptionService`)
- [x] Snapshot creation/management (`SnapshotService`)
- [x] Data export/import (`DataExportService`, `DataImportService`)
- [x] Cloud backup foundation (iCloud / Google Drive stubs)
- [x] Backup history with deletion and export
- [x] Selective restore (passport / personal / travel / funds per-category)

### Template System
- [x] EntryFlowScreenTemplate, EnhancedTravelInfoTemplate, EntryInfoScreenTemplate
- [x] EntryRequirementsTemplate, EntryPackPreviewTemplate, EntryGuideTemplate
- [x] All 10 countries migrated to template system
- [x] Console → LoggingService across all templates

### Code Quality
- [x] @ts-nocheck removed from all files
- [x] TypeScript errors: 4288 → 709 (-83.5%) across 13 codewhale passes
- [x] Major files fully typed: TDACAPIService, EntryCompletionCalculator, DateFormatter, etc.
- [x] All duplicate property errors fixed

### Bug Fixes + Features
- [x] expo-sqlite v16 API compatibility, SecureStorageService async API migration
- [x] Name field / fund items / travel info persistence
- [x] Collapsible sections, auto-save, data reload, submission countdown
- [x] Immigration officer view, QR code generation for TDAC
- [x] TDAC WebView / API / Hybrid submission modes
- [x] PIK guide, MDAC, SG Arrival Card, HDAC, TW Arrival Card
- [x] Entry guide system for 10 countries
- [x] Multi-language support (zh/en/ja/ko/ms/de/fr/es/th/vi)
- [x] PDF generation, GDPR compliance, notification system

### P0 — Production Readiness
- [x] Encryption — DataEncryptionService (720 lines) fully implemented, enabled by default
- [x] Key management — KeyManagementService integrated with GDPR + encryption
- [ ] Test on physical devices (iOS + Android)

### P2 — Features (new in this session)
- [x] Biometric authentication — BiometricAuthService (694 lines): Face ID/Touch ID
- [x] Offline mode — OfflineQueueService (279 lines) + OfflineIndicator component
- [x] Photo compression — integrated into template photo management hooks
- [ ] Passport OCR scanning (LocalOCRService exists, needs integration)
- [ ] Flight ticket scanning
- [ ] Hotel booking scanning

### P4 — Polish
- [x] Photo persistence verified — photos saved via UserDataService, restored on load
- [x] Husky updated to v9 format
- [x] ESLint errors eliminated — all severity-2 errors fixed
- [x] Gender field consistency — verified `sex`→`gender` mapping across all 10 countries

---

## 🔧 Remaining (Prioritized)

### P0
- [ ] Test on physical devices (iOS + Android)

### P1 — TypeScript
- [ ] 709 remaining errors — mostly template system type mismatches (TS2322: 121, TS7006: 90, TS2345: 88, TS2339: 82)

### P2 — Missing Features
- [ ] Passport OCR scanning (LocalOCRService exists, needs UI integration)
- [ ] Flight ticket scanning
- [ ] Hotel booking scanning
- [ ] Biometric lock at app startup (service exists, needs LoginScreen integration)

### P3 — Performance & Testing
- [ ] Optimize database queries (prepared statements, connection pooling)
- [ ] Reduce app startup time (lazy imports, code splitting)
- [ ] Lazy load heavy components
- [ ] Unit tests for models (`EntryData`, `Passport`, `PersonalInfo`)
- [ ] Integration tests for storage layer
- [ ] Snapshot / restore end-to-end tests

---

## Notes
- BackupService + SnapshotService + DataExportService + DataImportService cover all backup/restore
- Backup format is JSON, compressed, with AES-256 encryption
- GDPR compliance service handles data access logging and retention policies
- TypeScript: 4288→709 (-83.5%) across 13 codewhale passes — 190+ files modified
- Template system covers all 10 countries with config-driven architecture
