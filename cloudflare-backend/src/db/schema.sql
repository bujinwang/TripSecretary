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
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  passport_no TEXT NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  gender TEXT,
  birth_date TEXT,
  nationality TEXT,
  issue_date TEXT,
  expiry_date TEXT,
  issue_place TEXT,
  ocr_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Generation records table
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
  passport_id INTEGER,
  personal_info_id TEXT,
  destination_id TEXT,
  trip_id TEXT,
  status TEXT DEFAULT 'incomplete',
  completion_metrics TEXT,
  last_updated_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  arrival_date TEXT,
  departure_date TEXT,
  travel_purpose TEXT,
  flight_number TEXT,
  accommodation TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (passport_id) REFERENCES passports(id),
  FOREIGN KEY (personal_info_id) REFERENCES personal_info(id)
);

-- Entry packs table
CREATE TABLE IF NOT EXISTS entry_packs (
  id TEXT PRIMARY KEY,
  entry_info_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  destination_id TEXT,
  trip_id TEXT,
  status TEXT DEFAULT 'in_progress',
  tdac_submission TEXT,
  submission_history TEXT,
  documents TEXT,
  display_status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  archived_at DATETIME,
  FOREIGN KEY (entry_info_id) REFERENCES entry_info(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Entry info ⇄ fund items mapping
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

-- TDAC submissions table
CREATE TABLE IF NOT EXISTS tdac_submissions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  entry_pack_id TEXT,
  destination_id TEXT,
  trip_id TEXT,
  arr_card_no TEXT NOT NULL,
  qr_uri TEXT,
  pdf_url TEXT,
  submitted_at DATETIME NOT NULL,
  submission_method TEXT DEFAULT 'api',
  status TEXT DEFAULT 'success',
  api_response TEXT,
  processing_time INTEGER,
  retry_count INTEGER DEFAULT 0,
  error_details TEXT,
  is_superseded INTEGER DEFAULT 0,
  superseded_at DATETIME,
  superseded_reason TEXT,
  superseded_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (entry_pack_id) REFERENCES entry_packs(id)
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
CREATE INDEX IF NOT EXISTS idx_entry_packs_user ON entry_packs(user_id);
CREATE INDEX IF NOT EXISTS idx_entry_packs_entry_info ON entry_packs(entry_info_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_fund_items_entry ON entry_info_fund_items(entry_info_id);
CREATE INDEX IF NOT EXISTS idx_entry_info_fund_items_fund ON entry_info_fund_items(fund_item_id);
CREATE INDEX IF NOT EXISTS idx_tdac_submissions_user ON tdac_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_tdac_submissions_entry_pack ON tdac_submissions(entry_pack_id);
CREATE INDEX IF NOT EXISTS idx_tdac_submissions_status ON tdac_submissions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tdac_submissions_arr_card ON tdac_submissions(arr_card_no);
