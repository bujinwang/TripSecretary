## Problem
- The Singapore Info screen displays raw keys or mixed-language text; every word should be English when language=English.

## Immediate Fix (Singapore)
1. Ensure Singapore Info config uses ISO namespace keys:
   - Change keys in `app/config/destinations/singapore/infoScreenConfig.ts` from `singapore.info.*` to `sg.info.*`.
2. Validate English translations exist:
   - Confirm `sg.info.*` in `app/i18n/translations/countries.en.json` (headerTitle, title, subtitle, sections, continueButton).
3. Reload app to pick up translation changes (Metro cache clears often fix stale loads).

## Consistency & Safeguards
1. Normalize destination→namespace mapping across templates (`us→usa`, `malaysia→my`, `singapore→sg`, `hongkong→hk`, `japan→jp`, `korea→kr`, `taiwan→tw`).
2. Audit templates for language-specific default strings; set defaults to English only and rely on zh keys for Chinese.
3. Remove duplicate country blocks in JSON that shadow earlier keys.

## Fill Missing Keys (English & Chinese)
- Required sets per country:
  - Info: `*.info.headerTitle`, `*.info.title`, `*.info.subtitle`, `*.info.sections.{visa|onsite|appFeatures}.{title,items[]}`, `*.info.continueButton`.
  - Entry Flow: `*.entryFlow.title`, `*.entryFlow.progress.headline/subtitle/label`, `*.entryFlow.status.*`, `*.entryFlow.countdown.*`, `*.entryFlow.actions.*`.
  - Preview: `*.entryPack.preview.actions.*`, `*.entryPack.preview.completion.*`, `*.entryPack.preview.validation.*`, `*.entryPack.preview.documents.*`.
- Proceed country-by-country (SG → HK → MY → TH → TW → KR → JP → USA → VN → CA).

## Automation
- Add a JSON integrity check to prevent runtime crashes.
- Add an i18n coverage script/test that fails when required en/zh keys are missing.

## Verification
- For each country, switch language to English and Chinese and open Info/Entry Flow/Preview; confirm all labels render in selected language.
- Provide quick before/after screenshots for Singapore.

## Request
- Approve this plan to implement the fixes and complete the i18n coverage. I will start with Singapore (ensure full English rendering), then complete the audit and fill keys for the remaining countries.