# Root docs/ Folder Cleanup Proposal

**Current**: ~40 files in root (too many!)
**Target**: ~12 essential files in root

---

## 📋 What to KEEP in Root (12 files)

### Core Documentation (6 files)
- ✅ `README.md` - Documentation index
- ✅ `QUICKSTART.md` - Getting started
- ✅ `ARCHITECTURE.md` - System architecture
- ✅ `ADDING_NEW_COUNTRY.md` - Country integration workflow
- ✅ `TODO.md` - Current tasks
- ✅ `AGENTS.md` - AI agents

### Reference Docs (4 files)
- ✅ `QUICK_REFERENCE_DEV_DATABASE.md` - Database quick ref
- ✅ `REPOSITORY_API_REFERENCE.md` - API reference
- ✅ `DOC_CLEANUP_PLAN.md` - This cleanup's history
- ✅ `README_APP.md` - App README

### Active Features (2 files)
- ✅ `PDF_EXPORT_FEATURE.md` - Current feature
- ✅ `GLASSCARD_INTEGRATION_GUIDE.md` - Active integration

**Total: 12 files** ✨

---

## 📦 What to ARCHIVE (28 files)

### → history/implementations/ (15 files)
Implementation/status docs that are completed:
- `INTEGRATION_STATUS.md`
- `INTEGRATION_GUIDE.md` (move to guides/ instead?)
- `INTEGRATION_COMPLETION_OPTIONS.md`
- `SINGAPORE_ACTUAL_INTEGRATION_PATTERN.md`
- `SINGAPORE_HOOKS_INTEGRATION_GUIDE.md`
- `SINGAPORE_INTEGRATION_EXAMPLE.md`
- `MIGRATION_IMPLEMENTATION_SUMMARY.txt`
- `MULTI_COUNTRY_AUDIT.md`
- `VIETNAM_PROOF_OF_CONCEPT.md`
- `THAILAND_I18N_SHIP_READY.md`
- `TRAVEL_INFO_PERSISTENCE_IMPLEMENTATION.md`
- `TEST_RUN_RESULTS.md`
- `THAI_CODE_REVIEW.md`
- `i18n-implementation-plan.md`
- `i18n-progress-summary.md`
- `thailand-i18n-completion-summary.md`
- `thailand-i18n-final-summary.md`
- `thailand-entry-flow-redesign-summary.md`

### → history/planning/ (7 files)
Chinese planning/design docs:
- `React-Native国产手机兼容性分析.md`
- `全球网络访问方案.md`
- `出境通-最终确认.md`
- `家庭账号与远程协助设计.md`
- `数据安全与合规方案.md`
- `离线模式与访客模式设计.md`
- `项目总结-精简版.md`

### → history/fixes/ (7 files)
Specific fix/solution docs:
- `COMMERCIAL_FLIGHT_ID_UPDATE.md`
- `TRANSPORT_MODE_ID_CORRECTION.md`
- `TDAC_TIMEOUT_FINAL_SOLUTION.md`
- `IOS_SIMULATOR_NETWORKING_RESOLVED.md`
- `IOS_SIMULATOR_SOLUTION.md`
- `NETWORKING_TEST_CLEANUP.md`
- `fix-tdac-hanging-issue.md`

### → history/ or api/ (6 files)
Reference docs (decide based on current relevance):
- `DEV_MODE_CONFIRMATION_DIALOGS.md` → history/
- `DEV_MODE_DATABASE_SIMPLIFICATION.md` → history/
- `ASYNCSTORAGE_USAGE_AUDIT.md` → history/
- `README-schema-v2.md` → api/ or history/
- `FLASH_API_SUBMISSION_FLOW_REVIEW.md` → history/
- `FLASH_API_FLOW_DIAGRAM.txt` → history/

### → features/ or history/ (3 files)
Small features:
- `visa-free-badge-feature.md` → features/ or history/
- `JAPAN_PURPOSE_OF_VISIT_UPDATE.md` → history/
- `MALAYSIA_VS_THAILAND_COMPARISON.md` → history/

### → history/ (2 files)
Misc:
- `database-design.md` → history/
- `front-end-spec.md` → history/

**Total to archive: ~30 files**

---

## ✨ Result

**Before**: 40+ files in root (overwhelming)
**After**: 12 essential files (clean and focused)

**Reduction**: 70% fewer files in root!

---

## 🤔 Exceptions to Consider

**Keep if still actively used:**
- `INTEGRATION_GUIDE.md` - Move to `guides/` instead of archiving?
- `DEV_MODE_*` - If these are still relevant for dev
- `visa-free-badge-feature.md` - If feature is still being developed

**You decide based on what's actively used!**

---

## 🚀 Execution Command

```bash
# Run this script to execute the cleanup
./scripts/cleanup-docs.sh root-cleanup
```

Or I can do it manually for you!
