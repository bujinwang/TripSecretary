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

-- Trigger: Ensure only one primary passport per user
CREATE TRIGGER IF NOT EXISTS ensure_one_primary_passport
BEFORE UPDATE OF is_primary ON passports
WHEN NEW.is_primary = 1
BEGIN
  UPDATE passports
  SET is_primary = 0
  WHERE user_id = NEW.user_id AND id != NEW.id;
END;

-- Also handle INSERT for primary passports
CREATE TRIGGER IF NOT EXISTS ensure_one_primary_passport_insert
BEFORE INSERT ON passports
WHEN NEW.is_primary = 1
BEGIN
  UPDATE passports
  SET is_primary = 0
  WHERE user_id = NEW.user_id;
END;

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
  gender TEXT,

  -- Selection Mechanism
  is_default INTEGER DEFAULT 0,
  label TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE SET NULL
);

-- Trigger: Ensure only one default personal_info per user
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

-- Trigger: Mark previous DAC submissions as superseded
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

-- =====================================================
-- Indexes
-- =====================================================

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
