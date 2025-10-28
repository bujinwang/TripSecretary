-- Migration: Add entry_guide_progress table
-- Date: 2025-10-28
-- Purpose: Migrate entry guide progress from AsyncStorage to database

CREATE TABLE IF NOT EXISTS entry_guide_progress (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  country_code TEXT NOT NULL,  -- 'canada', 'vietnam', 'japan', 'thailand', 'usa', 'malaysia', 'singapore', 'korea'
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  completed_steps TEXT,  -- JSON array: ["step1", "step2"]
  answers TEXT,  -- JSON object: {"question1": "answer1", "question2": "answer2"}
  last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, country_code)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_entry_guide_user ON entry_guide_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_entry_guide_country ON entry_guide_progress(country_code);
CREATE INDEX IF NOT EXISTS idx_entry_guide_updated ON entry_guide_progress(last_updated_at);

-- Trigger to update last_updated_at
CREATE TRIGGER IF NOT EXISTS update_entry_guide_progress_timestamp
AFTER UPDATE ON entry_guide_progress
BEGIN
  UPDATE entry_guide_progress
  SET last_updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;
