# TripSecretary Documentation

**Last updated:** 2025-10-30
**Total living docs:** 123 files | **Archived docs:** 106 files

Welcome to TripSecretary! This index will help you find what you need quickly.

---

## 🚀 Quick Start

New to the project? Start here:

- **[QUICKSTART.md](QUICKSTART.md)** - Get up and running in 5 minutes
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture overview
- **[ADDING_NEW_COUNTRY.md](ADDING_NEW_COUNTRY.md)** - How to add a new country

---

## 📚 Essential Documentation

### For Developers

**Getting Started:**
- [QUICKSTART.md](QUICKSTART.md) - Development setup
- [AGENTS.md](AGENTS.md) - AI agents documentation
- [QUICK_REFERENCE_DEV_DATABASE.md](QUICK_REFERENCE_DEV_DATABASE.md) - Database operations

**Architecture:**
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [architecture/Architecture-Decision-Records.md](architecture/Architecture-Decision-Records.md) - All ADRs
- [architecture/Multi-Country-Platform-Architecture.md](architecture/Multi-Country-Platform-Architecture.md)
- [architecture/Component-Reuse-Dynamic-Rendering.md](architecture/Component-Reuse-Dynamic-Rendering.md)
- [architecture/Config-Distribution-Architecture.md](architecture/Config-Distribution-Architecture.md)

**Integration & Development:**
- [ADDING_NEW_COUNTRY.md](ADDING_NEW_COUNTRY.md) - Country integration workflow
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - API integration guide
- [INTEGRATION_STATUS.md](INTEGRATION_STATUS.md) - Current integration status
- [GLASSCARD_INTEGRATION_GUIDE.md](GLASSCARD_INTEGRATION_GUIDE.md) - Glasscard integration
- [DEV_MODE_DATABASE_SIMPLIFICATION.md](DEV_MODE_DATABASE_SIMPLIFICATION.md) - Dev database

**Troubleshooting:**
- [IOS_SIMULATOR_SOLUTION.md](IOS_SIMULATOR_SOLUTION.md) - iOS simulator issues
- [NETWORKING_TEST_CLEANUP.md](NETWORKING_TEST_CLEANUP.md) - Network debugging
- [ASYNCSTORAGE_USAGE_AUDIT.md](ASYNCSTORAGE_USAGE_AUDIT.md) - AsyncStorage audit

### For Designers

**Design System:**
- [design/UI设计规范.md](design/UI设计规范.md) - UI design standards (Chinese)
- [design/智能出入境助手-产品设计文档.md](design/智能出入境助手-产品设计文档.md) - Product design (Chinese)

**UX Decisions:**
- [design/TRAVEL_INFO_SCREEN_DESIGN_DECISIONS.md](design/TRAVEL_INFO_SCREEN_DESIGN_DECISIONS.md) - Travel info screen UX
- [design/ThailandTravelInfoScreen-UX-Review.md](design/ThailandTravelInfoScreen-UX-Review.md) - Thailand UX review
- [design/ThailandEntryFlow-UX-Improvements.md](design/ThailandEntryFlow-UX-Improvements.md) - Entry flow improvements
- [design/EntryGuide-Template-Design.md](design/EntryGuide-Template-Design.md) - Entry guide templates

**Wireframes:**
- [wireframes/](wireframes/) - UI wireframes and mockups
- [ai/AI_TRIP_ASSISTANT_WIREFRAMES.md](ai/AI_TRIP_ASSISTANT_WIREFRAMES.md) - AI assistant wireframes

### For Product Managers

**Feature Specifications:**
- [features/ELDERLY_USER_FEATURES.md](features/ELDERLY_USER_FEATURES.md) - Elderly user accessibility
- [features/SETUP_ELDERLY_FEATURES.md](features/SETUP_ELDERLY_FEATURES.md) - Setup guide
- [PDF_EXPORT_FEATURE.md](PDF_EXPORT_FEATURE.md) - PDF export functionality
- [ai/AI_TRIP_ASSISTANT_MVP_SPEC.md](ai/AI_TRIP_ASSISTANT_MVP_SPEC.md) - AI assistant MVP spec

**AI Features:**
- [ai/AI_TRIP_ASSISTANT_SUMMARY.md](ai/AI_TRIP_ASSISTANT_SUMMARY.md) - AI assistant overview
- [ai/AI_TRIP_ASSISTANT_DESIGN.md](ai/AI_TRIP_ASSISTANT_DESIGN.md) - AI design doc
- [ai/AI_PROVIDERS_CHINA.md](ai/AI_PROVIDERS_CHINA.md) - AI providers in China

**Product Documentation:**
- [出境通-最终确认.md](出境通-最终确认.md) - Product overview (Chinese)
- [MULTI_COUNTRY_AUDIT.md](MULTI_COUNTRY_AUDIT.md) - Multi-country status
- [TODO.md](TODO.md) - Current tasks

### Internationalization (i18n)

- [i18n/HOW_TO_SELECT_SIMPLIFIED_CHINESE.md](i18n/HOW_TO_SELECT_SIMPLIFIED_CHINESE.md)
- [i18n/JAPAN_I18N_STATUS.md](i18n/JAPAN_I18N_STATUS.md)

### Integrations

- [integrations/登录方案对比分析.md](integrations/登录方案对比分析.md) - Login solutions (Chinese)

---

## 📂 Directory Structure

```
docs/
├── README.md              # 👈 You are here
├── QUICKSTART.md          # Quick start guide
├── ARCHITECTURE.md        # System architecture
├── ADDING_NEW_COUNTRY.md  # Country integration guide
├── TODO.md                # Current tasks
│
├── architecture/          # Architecture docs & ADRs (13 files)
│   ├── Architecture-Decision-Records.md
│   ├── Multi-Country-Platform-Architecture.md
│   ├── Component-Reuse-Dynamic-Rendering.md
│   └── ...
│
├── design/                # Design decisions & UX (10 files)
│   ├── UI设计规范.md
│   ├── TRAVEL_INFO_SCREEN_DESIGN_DECISIONS.md
│   ├── ThailandTravelInfoScreen-UX-Review.md
│   └── ...
│
├── features/              # Feature specifications (4 files)
│   ├── ELDERLY_USER_FEATURES.md
│   ├── SETUP_ELDERLY_FEATURES.md
│   └── ...
│
├── ai/                    # AI assistant docs (7 files)
│   ├── AI_TRIP_ASSISTANT_MVP_SPEC.md
│   ├── AI_TRIP_ASSISTANT_DESIGN.md
│   ├── AI_PROVIDERS_CHINA.md
│   └── ...
│
├── i18n/                  # i18n guides (2 files)
├── integrations/          # Third-party integrations (3 files)
├── templates/             # Code templates (1 file)
├── wireframes/            # Design wireframes
├── examples/              # Code examples
│
└── history/               # 📦 ARCHIVED (106 files - read-only)
    ├── fixes/             # Bug fix summaries (35 files)
    ├── implementations/   # "Complete" status docs (26 files)
    ├── migrations/        # Migration guides (6 files)
    ├── consolidated/      # Old refactoring docs (22 files)
    ├── i18n/              # i18n implementation summaries (7 files)
    ├── implementation/    # Old implementation docs (3 files)
    └── ...                # Other historical docs (7 files)
```

---

## 🎯 How to Find What You Need

### "How do I...?"

| Task | Document |
|------|----------|
| Add a new country? | [ADDING_NEW_COUNTRY.md](ADDING_NEW_COUNTRY.md) |
| Set up development? | [QUICKSTART.md](QUICKSTART.md) |
| Understand architecture? | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Make a design decision? | Add to [ADRs](architecture/Architecture-Decision-Records.md) |
| Debug an issue? | Search [history/fixes/](history/fixes/) |
| Integrate with API? | [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) |
| Fix iOS simulator? | [IOS_SIMULATOR_SOLUTION.md](IOS_SIMULATOR_SOLUTION.md) |

### "Where is...?"

| Looking for | Location |
|-------------|----------|
| API documentation | Root folder (integration guides) |
| Old fix summaries | [history/fixes/](history/fixes/) |
| Migration guides | [history/migrations/](history/migrations/) |
| Implementation notes | [history/implementations/](history/implementations/) |
| Country templates | [templates/country-template/](templates/country-template/) |
| Design decisions | [design/](design/) folder |
| Feature specs | [features/](features/) folder |

---

## 📝 Documentation Guidelines

### ✅ When to Create a Doc

**DO create:**
- Architecture decisions → Use ADR format in `architecture/`
- Feature specifications → Add to `features/`
- How-to guides → Add to root or appropriate folder
- Design decisions → Add to `design/`
- API/integration guides → Add to root

**DON'T create:**
- ❌ Bug fix summaries (use git commit messages)
- ❌ "Implementation complete" docs (update TODO.md)
- ❌ Test result summaries (use CI/CD)
- ❌ Temporary notes (use PR descriptions)

### Document Lifecycle

1. **Living docs** - Updated as system evolves
   - `architecture/`, `design/`, `features/`, root guides
   - Examples: ARCHITECTURE.md, ADRs, feature specs

2. **Reference docs** - Stable, updated when needed
   - API guides, integration docs
   - Examples: INTEGRATION_GUIDE.md

3. **Historical docs** - Never updated, archived
   - `history/` folder
   - Examples: Fix summaries, migration guides

### Contributing

1. **Check if doc exists** - Update existing doc if possible
2. **Choose right location:**
   - Root: Essential guides everyone needs
   - `architecture/`: System design, ADRs
   - `design/`: UX decisions
   - `features/`: Feature specs
   - Specialized: `ai/`, `i18n/`, etc.
3. **Use clear naming:** `lowercase-with-hyphens.md`
4. **Update this README** - Add link in appropriate section
5. **Archive when obsolete** - Move to `history/`

---

## 🗄️ About the history/ Folder

The `history/` folder contains **106 archived documents** from 2024-2025:

- **fixes/** (35) - Bug fix summaries
- **implementations/** (26) - "Complete" status docs
- **migrations/** (6) - Schema/security migrations
- **consolidated/** (22) - Old refactoring docs
- **i18n/** (7) - i18n implementation summaries
- **implementation/** (3) - Old implementation plans
- **Other** (7) - Misc historical docs

These are **read-only** and may be outdated. Kept for:
- Historical reference
- Understanding past decisions
- Troubleshooting similar issues

**Don't update these** - they represent completed work.

---

## 🔍 Search Tips

**Find a specific topic:**
```bash
# Search all docs
grep -r "keyword" docs/ --include="*.md"

# Search living docs only (exclude history)
grep -r "keyword" docs/ --include="*.md" --exclude-dir=history

# Find all ADRs
grep -r "^## ADR" docs/architecture/Architecture-Decision-Records.md
```

**List recent docs:**
```bash
find docs -name "*.md" -not -path "*/history/*" -exec ls -lt {} + | head -20
```

---

## 📊 Documentation Stats

- **Total docs:** 229 files
- **Living docs:** 123 files (54%)
- **Archived:** 106 files (46%)
- **Last cleanup:** 2025-10-30
- **Reduction:** 46% of old docs archived

---

## 📮 Need Help?

- Check [QUICKSTART.md](QUICKSTART.md) for setup questions
- Review [ADRs](architecture/Architecture-Decision-Records.md) for design decisions
- Search [history/fixes/](history/fixes/) for similar issues
- Check [TODO.md](TODO.md) for current work
- Ask in team chat

---

**Happy coding! 🚀**

*Last updated: 2025-10-30 - After major documentation cleanup*
