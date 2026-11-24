## Scope & Goals
- Audit all user‑facing screens and templates for translation correctness.
- Ensure English renders exclusively when language=English; Chinese renders exclusively when language=Chinese.
- Normalize namespaces and destination ID mappings so keys resolve consistently across countries.
- Fill missing keys in `countries.en.json` and `countries.zh.json` and remove language‑specific hardcoded defaults.

## Current Architecture
- Provider: `app/i18n/LocaleContext.tsx` — exposes `t(key, { defaultValue })`, persists language.
- Country translations loader: `app/i18n/translations/index.ts` — merges `countries.*.json` into `translations` (Traditional Chinese generated lazily).
- Final merged map: `app/i18n/locales.ts` — exports `translations`, supports fallback to English.
- Templates driving screens:
  - Info: `app/templates/EntryInfoScreenTemplate.tsx`
  - Entry Flow: `app/templates/EntryFlowScreenTemplate.tsx`
  - Entry Pack Preview: `app/templates/EntryPackPreviewTemplate.tsx`

## Key Consistency Requirements
- Use ISO code namespaces in translation keys: `th`, `sg`, `hk`, `my`, `tw`, `kr`, `jp`, `usa`, `ca`, `vn`.
- Avoid defaultValue strings in non‑English; rely on keys existing in both `en` and `zh`.
- Map route destination IDs → ISO codes before key generation.

## Issues To Address
- Some configs/pages use long country names in keys (e.g., `singapore.info.*`) causing missing translations.
- Mixed or Chinese defaults inside templates can leak Chinese into English UI if a key is absent.
- Incomplete action/countdown/status keys across countries for entry flow & info screens.

## Implementation Plan
### Phase 1: Inventory & Coverage Report
- Enumerate all translation keys used by templates/configs via static search and generate a country/key matrix.
- Compare with `countries.en.json` and `countries.zh.json` to detect missing keys.

### Phase 2: Normalize Destination → Namespace Mapping
- Create a shared mapper (`mapDestinationId`) used in templates and any config that builds translation keys: `us→usa`, `malaysia→my`, `singapore→sg`, `hongkong→hk`, `japan→jp`, `korea→kr`, `taiwan→tw`.
- Ensure all screens’ configs use ISO code namespaces (e.g., `sg.info.*`), updating any outliers.

### Phase 3: Template Defaults Hygiene
- Audit `EntryFlowScreenTemplate`, `EntryInfoScreenTemplate`, `EntryPackPreviewTemplate` for language‑specific defaultValue texts.
- Replace defaults with English only; guarantee zh keys exist so Chinese users see Chinese strings from translation files.

### Phase 4: Fill Translation Keys (en & zh)
- Define required key sets per page type:
  - Info: `*.info.headerTitle`, `*.info.title`, `*.info.subtitle`, `*.info.sections.{visa|onsite|appFeatures}.{title,items[]}`, `*.info.continueButton`.
  - Entry Flow: `*.entryFlow.title`, `*.entryFlow.progress.headline/subtitle/label`, `*.entryFlow.status.ready/mostlyComplete/needsImprovement.title/subtitle`, `*.entryFlow.countdown.title/subtitle/time/arrival/days`, `*.entryFlow.actions.*`.
  - Preview: `*.entryPack.preview.actions.*`, `*.entryPack.preview.completion.*`, `*.entryPack.preview.validation.*`, `*.entryPack.preview.documents.*`.
- For each country directory under `app/screens/*`, ensure keys exist in both `countries.en.json` and `countries.zh.json`.

### Phase 5: Tests & Tooling
- Extend `app/i18n/__tests__/MissingTranslationKeys.test.ts` to assert each required key exists in both languages for all active countries.
- Add a lightweight script to parse JSON and fail on syntax errors (guard against crashes like non‑std exceptions).

### Phase 6: Verification
- Manual checks per country:
  - Switch language to English and open Info, Entry Flow, Preview → verify all UI in English.
  - Switch to Chinese and repeat → verify all UI in Chinese.
- Validate countdown date formatting respects `language` in `EntryFlowScreenTemplate`.

## Country Checklist (Screens)
- Hong Kong: Info, Entry Flow, Entry Pack Preview, HDAC guides/selection/webview.
- Singapore: Info, Entry Flow, Entry Pack Preview, SGAC guides/selection/webview.
- Malaysia: Info, Entry Flow, Entry Pack Preview, MDAC selection/webview.
- Thailand, Taiwan, Korea, Japan, USA, Canada, Vietnam: Info, Entry Flow, Entry Pack Preview where present.

## Deliverables
- Updated configs and templates using ISO namespaces.
- Completed `en`/`zh` translation keys across required sets.
- Tests ensuring translation coverage; CI guard scripts for JSON integrity.
- Short verification report with before/after screenshots for at least HK, SG, MY.

## Rollout
- Implement in small PRs by country to ease review.
- Run tests; perform manual QA; merge once each country passes the checklist.

## Confirmation
- Proceed with the implementation phases above, starting with Singapore and Hong Kong fixes, then audit & fill remaining countries, and add tests for coverage?