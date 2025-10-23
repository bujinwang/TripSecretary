#!/bin/bash

# TripSecretary Database Clear Script
# Clears all records from: passports, personal_info, travel_info, users, entry_info, fund_items
# Used for testing - deletes all data from the iPhone simulator database

# Find the most recently used simulator directory
SIMULATOR_DIR=$(ls -t ~/Library/Developer/CoreSimulator/Devices/ | head -n 1)
SIMULATOR_PATH=~/Library/Developer/CoreSimulator/Devices/$SIMULATOR_DIR

# Find the database file (tripsecretary_secure or tripsecretary_secure.db)
DB_PATH=$(find "$SIMULATOR_PATH" -name "tripsecretary_secure*" -type f | head -n 1)

# Check if the database file was found
if [ -z "$DB_PATH" ]; then
    echo "❌ Error: Could not find the 'tripsecretary_secure' database file."
    echo "Please make sure you have run the app in the iOS Simulator at least once."
    exit 1
fi

echo "📍 Found database at: $DB_PATH"
echo "🗑️  Clearing all test data..."

# Use sqlite3 to delete all records from specified tables
sqlite3 "$DB_PATH" <<EOF
-- Disable foreign key constraints temporarily to avoid constraint violations
PRAGMA foreign_keys = OFF;

-- Delete all records from the specified tables
DELETE FROM entry_info;
DELETE FROM fund_items;
DELETE FROM passports;
DELETE FROM personal_info;
DELETE FROM travel_info;
DELETE FROM users;

-- Re-enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Vacuum the database to reclaim space and optimize
VACUUM;

-- Verify tables are empty
SELECT 'users: ' || COUNT(*) FROM users;
SELECT 'passports: ' || COUNT(*) FROM passports;
SELECT 'personal_info: ' || COUNT(*) FROM personal_info;
SELECT 'travel_info: ' || COUNT(*) FROM travel_info;
SELECT 'entry_info: ' || COUNT(*) FROM entry_info;
SELECT 'fund_items: ' || COUNT(*) FROM fund_items;
EOF

echo "✅ All records deleted from the specified tables."
echo "🔄 Database vacuumed and optimized."
echo "📊 Verification complete - all tables should show 0 records above."