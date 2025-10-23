#!/usr/bin/env node

/**
 * Fix Gender Column Duplication
 * 
 * This script removes the duplicated gender column from the personal_info table
 * and migrates any existing gender data to the passports table where it belongs.
 * 
 * Issue: Gender is stored in both passports.gender and personal_info.gender
 * Solution: Keep only passports.gender as the single source of truth
 * 
 * Usage: node scripts/fix-gender-duplication.js
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

async function fixGenderDuplication() {
  try {
    console.log('🔧 Fixing gender column duplication...');

    // Find the database file
    const dbPath = path.join(__dirname, '..', 'data', 'tripsecretary_secure.db');

    if (!fs.existsSync(dbPath)) {
      console.log('❌ Database file not found:', dbPath);
      console.log('Please run the database creation script first.');
      process.exit(1);
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

    const dbAll = (query, params = []) => {
      return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    try {
      console.log('📋 Starting gender duplication fix...');

      // Start transaction
      await dbRun('BEGIN TRANSACTION');

      try {
        // Step 1: Check if gender column exists in personal_info table
        console.log('🔍 Checking for gender column in personal_info table...');
        const personalInfoColumns = await dbAll(`PRAGMA table_info(personal_info)`);
        const hasGenderColumn = personalInfoColumns.some(col => col.name === 'gender');

        if (!hasGenderColumn) {
          console.log('✅ No gender column found in personal_info table. Nothing to fix.');
          await dbRun('ROLLBACK');
          return;
        }

        console.log('⚠️  Gender column found in personal_info table. Proceeding with migration...');

        // Step 2: Migrate gender data from personal_info to passports where missing
        console.log('📊 Migrating gender data from personal_info to passports...');
        
        const migrationQuery = `
          UPDATE passports 
          SET gender = (
            SELECT pi.gender 
            FROM personal_info pi 
            WHERE pi.passport_id = passports.id 
            AND pi.gender IS NOT NULL 
            AND pi.gender != ''
            LIMIT 1
          )
          WHERE (passports.gender IS NULL OR passports.gender = '')
          AND EXISTS (
            SELECT 1 FROM personal_info pi 
            WHERE pi.passport_id = passports.id 
            AND pi.gender IS NOT NULL 
            AND pi.gender != ''
          )
        `;

        const migrationResult = await dbRun(migrationQuery);
        console.log(`✅ Migrated gender data for ${migrationResult.changes} passport records`);

        // Step 3: Create new personal_info table without gender column
        console.log('🔄 Creating new personal_info table without gender column...');
        
        await dbRun(`
          CREATE TABLE personal_info_new (
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

        // Step 4: Copy data from old table to new table (excluding gender)
        console.log('📋 Copying data to new table...');
        
        await dbRun(`
          INSERT INTO personal_info_new (
            id, user_id, passport_id, encrypted_phone_number, encrypted_email,
            encrypted_home_address, occupation, province_city, country_region,
            phone_code, is_default, label, created_at, updated_at
          )
          SELECT 
            id, user_id, passport_id, encrypted_phone_number, encrypted_email,
            encrypted_home_address, occupation, province_city, country_region,
            phone_code, is_default, label, created_at, updated_at
          FROM personal_info
        `);

        // Step 5: Drop old table and rename new table
        console.log('🔄 Replacing old table with new table...');
        
        await dbRun('DROP TABLE personal_info');
        await dbRun('ALTER TABLE personal_info_new RENAME TO personal_info');

        // Step 6: Recreate indexes for personal_info table
        console.log('📋 Recreating indexes...');
        
        await dbRun(`
          CREATE INDEX IF NOT EXISTS idx_personal_info_user ON personal_info(user_id);
          CREATE INDEX IF NOT EXISTS idx_personal_info_passport ON personal_info(passport_id);
          CREATE INDEX IF NOT EXISTS idx_personal_info_default ON personal_info(user_id, is_default);
          CREATE INDEX IF NOT EXISTS idx_personal_info_country ON personal_info(user_id, country_region);
        `);

        // Step 7: Recreate triggers for personal_info table
        console.log('📋 Recreating triggers...');
        
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

        // Commit the transaction
        await dbRun('COMMIT');

        console.log('✅ Gender duplication fix completed successfully!');

        // Step 8: Verify the fix
        console.log('🔍 Verifying the fix...');
        
        const personalInfoColumnsAfter = await dbAll(`PRAGMA table_info(personal_info)`);
        const stillHasGenderColumn = personalInfoColumnsAfter.some(col => col.name === 'gender');
        
        if (stillHasGenderColumn) {
          console.log('❌ ERROR: Gender column still exists in personal_info table');
        } else {
          console.log('✅ Gender column successfully removed from personal_info table');
        }

        // Show current schema
        console.log('\n📋 Current personal_info table schema:');
        personalInfoColumnsAfter.forEach(col => {
          console.log(`   - ${col.name} (${col.type})`);
        });

        // Count records
        const personalInfoCount = await dbAll('SELECT COUNT(*) as count FROM personal_info');
        const passportCount = await dbAll('SELECT COUNT(*) as count FROM passports');
        
        console.log(`\n📊 Database statistics:`);
        console.log(`   - Personal info records: ${personalInfoCount[0].count}`);
        console.log(`   - Passport records: ${passportCount[0].count}`);

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

    console.log('\n✨ Gender duplication fix completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update PersonalInfo model to remove gender field');
    console.log('2. Update application code to use passport.gender instead of personalInfo.gender');
    console.log('3. Test the application to ensure gender data is properly loaded from passports');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Gender duplication fix failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
fixGenderDuplication();