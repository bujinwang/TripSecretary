# TripSecretary Documentation

**Last updated:** 2026-01-10
**Status:** Reorganized and Cleaned Up

Welcome to TripSecretary! This index will help you find the current living documentation for the project.

---

## 🚀 Quick Start

New to the project? Start here:

- **[QUICKSTART.md](guides/development/QUICKSTART.md)** - Get up and running in 5 minutes
- **[ARCHITECTURE.md](architecture/ARCHITECTURE.md)** - System architecture overview
- **[ADDING_NEW_COUNTRY.md](guides/integration/ADDING_NEW_COUNTRY.md)** - How to add a new country

---

## 📚 Essential Documentation

### For Developers

**Getting Started:**
- [QUICKSTART.md](guides/development/QUICKSTART.md) - Development setup
- [AGENTS.md](architecture/AGENTS.md) - AI agents documentation
- [QUICK_REFERENCE_DEV_DATABASE.md](guides/database/QUICK_REFERENCE_DEV_DATABASE.md) - Database operations
- [CODE_STANDARDS.md](guides/development/CODE_STANDARDS.md) - Coding standards
- [ESLINT_CONFIGURATION.md](guides/development/ESLINT_CONFIGURATION.md) - ESlint setup
- [PRE_COMMIT_HOOKS.md](guides/development/PRE_COMMIT_HOOKS.md) - Pre-commit hooks

**Architecture:**
- [ARCHITECTURE.md](architecture/ARCHITECTURE.md) - System architecture
- [architecture/Architecture-Decision-Records.md](architecture/Architecture-Decision-Records.md) - All ADRs

**Integration & Development:**
- [ADDING_NEW_COUNTRY.md](guides/integration/ADDING_NEW_COUNTRY.md) - Country integration workflow
- [GLASSCARD_INTEGRATION_GUIDE.md](guides/integration/GLASSCARD_INTEGRATION_GUIDE.md) - Glasscard integration
- [REPOSITORY_API_REFERENCE.md](api/REPOSITORY_API_REFERENCE.md) - API reference

**Operations:**
- [PRODUCTION_LOGGING_SETUP.md](guides/operations/PRODUCTION_LOGGING_SETUP.md) - Production logging

### For Product & Design

**Feature Specifications:**
- [PDF_EXPORT_FEATURE.md](features/PDF_EXPORT_FEATURE.md) - PDF export functionality
- [features/ELDERLY_USER_FEATURES.md](features/ELDERLY_USER_FEATURES.md) - Elderly user accessibility

**Design & UX:**
- [design/UI设计规范.md](design/UI设计规范.md) - UI design standards (Chinese)
- [design/TRAVEL_INFO_SCREEN_DESIGN_DECISIONS.md](design/TRAVEL_INFO_SCREEN_DESIGN_DECISIONS.md) - Travel info screen UX

---

## 📂 Directory Structure

```
docs/
├── README.md              # 👈 You are here
├── architecture/          # System design & ADRs
├── guides/                # How-to guides (Dev, Integration, Database, Ops)
├── api/                   # API references
├── features/              # Feature specifications
├── design/                # Design decisions & UX
├── ai/                    # AI assistant docs
├── i18n/                  # i18n guides
├── history/               # 📦 ARCHIVED (Legacy docs)
└── ...
```

---

## 📦 Archived Documentation

Historical docs are moved to the `history/` folder to keep the active documentation surface clean.

- **[history/docs-cleanup/](history/docs-cleanup/)**: Past documentation cleanup plans
- **[history/migrations/](history/migrations/)**: Completed migrations (e.g., TS migration)
- **[history/sessions/](history/sessions/)**: Previous development session notes
- **[history/projects/](history/projects/)**: Legacy project READMEs
- **[history/code-reviews/](history/code-reviews/)**: Historical code review feedback
- **[history/analysis/](history/analysis/)**: Past field analysis reports
- **[history/fixes/](history/fixes/)**: Old bug fix summaries

---

## 🔍 Documentation Guidelines

1. **Keep it Clean**: Move obsolete docs to `history/`.
2. **One Topic, One Doc**: Avoid duplication.
3. **Use Subdirectories**: Keep the `docs/` root focused on top-level entry points.
