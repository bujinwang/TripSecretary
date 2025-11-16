## Objective
Audit and align the TDAC submission JSON payload with the server’s expectations, confirm `gender` and other required fields are present end‑to‑end, and fix any gaps introduced by the TypeScript migration.

## Current Findings
1. API payload builder includes `gender` and all required fields
- `app/services/TDACAPIService.ts:1510–1557` builds `personalInfo`, `tripInfo`, `healthInfo` with required keys like `gender`, `arrDate`, `traPurposeId`, dates, residence, and transport IDs.
- `validateFormData` enforces presence of `gender` and `arrDate` (`app/services/TDACAPIService.ts:1304–1344`).
- Screens construct traveler payload with `gender` present:
  - `app/screens/thailand/TDACAPIScreen.tsx:116–150`
  - `app/screens/thailand/TDACHybridScreen.tsx:165–199`

2. Types show a gap unrelated to the API call
- `TDACSubmissionService.TravelerInfo` omits `gender` (used for post‑submission metadata/entry info), while API submission uses `TDACTravelerInfo` which includes `gender` (`app/types/thailand.ts:73–115`).

3. HAR alignment
- Endpoints and flow match: `initActionToken`, `gotoAdd`, `next`, `gotoPreview`, `submit`, `gotoSubmitted`, `downloadPdf`.
- `initActionToken` body keys (`token`, `langague`) align with HAR analysis.

## Required Field Checklist (server expects via `arrivalcard/next`)
- `personalInfo`: `familyName`, `middleName`, `firstName`, `gender` (TDAC ID), `nationalityId`, `nationalityDesc`, `passportNo`, `bdDateDay`, `bdDateMonth`, `bdDateYear`, `occupation`, `cityResCode`, `cityRes`, `countryResCode`, `countryResDesc`, `visaNo`, `phoneCode`, `phoneNo`.
- `tripInfo`: `arrDate`, `deptDate?`, `countryBoardCode`, `countryBoardDesc`, `traPurposeId`, `traModeId`, `tranModeId`, `flightNo`, `deptTraModeId?`, `deptTranModeId?`, `deptFlightNo?`, `accTypeId`, `accProvinceId`, `accProvinceDesc`, `accDistrictId/Desc` (empty for hotel), `accSubDistrictId/Desc` (empty for hotel), `accPostCode` (empty for hotel), `accAddress`, `notStayInTh`.
- `healthInfo`: `ddcCountryCodes` (empty string for most cases).

## Changes (no runtime behavior changes beyond fixing types/validation)
1. Add missing `gender` to `TDACSubmissionService.TravelerInfo`
- Update `app/services/thailand/TDACSubmissionService.ts` to include `gender?: string` so post‑submission snapshots/history can carry the field.

2. Strengthen pre‑flight validation for traveler payload
- Add an assertion helper used before calling `TDACAPIService.submitArrivalCard(...)` to verify all required traveler fields (`familyName`, `firstName`, `passportNo`, `nationality`, `birthDate`, `occupation`, `gender`, `countryResidence`, `cityResidence`, `phoneCode`, `phoneNo`, `arrivalDate`, `flightNo`, `accommodationType`, `province`, `address`) are non‑empty.
- Keep logs masked for sensitive fields.

3. Tests
- Add unit tests ensuring `buildFormData(...)` contains `gender` and other required keys with correct formats.
- Add screen‑level tests validating `buildTravelerPayload(...)` includes the full set of required fields.

## Verification
- Run existing TDAC integration tests and the new unit tests.
- Dry‑run payload construction and log key presence (masked values) without sending extra network requests.

## Rollback and Safety
- Typing addition is backward compatible. No API surface changes.
- Validation additions fail fast locally rather than after multiple API calls.

Please confirm and I will implement these changes and add the tests.