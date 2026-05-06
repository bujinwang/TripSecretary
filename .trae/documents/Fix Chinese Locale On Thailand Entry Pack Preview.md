## Root Cause

* Thailand preview config hardcodes Thai strings and uses Thai defaults for missing translations.

* `t()` falls back to `defaultValue` when a key is missing, so Chinese UI shows Thai for Thailand-specific keys.

* Evidence:

  * Hardcoded Thai header/subtitle in `app/config/destinations/thailand/entryPackPreviewConfig.tsx:43–53` and `:169–176`.

  * Thai default strings via `t('thailand.preview.*', { defaultValue: '...' })` in `entryPackPreviewConfig.tsx:75–99` and `:132–147`.

  * `t()` defaultValue fallback behavior in `app/i18n/LocaleContext.tsx:147–172`.

  * No `thailand.preview.*` keys exist in central translations (`app/i18n/locales.ts`), so default Thai is used.

## Fix Plan

1. Replace hardcoded Thai with translatable content

* Update Thailand config to avoid raw Thai strings; use either i18n keys or `values` maps per language supported by `resolveText`.

* Example: `header.title` → `{ values: { th: '...', zh-CN: '...', zh-TW: '...', en: '...' } }`.

1. Add i18n keys for Thailand preview

* Define `thailand.preview.deadline.*` and `thailand.preview.actions.*` under `zh-CN`, `zh-TW`, `en`, `th` in `app/i18n/locales.ts`.

* Map concise, consistent Chinese copy for each string (deadline alerts, action labels, header, info tips).

1. Use current UI language for date formatting

* In `entryPackPreviewConfig.tsx:31–36`, replace `'th-TH'` with the active `language` from `useTranslation()`; fallback to `'en'` if unavailable.

1. Normalize namespace usage

* Optionally standardize action keys to `entryPack.preview.actions.*` to reuse across countries; keep country-specific overrides under `thailand.preview.*` where needed.

1. Verification

* Switch locale to `zh-CN` and open Thailand Entry Pack preview; confirm all strings render in Chinese.

* Also verify `zh-TW` shows Traditional Chinese; `th` shows Thai; `en` shows English.

## Deliverables

* Updated Thailand preview config with multi-language `values` and no hardcoded Thai.

* New translation entries for `thailand.preview.*` in `locales.ts` for `zh-CN`, `zh-TW`, `en`, `th`.

* Date formatting respects current UI language.

* Manual verification across `zh-CN`, `zh-TW`, `th`, `en`.

