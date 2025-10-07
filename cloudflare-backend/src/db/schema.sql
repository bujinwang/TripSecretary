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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_duplicate ON generations(passport_id, destination_id, flight_number, arrival_date);
CREATE INDEX IF NOT EXISTS idx_passports_user ON passports(user_id);
