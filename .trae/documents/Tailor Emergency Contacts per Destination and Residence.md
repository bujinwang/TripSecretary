## Goal
Make the Entry Guide’s “Emergency Contacts” tab truly useful by tailoring contacts to both the destination and the traveler’s country of residence (fallback to passport nationality), across all supported destinations.

## Current State
- Tab content comes from each country’s `entryGuide` config step `id: 'emergency_contacts'` and renders `currentStep.tips`/`tipsZh` in `app/templates/EntryGuideTemplate.tsx`.
- US screen already enriches tips dynamically with embassy numbers based on `route.params.passport.nationality` (`app/screens/usa/USAEntryGuideScreen.tsx:41-54`).
- Destination-level emergency datasets exist for Thailand (`app/config/destinations/thailand/emergencyInfo.ts`) and are retrievable via `getEmergencyInfo(destinationId)` (`app/config/destinations/index.ts:161-164`), but not uniformly present/used for other countries.

## Approach
1. Standardize a destination emergency data shape
- Use the Thailand schema as reference: `emergencyNumbers`, `embassies`, `hospitals`, `hotlines`.
- For destinations missing `emergency` data (e.g., Japan), add minimal `emergencyInfo.ts` with police/ambulance/fire numbers, tourist hotlines and a small set of common embassies (USA, CHN, GBR).

2. Build a centralized builder for tips
- Create `app/utils/EmergencyContactsBuilder.ts` with `buildEmergencyTips({ destinationId, residentCountryCode3, language })`.
- Logic:
  - Pull core numbers (`police`, `ambulance`, `fire`, country-wide “single” emergency numbers if present).
  - Add relevant hotlines (tourist police, immigration/border).
  - Locate the traveler’s embassy/consulate from `embassies` via ISO alpha-3 `countryCode` (fallback to passport code when residence missing; fallback to a generic embassy help text if not found).
  - Format for `zh` vs `en` using `nameZh` and localized number labels where available.

3. Resolve traveler residence/nationality
- Prefer `personal_info.country_region` via `UserDataService` (see storage flow summarized by `PersonalInfo.countryRegion`).
- Fallback to `route.params.passport.nationality` (see `USAEntryGuideScreen.tsx:16-29`).
- Normalize to ISO alpha-3 for embassy lookup (extend existing `countryCodeUtils` with a small mapping for common countries if needed).

4. Inject tailored tips in screens
- In each Entry Guide screen (Japan, Singapore, Korea, Thailand, Vietnam, Hong Kong, Canada, USA), compute `tailoredConfig` in `useMemo` similar to US and overwrite the `emergency_contacts` step’s `tips` with builder output.
- Keep other steps unchanged; preserve bilingual `tipsZh` when builder provides Chinese strings.

5. Template-level optional auto-tailoring
- As a follow-up, optionally enhance `EntryGuideTemplateCurrentStep` to auto-tailor when `currentStep.id === 'emergency_contacts'` and `route.params.destination` is available. Prefer screen-level first to avoid side effects and ensure clear ownership.

6. Internationalization
- Return language-appropriate strings from the builder; respect `EntryGuideTemplate`’s `isChinese` selection (`app/templates/EntryGuideTemplate.tsx:600-646`).

7. Testing and verification
- Add unit tests for builder (per-destination inputs → expected tips arrays).
- Add integration tests to verify each screen renders embassy contact for residence/passport correctly.
- Manually verify numbers for all destinations; cross-check official emergency numbers.

## Deliverables
- `EmergencyContactsBuilder` utility with docs and tests.
- Minimal `emergencyInfo.ts` for destinations missing it (Japan, Singapore, Korea, Vietnam, Hong Kong, Canada where applicable).
- Updated Entry Guide screens to tailor the `emergency_contacts` step.

## Rollout Plan
- Phase 1: Implement builder, update two destinations (US, Thailand) to prove pattern.
- Phase 2: Add/standardize emergency datasets and wire remaining destinations.
- Phase 3: Optional template auto-tailoring and i18n refinements.

## Code References
- Entry Guide rendering and tips resolution: `app/templates/EntryGuideTemplate.tsx:600-646`, `app/templates/EntryGuideTemplate.tsx:442-771`.
- US dynamic tailoring example: `app/screens/usa/USAEntryGuideScreen.tsx:41-54`.
- Destination emergency retrieval: `app/config/destinations/index.ts:161-164`.
- Thailand emergency dataset example: `app/config/destinations/thailand/emergencyInfo.ts:22-106`.