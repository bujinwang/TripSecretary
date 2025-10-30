-- User table
-- Note: Using TEXT for id to match mobile schema (generates UUIDs client-side)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  wechat_openid TEXT UNIQUE,
  phone TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Passport table
CREATE TABLE IF NOT EXISTS passports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
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

-- Generation records table (LEGACY - kept for backward compatibility)
CREATE TABLE IF NOT EXISTS generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  passport_id TEXT NOT NULL,
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
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (passport_id) REFERENCES passports(id)
);

-- Personal information table
CREATE TABLE IF NOT EXISTS personal_info (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  passport_id TEXT,
  phone_number TEXT,
  email TEXT,
  home_address TEXT,
  occupation TEXT,
  province_city TEXT,
  country_region TEXT,
  phone_code TEXT,
  gender TEXT,
  is_default INTEGER DEFAULT 0,
  label TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE SET NULL
);

-- Fund items table
CREATE TABLE IF NOT EXISTS fund_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount TEXT,
  currency TEXT,
  details TEXT,
  photo_uri TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Travel info table (trip-specific draft data)
CREATE TABLE IF NOT EXISTS travel_info (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  entry_info_id TEXT UNIQUE,
  destination TEXT,
  travel_purpose TEXT DEFAULT 'HOLIDAY',
  recent_stay_country TEXT,
  boarding_country TEXT,
  visa_number TEXT,
  arrival_flight_number TEXT,
  arrival_departure_airport TEXT,
  arrival_departure_date TEXT,
  arrival_arrival_airport TEXT,
  arrival_arrival_date TEXT,
  arrival_flight_ticket_photo_uri TEXT,
  departure_flight_number TEXT,
  departure_departure_airport TEXT,
  departure_departure_date TEXT,
  departure_arrival_airport TEXT,
  departure_arrival_date TEXT,
  departure_flight_ticket_photo_uri TEXT,
  accommodation_type TEXT DEFAULT 'HOTEL',
  province TEXT,
  district TEXT,
  sub_district TEXT,
  postal_code TEXT,
  hotel_name TEXT,
  hotel_address TEXT,
  hotel_booking_photo_uri TEXT,
  accommodation_phone TEXT,
  length_of_stay TEXT,
  is_transit_passenger INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE SET NULL
);

-- Entry info table
CREATE TABLE IF NOT EXISTS entry_info (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  passport_id TEXT,              -- Nullable: allow creation without passport, can be added later
  personal_info_id TEXT,
  travel_info_id TEXT,
  destination_id TEXT,           -- Country code for fast filtering (e.g., 'THA', 'JPN')

  -- Status: incomplete, ready, submitted, superseded, completed, expired, archived
  status TEXT DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'ready', 'submitted', 'superseded', 'completed', 'expired', 'archived')),

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
  FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE SET NULL,
  FOREIGN KEY (personal_info_id) REFERENCES personal_info(id) ON DELETE SET NULL,
  FOREIGN KEY (travel_info_id) REFERENCES travel_info(id) ON DELETE SET NULL
);

-- Entry info ⇄ fund items mapping
CREATE TABLE IF NOT EXISTS entry_info_fund_items (
  entry_info_id TEXT NOT NULL,
  fund_item_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  linked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (entry_info_id, fund_item_id),
  FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE CASCADE,
  FOREIGN KEY (fund_item_id) REFERENCES fund_items(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Digital Arrival Cards table (generic for all card types)
-- Links directly to entry_info (no entry_packs table needed)
CREATE TABLE IF NOT EXISTS digital_arrival_cards (
  id TEXT PRIMARY KEY,
  entry_info_id TEXT NOT NULL,
  user_id TEXT NOT NULL,

  -- Card type
  card_type TEXT NOT NULL CHECK (card_type IN ('TDAC', 'MDAC', 'SDAC', 'HKDAC')),
  destination_id TEXT,                     -- Denormalized for fast lookup

  -- Submission data
  arr_card_no TEXT,
  qr_uri TEXT,
  pdf_url TEXT,

  -- Submission metadata
  submitted_at DATETIME NOT NULL,
  submission_method TEXT DEFAULT 'api',
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),

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

-- Entry guide progress table (mobile-specific)
CREATE TABLE IF NOT EXISTS entry_guide_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  completed_steps TEXT,
  answers TEXT,
  last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, country_code)
);

-- TDAC submission logs table (mobile-specific)
CREATE TABLE IF NOT EXISTS tdac_submission_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  submission_method TEXT NOT NULL,
  arr_card_no TEXT,
  traveler_data TEXT,
  field_mappings TEXT,
  validation_results TEXT,
  cloudflare_token_length INTEGER,
  submission_timestamp DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Travel history table (non-sensitive data)
CREATE TABLE IF NOT EXISTS travel_history (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  destination_id TEXT,
  destination_name TEXT,
  travel_date TEXT,
  return_date TEXT,
  purpose TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  action TEXT,
  table_name TEXT,
  record_id TEXT,
  timestamp TEXT,
  details TEXT
);

-- Settings table (non-sensitive)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT
);

-- Snapshots table (historical entry pack records)
-- Purpose: Immutable point-in-time copies of completed/expired/cancelled entry packs
CREATE TABLE IF NOT EXISTS snapshots (
  snapshot_id TEXT PRIMARY KEY,
  entry_info_id TEXT,
  user_id TEXT NOT NULL,
  destination_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('completed', 'cancelled', 'expired')),
  created_at TEXT NOT NULL,
  arrival_date TEXT,
  version INTEGER DEFAULT 1,
  metadata TEXT,
  passport_data TEXT,
  personal_info_data TEXT,
  funds_data TEXT,
  travel_data TEXT,
  tdac_submission_data TEXT,
  completeness_indicator TEXT,
  photo_manifest TEXT,
  encryption_info TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_duplicate ON generations(passport_id, destination_id, flight_number, arrival_date);
CREATE INDEX IF NOT EXISTS idx_passports_user ON passports(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_info_user ON personal_info(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_items_user ON fund_items(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_info_user ON travel_info(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_info_destination ON travel_info(user_id, destination);
CREATE INDEX IF NOT EXISTS idx_travel_info_entry_info ON travel_info(entry_info_id);

CREATE INDEX IF NOT EXISTS idx_entry_info_user ON entry_info(user_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_destination ON entry_info(user_id, destination_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_passport ON entry_info(passport_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_personal ON entry_info(personal_info_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_travel ON entry_info(travel_info_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_status ON entry_info(user_id, status);

CREATE INDEX IF NOT EXISTS idx_entry_info_fund_items_entry ON entry_info_fund_items(entry_info_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_fund_items_fund ON entry_info_fund_items(fund_item_id);

CREATE INDEX IF NOT EXISTS idx_dac_entry_info ON digital_arrival_cards(entry_info_id);
CREATE INDEX IF NOT EXISTS idx_dac_user ON digital_arrival_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_dac_card_type ON digital_arrival_cards(card_type);
CREATE INDEX IF NOT EXISTS idx_dac_status ON digital_arrival_cards(user_id, status);
CREATE INDEX IF NOT EXISTS idx_dac_superseded ON digital_arrival_cards(entry_info_id, card_type, is_superseded);
CREATE INDEX IF NOT EXISTS idx_dac_arr_card_no ON digital_arrival_cards(arr_card_no);
CREATE INDEX IF NOT EXISTS idx_dac_latest ON digital_arrival_cards(entry_info_id, card_type, is_superseded, status);

CREATE INDEX IF NOT EXISTS idx_entry_guide_user ON entry_guide_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_entry_guide_country ON entry_guide_progress(country_code);
CREATE INDEX IF NOT EXISTS idx_entry_guide_updated ON entry_guide_progress(last_updated_at);

CREATE INDEX IF NOT EXISTS idx_tdac_logs_user ON tdac_submission_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tdac_logs_method ON tdac_submission_logs(submission_method);
CREATE INDEX IF NOT EXISTS idx_tdac_logs_timestamp ON tdac_submission_logs(submission_timestamp);
CREATE INDEX IF NOT EXISTS idx_tdac_logs_created ON tdac_submission_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_tdac_logs_arr_card ON tdac_submission_logs(arr_card_no);

CREATE INDEX IF NOT EXISTS idx_snapshots_user ON snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_entry_info ON snapshots(entry_info_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_destination ON snapshots(user_id, destination_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_status ON snapshots(user_id, status);
CREATE INDEX IF NOT EXISTS idx_snapshots_created ON snapshots(created_at DESC);
