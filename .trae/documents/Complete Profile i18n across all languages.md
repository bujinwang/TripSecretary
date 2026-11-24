## Scope
- Internationalize all Profile-related screens: Profile, Notification Settings, Notification Logs, Entry Info History, and in‑screen modals.
- Ensure consistent translations for the languages shown in the selector: English, 简体中文, 繁體中文, Français, Deutsch, Español, plus add Korean (한국어) and Japanese (日本語) for the Profile namespace.

## Implementation Steps
1. Audit Strings
- Scan Profile, Notification Settings, Notification Logs, and Entry Info History for hardcoded literals and Spanish remnants.
- Replace any literals with `t('...')` keys where missing; keep existing defaults as neutral English for safety.

2. Fill Translation Keys
- Extend `app/i18n/locales.ts`:
  - Add complete `profile.*` namespace for `ko` and `ja` (titles, subtitles, fields, funding, passport, VIP, export, edit modal, menu, common labels).
  - Ensure `fundItem.types.*` and `fundItem.detail.notProvided` exist for all targeted languages.
  - Verify `fr/de/es` blocks already cover `notificationLog.*`, `notificationSettings.*`, and `history.*` where used; add any missing keys if discovered during audit.
- Confirm `zh-TW` is generated from Simplified via converter and override specific phrasing only if needed.

3. Language Switching
- Verify `SUPPORTED_LANGUAGES` includes all codes; confirm selector shows native names and persists.
- Fix any mis-normalization that could cause Spanish to appear after selecting another language (check `normalizeLanguage` usage and stored value).

4. Verification
- Switch through all languages in the Profile language modal:
  - Confirm Profile header, Personal/Funding/Passport sections, VIP banner, export dialogs, and menu items render localized text.
  - Open Notification Settings and Notification Logs to confirm localized section headers and actions.
  - Open Entry Info History and check labels/groups and action texts.
- Validate fund item type labels display correctly in the funding section.

## Deliverables
- Updated `locales.ts` with `ko` and `ja` Profile translations and any missing keys for other languages.
- String audit fixes across Profile-related screens (no business logic changes).
- Verified language switching and persistence without unexpected Spanish fallback.

## Rollback
- Changes limited to translation keys and i18n calls; safe to revert via file diffs if needed.

Please confirm to proceed with implementation and verification.