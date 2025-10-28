-- Migration: Add tdac_submission_logs table
-- Date: 2025-10-28
-- Purpose: Migrate TDAC submission logs from AsyncStorage to database

CREATE TABLE IF NOT EXISTS tdac_submission_logs (
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  submission_method TEXT NOT NULL,  -- 'api', 'webview', 'hybrid'
  arr_card_no TEXT,
  traveler_data TEXT,  -- JSON: complete traveler information
  field_mappings TEXT,  -- JSON: field mapping details
  validation_results TEXT,  -- JSON: validation results
  cloudflare_token_length INTEGER,  -- For debugging
  submission_timestamp DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_tdac_logs_user ON tdac_submission_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tdac_logs_method ON tdac_submission_logs(submission_method);
CREATE INDEX IF NOT EXISTS idx_tdac_logs_timestamp ON tdac_submission_logs(submission_timestamp);
CREATE INDEX IF NOT EXISTS idx_tdac_logs_created ON tdac_submission_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_tdac_logs_arr_card ON tdac_submission_logs(arr_card_no);

-- Auto-cleanup trigger: Delete logs older than 90 days
CREATE TRIGGER IF NOT EXISTS cleanup_old_tdac_logs
AFTER INSERT ON tdac_submission_logs
BEGIN
  DELETE FROM tdac_submission_logs
  WHERE submission_timestamp < datetime('now', '-90 days');
END;
