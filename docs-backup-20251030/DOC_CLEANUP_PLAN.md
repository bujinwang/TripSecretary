# Documentation Cleanup Plan

**Current Status**: 229 markdown files
**Target**: ~20-30 essential docs
**Reduction**: ~85% fewer files

---

## Problem Analysis

### Issues
1. **Fix summaries everywhere** - Historical fixes that are already implemented
2. **"Complete" docs** - Implementation summaries that are no longer needed
3. **Duplicate information** - Multiple docs covering same topics
4. **No clear hierarchy** - Hard to find what you need
5. **Outdated content** - Some docs reference old code/patterns

### Categories Found
- 50+ Fix/Bug summaries
- 30+ Implementation complete/summaries
- 15+ Refactoring docs
- 10+ Test/Debug guides
- Multiple country-specific guides
- Architecture/Design docs (keep these!)

---

## Proposed New Structure

```
docs/
├── README.md                          # Start here - project overview & doc index
├── QUICKSTART.md                      # Getting started guide
├── ARCHITECTURE.md                    # System architecture (keep current)
│
├── guides/                            # How-to guides (living docs)
│   ├── adding-new-country.md
│   ├── development.md                 # Dev setup, debugging, testing
│   ├── database.md                    # Database operations
│   └── troubleshooting.md            # Common issues & solutions
│
├── architecture/                      # Architecture decisions (living docs)
│   ├── Architecture-Decision-Records.md  # ADRs (keep)
│   ├── data-architecture.md
│   ├── multi-country-platform.md
│   └── component-system.md
│
├── design/                           # Design decisions (living docs)
│   ├── UI-design-system.md
│   ├── travel-info-screen-decisions.md
│   └── ux-patterns.md
│
├── api/                              # API references (living docs)
│   ├── services.md
│   ├── repositories.md
│   └── schema-v2-reference.md
│
├── features/                         # Feature specs (living docs)
│   ├── elderly-users.md
│   ├── pdf-export.md
│   └── ai-assistant.md
│
├── history/                          # Archive (read-only)
│   ├── 2025-10-vietnam-poc.md
│   ├── 2025-09-refactoring.md
│   ├── migrations/
│   │   ├── schema-v2-migration.md
│   │   └── security-migration.md
│   └── fixes/                        # All the old fix summaries
│
└── templates/                        # Code templates & examples
    ├── country-template/
    └── examples/
```

---

## Cleanup Strategy

### Phase 1: Archive Historical Docs (Safe to move)

**Move to `docs/history/fixes/`** (~100 files):
- All `*_FIX_*.md`
- All `*_SUMMARY.md` with dates
- All `*_COMPLETE.md`
- All `*_DEBUG_*.md`
- All implementation summaries

**Move to `docs/history/migrations/`** (~20 files):
- Schema migration docs
- Security migration docs
- Refactoring summaries

**Move to `docs/history/`** (~30 files):
- Dated project summaries (PHASE_1, PHASE_2, etc.)
- Country-specific implementation summaries
- Comparison/audit docs

### Phase 2: Consolidate Living Docs (~15 files)

**Merge into single guides**:
```
guides/development.md ← Merge:
  - DEBUG_TROUBLESHOOTING.md
  - REACT_NATIVE_DEBUG_GUIDE.md
  - DEV_MODE_*.md
  - QUICKSTART.md

guides/adding-new-country.md ← Merge:
  - ADDING_NEW_COUNTRY.md
  - INTEGRATION_GUIDE.md
  - Country template docs

guides/database.md ← Merge:
  - QUICK_REFERENCE_DEV_DATABASE.md
  - Repository docs
  - Schema references

api/schema-v2-reference.md ← Merge:
  - SCHEMA_V2_DAC_REFERENCE.md
  - README-schema-v2.md
```

### Phase 3: Delete Truly Obsolete (~30 files)

**Safe to delete** (info is in git history if needed):
- Empty files (FUNDS_PERSISTENCE_IMPLEMENTATION.md is 0B)
- Duplicate "QUICK_FIX" type docs
- Very old fix summaries (>6 months)
- Test run results
- Redundant comparison docs

---

## Keep These (High Value)

### Must Keep & Polish
- ✅ ARCHITECTURE.md - Core architecture
- ✅ Architecture-Decision-Records.md - ADRs
- ✅ ADDING_NEW_COUNTRY.md - Essential workflow
- ✅ UI设计规范.md - Design system
- ✅ Component docs in architecture/

### Keep but Archive
- Country-specific integration patterns (reference)
- Major migration docs (history)
- Security migration guide (reference)

---

## New Documentation Rules

### Going Forward
1. **One topic, one doc** - No duplication
2. **Living vs Historical** - Living docs update, historical goes to history/
3. **Fix summaries** - Don't create them. Use git commits + PR descriptions
4. **Implementation complete docs** - Don't create. Update TODO.md instead
5. **README.md as index** - Main README lists all docs with descriptions

### When to Document
- ✅ Architecture decision (ADR)
- ✅ New feature spec (features/)
- ✅ API change (api/)
- ✅ How-to guide (guides/)
- ❌ Bug fix summary
- ❌ Implementation complete status
- ❌ Refactoring summary
- ❌ Test results

---

## Execution Plan

### Option A: Aggressive (Recommended)
1. Create new structure
2. Move 150+ files to history/
3. Consolidate 30 files into 10 guides
4. Delete 30 obsolete files
5. Update README.md as index
6. **Result: ~25 essential docs**

### Option B: Conservative
1. Create history/ folder
2. Move obvious candidates (100 files)
3. Keep current structure for rest
4. Add README.md index
5. **Result: ~80 docs** (still better)

### Option C: Gradual
1. Freeze new doc creation
2. Move 10 files per week
3. Consolidate as you go
4. **Result: Clean in 2 months**

---

## Quick Wins (Do First)

1. **Create `docs/history/fixes/`** - Move all fix summaries (5 min)
2. **Move all "*_COMPLETE.md"** to history/ (2 min)
3. **Delete empty files** (1 min)
4. **Create README.md** with current doc index (10 min)

This gives immediate ~70% reduction with minimal risk.

---

## Next Steps

Choose your approach:
1. Review this plan
2. Pick: Aggressive / Conservative / Gradual
3. I'll execute the cleanup with you
4. Set up documentation guidelines

Would you like me to proceed with the Quick Wins first?
