## Summary
- Effort: low; 10–15 minutes following existing destination metadata pattern.
- Outcome: China (`cn`) is selectable, shows correct visa status for `CAN`, and your personal 10‑year visa can be recorded in `passport_countries`.

## Approach
- Prefer destination metadata over fallback for consistency and discoverability.
- Use `visaRequirement` keyed by ISO alpha‑3 nationality codes (e.g., `CAN`).

## Implementation Steps
1. Create China destination config
- File: `app/config/destinations/china/metadata.ts`
- Minimal fields: `id: 'cn'`, `code: 'CN'`, `code3: 'CHN'`, names (EN/ZH), `flag: '🇨🇳'`, `enabled: true`, `flightTimeKey: 'home.destinations.china.flightTime'`, and `visaRequirement: { CAN: 'visa_required', default: 'visa_required' }`.
- Reference pattern: Korea metadata in `app/config/destinations/korea/metadata.ts` and USA in `app/config/destinations/usa/metadata.ts`.

2. Export China module
- File: `app/config/destinations/china/index.ts`
- Re‑export `metadata` and provide `screens: { info: 'TravelInfo' }` (or omit until specialized screens exist).

3. Register China in destination registry
- Edit `app/config/destinations/index.ts` to import and add `cn: chinaConfig` to `DESTINATIONS`.

4. Add i18n keys if referenced
- `home.destinations.china.flightTime` in `app/i18n/translations/countries.en.json`, `countries.zh-CN.json`, `countries.zh-TW.json` (optional `countries.ko.json` if desired).

5. Optional fallback-only path (if you want zero new files)
- Add `cn` entry to `FALLBACK_COUNTRIES` in `app/utils/countriesService.ts` with `visaRequirement.CAN = 'visa_required'`.

## Personal Visa Record (based on your 10‑year visa)
- Store a user‑specific record so the app can reflect “visa already held”.
- Use `PassportCountry.save` via `SecureStorageService.savePassportCountry`:
  - `countryCode: 'CHN'`
  - `visaRequired: false` (requirement satisfied by existing visa)
  - `maxStayDays: null` (or 60 if you prefer to track typical per‑entry stay)
  - `notes: '10-year multiple-entry tourist visa (Canadian passport)'`
- References:
  - Model in `app/models/PassportCountry.ts` (save/load)
  - Repository in `app/services/security/repositories/PassportRepository.ts` (addCountry)

## Verification
- Country resolution: call `getVisaRequirement('cn', 'CAN')` -> `'visa_required'` (from destination metadata). See `app/utils/countriesService.ts:169` (resolution) and `app/config/destinations/index.ts:65` (lookup).
- Display: `getCountryForDisplay('cn', t, lang)` returns `visaRequirement` and `visaPriority`. See `app/utils/countriesService.ts:280`.
- Sorting: `getHotCountries` respects `visaPriority` (visa_required = 4). See `app/utils/countriesService.ts:336`.
- Personal record: load via `SecureStorageService.getPassportCountry(passportId, 'CHN')` and confirm stored fields.
- Optional test: extend `app/utils/__tests__/countriesService.test.ts` with a `cn` case verifying `'CAN'` mapping.

## Notes
- If you prefer no new destination yet, the fallback entry is a one‑line change, but destination metadata is the long‑term pattern.
- No backend schema changes needed; `passport_countries` already supports your record.

## Next Action
- I will implement the destination metadata (preferred), registry update, minimal translations, and add your personal `passport_countries` record exactly as above.