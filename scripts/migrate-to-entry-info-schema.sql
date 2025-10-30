-- Migration script: Create entry_info schema from existing travel_info data
-- This script:
-- 1. Creates the new entry_info table structure
-- 2. Migrates data from travel_info to entry_info
-- 3. Links related tables (passports, personal_info, travel_info, fund_items, DACs)

-- Create users table first (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Ensure user_001 exists
INSERT OR IGNORE INTO users (id) VALUES ('user_001');

-- Create passports table
CREATE TABLE IF NOT EXISTS passports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create personal_info table
CREATE TABLE IF NOT EXISTS personal_info (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create fund_items table
CREATE TABLE IF NOT EXISTS fund_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create entry_info table
CREATE TABLE IF NOT EXISTS entry_info (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  passport_id TEXT,
  personal_info_id TEXT,
  travel_info_id TEXT,
  destination_id TEXT,
  status TEXT DEFAULT 'incomplete',
  completion_metrics TEXT,
  documents TEXT,
  display_status TEXT,
  last_updated_at TEXT,
  created_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (passport_id) REFERENCES passports(id),
  FOREIGN KEY (personal_info_id) REFERENCES personal_info(id)
);

-- Create entry_info_fund_items mapping table
CREATE TABLE IF NOT EXISTS entry_info_fund_items (
  entry_info_id TEXT NOT NULL,
  fund_item_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  linked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (entry_info_id, fund_item_id),
  FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE CASCADE,
  FOREIGN KEY (fund_item_id) REFERENCES fund_items(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create digital_arrival_cards table
CREATE TABLE IF NOT EXISTS digital_arrival_cards (
  id TEXT PRIMARY KEY,
  entry_info_id TEXT NOT NULL,
  card_type TEXT NOT NULL,
  status TEXT NOT NULL,
  submission_data TEXT,
  response_data TEXT,
  error_data TEXT,
  submitted_at TEXT,
  created_at TEXT,
  FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE CASCADE
);

-- Migrate data from travel_info to entry_info
-- Use the travel_info id as the entry_info id for consistency
INSERT OR REPLACE INTO entry_info (
  id,
  user_id,
  passport_id,
  personal_info_id,
  travel_info_id,
  destination_id,
  status,
  completion_metrics,
  documents,
  display_status,
  last_updated_at,
  created_at
)
SELECT
  id,                                                    -- entry_info id = travel_info id
  'user_001',                                            -- user_id
  NULL,                                                  -- passport_id (will be set later)
  NULL,                                                  -- personal_info_id (will be set later)
  id,                                                    -- travel_info_id (link to travel_info)
  country,                                               -- destination_id
  CASE
    WHEN json_extract(data, '$.submissionStatus') = 'submitted' THEN 'submitted'
    ELSE 'incomplete'
  END,                                                   -- status
  NULL,                                                  -- completion_metrics (will be calculated)
  NULL,                                                  -- documents
  NULL,                                                  -- display_status
  datetime(updated_at / 1000, 'unixepoch'),             -- last_updated_at
  datetime(created_at / 1000, 'unixepoch')              -- created_at
FROM travel_info;

-- Show results
SELECT 'Migration Summary:' as message;
SELECT '==================' as message;
SELECT 'entry_info records: ' || COUNT(*) as message FROM entry_info;
SELECT 'travel_info records: ' || COUNT(*) as message FROM travel_info;
SELECT '' as message;
SELECT 'Entry Info Details:' as message;
SELECT '-------------------' as message;
SELECT id || ': destination=' || destination_id || ', status=' || status as message
FROM entry_info
ORDER BY created_at DESC;
