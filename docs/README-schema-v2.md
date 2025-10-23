# Database Schema v2.0 - Documentation

**Last Updated**: 2025-10-22
**Status**: ✅ Ready for Implementation
**Version**: 2.0

---

## 📖 Main Documentation

All database design documentation has been **consolidated** into a single comprehensive guide:

### 👉 **[database-design.md](./database-design.md)** - Complete Database Design Guide

This document contains everything you need:

- ✅ Complete schema with all 10 tables
- ✅ Design decisions and rationale
- ✅ ERD diagrams and relationships
- ✅ Database triggers (3 triggers)
- ✅ Indexes (comprehensive list)
- ✅ Common queries with examples
- ✅ Migration guide
- ✅ Quick reference tables

---

## 📂 Schema Files

Apply these files to create the database:

```bash
# 1. Apply main schema
sqlite3 tripsecretary.db < cloudflare-backend/src/db/schema-v2.sql

# 2. Seed passport-country data
sqlite3 tripsecretary.db < cloudflare-backend/src/db/seed-passport-countries.sql

# 3. Verify
sqlite3 tripsecretary.db ".tables"
sqlite3 tripsecretary.db "SELECT name FROM sqlite_master WHERE type='trigger';"
```

**Files Location**:
- `cloudflare-backend/src/db/schema-v2.sql` - Main schema
- `cloudflare-backend/src/db/seed-passport-countries.sql` - Seed data

---

## 🗂️ Archived Documentation

Previous fragmented documents have been moved to `archive/`:

- database-schema-proposal.md
- database-erd-simplified.md
- FINAL-schema-v2.md
- simplified-schema-design.md
- destination-trip-id-analysis.md
- personal-info-design.md
- schema-comparison.md
- quick-reference.md

**These files are for historical reference only.**

See [archive/README.md](./archive/README.md) for details.

---

## 🚀 Quick Start

1. **Read**: [database-design.md](./database-design.md)
2. **Apply**: Run `schema-v2.sql`
3. **Seed**: Run `seed-passport-countries.sql`
4. **Implement**: Update application code
5. **Test**: Unit and integration tests

---

## 📊 Schema Summary

**10 Tables Total**:

| Category | Tables | Count |
|----------|--------|-------|
| Core | users, passports, passport_countries, personal_info, travel_info, fund_items | 6 |
| Entry Management | entry_info, digital_arrival_cards | 2 |
| Junction | entry_info_fund_items | 1 |
| Legacy | generations | 1 |

**Key Features**:
- ✨ Multiple personal info per user (passport/country-specific)
- ✨ Primary passport pattern (trigger-enforced)
- ✨ Simplified entry management (no entry_packs table)
- ✨ Generic DAC table (TDAC, MDAC, SDAC, HKDAC)
- ✨ Auto-superseding DAC submissions
- ✨ Performance optimization (destination_id denormalized)

---

## 🎯 Design Highlights

### Simplified from Original

| Aspect | Old | New |
|--------|-----|-----|
| Tables | 11 | 10 ✅ |
| Entry → DAC joins | 2 | 1 ✅ |
| Trip grouping | trip_id | Removed ✅ |
| Entry packs | Separate table | Merged ✅ |

### Key Changes

1. **Removed entry_packs**: Merged into entry_info (50% fewer joins)
2. **Removed trip_id**: Single country per entry (simplified)
3. **Added documents**: entry_info.documents (QR, PDF storage)
4. **Added display_status**: entry_info.display_status (UI state)
5. **Direct DAC link**: entry_info → digital_arrival_cards

---

## 💡 For More Details

Read the comprehensive guide: **[database-design.md](./database-design.md)**

It has everything you need in one place! 🎉
