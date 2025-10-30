#!/usr/bin/env node
/**
 * Migration script: Create entry_info schema from existing travel_info data
 *
 * This script:
 * 1. Creates the new entry_info table structure
 * 2. Migrates data from travel_info to entry_info
 * 3. Links related tables (passports, personal_info, travel_info, fund_items, DACs)
 */

const { openDatabaseAsync } = require('expo-sqlite');
const path = require('path');

async function migrate() {
  console.log('🚀 Starting migration to entry_info schema...\n');

  try {
    // Open the database
    const dbPath = path.join(__dirname, '../app/data/tripsecretary_secure.db');
    console.log('Opening database:', dbPath);

    const db = await openDatabaseAsync('tripsecretary_secure');

    // Check current schema
    console.log('\n📊 Current tables:');
    const tables = await db.getAllAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    tables.forEach(t => console.log(`  - ${t.name}`));

    // Check if entry_info already exists
    const hasEntryInfo = tables.some(t => t.name === 'entry_info');
    if (hasEntryInfo) {
      console.log('\n✅ entry_info table already exists');

      // Show current data
      const count = await db.getFirstAsync('SELECT COUNT(*) as count FROM entry_info');
      console.log(`   Found ${count.count} entry_info records`);

      const entries = await db.getAllAsync('SELECT * FROM entry_info');
      entries.forEach(e => {
        console.log(`   - ${e.id}: destination=${e.destination_id}, status=${e.status}`);
      });

      return;
    }

    console.log('\n⚠️  entry_info table not found. Creating schema...');

    // Create users table first (if not exists)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure user_001 exists
    await db.runAsync(
      `INSERT OR IGNORE INTO users (id) VALUES (?)`,
      ['user_001']
    );

    // Create passports table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS passports (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create personal_info table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS personal_info (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create fund_items table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS fund_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create entry_info table
    await db.execAsync(`
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
      )
    `);

    // Create entry_info_fund_items mapping table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS entry_info_fund_items (
        entry_info_id TEXT NOT NULL,
        fund_item_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        linked_at TEXT DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (entry_info_id, fund_item_id),
        FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE CASCADE,
        FOREIGN KEY (fund_item_id) REFERENCES fund_items(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create digital_arrival_cards table
    await db.execAsync(`
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
      )
    `);

    console.log('✅ Schema created successfully');

    // Now migrate data from travel_info to entry_info
    console.log('\n📦 Migrating travel_info data to entry_info...');

    const travelInfoRecords = await db.getAllAsync('SELECT * FROM travel_info');
    console.log(`   Found ${travelInfoRecords.length} travel_info records`);

    for (const record of travelInfoRecords) {
      const data = JSON.parse(record.data);
      const destinationId = record.country;

      // Use the travel_info id as the entry_info id
      const entryInfoId = record.id;

      console.log(`   Migrating ${destinationId} (${entryInfoId})...`);

      // Insert entry_info record
      await db.runAsync(
        `INSERT OR REPLACE INTO entry_info (
          id, user_id, passport_id, personal_info_id, travel_info_id,
          destination_id, status, completion_metrics, documents,
          display_status, last_updated_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entryInfoId,
          'user_001',
          null, // passport_id - will be set when passport is created
          null, // personal_info_id - will be set when personal info is created
          record.id, // travel_info_id - link to the travel_info record
          destinationId,
          data.submissionStatus === 'submitted' ? 'submitted' : 'incomplete',
          null, // completion_metrics - will be calculated
          null, // documents
          null, // display_status
          new Date(record.updated_at).toISOString(),
          new Date(record.created_at).toISOString()
        ]
      );
    }

    console.log('✅ Data migration completed');

    // Show final state
    console.log('\n📊 Final state:');
    const finalCount = await db.getFirstAsync('SELECT COUNT(*) as count FROM entry_info');
    console.log(`   entry_info records: ${finalCount.count}`);

    const entries = await db.getAllAsync('SELECT * FROM entry_info ORDER BY created_at DESC');
    entries.forEach(e => {
      console.log(`   - ${e.id}: destination=${e.destination_id}, status=${e.status}`);
    });

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrate().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
