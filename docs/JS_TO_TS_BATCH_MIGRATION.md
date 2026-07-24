# JS → TS Batch Migration

> Last updated: 2025-02-14

## Snapshot (before batch conversion)

- Remaining `.js` files under `app/`: 340 → **0** after this pass
- Distribution of the original 340 files:
  - `config/`: 77
  - `utils/`: 69
  - `services/`: 65
  - `components/`: 56
  - `hooks/`: 35
  - `data/`: 13
  - `templates/`: 10
  - `i18n/`: 8
  - `theme/`: 2
  - `types/`, `navigation/`, `models/`, `assets/`, `__tests__/`: remainder

## Batch Strategy

1. **Automated conversion**  
   - Rename every `app/**/*.js` file to `.ts` or `.tsx` (see heuristics below).  
   - Prepend `// @ts-nocheck` to preserve current behavior while TypeScript types are added incrementally.

2. **JSX detection heuristics**  
   - Convert to `.tsx` when the file contains obvious JSX (e.g. `<View`, `<Text`, `<Component`, `return (` followed by `<`).  
   - Default to `.ts` for config/data/services without JSX.

3. **Safety valves**  
   - Skip files when a `.ts`/`.tsx` sibling already exists (manual review later).  
   - Keep existing relative import paths (Metro already resolves without extensions).  
   - Defer deletion of historical backup files (e.g. `*.js.backup_*`).

4. **Post-processing**  
   - Verify `rg --files -g '*.js' app` returns zero results (✅).  
   - Update migration docs/status pages with the new totals.  
   - Schedule follow-up passes to remove `@ts-nocheck` directives and tighten types per domain.

## TODO Checklist

- [x] Generate definitive file list (`rg --files -g '*.js' app`).  
- [x] Implement one-shot migration script (`scripts/migrate_app_js_to_ts.py`).  
- [x] Capture dry-run report (files renamed, skipped, conflicts).  
- [x] Execute migration and validate there are no `.js` files left under `app/`.  
- [ ] Run existing test suites / type-check once the tree stabilizes.  
- [x] Update `docs/TYPESCRIPT_MIGRATION_STATUS.md` with “0 JS files remaining in app/`.  
- [ ] Plan follow-up strictness (remove `allowJs`, turn on `strict` once feasible).

## Notes

- `allowJs` can remain enabled temporarily; removing it becomes trivial once all `.js` files disappear.  
- Treat `app/templates`, `app/screens`, and `app/components` as JSX-heavy by default.  
- Keep an eye on generated files (e.g. snapshot fixtures) before blindly renaming; add explicit excludes if needed.
