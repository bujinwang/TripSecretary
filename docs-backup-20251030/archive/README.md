# Archived Database Design Documents

**Date Archived**: 2025-10-22

These documents have been **consolidated** into a single comprehensive document:

📄 **[../database-design.md](../database-design.md)** - Complete Database Design Guide

---

## Archived Files

All information from these files has been merged into the consolidated document:

### Schema Design Documents
1. **database-schema-proposal.md** - Original comprehensive schema proposal
2. **database-erd-simplified.md** - ERD diagrams and visualizations
3. **FINAL-schema-v2.md** - Final simplified design summary
4. **simplified-schema-design.md** - Analysis of entry_packs removal
5. **destination-trip-id-analysis.md** - Analysis of destination_id and trip_id
6. **personal-info-design.md** - Personal info multiple records design
7. **schema-comparison.md** - Current vs proposed comparison
8. **quick-reference.md** - Quick reference tables and queries

### Implementation Documents (Outdated)
9. **implementation-guide.md** - Old implementation guide (references removed entry_packs table)
10. **PASSPORT_SELECTION_IMPLEMENTATION.md** - Alternative approach documentation (conflicts with current schema)

---

## Why Consolidated?

**Reason**: Too many fragmented documents making it hard to find information

**Solution**: One comprehensive guide with:
- Complete schema with all tables
- Design decisions and rationale
- ERD diagrams
- Common queries
- Migration guide
- Quick reference

---

## If You Need These Files

These are kept for **historical reference** only. For current information, always refer to:

👉 **[../database-design.md](../database-design.md)**

---

**Note**: The actual schema file is still at:
- `cloudflare-backend/src/db/schema-v2.sql`
- `cloudflare-backend/src/db/seed-passport-countries.sql`
