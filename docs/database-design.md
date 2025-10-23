# TripSecretary Database Design - Complete Guide

**Version**: 2.0 (Final)
**Date**: 2025-10-22
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Requirements](#requirements)
3. [Design Decisions](#design-decisions)
4. [Complete Schema](#complete-schema)
5. [Table Details](#table-details)
6. [Database Triggers](#database-triggers)
7. [Indexes](#indexes)
8. [ERD Diagram](#erd-diagram)
9. [Common Queries](#common-queries)
10. [Migration Guide](#migration-guide)
11. [Quick Reference](#quick-reference)

---

## Overview

TripSecretary uses SQLite database with **10 tables** organized into three categories:

| Category | Tables | Count |
|----------|--------|-------|
| **Core** | users, passports, passport_countries, personal_info, travel_info, fund_items | 6 |
| **Entry Management** | entry_info, digital_arrival_cards | 2 |
| **Junction** | entry_info_fund_items | 1 |
| **Legacy** | generations | 1 |

### Key Design Principles

1. ✅ **Multiple personal info per user** - Passport/country-specific addresses
2. ✅ **Primary passport pattern** - One primary per user (trigger-enforced)
3. ✅ **Simplified entry management** - Direct link entry_info → digital_arrival_cards
4. ✅ **Generic DAC table** - TDAC, MDAC, SDAC, HKDAC in one table
5. ✅ **Auto-superseding** - Old DAC submissions marked automatically
6. ✅ **Performance optimization** - destination_id denormalized for fast filtering

---

## Requirements

### Original Requirements

1. **Single user per device** can have **multiple passports**
2. Each **passport** can enter **multiple countries**
3. Each **user** can have **multiple personal info** records (country/passport-specific)
4. **Entry info** captures a country entry with passport, personal_info, travel_info, and fund_items
5. Entry info contains all necessary materials for immigration officer
6. Each entry can have **multiple digital arrival card submissions** (TDAC, MDAC, SDAC, HK DAC)
7. **Latest successful DAC** is used for border presentation

### Key Clarifications

- **Personal Info**: Changed from "one per user" to "multiple per user" to support different addresses for different passports/countries
- **Entry Packs**: Removed redundant table, merged into entry_info
- **Trip ID**: Removed to simplify (single country per entry)
- **Destination ID**: Kept for performance (fast filtering without JOIN)

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **User ID Type** | INTEGER | WeChat OpenID compatibility |
| **Other IDs** | TEXT | Application uses TEXT IDs (uuid format) |
| **Personal Info** | Multiple per user | Support passport/country-specific addresses |
| **Travel Info** | One-to-one with entry_info | Each entry has unique travel details |
| **Entry Packs** | REMOVED | Redundant, merged into entry_info |
| **Trip ID** | REMOVED | Single country per entry (simplified) |
| **Destination ID** | KEPT | Performance optimization for fast filtering |
| **Data Migration** | Start fresh | Clean slate, no migration needed |
| **Passport Countries** | Pre-populate | Better UX, immediate availability |

### Why entry_packs Was Removed

**Problem**: entry_packs only stored references and duplicate data:
- latest_tdac_id → Can be queried from digital_arrival_cards
- documents → Moved to entry_info.documents
- display_status → Moved to entry_info.display_status
- status → Already in entry_info.status

**Solution**: Direct link entry_info → digital_arrival_cards
- 50% fewer joins
- Simpler queries
- Better performance

### Why trip_id Was Removed

**Analysis**: trip_id was for grouping multi-country trips (Thailand → Malaysia → Singapore)

**Decision**: Not needed for initial version
- Simplified schema
- Single country per entry
- Can add later if needed

**Kept destination_id**: Fast filtering without JOIN to travel_info

---

## Complete Schema

```sql
-- =====================================================
-- TripSecretary Database Schema v2.0
-- Updated: 2025-10-22
--
-- Design Decisions:
-- 1. users.id = INTEGER (WeChat compatibility)
-- 2. All other entities use TEXT IDs
-- 3. Multiple personal_info per user (passport/country-specific)
-- 4. Travel info separated from entry_info
-- 5. Generic digital_arrival_cards (TDAC, MDAC, SDAC, HK DAC)
-- 6. Passport-countries tracking
-- 7. No entry_packs table (merged into entry_info)
-- 8. No trip_id (single country per entry, simplified)
-- 9. destination_id kept for fast filtering (denormalized)
-- =====================================================

-- =====================================================
-- Core Tables
-- =====================================================

-- Users table (no changes - keep INTEGER for WeChat)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wechat_openid TEXT UNIQUE,
  phone TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Passports table (updated with TEXT ID and is_primary)
CREATE TABLE IF NOT EXISTS passports (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  passport_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth TEXT,
  nationality TEXT,
  gender TEXT,
  expiry_date TEXT,
  issue_date TEXT,
  issue_place TEXT,
  photo_uri TEXT,
  is_primary INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Passport-Countries mapping (NEW)
CREATE TABLE IF NOT EXISTS passport_countries (
  passport_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  visa_required INTEGER DEFAULT 0,
  max_stay_days INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (passport_id, country_code),
  FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE CASCADE
);

-- Personal Info table (multiple per user, optionally linked to passport)
CREATE TABLE IF NOT EXISTS personal_info (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  passport_id TEXT,

  -- Contact Information
  phone_number TEXT,
  email TEXT,
  home_address TEXT,

  -- Location Context
  country_region TEXT,
  province_city TEXT,

  -- Personal Details
  occupation TEXT,
  phone_code TEXT,
  -- NOTE: gender field removed - use passports.gender instead (single source of truth)

  -- Selection Mechanism
  is_default INTEGER DEFAULT 0,
  label TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE SET NULL
);

-- Travel Info table (separated from entry_info)
CREATE TABLE IF NOT EXISTS travel_info (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  destination TEXT,
  travel_purpose TEXT DEFAULT 'HOLIDAY',
  recent_stay_country TEXT,
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

  status TEXT DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Fund Items table
CREATE TABLE IF NOT EXISTS fund_items (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  amount TEXT,
  currency TEXT,
  details TEXT,
  photo_uri TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- Entry Management Tables
-- =====================================================

-- Entry Info table (links passport, personal_info, travel_info, fund_items)
-- Status flow: incomplete → ready → submitted → superseded/completed/expired/archived
CREATE TABLE IF NOT EXISTS entry_info (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  passport_id TEXT NOT NULL,
  personal_info_id TEXT,
  travel_info_id TEXT,
  destination_id TEXT,           -- Country code for fast filtering (e.g., 'THA', 'JPN')

  -- Status: incomplete, ready, submitted, superseded, completed, expired, archived
  status TEXT DEFAULT 'incomplete',

  -- Completion tracking (JSON)
  completion_metrics TEXT,

  -- Documents (after DAC submission) - JSON
  -- {qrCodeImage: 'path', pdfDocument: 'path', entryCardImage: 'path'}
  documents TEXT,

  -- Display status (for UI) - JSON
  -- {completionPercent: 80, categoryStates: {...}, ctaState: 'enabled', showQR: true}
  display_status TEXT,

  last_updated_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (passport_id) REFERENCES passports(id),
  FOREIGN KEY (personal_info_id) REFERENCES personal_info(id),
  FOREIGN KEY (travel_info_id) REFERENCES travel_info(id)
);

-- Entry Info <-> Fund Items junction table
CREATE TABLE IF NOT EXISTS entry_info_fund_items (
  entry_info_id TEXT NOT NULL,
  fund_item_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  linked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (entry_info_id, fund_item_id),
  FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE CASCADE,
  FOREIGN KEY (fund_item_id) REFERENCES fund_items(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Digital Arrival Cards table (generic for all card types)
-- Links directly to entry_info (no entry_packs table needed)
CREATE TABLE IF NOT EXISTS digital_arrival_cards (
  id TEXT PRIMARY KEY,
  entry_info_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,

  -- Card type
  card_type TEXT NOT NULL,                 -- 'TDAC', 'MDAC', 'SDAC', 'HKDAC'
  destination_id TEXT,                     -- Denormalized for fast lookup

  -- Submission data
  arr_card_no TEXT,
  qr_uri TEXT,
  pdf_url TEXT,

  -- Submission metadata
  submitted_at DATETIME NOT NULL,
  submission_method TEXT DEFAULT 'api',
  status TEXT DEFAULT 'success',

  -- Response data
  api_response TEXT,
  processing_time INTEGER,

  -- Retry tracking
  retry_count INTEGER DEFAULT 0,
  error_details TEXT,

  -- Superseded tracking
  is_superseded INTEGER DEFAULT 0,
  superseded_at DATETIME,
  superseded_by TEXT,
  superseded_reason TEXT,

  -- Version tracking
  version INTEGER DEFAULT 1,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================================================
-- Legacy Table (kept for reference)
-- =====================================================

-- Generation records table (legacy - may be deprecated)
CREATE TABLE IF NOT EXISTS generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  passport_id INTEGER NOT NULL,
  destination_id TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  flight_number TEXT,
  arrival_date TEXT,
  hotel_name TEXT,
  hotel_address TEXT,
  contact_phone TEXT,
  stay_duration TEXT,
  travel_purpose TEXT,
  additional_data TEXT,
  status TEXT DEFAULT 'completed',
  result_data TEXT,
  pdf_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Table Details

### Core Tables

#### users
```sql
id (INT) PK - WeChat compatibility
wechat_openid, phone, name, avatar_url
```

**Purpose**: User account management

#### passports
```sql
id (TEXT) PK
user_id (INT) FK
passport_number, full_name, nationality, gender
date_of_birth, expiry_date, issue_date, issue_place
photo_uri
is_primary (INT) ✨ NEW - Only one per user
```

**Purpose**: Store multiple passports per user
**Key Feature**: is_primary flag enforced by trigger

#### passport_countries ✨ NEW
```sql
passport_id (TEXT) FK } PK (composite)
country_code (TEXT)   }
visa_required (INT), max_stay_days (INT)
notes (TEXT)
```

**Purpose**: Track which countries each passport can enter
**Pre-populated**: CHN, HKG, MAC passports with common destinations

#### personal_info
```sql
id (TEXT) PK
user_id (INT) FK
passport_id (TEXT) FK ✨ NULLABLE - Optional link
phone_number, email, home_address
country_region, province_city
occupation, phone_code
is_default (INT) ✨ NEW - Only one per user
label (TEXT) ✨ NEW - e.g., "China", "Hong Kong"
```

**Purpose**: Multiple personal info per user
**Use Cases**:
- China address for Chinese passport
- Hong Kong address for HK passport
- Different addresses for different countries

**Smart Selection Logic**:
1. Passport-specific → personal_info.passport_id = selected_passport.id
2. Country-specific → personal_info.country_region = destination_country
3. Default → personal_info.is_default = 1
4. Fallback → First record

#### travel_info
```sql
id (TEXT) PK
user_id (INT) FK
destination, travel_purpose
arrival_flight_number, arrival_departure_date, ...
departure_flight_number, departure_departure_date, ...
hotel_name, hotel_address, accommodation_type, ...
status (draft/completed)
```

**Purpose**: Flight and accommodation details
**Relationship**: One-to-one with entry_info

#### fund_items
```sql
id (TEXT) PK
user_id (INT) FK
type, amount, currency, details
photo_uri
```

**Purpose**: Funding proof items
**Types**: CASH, CREDIT_CARD, BANK_STATEMENT, TRAVELLER_CHECK

### Entry Management Tables

#### entry_info (UPDATED)
```sql
id (TEXT) PK
user_id (INT) FK
passport_id (TEXT) FK
personal_info_id (TEXT) FK
travel_info_id (TEXT) FK
destination_id (TEXT) - Country code for fast filtering

status (TEXT) ✨ incomplete/ready/submitted/superseded/completed/expired/archived
completion_metrics (JSON)
documents (JSON) ✨ NEW - {qrCodeImage, pdfDocument, ...}
display_status (JSON) ✨ NEW - {completionPercent, ctaState, showQR, ...}

last_updated_at, created_at
```

**Purpose**: Central entry management with all references
**Key Changes**:
- Added documents field (was in entry_packs)
- Added display_status field (was in entry_packs)
- Direct link to digital_arrival_cards

**Status Flow**:
```
incomplete → ready → submitted → {superseded, completed, expired, archived}
            ↑________________________↓
              (user edits after submit)
```

#### digital_arrival_cards
```sql
id (TEXT) PK
entry_info_id (TEXT) FK ✨ Direct link (was entry_pack_id)
user_id (INT) FK

card_type (TEXT) - 'TDAC', 'MDAC', 'SDAC', 'HKDAC'
destination_id, arr_card_no, qr_uri, pdf_url

submitted_at, submission_method, status
is_superseded (INT), superseded_at, superseded_by
version (INT)

created_at, updated_at
```

**Purpose**: Store all DAC submissions
**Key Feature**: Auto-superseding via trigger

#### entry_info_fund_items (junction)
```sql
entry_info_id (TEXT) FK } PK (composite)
fund_item_id (TEXT) FK  }
user_id (INT) FK
linked_at
```

**Purpose**: Many-to-many relationship between entry_info and fund_items

---

## Database Triggers

### 1. ensure_one_primary_passport
```sql
CREATE TRIGGER IF NOT EXISTS ensure_one_primary_passport
BEFORE UPDATE OF is_primary ON passports
WHEN NEW.is_primary = 1
BEGIN
  UPDATE passports
  SET is_primary = 0
  WHERE user_id = NEW.user_id AND id != NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS ensure_one_primary_passport_insert
BEFORE INSERT ON passports
WHEN NEW.is_primary = 1
BEGIN
  UPDATE passports
  SET is_primary = 0
  WHERE user_id = NEW.user_id;
END;
```

**Purpose**: Ensure only one primary passport per user

### 2. ensure_one_default_personal_info
```sql
CREATE TRIGGER IF NOT EXISTS ensure_one_default_personal_info
BEFORE UPDATE OF is_default ON personal_info
WHEN NEW.is_default = 1
BEGIN
  UPDATE personal_info
  SET is_default = 0
  WHERE user_id = NEW.user_id AND id != NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS ensure_one_default_personal_info_insert
BEFORE INSERT ON personal_info
WHEN NEW.is_default = 1
BEGIN
  UPDATE personal_info
  SET is_default = 0
  WHERE user_id = NEW.user_id;
END;
```

**Purpose**: Ensure only one default personal_info per user

### 3. mark_previous_dac_superseded
```sql
CREATE TRIGGER IF NOT EXISTS mark_previous_dac_superseded
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
    entry_info_id = NEW.entry_info_id
    AND card_type = NEW.card_type
    AND id != NEW.id
    AND is_superseded = 0;
END;
```

**Purpose**: Automatically mark old DAC submissions as superseded

---

## Indexes

```sql
-- Users
CREATE INDEX IF NOT EXISTS idx_users_wechat ON users(wechat_openid);

-- Passports
CREATE INDEX IF NOT EXISTS idx_passports_user ON passports(user_id);
CREATE INDEX IF NOT EXISTS idx_passports_primary ON passports(user_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_passports_nationality ON passports(nationality);

-- Passport Countries
CREATE INDEX IF NOT EXISTS idx_passport_countries_passport ON passport_countries(passport_id);
CREATE INDEX IF NOT EXISTS idx_passport_countries_country ON passport_countries(country_code);

-- Personal Info
CREATE INDEX IF NOT EXISTS idx_personal_info_user ON personal_info(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_info_passport ON personal_info(passport_id);
CREATE INDEX IF NOT EXISTS idx_personal_info_default ON personal_info(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_personal_info_country ON personal_info(user_id, country_region);

-- Travel Info
CREATE INDEX IF NOT EXISTS idx_travel_info_user ON travel_info(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_info_destination ON travel_info(user_id, destination);

-- Fund Items
CREATE INDEX IF NOT EXISTS idx_fund_items_user ON fund_items(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_items_type ON fund_items(user_id, type);

-- Entry Info
CREATE INDEX IF NOT EXISTS idx_entry_info_user ON entry_info(user_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_passport ON entry_info(passport_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_personal ON entry_info(personal_info_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_travel ON entry_info(travel_info_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_destination ON entry_info(user_id, destination_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_status ON entry_info(user_id, status);

-- Entry Info Fund Items
CREATE INDEX IF NOT EXISTS idx_entry_info_fund_items_entry ON entry_info_fund_items(entry_info_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_fund_items_fund ON entry_info_fund_items(fund_item_id);

-- Digital Arrival Cards
CREATE INDEX IF NOT EXISTS idx_dac_entry_info ON digital_arrival_cards(entry_info_id);
CREATE INDEX IF NOT EXISTS idx_dac_user ON digital_arrival_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_dac_card_type ON digital_arrival_cards(card_type);
CREATE INDEX IF NOT EXISTS idx_dac_status ON digital_arrival_cards(user_id, status);
CREATE INDEX IF NOT EXISTS idx_dac_superseded ON digital_arrival_cards(entry_info_id, card_type, is_superseded);
CREATE INDEX IF NOT EXISTS idx_dac_arr_card_no ON digital_arrival_cards(arr_card_no);
CREATE INDEX IF NOT EXISTS idx_dac_latest ON digital_arrival_cards(entry_info_id, card_type, is_superseded, status);

-- Generations (legacy)
CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_duplicate ON generations(passport_id, destination_id, flight_number, arrival_date);
```

---

## ERD Diagram

```
┌──────────┐
│  users   │
│──────────│
│ id (INT) │◄─────────────────────┐
│ wechat.. │                      │
│ phone    │                      │
└──────────┘                      │
     │                            │
     │ 1:*                        │
     ▼                            │
┌──────────────┐                 │
│   passports  │                 │
│──────────────│                 │
│ id (TEXT) PK │                 │
│ user_id FK   │                 │
│ passport_num │                 │
│ is_primary ✨│                 │
└──────────────┘                 │
     │ 1:*                       │
     ▼                           │
┌──────────────────┐             │
│passport_countries│             │
│──────────────────│             │
│ passport_id FK   │             │
│ country_code     │             │
│ visa_required    │             │
└──────────────────┘             │
                                 │
┌───────────────┐                │
│ personal_info │                │
│───────────────│                │
│ id (TEXT) PK  │                │
│ user_id FK    │────────────────┘
│ passport_id FK│◄───────────────┐ (optional)
│ home_address  │                │
│ is_default ✨ │                │
│ label ✨      │                │
└───────────────┘                │
                                 │
┌─────────────┐                  │
│ travel_info │                  │
│─────────────│                  │
│ id (TEXT) PK│                  │
│ user_id FK  │                  │
│ destination │                  │
│ hotel_name  │                  │
└─────────────┘                  │
                                 │
┌────────────┐                   │
│ fund_items │                   │
│────────────│                   │
│ id (TEXT)  │                   │
│ user_id FK │                   │
│ type       │                   │
└────────────┘                   │
                                 │
         ┌──────────────┐        │
         │  entry_info  │        │
         │──────────────│        │
         │ id (TEXT) PK │        │
         │ user_id FK   │        │
         │ passport_id  │◄───────┤
         │ personal_... │◄───────┘
         │ travel_inf..│◄────────┐
         │ destination  │         │
         │ status       │         │
         │ completion..│          │
         │ documents ✨ │ ◄── NEW! Stores QR/PDF
         │ display_st..│ ◄── NEW! UI state
         │ last_updated │         │
         │ created_at   │         │
         └──────────────┘         │
                │                 │
                │ 1:*             │
                ▼                 │
    ┌────────────────────────┐   │
    │ digital_arrival_cards  │   │
    │────────────────────────│   │
    │ id (TEXT) PK           │   │
    │ entry_info_id FK ✨    │───┘ DIRECT LINK
    │ user_id FK             │
    │ card_type              │
    │ arr_card_no            │
    │ qr_uri                 │
    │ is_superseded          │
    │ submitted_at           │
    └────────────────────────┘

    ┌─────────────────────────┐
    │ entry_info_fund_items   │
    │─────────────────────────│
    │ entry_info_id FK } PK   │
    │ fund_item_id FK  }      │
    │ user_id FK              │
    └─────────────────────────┘
```

**Key Features**:
- ✨ **Direct link**: entry_info → digital_arrival_cards (no entry_packs)
- ✨ **Multiple personal_info**: passport/country-specific
- ✨ **Auto-superseding**: Trigger marks old DACs

---

## Common Queries

### Get Latest TDAC for Entry
```sql
SELECT * FROM digital_arrival_cards
WHERE entry_info_id = ?
  AND card_type = 'TDAC'
  AND is_superseded = 0
  AND status = 'success'
ORDER BY submitted_at DESC
LIMIT 1;
```

### Get All Latest DACs (One Per Type)
```sql
SELECT card_type, arr_card_no, qr_uri, submitted_at
FROM digital_arrival_cards
WHERE entry_info_id = ?
  AND is_superseded = 0
  AND status = 'success'
GROUP BY card_type
ORDER BY card_type;
```

### Get Entry with Complete Data
```sql
SELECT
  ei.*,
  p.passport_number,
  pi.home_address,
  ti.hotel_name,
  GROUP_CONCAT(fi.type) as fund_types
FROM entry_info ei
LEFT JOIN passports p ON ei.passport_id = p.id
LEFT JOIN personal_info pi ON ei.personal_info_id = pi.id
LEFT JOIN travel_info ti ON ei.travel_info_id = ti.id
LEFT JOIN entry_info_fund_items eifi ON ei.id = eifi.entry_info_id
LEFT JOIN fund_items fi ON eifi.fund_item_id = fi.id
WHERE ei.id = ?
GROUP BY ei.id;
```

### Get Primary Passport
```sql
SELECT * FROM passports
WHERE user_id = ? AND is_primary = 1;
```

### Get Default Personal Info
```sql
SELECT * FROM personal_info
WHERE user_id = ? AND is_default = 1;
```

### Get Personal Info for Passport
```sql
SELECT * FROM personal_info
WHERE passport_id = ?;
```

### Get Countries for Passport
```sql
SELECT pc.*, pc.visa_required, pc.max_stay_days
FROM passport_countries pc
WHERE pc.passport_id = ?
ORDER BY pc.country_code;
```

---

## Migration Guide

### Option 1: Start Fresh (Recommended)

```bash
# 1. Apply schema
sqlite3 tripsecretary.db < cloudflare-backend/src/db/schema-v2.sql

# 2. Apply seed data
sqlite3 tripsecretary.db < cloudflare-backend/src/db/seed-passport-countries.sql

# 3. Verify
sqlite3 tripsecretary.db ".tables"
sqlite3 tripsecretary.db "SELECT COUNT(*) FROM passport_countries;"

# 4. Check triggers
sqlite3 tripsecretary.db "SELECT name FROM sqlite_master WHERE type='trigger';"
```

### Option 2: Migrate Existing Data

```sql
-- 1. Backup existing database
-- cp tripsecretary.db tripsecretary.db.backup

-- 2. Create new tables
-- (Run schema-v2.sql)

-- 3. Migrate data
-- INSERT INTO new_table SELECT ... FROM old_table;

-- 4. Drop old tables
-- DROP TABLE old_table;
```

---

## Quick Reference

### Relationships

```
users
├── passports (1:*)
│   ├── passport_countries (1:*)
│   └── personal_info (1:0..1) optional link
├── personal_info (1:*) multiple per user
├── travel_info (1:*)
└── fund_items (1:*)

entry_info
├── passport (1:1)
├── personal_info (1:1)
├── travel_info (1:1)
├── fund_items (*:*) via junction
└── digital_arrival_cards (1:*) ✨ DIRECT LINK
```

### Status Values

**entry_info.status**:
- `incomplete` - Filling out form (< 100% complete)
- `ready` - All fields complete, ready to submit DAC
- `submitted` - DAC successfully submitted
- `superseded` - User edited after submission, needs resubmit
- `completed` - User passed immigration successfully
- `expired` - Trip date passed
- `archived` - Manually archived by user

**digital_arrival_cards.status**:
- `success` - Successfully submitted
- `failed` - Submission failed
- `pending` - Submission in progress

### Comparison: Before vs After

| Aspect | Old Design | New Design |
|--------|-----------|------------|
| **Tables** | 11 | 10 ✅ |
| **Entry → DAC** | 2 joins (via entry_packs) | 1 join ✅ |
| **Documents** | entry_packs.documents | entry_info.documents ✅ |
| **Display State** | entry_packs.display_status | entry_info.display_status ✅ |
| **Latest DAC** | entry_packs.latest_tdac_id | Query (indexed) ✅ |
| **Trip Grouping** | trip_id field | Removed ✅ |
| **Complexity** | Higher | Lower ✅ |
| **Performance** | Slower (more joins) | Faster ✅ |

---

## Files Location

```
cloudflare-backend/src/db/
├── schema-v2.sql ✅ Main schema (apply this)
└── seed-passport-countries.sql ✅ Seed data

docs/
└── database-design.md ✅ This file (consolidated)
```

### Archived Documentation

The following files have been consolidated into this document:
- database-schema-proposal.md
- database-erd-simplified.md
- FINAL-schema-v2.md
- simplified-schema-design.md
- destination-trip-id-analysis.md
- personal-info-design.md
- schema-comparison.md
- quick-reference.md

---

**Ready to implement!** 🚀

Apply `schema-v2.sql` → Seed `passport-countries.sql` → Update code
