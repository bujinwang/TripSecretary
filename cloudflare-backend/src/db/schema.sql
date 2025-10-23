-- User table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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

-- Generation records table
CREATE TABLE IF NOT EXISTS generations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
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
  user_id INTEGER NOT NULL,
  phone TEXT,
  email TEXT,
  home_address TEXT,
  occupation TEXT,
  province_city TEXT,
  country_region TEXT,
  phone_code TEXT,
  gender TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Fund items table
CREATE TABLE IF NOT EXISTS fund_items (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  amount TEXT,
  currency TEXT,
  details TEXT,
  document_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Entry info table
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

-- Entry info ⇄ fund items mapping
CREATE TABLE IF NOT EXISTS entry_info_fund_items (
  entry_info_id TEXT NOT NULL,
  fund_item_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  linked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (entry_info_id, fund_item_id),
  FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE CASCADE,
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_duplicate ON generations(passport_id, destination_id, flight_number, arrival_date);
CREATE INDEX IF NOT EXISTS idx_passports_user ON passports(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_info_user ON personal_info(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_items_user ON fund_items(user_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_user ON entry_info(user_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_destination ON entry_info(user_id, destination_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_passport ON entry_info(passport_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_personal ON entry_info(personal_info_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_fund_items_entry ON entry_info_fund_items(entry_info_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_fund_items_fund ON entry_info_fund_items(fund_item_id);
