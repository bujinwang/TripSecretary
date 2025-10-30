# Database Schema Comparison: Current vs Proposed

## Executive Summary

This document compares the current SQLite database schema with the proposed schema changes to better align with the application requirements.

---

## Key Changes Overview

| Area | Current | Proposed | Reason |
|------|---------|----------|--------|
| **ID Types** | Mixed INT/TEXT | Consistent TEXT | Application uses TEXT IDs (`passport_123...`) |
| **Primary Passport** | Missing | Added `is_primary` field + trigger | Support multiple passports per user |
| **Personal Info** | No constraint | Multiple per user (no UNIQUE) | Support passport/country-specific addresses |
| **Travel Info** | Embedded in entry_info | Separate table | Better normalization |
| **Passport Countries** | Missing | New table | Track which countries passport can enter |
| **DAC Submissions** | Single tdac_submissions table | Generic digital_arrival_cards | Support multiple DAC types (TDAC, MDAC, SDAC, HK DAC) |
| **Superseding Logic** | Manual | Automatic trigger | Auto-mark old submissions as superseded |

---

## Detailed Comparison

### 1. Passports Table

#### Current Schema
```sql
CREATE TABLE passports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  passport_no TEXT NOT NULL,
  name TEXT NOT NULL,
  -- ...
);
```

**Issues:**
- ID type mismatch (INT vs TEXT)
- No `is_primary` field
- Field names don't match application models

#### Proposed Schema
```sql
CREATE TABLE passports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  passport_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  -- ...
);

-- Trigger to ensure only one primary per user
CREATE TRIGGER ensure_one_primary_passport
BEFORE UPDATE OF is_primary ON passports
WHEN NEW.is_primary = 1
BEGIN
  UPDATE passports SET is_primary = 0
  WHERE user_id = NEW.user_id AND id != NEW.id;
END;
```

**Benefits:**
✅ Consistent TEXT IDs
✅ Primary passport support
✅ Field names match models
✅ Automatic primary enforcement

---

### 2. Personal Info Table

#### Current Schema
```sql
CREATE TABLE personal_info (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,  -- No UNIQUE constraint
  phone TEXT,
  email TEXT,
  -- ...
);
```

**Issues:**
- No passport/country context
- Cannot distinguish between different addresses for different passports
- No default selection mechanism

#### Proposed Schema
```sql
CREATE TABLE personal_info (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,           -- NO UNIQUE - allows multiple per user
  passport_id TEXT,                -- Optional link to specific passport
  phone_number TEXT,
  email TEXT,
  home_address TEXT,
  country_region TEXT,             -- Country context
  is_default INTEGER DEFAULT 0,    -- Default personal info flag
  label TEXT,                      -- User-friendly label (e.g., "China", "HK")
  -- ...
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE SET NULL
);

-- Trigger ensures only one default per user
CREATE TRIGGER ensure_one_default_personal_info
BEFORE UPDATE OF is_default ON personal_info
WHEN NEW.is_default = 1
BEGIN
  UPDATE personal_info SET is_default = 0
  WHERE user_id = NEW.user_id AND id != NEW.id;
END;
```

**Benefits:**
✅ Multiple personal_info per user (passport/country-specific)
✅ Optional link to specific passport
✅ Default selection via `is_default` flag
✅ Country context for smart selection
✅ User-friendly labels for UI
✅ Automatic default enforcement via trigger

**Use Cases:**
- User with Chinese passport → China address (+86 phone)
- User with HK passport → Hong Kong address (+852 phone)
- Business travel → Office address, work email
- Personal travel → Home address, personal email

---

### 3. Travel Info

#### Current Schema
```sql
-- Travel fields embedded in entry_info table
CREATE TABLE entry_info (
  id TEXT PRIMARY KEY,
  -- ...
  arrival_date TEXT,
  departure_date TEXT,
  travel_purpose TEXT,
  flight_number TEXT,
  accommodation TEXT,
  -- ...
);
```

**Issues:**
- Denormalized (travel data mixed with entry data)
- Cannot reuse travel info across entries
- Difficult to manage complex travel data

#### Proposed Schema
```sql
CREATE TABLE travel_info (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  destination TEXT,
  travel_purpose TEXT,
  -- Arrival flight details
  arrival_flight_number TEXT,
  arrival_departure_airport TEXT,
  arrival_departure_date TEXT,
  -- Departure flight details
  departure_flight_number TEXT,
  -- Accommodation details
  hotel_name TEXT,
  hotel_address TEXT,
  -- ...
);

CREATE TABLE entry_info (
  id TEXT PRIMARY KEY,
  -- ...
  travel_info_id TEXT,
  FOREIGN KEY (travel_info_id) REFERENCES travel_info(id)
);
```

**Benefits:**
✅ Better normalization
✅ Separate concerns
✅ More detailed travel tracking
✅ Can reuse travel info if needed

---

### 4. Passport Countries (NEW)

#### Current Schema
❌ **Does not exist**

**Issues:**
- Cannot track which countries a passport can enter
- Visa requirements not stored
- Must hardcode country logic in application

#### Proposed Schema
```sql
CREATE TABLE passport_countries (
  passport_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  visa_required INTEGER DEFAULT 0,
  max_stay_days INTEGER,
  notes TEXT,
  PRIMARY KEY (passport_id, country_code),
  FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE CASCADE
);
```

**Benefits:**
✅ Track passport-country relationships
✅ Store visa requirements
✅ Max stay duration per country
✅ Flexible for different passport types

**Example Data:**
```
passport_id          | country_code | visa_required | max_stay_days
---------------------|--------------|---------------|---------------
passport_123_china   | THA          | 0             | 30
passport_123_china   | JPN          | 0             | 15
passport_456_hk      | THA          | 0             | 30
passport_456_hk      | SGP          | 0             | 90
```

---

### 5. Digital Arrival Cards

#### Current Schema
```sql
CREATE TABLE tdac_submissions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  entry_pack_id TEXT,
  -- ...
  arr_card_no TEXT NOT NULL,
  qr_uri TEXT,
  -- ...
  is_superseded INTEGER DEFAULT 0,
  superseded_by TEXT,
  -- ...
);
```

**Issues:**
- Name implies only TDAC (Thailand)
- Manual superseding (application must handle)
- Cannot easily support MDAC, SDAC, HK DAC
- Difficult to query latest submission per card type

#### Proposed Schema
```sql
CREATE TABLE digital_arrival_cards (
  id TEXT PRIMARY KEY,
  entry_pack_id TEXT NOT NULL,
  card_type TEXT NOT NULL,  -- 'TDAC', 'MDAC', 'SDAC', 'HKDAC'
  destination_id TEXT,
  -- ...
  arr_card_no TEXT,
  qr_uri TEXT,
  -- ...
  is_superseded INTEGER DEFAULT 0,
  superseded_by TEXT,
  version INTEGER DEFAULT 1,
  -- ...
);

-- Auto-supersede trigger
CREATE TRIGGER mark_previous_dac_superseded
AFTER INSERT ON digital_arrival_cards
WHEN NEW.status = 'success' AND NEW.is_superseded = 0
BEGIN
  UPDATE digital_arrival_cards
  SET is_superseded = 1,
      superseded_at = CURRENT_TIMESTAMP,
      superseded_by = NEW.id
  WHERE entry_pack_id = NEW.entry_pack_id
    AND card_type = NEW.card_type
    AND id != NEW.id
    AND is_superseded = 0;
END;
```

**Benefits:**
✅ Generic name supports all card types
✅ Automatic superseding via trigger
✅ Easy to query latest per card type
✅ Version tracking for audit

**Query Latest TDAC:**
```sql
SELECT * FROM digital_arrival_cards
WHERE entry_pack_id = ?
  AND card_type = 'TDAC'
  AND is_superseded = 0
  AND status = 'success';
```

---

### 6. Entry Packs Table

#### Current Schema
```sql
CREATE TABLE entry_packs (
  id TEXT PRIMARY KEY,
  -- ...
  tdac_submission TEXT,      -- JSON field
  submission_history TEXT,   -- JSON array
  -- ...
);
```

**Issues:**
- TDAC-specific field name
- JSON storage requires parsing
- No direct FK to submissions table
- Difficult to query submission data

#### Proposed Schema
```sql
CREATE TABLE entry_packs (
  id TEXT PRIMARY KEY,
  entry_info_id TEXT NOT NULL,
  -- ...
  latest_tdac_id TEXT,       -- FK to digital_arrival_cards
  latest_mdac_id TEXT,       -- FK to digital_arrival_cards
  latest_sdac_id TEXT,       -- FK to digital_arrival_cards
  latest_hkdac_id TEXT,      -- FK to digital_arrival_cards
  -- ...
  FOREIGN KEY (latest_tdac_id) REFERENCES digital_arrival_cards(id),
  FOREIGN KEY (latest_mdac_id) REFERENCES digital_arrival_cards(id),
  -- ...
);
```

**Benefits:**
✅ Direct FK relationships (faster queries)
✅ Support multiple DAC types
✅ No JSON parsing needed
✅ Database-level referential integrity

**Getting Latest Submissions:**
```sql
SELECT
  ep.*,
  tdac.arr_card_no as tdac_card_no,
  tdac.qr_uri as tdac_qr,
  mdac.arr_card_no as mdac_card_no
FROM entry_packs ep
LEFT JOIN digital_arrival_cards tdac ON ep.latest_tdac_id = tdac.id
LEFT JOIN digital_arrival_cards mdac ON ep.latest_mdac_id = mdac.id
WHERE ep.user_id = ?;
```

---

## Migration Path

### Phase 1: Schema Migration
1. Create new tables with updated schema
2. Migrate existing data (if any)
3. Verify data integrity
4. Drop old tables

### Phase 2: Application Updates
1. Update `SecureStorageService.js` database operations
2. Update model classes (Passport, PersonalInfo, etc.)
3. Update services to handle multiple DAC types
4. Add tests for new schema

### Phase 3: New Features
1. Implement passport-countries management
2. Add support for MDAC, SDAC, HK DAC
3. Enhance entry pack detail screen with all DAC types
4. Add passport selection logic based on destination

---

## Requirements Alignment

Let's verify the proposed schema meets all requirements:

### ✅ Requirement 1: User and Passports
- [x] Single user per device (users table)
- [x] Multiple passports per user (passports table, no constraints)
- [x] Primary passport selection (`is_primary` field + trigger)

### ✅ Requirement 2: Passport and Countries
- [x] Each passport can enter multiple countries (passport_countries table)
- [x] Track visa requirements and max stay

### ✅ Requirement 3: Personal Info (UPDATED)
- [x] Multiple personal info per user (no UNIQUE constraint)
- [x] Optional link to specific passport (`passport_id` FK)
- [x] Country/region context (`country_region` field)
- [x] Default selection mechanism (`is_default` flag + trigger)
- [x] Support different addresses for different passports/countries

### ✅ Requirement 4: Entry Info
- [x] Link to passport (passport_id FK)
- [x] Link to personal_info (personal_info_id FK)
- [x] Link to travel_info (travel_info_id FK)
- [x] Link to fund_items (entry_info_fund_items junction table)

### ✅ Requirement 5: Entry Pack
- [x] Created when entry_info is mature/complete
- [x] Links to entry_info (entry_info_id FK)
- [x] Status tracking (in_progress, submitted, etc.)

### ✅ Requirement 6: Digital Arrival Cards
- [x] Multiple submissions per entry_pack (digital_arrival_cards table)
- [x] Support TDAC, MDAC, SDAC, HK DAC (card_type field)
- [x] Latest successful submission used (is_superseded = 0)
- [x] Automatic superseding (trigger)
- [x] Complete submission history (all records preserved)

---

## Questions to Resolve

1. **User ID Type**:
   - Keep `users.id` as INTEGER for WeChat integration?
   - Or change to TEXT for consistency?
   - **Recommendation**: Keep INTEGER for users, use TEXT for all other entities

2. **Travel Info Reusability**:
   - Should travel_info be one-to-one with entry_info?
   - Or can multiple entries share travel_info?
   - **Recommendation**: One-to-one initially, can evolve to many-to-one later

3. **Data Migration**:
   - Preserve existing generations/entry_packs?
   - Or start fresh with new schema?
   - **Recommendation**: Migrate if data exists, otherwise start fresh

4. **Passport Countries Pre-population**:
   - Pre-populate common passport-country relationships?
   - Or add dynamically when user creates entry?
   - **Recommendation**: Pre-populate for common passports (CHN, HKG, MAC)

5. **Fund Items Linking**:
   - Should fund_items link to specific passport?
   - Or just to user (current design)?
   - **Recommendation**: Current design is fine (fund items belong to user)

---

## Next Steps

1. **Review and Approve**: Discuss schema design and resolve questions
2. **Create Migration Scripts**: Write SQL scripts for schema migration
3. **Update Application Layer**: Modify services and models
4. **Testing**: Add comprehensive tests for new schema
5. **Deploy**: Roll out to development, then production

---

## Summary

The proposed schema provides:
- ✅ Better data integrity (constraints, triggers, FKs)
- ✅ Clearer relationships (one-to-many for personal_info, passports, etc.)
- ✅ **Multiple personal_info per user** - passport/country-specific addresses
- ✅ Flexibility for multiple DAC types
- ✅ Better normalization (separate travel_info)
- ✅ Automatic superseding logic
- ✅ Passport-countries tracking
- ✅ Context-aware personal info selection
- ✅ Complete alignment with requirements

**Key Change from Initial Proposal:**
The initial proposal enforced one-to-one for personal_info, but based on user feedback, we now support **multiple personal_info records per user** with optional passport/country linkage. This better reflects real-world use cases where users have different contact information for different passports or countries.

The changes are backward-compatible with careful migration, and provide a solid foundation for future feature development.
