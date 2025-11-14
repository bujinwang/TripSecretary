## Scope
- Complete i18n coverage across remaining screens/components: Thailand sections, USA screens, Vietnam (non-templates), Malaysia, Singapore, Taiwan.
- Replace hardcoded JSX literals flagged by lint; keep emojis/icons via rule allowances.
- Add/organize translation keys: common UI, travel info sections, passport/funds fields, action labels, emojis where needed.
- Remove unused files/screens detected during sweep.

## Key Additions to Translations
- Namespaces: `entryFlow.*`, `travelInfo.*`, `passport.*`, `funds.*`, `actions.*`, per-destination under `dest.<id>.*`.
- Field labels: `arrivalDate`, `departureDate`, `flightNumber`, `hotelAddress`, `provinceCity`, `district`, `durationOfStay`, `purpose`, plus `passportNumber`, `nationality`, `dateOfBirth`, `gender`, `expiry`.
- Section titles: `sections.passport`, `sections.personal`, `sections.travel`, `sections.funds`.
- Action labels: `continue`, `view`, `submit`, `share`, `delete`, `filter`, etc.

## Code Changes
- Replace literals in:
  - `app/screens/thailand/components/*` (PassportInfoSection, TravelInfoSection, ContactInfoSection, FundsInfoSection, QRCodeSection).
  - `app/screens/usa/*` (EntryFlow, EntryGuide).
  - `app/screens/vietnam/*` (EntryFlow, TravelInfo, Preview).
  - Remaining Malaysia/Singapore/Taiwan screens where literals persist.
- Centralize emojis via allowed strings but keep semantic labels via `t(...)`.

## Lint Refinement
- Adjust `react/jsx-no-literals`:
  - Set `ignoreProps: true` to avoid flagging icon props.
  - Add `allowedStrings` for common symbols (`:`, `%`, `(`, `)`, `›`, `✓`, `✕`, emoji set).
- Limit linting scope to `app/**` to avoid noisy docs/tests; expand `.eslintignore` for `docs*/` and example folders.

## Unused Code Cleanup
- Verify navigator-imported screens; remove non-referenced screens/components discovered in sweep (keep dev-only screens behind `__DEV__`).

## Verification
- Run lint on `app/screens` after changes; resolve remaining i18n-related warnings.
- Smoke run to ensure `t(...)` keys resolve with fallbacks.

## Deliverables
- Updated translation keys and screens with consistent `t(...)` usage.
- Refined ESLint config to reduce false positives while enforcing i18n.
- Removal of unused files found during sweep.

If confirmed, I will implement these changes across the listed areas, refine linting, and provide a summary of modified files and keys.