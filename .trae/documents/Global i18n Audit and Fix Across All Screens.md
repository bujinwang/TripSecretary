## Goal
Ensure every user-visible text and label across all screens and shared components uses the app’s i18n system (`useTranslation().t`) with complete, consistent keys and language coverage.

## Current State Summary
- LocaleContext provides `t` with interpolation, persistence, and fallbacks.
- Translations live in `app/i18n/translations/countries.*.json` and are merged in `translations/index.ts`.
- Supported languages in `locales.ts` currently: `en`, `zh-CN`, `zh-TW`, `fr`, `de`, `es`, `ms`.
- Additional translation files exist but aren’t wired: `th`, `vi`, `ko`, `ja`.
- Many screens already use `t`, but a number of titles/labels remain hard-coded (e.g., several `title:` props and `Text` children).

## Scope
- All screens in `app/screens/**` and shared UI in `app/components/**`.
- Navigation headers/options, buttons, inputs (`placeholder`, `label`), tooltips, alerts, toasts, templates (EntryPack), and notification payloads.
- Country-specific flows (Thailand, Singapore, Malaysia, Taiwan, Hong Kong, Korea, Japan, USA, Canada).

## Key Conventions
- Namespace by domain:
  - `common.*` for generic labels/buttons.
  - `tabs.*` for bottom tab labels.
  - `screenTitles.*` for navigator headers.
  - `forms.*` for field labels/placeholders.
  - `alerts.*`, `toasts.*` for transient messages.
  - `entryFlow.*`, `entryPack.*`, `notifications.*` for flow-specific content.
  - Country scopes under `thailand.*`, `singapore.*`, `malaysia.*`, `taiwan.*`, `hongkong.*`, `korea.*`, `japan.*`, `usa.*`, `canada.*`.
- Always use interpolation for variables: `t('entryPack.title', { destination })`.
- No string literals in JSX for user-visible text.

## Automation: Detection
1. Build a static analyzer script (Babel/TS AST) to flag hard-coded strings in:
   - `<Text>"..."</Text>` or `'...'` children without `{t(...)}`.
   - Props: `title`, `label`, `placeholder`, `aria-label`, `alt`, Tamagui `Text`, `Button`, RN components.
   - React Navigation `options.title: '...'`.
2. Output a CSV/JSON report with file path, line, snippet, and suggested key namespace.
3. ESLint rule added to CI/pre-commit to prevent regressions (allow test files and developer-only docs).

## Automation: Extraction & Key Seeding
1. Create a CLI to:
   - Generate key suggestions per flagged string using namespace heuristics and file paths.
   - Write/update `countries.en.json` with proposed keys.
   - Insert placeholders into all languages (`zh-CN`, `zh-TW`, `fr`, `de`, `es`, `ms`, plus `th`, `vi`, `ko`, `ja`).
2. Add a “missing translation” dev overlay/logger when `t(key)` falls back, to accelerate fill-in.

## Wiring Missing Languages
- Update `translations/index.ts` to import and expose `th`, `vi`, `ko`, `ja`.
- Update `SUPPORTED_LANGUAGES` and `LANGUAGE_FALLBACK` in `locales.ts`:
  - Fallbacks: `th → en`, `vi → en`, `ko → en`, `ja → en` initially; refine if preferred.
- Ensure device language normalization maps to these codes.

## Refactor Passes
1. Navigation headers: replace all literal `options.title` with keys under `screenTitles.*`.
2. Buttons/labels/placeholders: replace literals with `t('common.*')` or `forms.*`.
3. Flow content (guides/steps/cards): move literals into country namespaces.
4. Shared components: enforce props accept `t(key)` rather than raw strings; where necessary, pass keys and options instead of strings.

## Testing & QA
- Add tests:
  - Translation coverage: detect missing keys across all supported languages.
  - Snapshot tests for key screens ensuring no raw literals remain.
  - Locale switching tests for `zh-CN`/`zh-TW` conversion and new languages (`th`, `vi`, `ko`, `ja`).
- Manual QA script:
  - Smoke run each destination flow in `en`, `zh-CN`, `zh-TW`, and one of the new languages, verifying headers, buttons, placeholders, and guides.

## Developer Workflow
- Pre-commit ESLint rule blocks new literals.
- CI job runs analyzer + coverage test, fails on missing keys.
- A translation checklist is generated from analyzer report for translators.

## Timeline & Deliverables
- Phase 1 (Day 1): Analyzer + report; wire `th`, `vi`, `ko`, `ja`; add ESLint rule; seed keys.
- Phase 2 (Days 2–3): Refactor nav headers, common components, and high-traffic screens (Home, Login, Result, Entry flows).
- Phase 3 (Days 4–5): Country-specific flows migration; fill translation placeholders; add tests; QA.
- Deliverables: Analyzer tool, updated translation files, refactored screens/components, ESLint rule, tests, QA checklist.

## Risks & Mitigations
- Key churn: lock conventions early; add linter rule to enforce namespaces.
- Large diff: batch PRs per domain to ease review.
- Incomplete translations: placeholders + fallbacks; track via coverage report.

## Acceptance Criteria
- Zero hard-coded user-facing strings in `app/screens/**` and `app/components/**`.
- All navigation titles, labels, placeholders use `t`.
- `SUPPORTED_LANGUAGES` includes `th`, `vi`, `ko`, `ja`; fallbacks set.
- Tests pass: coverage/missing keys, snapshot, locale switching.
- Analyzer report shows no remaining violations.

## Confirmation
If this plan looks good, I’ll implement Phase 1 first: add analyzer, wire additional languages, generate the initial violation report, and seed keys across all locales.