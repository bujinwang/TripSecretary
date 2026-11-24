## Objectives

* Verify and complete translations for every screen’s user‑facing text in both English and Chinese.

* Ensure English appears only when English is selected; Chinese appears only when Chinese is selected.

* Prevent regressions via automated coverage and JSON integrity checks.

## Scope

* Screen categories:

  * Info screens (country landing/guide) — e.g., `*InfoScreen.tsx` driven by `EntryInfoScreenTemplate`.

  * Entry Flow status screens — `*EntryFlowScreen.tsx` driven by `EntryFlowScreenTemplate`.

  * Entry Pack Preview screens — `*EntryPackPreviewScreen.tsx` driven by `EntryPackPreviewTemplate`.

  * Travel Info screens — `*TravelInfoScreen.tsx` driven by `TravelInfoScreenTemplate` or country configs.

  * Entry Guide screens — `entryGuide/*`.

* Countries covered: TH, SG, HK, MY, TW, KR, JP, USA, VN, CA.

## Standards & Namespaces

* Use ISO namespaces in translation keys: `th`, `sg`, `hk`, `my`, `tw`, `kr`, `jp`, `usa`, `vn`, `ca`.

* Normalize destination→namespace mapping in templates/configs before key generation.

* Avoid language‑specific hardcoded defaults inside templates; use English defaults only as development fallback.

## Key Sets to Validate (per country)

* Info:

  * `*.info.headerTitle`, `*.info.title`, `*.info.subtitle`

  * `*.info.sections.{visa|onsite|appFeatures}.{title,items[]}`

  * `*.info.continueButton`

* Entry Flow:

  * `*.entryFlow.title`, `*.entryFlow.submissionWindow`

  * `*.entryFlow.progress.headline.{ready,almost,start}`

  * `*.entryFlow.progress.subtitle.{ready,almost,start}`

  * `*.entryFlow.progress.label`

  * `*.entryFlow.status.{ready,mostlyComplete,needsImprovement}.{title,subtitle}`

  * `*.entryFlow.countdown.{title,subtitle,time,arrival,days}`

  * `*.entryFlow.actions.{startEntryGuide,submit,submitSubtitle,edit,editSubtitle,entryGuide,entryGuideSubtitle,previewPack,previewPackSubtitle,editThai,editThaiSubtitle,help.{title,message,share,contact,callout,calloutSubtitle},incomplete.{title,message},success.{title,message},continue}`

* Preview:

  * `*.entryPack.preview.actions.{editInfo,viewGuide,submit*}`

  * `*.entryPack.preview.completion.{title,subtitle}`

  * `*.entryPack.preview.validation.{title,message}`

  * `*.entryPack.preview.documents.{title,subtitle}`

## Methodology

1. Inventory keys used by templates/configs via static search:

   * Scan `app/templates/*` and `app/config/destinations/**/*` for `*.Key`/`*.labelKey`/`t(...)` usages.

   * Build a country→keys matrix for all screen categories.
2. Compare inventory against `app/i18n/translations/countries.en.json` and `countries.zh.json`:

   * Identify missing keys per country and screen category.
3. Normalize any configs using long names (e.g., `singapore.info.*`) to ISO codes (`sg.info.*`).
4. Fill missing English and Chinese keys:

   * Draft English copy consistent with existing voice; add equivalent Chinese copy.
5. Validate formatting and interpolation:

   * Ensure placeholders like `{{percent}}`, `{{days}}`, `{{date}}` are present correctly in both languages.

## Automation & Safeguards

* JSON integrity check: parse translation JSON files in CI to prevent runtime crashes.

* i18n coverage script/test: verifies required en/zh keys exist for each country; fails build if missing.

* Add `npm run i18n:check` and include in test pipeline.

## Verification

* Manual QA per country:

  * Switch language to English; open Info, Entry Flow, Preview, Travel Info, Entry Guide → confirm all labels are English.

  * Switch language to Chinese and repeat → confirm all labels are Chinese.

* Capture before/after screenshots for representative countries (SG, HK, MY) to confirm fixes.

## Timeline

* Day 1: Run audit; normalize namespaces; fix SG/HK/MY (already partially complete). Deliver coverage passing for these.

* Day 2: Fill TH, TW, KR, JP; run coverage and manual QA.

* Day 3: Fill USA, VN, CA; finalize coverage tooling; wrap up verification.

## Deliverables

* Completed `countries.en.json` and `countries.zh.json` for all countries and screens.

* Normalized configs; consistent mapping for all templates.

* Automated i18n coverage and JSON integrity checks.

* Short verification report with screenshots.

## Request

* Approve this plan to begin the full audit and implementation. I will start immediately with the repository‑wide key inventory, then fill missing English/Chinese keys country by country, and wire up the coverage checks.

