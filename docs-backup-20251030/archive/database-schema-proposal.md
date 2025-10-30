# Database Schema Design Proposal

## Requirements Summary

1. **User**: Currently single user per device
2. **Passport**: Each user can have multiple passports (e.g., Chinese + Hong Kong passport)
3. **Passport-Countries**: Each passport can enter multiple countries
4. **Personal Info**: Each user can have multiple personal info records, each may be linked to a specific passport or country context (e.g., China mainland address for Chinese passport, HK address for HK passport)
5. **Entry Info**: Contains passport reference, personal_info reference, travel_info reference, and fund_items references
6. **Entry Pack**: Created when entry_info is mature/complete with arrival card submission
7. **Digital Arrival Cards (DAC)**: Multiple submissions per entry_pack (TDAC, MDAC, SDAC, HK DAC), latest successful one is used

---

## Proposed Schema Changes

### 1. **Fix ID Type Consistency**

**Problem**: Application uses TEXT IDs (`passport_123...`) but database uses INTEGER

**Solution**: Change all ID fields to TEXT for consistency

```sql
-- Users table - Keep INTEGER for compatibility with WeChat integration
-- DECISION: Keep users.id as INTEGER for WeChat OpenID compatibility
-- All other entities use TEXT IDs

-- Passports table - Change to TEXT IDs and add is_primary
ALTER TABLE passports RENAME TO passports_old;

CREATE TABLE passports (
  id TEXT PRIMARY KEY,                    -- Changed from INTEGER to TEXT
  user_id INTEGER NOT NULL,               -- Keep as INTEGER (references users.id)
  passport_number TEXT NOT NULL,          -- Changed from passport_no
  full_name TEXT NOT NULL,                -- Changed from name
  date_of_birth TEXT,                     -- Changed from birth_date
  nationality TEXT,
  gender TEXT,
  expiry_date TEXT,
  issue_date TEXT,
  issue_place TEXT,
  photo_uri TEXT,                         -- Photo path
  is_primary INTEGER DEFAULT 0,           -- NEW: Primary passport flag
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create trigger to ensure only one primary passport per user
CREATE TRIGGER ensure_one_primary_passport
BEFORE UPDATE OF is_primary ON passports
WHEN NEW.is_primary = 1
BEGIN
  UPDATE passports
  SET is_primary = 0
  WHERE user_id = NEW.user_id AND id != NEW.id;
END;

CREATE INDEX idx_passports_user ON passports(user_id);
CREATE INDEX idx_passports_primary ON passports(user_id, is_primary);
```

---

### 2. **Add Passport-Countries Mapping Table**

**Purpose**: Track which countries each passport can enter

```sql
CREATE TABLE passport_countries (
  passport_id TEXT NOT NULL,
  country_code TEXT NOT NULL,              -- ISO 3166-1 alpha-3 (e.g., 'THA', 'JPN', 'SGP')
  visa_required INTEGER DEFAULT 0,         -- 0 = visa-free, 1 = visa required
  max_stay_days INTEGER,                   -- Maximum stay duration (e.g., 30, 90)
  notes TEXT,                              -- Additional requirements or notes
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (passport_id, country_code),
  FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE CASCADE
);

CREATE INDEX idx_passport_countries_passport ON passport_countries(passport_id);
CREATE INDEX idx_passport_countries_country ON passport_countries(country_code);
```

---

### 3. **Support Multiple Personal Info per User (Passport/Country-Specific)**

**Purpose**: Allow users to maintain different contact information for different passports or countries

**Use Cases**:
- User with Chinese passport lives in China (mainland address, mainland phone)
- Same user with Hong Kong passport lives in Hong Kong (HK address, HK phone)
- Different occupation titles or contact info for business vs personal travel
- Country-specific addresses for immigration purposes

**Solution**: Allow multiple personal_info records, optionally linked to specific passport

```sql
ALTER TABLE personal_info RENAME TO personal_info_old;

CREATE TABLE personal_info (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,               -- NO UNIQUE constraint - allows multiple
  passport_id TEXT,                       -- Optional link to specific passport

  -- Contact Information
  phone_number TEXT,
  email TEXT,
  home_address TEXT,

  -- Location Context
  country_region TEXT,                    -- Which country/region this info is for
  province_city TEXT,

  -- Personal Details
  occupation TEXT,
  phone_code TEXT,
  gender TEXT,

  -- Default flag
  is_default INTEGER DEFAULT 0,          -- Default personal info for this user

  -- Context label (optional, for UI)
  label TEXT,                            -- e.g., "China Mainland", "Hong Kong", "Business"

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE SET NULL
);

-- Trigger to ensure only one default personal_info per user
CREATE TRIGGER ensure_one_default_personal_info
BEFORE UPDATE OF is_default ON personal_info
WHEN NEW.is_default = 1
BEGIN
  UPDATE personal_info
  SET is_default = 0
  WHERE user_id = NEW.user_id AND id != NEW.id;
END;

-- Also handle INSERT to ensure default is unique
CREATE TRIGGER ensure_one_default_personal_info_insert
BEFORE INSERT ON personal_info
WHEN NEW.is_default = 1
BEGIN
  UPDATE personal_info
  SET is_default = 0
  WHERE user_id = NEW.user_id;
END;

CREATE INDEX idx_personal_info_user ON personal_info(user_id);
CREATE INDEX idx_personal_info_passport ON personal_info(passport_id);
CREATE INDEX idx_personal_info_default ON personal_info(user_id, is_default);
CREATE INDEX idx_personal_info_country ON personal_info(user_id, country_region);
```

**Querying Examples**:
```sql
-- Get personal info for a specific passport
SELECT * FROM personal_info
WHERE passport_id = 'passport_abc123';

-- Get default personal info for user
SELECT * FROM personal_info
WHERE user_id = 'user_1' AND is_default = 1;

-- Get all personal info for user, ordered by default first
SELECT * FROM personal_info
WHERE user_id = 'user_1'
ORDER BY is_default DESC, created_at DESC;

-- Get personal info for a country
SELECT * FROM personal_info
WHERE user_id = 'user_1' AND country_region = 'CHN';

-- Smart selection: passport-specific, or default
SELECT * FROM personal_info
WHERE (passport_id = 'passport_abc123' OR (user_id = 'user_1' AND is_default = 1))
ORDER BY passport_id DESC NULLS LAST
LIMIT 1;
```

---

### 4. **Create Separate Travel Info Table**

**Purpose**: Separate travel information from entry_info for better normalization

```sql
CREATE TABLE travel_info (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  destination TEXT,                        -- Destination country code or name
  travel_purpose TEXT DEFAULT 'HOLIDAY',  -- HOLIDAY, BUSINESS, MEETING, etc.
  recent_stay_country TEXT,                -- For health declarations
  boarding_country TEXT,
  visa_number TEXT,

  -- Arrival flight
  arrival_flight_number TEXT,
  arrival_departure_airport TEXT,
  arrival_departure_date TEXT,
  arrival_departure_time TEXT,
  arrival_arrival_airport TEXT,
  arrival_arrival_date TEXT,
  arrival_arrival_time TEXT,

  -- Departure flight
  departure_flight_number TEXT,
  departure_departure_airport TEXT,
  departure_departure_date TEXT,
  departure_departure_time TEXT,
  departure_arrival_airport TEXT,
  departure_arrival_date TEXT,
  departure_arrival_time TEXT,

  -- Accommodation
  is_transit_passenger INTEGER DEFAULT 0,
  accommodation_type TEXT DEFAULT 'HOTEL',
  province TEXT,
  district TEXT,
  sub_district TEXT,
  postal_code TEXT,
  hotel_name TEXT,
  hotel_address TEXT,
  accommodation_phone TEXT,
  length_of_stay TEXT,

  status TEXT DEFAULT 'draft',             -- draft, completed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_travel_info_user ON travel_info(user_id);
CREATE INDEX idx_travel_info_destination ON travel_info(user_id, destination);
```

---

### 5. **Update Entry Info Table**

**Purpose**: Link to passport, personal_info, travel_info, and fund_items

```sql
ALTER TABLE entry_info RENAME TO entry_info_old;

CREATE TABLE entry_info (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  passport_id TEXT NOT NULL,               -- Required link to passport
  personal_info_id TEXT,                   -- Link to personal info
  travel_info_id TEXT,                     -- NEW: Link to travel info
  destination_id TEXT,                     -- Country code for fast filtering (e.g., 'THA', 'JPN')

  status TEXT DEFAULT 'incomplete',        -- incomplete, ready, submitted, superseded, expired, archived
  completion_metrics TEXT,                 -- JSON: completion tracking

  last_updated_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (passport_id) REFERENCES passports(id),
  FOREIGN KEY (personal_info_id) REFERENCES personal_info(id),
  FOREIGN KEY (travel_info_id) REFERENCES travel_info(id)
);

CREATE INDEX idx_entry_info_user ON entry_info(user_id);
CREATE INDEX idx_entry_info_passport ON entry_info(passport_id);
CREATE INDEX idx_entry_info_personal ON entry_info(personal_info_id);
CREATE INDEX idx_entry_info_travel ON entry_info(travel_info_id);
CREATE INDEX idx_entry_info_destination ON entry_info(user_id, destination_id);
```

---

### 6. **Create Digital Arrival Card Submissions Table**

**Purpose**: Track multiple DAC submission attempts (TDAC, MDAC, SDAC, HK DAC)

```sql
-- Rename existing table for migration
ALTER TABLE tdac_submissions RENAME TO tdac_submissions_old;

-- New generic digital_arrival_cards table
CREATE TABLE digital_arrival_cards (
  id TEXT PRIMARY KEY,
  entry_pack_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,

  -- Card type
  card_type TEXT NOT NULL,                 -- 'TDAC', 'MDAC', 'SDAC', 'HKDAC', etc.
  destination_id TEXT,                     -- Country/region code

  -- Submission data
  arr_card_no TEXT,                        -- Arrival card number
  qr_uri TEXT,                             -- QR code data or URI
  pdf_url TEXT,                            -- PDF document URL

  -- Submission metadata
  submitted_at DATETIME NOT NULL,
  submission_method TEXT DEFAULT 'api',    -- 'api', 'webview', 'hybrid'
  status TEXT DEFAULT 'success',           -- 'success', 'failed', 'pending'

  -- Response data
  api_response TEXT,                       -- JSON response from API
  processing_time INTEGER,                 -- Processing time in ms

  -- Retry tracking
  retry_count INTEGER DEFAULT 0,
  error_details TEXT,

  -- Superseded tracking
  is_superseded INTEGER DEFAULT 0,         -- 0 = current, 1 = superseded
  superseded_at DATETIME,
  superseded_by TEXT,                      -- ID of the submission that supersedes this one
  superseded_reason TEXT,

  -- Version tracking
  version INTEGER DEFAULT 1,               -- Submission version number

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (entry_pack_id) REFERENCES entry_packs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_dac_entry_pack ON digital_arrival_cards(entry_pack_id);
CREATE INDEX idx_dac_user ON digital_arrival_cards(user_id);
CREATE INDEX idx_dac_card_type ON digital_arrival_cards(card_type);
CREATE INDEX idx_dac_status ON digital_arrival_cards(user_id, status);
CREATE INDEX idx_dac_superseded ON digital_arrival_cards(entry_pack_id, is_superseded);
CREATE INDEX idx_dac_arr_card_no ON digital_arrival_cards(arr_card_no);

-- Trigger to mark previous submissions as superseded when a new one is successful
CREATE TRIGGER mark_previous_dac_superseded
AFTER INSERT ON digital_arrival_cards
WHEN NEW.status = 'success' AND NEW.is_superseded = 0
BEGIN
  UPDATE digital_arrival_cards
  SET
    is_superseded = 1,
    superseded_at = CURRENT_TIMESTAMP,
    superseded_by = NEW.id,
    superseded_reason = 'Replaced by newer successful submission'
  WHERE
    entry_pack_id = NEW.entry_pack_id
    AND card_type = NEW.card_type
    AND id != NEW.id
    AND is_superseded = 0;
END;
```

---

### 7. **Update Entry Packs Table**

**Purpose**: Simplify entry_packs to reference DAC submissions

```sql
ALTER TABLE entry_packs RENAME TO entry_packs_old;

CREATE TABLE entry_packs (
  id TEXT PRIMARY KEY,
  entry_info_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  destination_id TEXT,                     -- Country code for fast filtering

  -- Status
  status TEXT DEFAULT 'in_progress',       -- in_progress, submitted, superseded, completed, expired, archived

  -- Latest DAC submission references (for quick access)
  latest_tdac_id TEXT,                     -- Latest successful TDAC submission
  latest_mdac_id TEXT,                     -- Latest successful MDAC submission
  latest_sdac_id TEXT,                     -- Latest successful SDAC submission
  latest_hkdac_id TEXT,                    -- Latest successful HK DAC submission

  -- Display metadata (JSON)
  display_status TEXT,                     -- JSON: UI display state
  documents TEXT,                          -- JSON: document references

  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  archived_at DATETIME,

  FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (latest_tdac_id) REFERENCES digital_arrival_cards(id),
  FOREIGN KEY (latest_mdac_id) REFERENCES digital_arrival_cards(id),
  FOREIGN KEY (latest_sdac_id) REFERENCES digital_arrival_cards(id),
  FOREIGN KEY (latest_hkdac_id) REFERENCES digital_arrival_cards(id)
);

CREATE INDEX idx_entry_packs_user ON entry_packs(user_id);
CREATE INDEX idx_entry_packs_entry_info ON entry_packs(entry_info_id);
CREATE INDEX idx_entry_packs_status ON entry_packs(user_id, status);
CREATE INDEX idx_entry_packs_destination ON entry_packs(user_id, destination_id);
```

---

## Migration Strategy

### Phase 1: Data Migration
1. Create new tables with updated schema
2. Migrate data from old tables to new tables
3. Update foreign key references
4. Verify data integrity

### Phase 2: Application Layer Updates
1. Update SecureStorageService to use new schema
2. Update models:
   - Passport: Add `is_primary` support
   - PersonalInfo: Support multiple records, `passport_id`, `is_default`, `label`
   - TravelInfo: Separate model (already exists)
   - EntryInfo: Link to `travel_info_id`
   - EntryPack: Support multiple DAC types
3. Update services to handle multiple DAC types
4. Add PersonalInfo management UI (select, create, edit, delete)
5. Add tests for new schema

### Phase 3: Cleanup
1. Drop old tables
2. Update documentation
3. Deploy to production

---

## Benefits of New Design

1. **Clear Relationships**: Multiple personal_info per user (passport/country-specific), one-to-many for passports, entry_info, etc.
2. **Flexible Personal Info**: Support different addresses/contacts for different passports or countries
3. **Flexible DAC Support**: Can handle multiple DAC types (TDAC, MDAC, SDAC, HK DAC) with automatic superseding
4. **Better Normalization**: Travel info separated from entry_info
5. **Data Integrity**: Foreign keys with CASCADE delete, triggers for constraints
6. **Passport-Countries**: Easy to query which countries a passport can enter
7. **Scalability**: Can easily add new DAC types without schema changes
8. **Audit Trail**: Complete submission history with superseded tracking
9. **Context-Aware**: Personal info can be linked to passport or country for immigration-specific requirements

---

## Design Decisions (RESOLVED)

1. **User ID Type**: ✅ **Keep users.id as INTEGER**, change all other entities to TEXT
   - **Rationale**: WeChat OpenID integration requires INTEGER compatibility
   - **Implementation**: users.id = INTEGER, all other IDs = TEXT

2. **Travel Info Reusability**: ✅ **One-to-one with entry_info**
   - **Rationale**: Each entry typically has unique travel details
   - **Implementation**: One travel_info per entry_info, can evolve later if needed

3. **Data Migration**: ✅ **Start fresh**
   - **Rationale**: Clean slate for new schema, existing data is test/development only
   - **Implementation**: Create new tables, no migration scripts needed

4. **Passport Countries**: ✅ **Pre-populate common entries**
   - **Rationale**: Better UX - user can see supported countries immediately
   - **Implementation**: Seed data for CHN, HKG, MAC passports with common destinations (THA, JPN, SGP, etc.)

5. **Fund Items**: ✅ **Keep current design** (link to user only, not passport)
   - **Rationale**: Fund items are user-owned assets, not passport-specific
