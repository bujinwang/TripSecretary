#!/usr/bin/env node

/**
 * Direct Database Schema Creation Script
 *
 * This script directly creates the Schema v2.0 database schema using raw SQL commands.
 * This approach works outside of the React Native environment and creates all tables,
 * triggers, and indexes needed for Schema v2.0.
 *
 * Usage: node scripts/create-schema-direct.js
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

async function createSchemaDirect() {
  try {
    console.log('🚀 Creating Schema v2.0 database schema directly...');

    // Find the database file
    const dbPath = path.join(__dirname, '..', 'data', 'tripsecretary_secure.db');

    // Create data directory if it doesn't exist
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`📁 Created data directory: ${dataDir}`);
    }

    console.log(`📁 Database path: ${dbPath}`);

    // Connect to database
    console.log('🔌 Connecting to database...');
    const db = new sqlite3.Database(dbPath);

    // Wrap database operations in promises
    const dbRun = (query, params = []) => {
      return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    };

    const dbGet = (query, params = []) => {
      return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    };

    const dbAll = (query, params = []) => {
      return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    try {
      console.log('📋 Creating Schema v2.0 tables...');

      // Execute all DDL statements in a single transaction for better performance
      await dbRun('BEGIN TRANSACTION');

      try {
        // ========================================
        // Core Tables
        // ========================================

        // Users table (local reference for foreign keys)
        await dbRun(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            external_id TEXT,
            display_name TEXT,
            created_at TEXT,
            updated_at TEXT
          )
        `);

        // Passports table (with is_primary field)
        await dbRun(`
          CREATE TABLE IF NOT EXISTS passports (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            encrypted_passport_number TEXT,
            encrypted_full_name TEXT,
            encrypted_date_of_birth TEXT,
            encrypted_nationality TEXT,
            gender TEXT,
            expiry_date TEXT,
            issue_date TEXT,
            issue_place TEXT,
            photo_uri TEXT,
            is_primary INTEGER DEFAULT 0,
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        // Passport-Countries mapping (NEW in v2.0)
        await dbRun(`
          CREATE TABLE IF NOT EXISTS passport_countries (
            passport_id TEXT NOT NULL,
            country_code TEXT NOT NULL,
            visa_required INTEGER DEFAULT 0,
            max_stay_days INTEGER,
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (passport_id, country_code),
            FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE CASCADE
          )
        `);

        // Personal information table (with passport_id, is_default, label)
        await dbRun(`
          CREATE TABLE IF NOT EXISTS personal_info (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            passport_id TEXT,
            encrypted_phone_number TEXT,
            encrypted_email TEXT,
            encrypted_home_address TEXT,
            occupation TEXT,
            province_city TEXT,
            country_region TEXT,
            phone_code TEXT,
            is_default INTEGER DEFAULT 0,
            label TEXT,
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE SET NULL
          )
        `);

        // Travel info table (trip-specific draft data)
        await dbRun(`
          CREATE TABLE IF NOT EXISTS travel_info (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            destination TEXT,
            travel_purpose TEXT DEFAULT 'HOLIDAY',
            recent_stay_country TEXT,
            boarding_country TEXT,
            visa_number TEXT,
            arrival_flight_number TEXT,
            arrival_departure_airport TEXT,
            arrival_departure_date TEXT,
            arrival_departure_time TEXT,
            arrival_arrival_airport TEXT,
            arrival_arrival_date TEXT,
            arrival_arrival_time TEXT,
            departure_flight_number TEXT,
            departure_departure_airport TEXT,
            departure_departure_date TEXT,
            departure_departure_time TEXT,
            departure_arrival_airport TEXT,
            departure_arrival_date TEXT,
            departure_arrival_time TEXT,
            accommodation_type TEXT DEFAULT 'HOTEL',
            province TEXT,
            district TEXT,
            sub_district TEXT,
            postal_code TEXT,
            hotel_name TEXT,
            hotel_address TEXT,
            accommodation_phone TEXT,
            length_of_stay TEXT,
            is_transit_passenger INTEGER DEFAULT 0,
            status TEXT DEFAULT 'draft',
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        // Fund items table
        await dbRun(`
          CREATE TABLE IF NOT EXISTS fund_items (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,
            amount TEXT,
            currency TEXT,
            details TEXT,
            photo_uri TEXT,
            created_at TEXT,
            updated_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        // ========================================
        // Entry Management Tables
        // ========================================

        // Entry info table (with travel_info_id, documents, display_status)
        await dbRun(`
          CREATE TABLE IF NOT EXISTS entry_info (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            passport_id TEXT NOT NULL,
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
            FOREIGN KEY (personal_info_id) REFERENCES personal_info(id),
            FOREIGN KEY (travel_info_id) REFERENCES travel_info(id)
          )
        `);

        // Entry info to fund items mapping table
        await dbRun(`
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

        // Digital Arrival Cards table (generic - replaces tdac_submissions)
        await dbRun(`
          CREATE TABLE IF NOT EXISTS digital_arrival_cards (
            id TEXT PRIMARY KEY,
            entry_info_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            card_type TEXT NOT NULL,
            destination_id TEXT,
            arr_card_no TEXT,
            qr_uri TEXT,
            pdf_url TEXT,
            submitted_at TEXT NOT NULL,
            submission_method TEXT DEFAULT 'api',
            status TEXT DEFAULT 'success',
            api_response TEXT,
            processing_time INTEGER,
            retry_count INTEGER DEFAULT 0,
            error_details TEXT,
            is_superseded INTEGER DEFAULT 0,
            superseded_at TEXT,
            superseded_by TEXT,
            superseded_reason TEXT,
            version INTEGER DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // ========================================
        // Legacy/Utility Tables
        // ========================================

        // Travel history table (non-sensitive data)
        await dbRun(`
          CREATE TABLE IF NOT EXISTS travel_history (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            destination_id TEXT,
            destination_name TEXT,
            travel_date TEXT,
            return_date TEXT,
            purpose TEXT,
            created_at TEXT
          )
        `);

        // Audit log table
        await dbRun(`
          CREATE TABLE IF NOT EXISTS audit_log (
            id TEXT PRIMARY KEY,
            action TEXT,
            table_name TEXT,
            record_id TEXT,
            timestamp TEXT,
            details TEXT
          )
        `);

        // Settings table (non-sensitive)
        await dbRun(`
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at TEXT
          )
        `);

        // Migrations tracking table
        await dbRun(`
          CREATE TABLE IF NOT EXISTS migrations (
            user_id TEXT PRIMARY KEY,
            migrated_at TEXT,
            source TEXT
          )
        `);

        console.log('✅ All tables created successfully');

        // ========================================
        // Database Triggers
        // ========================================

        console.log('📋 Creating database triggers...');

        // Trigger: Ensure only one primary passport per user (UPDATE)
        await dbRun(`
          CREATE TRIGGER IF NOT EXISTS ensure_one_primary_passport
          BEFORE UPDATE OF is_primary ON passports
          WHEN NEW.is_primary = 1
          BEGIN
            UPDATE passports
            SET is_primary = 0
            WHERE user_id = NEW.user_id AND id != NEW.id;
          END;
        `);

        // Trigger: Ensure only one primary passport per user (INSERT)
        await dbRun(`
          CREATE TRIGGER IF NOT EXISTS ensure_one_primary_passport_insert
          BEFORE INSERT ON passports
          WHEN NEW.is_primary = 1
          BEGIN
            UPDATE passports
            SET is_primary = 0
            WHERE user_id = NEW.user_id;
          END;
        `);

        // Trigger: Ensure only one default personal_info per user (UPDATE)
        await dbRun(`
          CREATE TRIGGER IF NOT EXISTS ensure_one_default_personal_info
          BEFORE UPDATE OF is_default ON personal_info
          WHEN NEW.is_default = 1
          BEGIN
            UPDATE personal_info
            SET is_default = 0
            WHERE user_id = NEW.user_id AND id != NEW.id;
          END;
        `);

        // Trigger: Ensure only one default personal_info per user (INSERT)
        await dbRun(`
          CREATE TRIGGER IF NOT EXISTS ensure_one_default_personal_info_insert
          BEFORE INSERT ON personal_info
          WHEN NEW.is_default = 1
          BEGIN
            UPDATE personal_info
            SET is_default = 0
            WHERE user_id = NEW.user_id;
          END;
        `);

        // Trigger: Mark previous DAC submissions as superseded
        await dbRun(`
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
        `);

        console.log('✅ All triggers created successfully');

        // ========================================
        // Indexes
        // ========================================

        console.log('📋 Creating database indexes...');

        await dbRun(`
          CREATE INDEX IF NOT EXISTS idx_passports_user ON passports(user_id);
          CREATE INDEX IF NOT EXISTS idx_passports_primary ON passports(user_id, is_primary);
          CREATE INDEX IF NOT EXISTS idx_passports_nationality ON passports(encrypted_nationality);

          CREATE INDEX IF NOT EXISTS idx_passport_countries_passport ON passport_countries(passport_id);
          CREATE INDEX IF NOT EXISTS idx_passport_countries_country ON passport_countries(country_code);

          CREATE INDEX IF NOT EXISTS idx_personal_info_user ON personal_info(user_id);
          CREATE INDEX IF NOT EXISTS idx_personal_info_passport ON personal_info(passport_id);
          CREATE INDEX IF NOT EXISTS idx_personal_info_default ON personal_info(user_id, is_default);
          CREATE INDEX IF NOT EXISTS idx_personal_info_country ON personal_info(user_id, country_region);

          CREATE INDEX IF NOT EXISTS idx_travel_info_user ON travel_info(user_id);
          CREATE INDEX IF NOT EXISTS idx_travel_info_destination ON travel_info(user_id, destination);

          CREATE INDEX IF NOT EXISTS idx_fund_items_user ON fund_items(user_id);
          CREATE INDEX IF NOT EXISTS idx_fund_items_type ON fund_items(user_id, type);

          CREATE INDEX IF NOT EXISTS idx_entry_info_user ON entry_info(user_id);
          CREATE INDEX IF NOT EXISTS idx_entry_info_passport ON entry_info(passport_id);
          CREATE INDEX IF NOT EXISTS idx_entry_info_personal ON entry_info(personal_info_id);
          CREATE INDEX IF NOT EXISTS idx_entry_info_travel ON entry_info(travel_info_id);
          CREATE INDEX IF NOT EXISTS idx_entry_info_destination ON entry_info(user_id, destination_id);
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
        `);

        console.log('✅ All indexes created successfully');

        // Commit the transaction
        await dbRun('COMMIT');

        console.log('\n📊 Schema v2.0 created successfully!');

        // Show database statistics
        console.log('\n📊 Database statistics:');
        const stats = fs.statSync(dbPath);
        console.log(`   Database file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

        // List all tables
        console.log('\n📋 Created tables:');
        const tables = await dbAll(`SELECT name FROM sqlite_master WHERE type='table'`);
        tables.forEach(table => {
          console.log(`   - ${table.name}`);
        });

        // List all indexes
        console.log('\n📋 Created indexes:');
        const indexes = await dbAll(`SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'`);
        indexes.forEach(index => {
          console.log(`   - ${index.name} (on ${index.tbl_name})`);
        });

        // List all triggers
        console.log('\n📋 Created triggers:');
        const triggers = await dbAll(`SELECT name, tbl_name FROM sqlite_master WHERE type='trigger'`);
        triggers.forEach(trigger => {
          console.log(`   - ${trigger.name} (on ${trigger.tbl_name})`);
        });

        // Set database version
        await dbRun(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
          ['db_version', '1.3.0', new Date().toISOString()]);

        console.log('\n✅ Database version set to 1.3.0 (Schema v2.0)');

      } catch (error) {
        await dbRun('ROLLBACK');
        throw error;
      }

    } finally {
      // Close database connection
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('🔌 Database connection closed');
        }
      });
    }

    console.log('\n✨ Schema v2.0 database creation completed successfully!');
    console.log('The database is now ready for fresh Schema v2.0 operations.');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Database schema creation failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
createSchemaDirect();