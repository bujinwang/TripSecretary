#!/bin/bash
#
# Documentation Cleanup Script
# Usage: ./scripts/cleanup-docs.sh [dry-run|quick-wins|aggressive|conservative]
#

set -e

MODE="${1:-dry-run}"
DOCS_DIR="docs"
BACKUP_DIR="docs-backup-$(date +%Y%m%d)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
MOVED=0
DELETED=0
KEPT=0

log_info() {
  echo -e "${BLUE}ℹ ${NC}$1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

# Create backup
create_backup() {
  if [ "$MODE" != "dry-run" ]; then
    log_info "Creating backup at $BACKUP_DIR..."
    cp -r "$DOCS_DIR" "$BACKUP_DIR"
    log_success "Backup created"
  fi
}

# Create new directory structure
create_structure() {
  if [ "$MODE" = "dry-run" ]; then
    log_info "Would create new directory structure"
    return
  fi

  log_info "Creating new directory structure..."

  mkdir -p docs/history/fixes
  mkdir -p docs/history/migrations
  mkdir -p docs/history/implementations
  mkdir -p docs/guides
  mkdir -p docs/api

  log_success "Directory structure created"
}

# Quick wins - Safe moves with high impact
quick_wins() {
  log_info "=== Quick Wins ==="

  # Move all fix summaries
  log_info "Moving fix summaries..."
  for file in $(find docs -maxdepth 1 -name "*FIX*.md" -o -name "*DEBUG*.md"); do
    if [ -f "$file" ]; then
      if [ "$MODE" != "dry-run" ]; then
        mv "$file" "docs/history/fixes/"
      fi
      log_success "Moved: $(basename $file)"
      ((MOVED++))
    fi
  done

  # Move all "complete" docs
  log_info "Moving implementation complete docs..."
  for file in $(find docs -maxdepth 1 -name "*COMPLETE*.md" -o -name "*SUMMARY*.md"); do
    if [ -f "$file" ] && [ "$file" != "docs/DOC_CLEANUP_PLAN.md" ]; then
      if [ "$MODE" != "dry-run" ]; then
        mv "$file" "docs/history/implementations/"
      fi
      log_success "Moved: $(basename $file)"
      ((MOVED++))
    fi
  done

  # Move phase docs
  log_info "Moving phase docs..."
  for file in $(find docs -maxdepth 1 -name "PHASE*.md"); do
    if [ -f "$file" ]; then
      if [ "$MODE" != "dry-run" ]; then
        mv "$file" "docs/history/"
      fi
      log_success "Moved: $(basename $file)"
      ((MOVED++))
    fi
  done

  # Move refactoring docs
  log_info "Moving refactoring docs..."
  for file in $(find docs -maxdepth 1 -name "*REFACTOR*.md"); do
    if [ -f "$file" ]; then
      if [ "$MODE" != "dry-run" ]; then
        mv "$file" "docs/history/"
      fi
      log_success "Moved: $(basename $file)"
      ((MOVED++))
    fi
  done

  # Move migration docs
  log_info "Moving migration docs..."
  for file in $(find docs -maxdepth 1 -name "*MIGRATION*.md" -o -name "SCHEMA_V2*.md"); do
    if [ -f "$file" ]; then
      if [ "$MODE" != "dry-run" ]; then
        mv "$file" "docs/history/migrations/"
      fi
      log_success "Moved: $(basename $file)"
      ((MOVED++))
    fi
  done

  # Delete empty files
  log_info "Deleting empty files..."
  find docs -maxdepth 1 -type f -size 0 -name "*.md" | while read file; do
    if [ "$MODE" != "dry-run" ]; then
      rm "$file"
    fi
    log_warning "Deleted: $(basename $file)"
    ((DELETED++))
  done
}

# Aggressive cleanup
aggressive_cleanup() {
  quick_wins

  log_info "=== Aggressive Cleanup ==="

  # Move all country-specific implementation docs
  log_info "Moving country implementation docs..."
  for file in $(find docs -maxdepth 1 -name "*THAILAND*.md" -o -name "*SINGAPORE*.md" -o -name "*MALAYSIA*.md" -o -name "*VIETNAM*.md"); do
    if [ -f "$file" ]; then
      if [ "$MODE" != "dry-run" ]; then
        mv "$file" "docs/history/"
      fi
      log_success "Moved: $(basename $file)"
      ((MOVED++))
    fi
  done

  # Move test/comparison docs
  log_info "Moving test and comparison docs..."
  for file in $(find docs -maxdepth 1 -name "*TEST*.md" -o -name "*COMPARISON*.md" -o -name "*AUDIT*.md"); do
    if [ -f "$file" ]; then
      if [ "$MODE" != "dry-run" ]; then
        mv "$file" "docs/history/"
      fi
      log_success "Moved: $(basename $file)"
      ((MOVED++))
    fi
  done

  # Move TDAC docs
  log_info "Moving TDAC implementation docs..."
  for file in $(find docs -maxdepth 1 -name "TDAC*.md"); do
    if [ -f "$file" ]; then
      if [ "$MODE" != "dry-run" ]; then
        mv "$file" "docs/history/"
      fi
      log_success "Moved: $(basename $file)"
      ((MOVED++))
    fi
  done
}

# Conservative cleanup
conservative_cleanup() {
  quick_wins
  log_warning "Conservative mode: Only quick wins applied"
}

# Generate new README
generate_readme() {
  if [ "$MODE" = "dry-run" ]; then
    log_info "Would generate new README.md"
    return
  fi

  log_info "Generating new README.md..."

  cat > docs/README.md << 'EOF'
# TripSecretary Documentation

**Last updated:** $(date +%Y-%m-%d)

This is the central index for all project documentation.

## Quick Start

- [Quickstart Guide](QUICKSTART.md) - Get up and running
- [Architecture Overview](ARCHITECTURE.md) - System design
- [Adding a New Country](ADDING_NEW_COUNTRY.md) - Country integration guide

## Essential Guides

### Development
- [Architecture](ARCHITECTURE.md) - System architecture
- [Adding New Country](ADDING_NEW_COUNTRY.md) - Country integration workflow
- [Development Guide](guides/development.md) - Dev setup, debugging, testing
- [Database Guide](QUICK_REFERENCE_DEV_DATABASE.md) - Database operations

### Design & UX
- [Architecture Decision Records](architecture/Architecture-Decision-Records.md) - ADRs
- [UI Design System](design/UI设计规范.md) - Design guidelines
- [Travel Info Screen Decisions](design/TRAVEL_INFO_SCREEN_DESIGN_DECISIONS.md)

### Features
- [Elderly User Features](features/ELDERLY_USER_FEATURES.md)
- [PDF Export](PDF_EXPORT_FEATURE.md)
- [AI Assistant](ai/AI_TRIP_ASSISTANT_SUMMARY.md)

### API Reference
- [Schema V2 Reference](SCHEMA_V2_DAC_REFERENCE.md)
- [Repository API](REPOSITORY_API_REFERENCE.md)

## Folder Structure

```
docs/
├── guides/          # How-to guides
├── architecture/    # Architecture docs & ADRs
├── design/          # Design decisions & patterns
├── features/        # Feature specifications
├── api/             # API references
├── templates/       # Code templates
├── examples/        # Code examples
└── history/         # Historical docs & archives
    ├── fixes/       # Bug fix summaries (archived)
    ├── migrations/  # Migration guides (archived)
    └── implementations/ # Implementation summaries (archived)
```

## Documentation Guidelines

### When to Create a Doc
- ✅ Architecture decision (use ADR format)
- ✅ New feature specification
- ✅ How-to guide
- ✅ API reference update
- ❌ Bug fix summary (use git commit message)
- ❌ Implementation complete status (update TODO.md)

### Document Lifecycle
- **Living docs** - Updated as system evolves (guides/, architecture/, design/)
- **Reference docs** - Updated when APIs change (api/)
- **Historical docs** - Never updated, moved to history/ when obsolete

## Contributing

When adding new documentation:
1. Check if existing doc can be updated instead
2. Use appropriate folder (guides/ for how-tos, architecture/ for decisions)
3. Update this README index
4. Follow naming: lowercase-with-hyphens.md

## History

Older documentation has been archived in `history/`. These docs are kept for reference but may be outdated.

---

**Need help?** Check [QUICKSTART.md](QUICKSTART.md) or ask in the team chat.
EOF

  log_success "README.md generated"
}

# Main execution
main() {
  log_info "Documentation Cleanup Script"
  log_info "Mode: $MODE"
  echo ""

  case "$MODE" in
    dry-run)
      log_warning "DRY RUN MODE - No files will be changed"
      create_structure
      quick_wins
      generate_readme
      ;;
    quick-wins)
      create_backup
      create_structure
      quick_wins
      generate_readme
      ;;
    aggressive)
      create_backup
      create_structure
      aggressive_cleanup
      generate_readme
      ;;
    conservative)
      create_backup
      create_structure
      conservative_cleanup
      generate_readme
      ;;
    *)
      log_error "Invalid mode: $MODE"
      echo "Usage: $0 [dry-run|quick-wins|aggressive|conservative]"
      exit 1
      ;;
  esac

  echo ""
  log_info "=== Summary ==="
  log_success "Files moved: $MOVED"
  log_warning "Files deleted: $DELETED"
  log_info "Files kept: $KEPT"

  if [ "$MODE" != "dry-run" ]; then
    log_success "Backup saved to: $BACKUP_DIR"
    log_info "Review changes and commit if satisfied"
    log_info "To rollback: rm -rf docs && mv $BACKUP_DIR docs"
  fi
}

main
