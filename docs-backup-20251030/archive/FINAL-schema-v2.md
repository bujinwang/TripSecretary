# Final Database Schema v2.0 - Simplified Design

**Date**: 2025-10-22
**Status**: ✅ **FINAL - Ready for Implementation**
**Version**: 2.0 (Simplified)

---

## Summary of Changes

Based on review feedback, **`entry_packs` table has been removed** as it was redundant. All functionality merged into `entry_info`.

---

## Final Table Structure

### Core Tables (6 tables):
1. ✅ **users** - User accounts (INTEGER id for WeChat)
2. ✅ **passports** - Multiple passports per user, with `is_primary` flag
3. ✅ **passport_countries** - Which countries each passport can enter
4. ✅ **personal_info** - Multiple per user (passport/country-specific)
5. ✅ **travel_info** - Flight and accommodation details
6. ✅ **fund_items** - Funding proof items

### Entry Management Tables (2 tables):
7. ✅ **entry_info** - Complete entry with all references + DAC documents
8. ✅ **digital_arrival_cards** - All DAC submissions (TDAC, MDAC, SDAC, HK DAC)

### Junction Table:
9. ✅ **entry_info_fund_items** - Many-to-many relationship

### Legacy:
10. ⚠️ **generations** - Kept for reference, may deprecate

---

## Key Design Simplifications

### ❌ Removed: entry_packs Table

**Reason**: All data can be stored in `entry_info` or queried from `digital_arrival_cards`

| Feature | Old Approach (entry_packs) | New Approach (simplified) |
|---------|---------------------------|---------------------------|
| Latest DAC | `entry_packs.latest_tdac_id` | Query: `SELECT * FROM digital_arrival_cards WHERE entry_info_id = ? AND card_type = 'TDAC' AND is_superseded = 0 LIMIT 1` |
| Documents | `entry_packs.documents` | `entry_info.documents` |
| Display status | `entry_packs.display_status` | `entry_info.display_status` |
| Status | `entry_packs.status` | `entry_info.status` |

### ✅ Benefits:
- **Simpler schema** - 2 tables instead of 3
- **Fewer joins** - Direct relationship between entry_info and DACs
- **Less redundancy** - No duplicate status fields
- **Easier to understand** - Clear, linear relationship
- **Better performance** - Fewer table joins

---

## Simplified Relationships

```
users (1) → passports (*)
users (1) → personal_info (*)
users (1) → travel_info (*)
users (1) → fund_items (*)

passports (1) → passport_countries (*)
passports (1) → personal_info (0..1) [optional link]

entry_info (1) → passport (1)
entry_info (1) → personal_info (1)
entry_info (1) → travel_info (1)
entry_info (*) ↔ fund_items (*) [many-to-many]

entry_info (1) → digital_arrival_cards (*) ← DIRECT LINK!
```

**Before:**
```
entry_info → entry_packs → digital_arrival_cards
(3 hops, 2 joins)
```

**After:**
```
entry_info → digital_arrival_cards
(1 hop, 1 join) ✅
```

---

## Updated entry_info Schema

```sql
CREATE TABLE entry_info (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,

  -- References
  passport_id TEXT NOT NULL,
  personal_info_id TEXT,
  travel_info_id TEXT,

  -- Trip context
  destination_id TEXT,           -- Country code for fast filtering (e.g., 'THA', 'JPN')

  -- Status: incomplete, ready, submitted, superseded, completed, expired, archived
  status TEXT DEFAULT 'incomplete',

  -- Completion tracking (JSON)
  completion_metrics TEXT,

  -- Documents (after DAC submission) - JSON
  documents TEXT,

  -- Display status (for UI) - JSON
  display_status TEXT,

  -- Timestamps
  last_updated_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (passport_id) REFERENCES passports(id),
  FOREIGN KEY (personal_info_id) REFERENCES personal_info(id),
  FOREIGN KEY (travel_info_id) REFERENCES travel_info(id)
);
```

---

## Updated digital_arrival_cards Schema

```sql
CREATE TABLE digital_arrival_cards (
  id TEXT PRIMARY KEY,
  entry_info_id TEXT NOT NULL,  -- Direct link to entry_info
  user_id INTEGER NOT NULL,

  card_type TEXT NOT NULL,      -- 'TDAC', 'MDAC', 'SDAC', 'HKDAC'
  destination_id TEXT,

  arr_card_no TEXT,
  qr_uri TEXT,
  pdf_url TEXT,

  submitted_at DATETIME NOT NULL,
  submission_method TEXT DEFAULT 'api',
  status TEXT DEFAULT 'success',

  -- Superseded tracking
  is_superseded INTEGER DEFAULT 0,
  superseded_at DATETIME,
  superseded_by TEXT,

  version INTEGER DEFAULT 1,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Common Queries

### Get Entry Info with Latest DACs

```sql
-- Get entry info
SELECT * FROM entry_info WHERE id = ?;

-- Get latest TDAC
SELECT * FROM digital_arrival_cards
WHERE entry_info_id = ?
  AND card_type = 'TDAC'
  AND is_superseded = 0
  AND status = 'success'
ORDER BY submitted_at DESC
LIMIT 1;

-- Get all latest DACs (one per type)
SELECT
  card_type,
  arr_card_no,
  qr_uri,
  submitted_at
FROM digital_arrival_cards
WHERE entry_info_id = ?
  AND is_superseded = 0
  AND status = 'success'
GROUP BY card_type
ORDER BY card_type;
```

### Get Entry Info with All Submission History

```sql
SELECT
  ei.*,
  dac.id as dac_id,
  dac.card_type,
  dac.arr_card_no,
  dac.submitted_at,
  dac.is_superseded
FROM entry_info ei
LEFT JOIN digital_arrival_cards dac ON ei.id = dac.entry_info_id
WHERE ei.id = ?
ORDER BY dac.card_type, dac.submitted_at DESC;
```

---

## Application Code Example

### EntryInfo Model (Simplified)

```javascript
class EntryInfo {
  constructor(data = {}) {
    this.id = data.id || EntryInfo.generateId();
    this.userId = data.userId;

    // References
    this.passportId = data.passportId;
    this.personalInfoId = data.personalInfoId;
    this.travelInfoId = data.travelInfoId;
    this.destinationId = data.destinationId;
    this.tripId = data.tripId;

    // Status
    this.status = data.status || 'incomplete';

    // Tracking
    this.completionMetrics = data.completionMetrics || {};

    // Documents (after DAC submission)
    this.documents = data.documents || {
      qrCodeImage: null,
      pdfDocument: null,
      entryCardImage: null
    };

    // Display status
    this.displayStatus = data.displayStatus || {
      completionPercent: 0,
      categoryStates: {},
      ctaState: 'disabled',
      showQR: false
    };

    // Timestamps
    this.lastUpdatedAt = data.lastUpdatedAt || new Date().toISOString();
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  /**
   * Submit DAC (links directly to entry_info)
   */
  async submitDAC(cardType, submissionData, method = 'api') {
    const cardData = {
      id: `dac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entryInfoId: this.id,  // Direct link
      userId: this.userId,
      cardType,
      destinationId: this.destinationId,
      arrCardNo: submissionData.arrCardNo,
      qrUri: submissionData.qrUri,
      pdfUrl: submissionData.pdfUrl,
      submittedAt: new Date().toISOString(),
      submissionMethod: method,
      status: 'success',
      version: 1
    };

    await SecureStorageService.saveDigitalArrivalCard(cardData);

    // Update entry_info
    this.status = 'submitted';
    this.documents = {
      qrCodeImage: submissionData.qrCodeImage,
      pdfDocument: submissionData.pdfUrl
    };
    this.displayStatus.showQR = true;

    await this.save();
    return cardData;
  }

  /**
   * Get latest DAC by type
   */
  async getLatestDAC(cardType) {
    const db = await getDatabase();
    return await db.getFirstAsync(
      `SELECT * FROM digital_arrival_cards
       WHERE entry_info_id = ? AND card_type = ? AND is_superseded = 0 AND status = 'success'
       ORDER BY submitted_at DESC LIMIT 1`,
      [this.id, cardType]
    );
  }

  /**
   * Get all DACs for this entry
   */
  async getAllDACs() {
    const db = await getDatabase();
    return await db.getAllAsync(
      `SELECT * FROM digital_arrival_cards
       WHERE entry_info_id = ?
       ORDER BY card_type, submitted_at DESC`,
      [this.id]
    );
  }
}
```

---

## Final Schema Files

1. ✅ **`cloudflare-backend/src/db/schema-v2.sql`**
   - Complete schema with entry_packs removed
   - All triggers and indexes updated

2. ✅ **`cloudflare-backend/src/db/seed-passport-countries.sql`**
   - Seed data for CHN, HKG, MAC passports

3. ✅ **`docs/simplified-schema-design.md`**
   - Analysis of why entry_packs was removed

4. ✅ **`docs/FINAL-schema-v2.md`** (this file)
   - Final simplified design summary

---

## Design Decisions Summary

| Decision | Choice | Status |
|----------|--------|--------|
| User ID Type | INTEGER | ✅ Final |
| Other IDs | TEXT | ✅ Final |
| Personal Info | Multiple per user | ✅ Final |
| Travel Info | One-to-one with entry_info | ✅ Final |
| Data Migration | Start fresh | ✅ Final |
| Passport Countries | Pre-populate | ✅ Final |
| **Entry Packs** | **Removed (merged into entry_info)** | ✅ **Final** |

---

## Database Triggers (3 total)

1. ✅ **`ensure_one_primary_passport`** - Only one primary per user
2. ✅ **`ensure_one_default_personal_info`** (INSERT + UPDATE) - Only one default per user
3. ✅ **`mark_previous_dac_superseded`** - Auto-supersede old DAC submissions

---

## Total Tables: 10

**Core**: 6 tables
- users
- passports
- passport_countries
- personal_info
- travel_info
- fund_items

**Entry Management**: 2 tables (**simplified from 3**)
- entry_info
- digital_arrival_cards

**Junction**: 1 table
- entry_info_fund_items

**Legacy**: 1 table
- generations

---

## Implementation Checklist

- [ ] Apply `schema-v2.sql`
- [ ] Apply `seed-passport-countries.sql`
- [ ] Update SecureStorageService (remove entry_pack methods)
- [ ] Update EntryInfo model (add DAC methods)
- [ ] Remove EntryPack model
- [ ] Update UI screens (EntryPackDetailScreen → EntryInfoDetailScreen)
- [ ] Update tests
- [ ] Deploy

---

## Performance Benefits

**Query Performance:**
- ❌ Old: `entry_info → entry_packs → digital_arrival_cards` (2 joins)
- ✅ New: `entry_info → digital_arrival_cards` (1 join)
- **Improvement**: ~50% fewer joins

**Storage:**
- ❌ Old: 10 tables
- ✅ New: 10 tables (but simpler relationships)
- Removed redundant status/document fields

---

## Summary

The final schema v2.0 is **simpler, cleaner, and more efficient** than the original proposal:

✅ **Removed** entry_packs table (redundant)
✅ **Merged** documents and display_status into entry_info
✅ **Direct link** between entry_info and digital_arrival_cards
✅ **Fewer joins** for better performance
✅ **Clearer model** for easier understanding

**The schema is production-ready and ready for implementation!** 🚀

---

## Next Steps

1. **Review**: `cloudflare-backend/src/db/schema-v2.sql`
2. **Apply**: Run schema SQL file
3. **Seed**: Run passport-countries seed data
4. **Implement**: Update application code
5. **Test**: Unit and integration tests
6. **Deploy**: Dev → Staging → Production

See `docs/implementation-guide.md` for detailed steps (note: update to reflect entry_packs removal).
