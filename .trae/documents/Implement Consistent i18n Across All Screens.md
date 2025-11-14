## Overview
- Adopt and extend the existing custom i18n (`app/i18n/LocaleContext.tsx` + `app/i18n/translations/`) rather than introducing new libraries.
- Standardize key naming, namespaces, and usage patterns across all screens and navigation labels.
- Replace remaining hardcoded literals with `t('...')`, add translation packs for common UI, notifications, GDPR, profile, debug, and destination-specific content.

## Current State
- Framework: Expo-managed React Native with React Navigation.
- i18n: Custom `LocaleProvider`, `useTranslation`, `getTranslationWithFallback`, country translation packs under `app/i18n/translations/`.
- Many screens already use `t(...)`, but several still contain hardcoded text (e.g., `HomeScreen.tsx`, Notification screens, GDPR screens, Profile, some destination screens).
- ESLint present but scripts target only `.js,.jsx`; `.tsx` files aren’t fully linted for i18n issues.

## Best Practices Decision
- Keep custom i18n to minimize churn; it already supports fallback and interpolation.
- Use dot-separated keys with clear namespaces: `common.*`, `home.*`, `notifications.*`, `gdpr.*`, `profile.*`, `debug.*`, plus per-destination `dest.<id>.*` when specific.
- Prefer interpolation over dynamic key composition; define consistent parameter names (`{count}`, `{name}`, etc.).
- Introduce simple pluralization convention: `.one` / `.other` keys; defer advanced ICU until needed.
- Centralize navigation titles/labels via keys to ensure consistent language switching.

## Key Naming & Structure
- `common.buttons.*` (e.g., `cancel`, `share`, `save`, `delete`, `ok`)
- `common.labels.*` (e.g., `language`, `passportNumber`, `nationality`, `validUntil`)
- `home.*` (e.g., `selectLanguageModal.title`, `selectLanguageModal.cancel`)
- `notifications.*` (e.g., `stats.title`, `stats.empty`, `log.title`, `log.clickRate`)
- `gdpr.*` (e.g., `export.title`, `export.share`, `deletion.willDelete`, `rights.access`, `rights.portability`)
- `profile.*` (e.g., `fields.passportNo`, `fields.nationality`, `fields.validUntil`)
- `debug.*` (e.g., `tdac.title`, `sections.iosUpdate`)
- Destination-specific keep under `dest.<id>.*` (e.g., `dest.hongkong.hdac.selection.aiLabel`, `dest.korea.preview.title`)

## Implementation Steps
1. Add translation packs
   - Create `app/i18n/translations/common.<lang>.json`, `home.<lang>.json`, `notifications.<lang>.json`, `gdpr.<lang>.json`, `profile.<lang>.json`, `debug.<lang>.json` at minimum; start with English, rely on `LANGUAGE_FALLBACK` for others.
   - Extend `app/i18n/translations/index.ts` to merge new packs into the per-language bundle.
2. Standardize LocaleContext usage
   - Confirm `useTranslation` and `getTranslationWithFallback` support namespaces consistently; expose a simple `t(key, params?)` for screens.
   - Add optional `count` handling convention via `.one`/`.other` keys; choose variant in `getTranslationWithFallback` when `count` provided.
3. Replace hardcoded literals
   - Update offenders to use keys:
     - `app/screens/HomeScreen.tsx`: `home.selectLanguageModal.title`, `common.buttons.cancel`.
     - `app/screens/NotificationTestScreen.tsx`: `notifications.stats.title`, `notifications.stats.empty`.
     - `app/screens/NotificationLogScreen.tsx`: `notifications.log.title`, `notifications.log.clickRate`, `notifications.log.empty`.
     - `app/screens/NotificationActionSettingsScreen.tsx`: `notifications.settings.remindLaterDuration`, `notifications.settings.enableActionButtons`.
     - `app/screens/debug/TDACDebugScreen.tsx`: `debug.tdac.title`, `debug.sections.iosUpdate`.
     - `app/screens/hongkong/HDACSelectionScreen.tsx`: `dest.hongkong.hdac.selection.aiLabel`.
     - `app/screens/korea/KoreaEntryPackPreviewScreen.tsx`: `dest.korea.preview.headerTitle`, `dest.korea.preview.previewMode`.
     - `app/screens/thailand/PIKGuideScreen.tsx`: `common.reader.font.decrease`, `common.reader.font.increase`.
     - `app/screens/thailand/TDACFilesScreen.tsx`: `dest.thailand.tdac.loadingSavedFiles`.
     - `app/screens/ProfileScreen.tsx`: `profile.fields.passportNo`, `profile.fields.nationality`, `profile.fields.validUntil`.
     - `app/screens/CopyWriteModeScreen.tsx`: `common.reader.font.decrease`, `common.reader.font.increase`.
     - `app/screens/PrivacyConsentScreen.tsx`: `gdpr.rights.access`, `gdpr.rights.portability`.
     - `app/screens/GDPRDataExportScreen.tsx`: `gdpr.export.title`, `gdpr.export.share`.
     - `app/screens/GDPRDataDeletionScreen.tsx`: `gdpr.deletion.willDelete`, `gdpr.deletion.consequences.accountDeactivated`.
4. Navigation labels
   - Audit `app/navigation/AppNavigator.tsx` and related index files; ensure every screen title/Tab label reads from keys (e.g., `home.title`, `profile.title`, `dest.hongkong.title`).
5. Linting and scripts
   - Enable `react/jsx-no-literals` (with an allowlist for emoji) and extend lint scripts to include `.ts,.tsx`.
   - Optionally add a simple check that scans for `t('...')` keys and reports missing translations.

## Verification
- Run lint to catch any remaining literals in `.tsx`.
- Switch languages to verify runtime updates via `LocaleProvider`.
- Spot-check the updated screens for correct text, interpolation, and fallbacks.

## Rollout
- Implement changes incrementally per screen group (Home, Notifications, GDPR, Profile, Destinations), validating after each group.
- Document the key naming convention in code comments or developer docs to keep future additions consistent.

If you approve, I will create the translation packs, wire them into the aggregator, and update all listed screens and navigation labels to use consistent `t(...)` keys, plus strengthen linting to prevent regressions.