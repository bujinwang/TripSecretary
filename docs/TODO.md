# 入境通 (Trip Secretary) — TODO List

> Updated: 2026-05-20 | Branch: `feat-i18n-dynamic-labels-f9a5a`

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
- [x] EntryFlowScreenTemplate with Categories + AutoContent
- [x] EnhancedTravelInfoTemplate with V2 hooks (validation, funds, photos, tracking)
- [x] EntryInfoScreenTemplate (Info screens)
- [x] EntryRequirementsTemplate (Requirements screens)
- [x] EntryPackPreviewTemplate (Preview screens)
- [x] EntryGuideTemplate (Entry guide screens)
- [x] All 10 countries migrated to template system (Korea/Thailand -2,780 lines)
- [x] Console → LoggingService across all templates (41 calls)

### Code Quality
- [x] @ts-nocheck removed from ~290 files (screens, hooks, components, data, configs)
- [x] TypeScript Props interfaces on all 10 country template screens
- [x] Type-annotated shared hooks (useNavigationPersistence, useSaveStatusMonitor)
- [x] Typed TemplateFieldStateManager
- [x] 11 duplicate property errors fixed (entryGuide configs + nationalities.ts)
- [x] 10-country entryFlow.progress Chinese fallback text unified
- [x] i18n entryFlow keys present in all 10 languages

### Bug Fixes
- [x] expo-sqlite v16 API compatibility
- [x] SecureStorageService async API migration
- [x] Name field persistence
- [x] Fund items persistence (individual DB rows)
- [x] Travel info destination persistence

### Features
- [x] Fund items CRUD (add/update/delete)
- [x] Travel info per-destination persistence
- [x] Collapsible sections with completion badges
- [x] Auto-save on field blur
- [x] Data reload on screen focus
- [x] Submission countdown with visual progress
- [x] Immigration officer view (presentation mode)
- [x] QR code generation for TDAC
- [x] TDAC WebView / API / Hybrid submission modes
- [x] PIK guide (自助通关机)
- [x] MDAC (Malaysia), SG Arrival Card (Singapore), HDAC (Hong Kong) integration
- [x] TW Arrival Card (Taiwan) integration
- [x] Entry guide system for 10 countries
- [x] Multi-language support (zh/en/ja/ko/ms/de/fr/es/th/vi)
- [x] PDF generation for entry packs
- [x] GDPR compliance primitives
- [x] Notification system with deadline/expiry/urgent reminders

---

## 🔧 Remaining (Prioritized)

### P0 — Production Readiness
- [ ] Re-enable encryption before production release
- [ ] Implement proper key management (`KeyManagementService` exists, needs audit)
- [ ] Test on physical devices (iOS + Android)

### P1 — TypeScript Deep Type Annotation
- [ ] 17 files with strategic `@ts-nocheck` — add full types:
  - `EnhancedTravelInfoTemplate.tsx` (267 implicit any errors)
  - `TDACAPIService.ts` (158)
  - `TDACWebViewScreen.tsx` (121)
  - `DateFormatter.ts` (95)
  - `PerformanceMonitor.ts` (72)
  - `FundItemDetailModal.tsx` (65)
  - `EntryData.ts` (78 — class needs field declarations)
  - `EntryCompletionCalculator.ts` (149)
  - Plus 9 smaller files
- [ ] ~2,800 remaining `implicit any` errors across utils/services/hooks

### P2 — Missing Features
- [ ] Passport OCR scanning
- [ ] Flight ticket scanning
- [ ] Hotel booking scanning
- [ ] Photo compression/resizing
- [ ] Biometric authentication (Face ID / fingerprint)
- [ ] Offline mode enhancements

### P3 — Performance & Testing
- [ ] Optimize database queries (prepared statements, connection pooling)
- [ ] Reduce app startup time (lazy imports, code splitting)
- [ ] Lazy load heavy components
- [ ] Unit tests for models (`EntryData`, `Passport`, `PersonalInfo`)
- [ ] Integration tests for storage layer
- [ ] Snapshot / restore end-to-end tests

### P4 — Polish
- [ ] Verify photo persistence across app restarts
- [ ] Test gender field consistency across screens
- [ ] Update `husky` pre-commit hook (deprecated API warning)
- [ ] Fix ESLint errors blocking `eslint --fix` (pre-existing, ~50 files)

---

## Notes
- `BackupService.ts` (2,295 lines) + `SnapshotService` + `DataExportService` + `DataImportService` cover all backup/restore TODO items
- Backup format is JSON, compressed, with AES-256 encryption option
- GDPR compliance service (`GDPRComplianceService`) already handles data access logging and retention policies
- TypeScript error count reduced from 5,494 to ~3,750 (-32%) in 2026-05-20 session
- `@ts-nocheck` count reduced from ~340 to ~17 strategic deferrals
- Template system now covers all 10 countries with config-driven architecture
