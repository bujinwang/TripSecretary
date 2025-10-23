#!/usr/bin/env node

/**
 * Truncate iOS Simulator Database
 *
 * This script truncates the actual iOS Simulator database file used by the React Native app.
 * The database is located in the iOS Simulator's app data directory.
 *
 * Usage: node scripts/truncate-ios-simulator-db.js
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// iOS Simulator database path (from user's feedback)
const SIMULATOR_DB_PATH = '/Users/bujin/Library/Developer/CoreSimulator/Devices/69A62B34-93E6-4C79-89E8-3674756671DA/data/Containers/Data/Application/D2C892B1-6872-4624-BA10-5AEABC8E69C2/Documents/ExponentExperienceData/@anonymous/chujingtong-949aa9fd-5f29-4180-8e63-54175ac2c5e3/SQLite/tripsecretary_secure';

const DB_NAME = 'tripsecretary_secure';

async function truncateIOSSimulatorDatabase() {
  console.log('🗑️  Starting iOS Simulator Database Truncation...');
  console.log('📁 Database path:', SIMULATOR_DB_PATH);

  // Check if database file exists
  if (!fs.existsSync(SIMULATOR_DB_PATH)) {
    console.error('❌ Database file not found at:', SIMULATOR_DB_PATH);
    console.log('ℹ️  This might mean:');
    console.log('   - The iOS Simulator is not running');
    console.log('   - The app has not been launched yet');
    console.log('   - The simulator device ID has changed');
    console.log('');
    console.log('💡 Try:');
    console.log('   1. Launch the iOS Simulator');
    console.log('   2. Run the React Native app');
    console.log('   3. Then run this script again');
    process.exit(1);
  }

  // Create backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${SIMULATOR_DB_PATH}.backup.${timestamp}`;

  console.log('📦 Creating backup...');
  try {
    fs.copyFileSync(SIMULATOR_DB_PATH, backupPath);
    console.log('✅ Backup created:', backupPath);
  } catch (error) {
    console.error('❌ Failed to create backup:', error.message);
    process.exit(1);
  }

  // Connect to database
  const db = new sqlite3.Database(SIMULATOR_DB_PATH);

  try {
    // Get database info before truncation
    console.log('\n📊 Database Info Before Truncation:');
    await getDatabaseInfo(db);

    // Tables to truncate (user data tables only)
    const tablesToTruncate = [
      'audit_log',
      'digital_arrival_cards',
      'entry_info',
      'entry_info_fund_items',
      'fund_items',
      'passport_countries',
      'passports',
      'personal_info',
      'travel_history',
      'travel_info',
      'users'
    ];

    console.log('\n🗑️  Truncating user data tables...');

    // Truncate all user data tables
    for (const tableName of tablesToTruncate) {
      try {
        // Get row count before truncation
        const countResult = await getRowCount(db, tableName);
        const rowCount = countResult.count;

        console.log(`📊 ${tableName}: ${rowCount} rows to truncate`);

        // Truncate the table
        await runQuery(db, `DELETE FROM ${tableName}`);

        // Verify truncation
        const verifyResult = await getRowCount(db, tableName);
        const remainingCount = verifyResult.count;

        if (remainingCount === 0) {
          console.log(`✅ ${tableName} truncated successfully (${rowCount} rows deleted)`);
        } else {
          console.error(`❌ Truncation verification failed for ${tableName}: ${remainingCount} rows remaining`);
        }
      } catch (error) {
        console.error(`❌ Failed to truncate ${tableName}:`, error.message);
      }
    }

    // Clear settings and migrations tables as well
    console.log('\n🧹 Clearing settings and migrations...');
    try {
      await runQuery(db, 'DELETE FROM settings');
      await runQuery(db, 'DELETE FROM migrations');
      console.log('✅ Settings and migrations tables cleared');
    } catch (error) {
      console.warn('⚠️  Failed to clear settings/migrations:', error.message);
    }

    // Get database info after truncation
    console.log('\n📊 Database Info After Truncation:');
    await getDatabaseInfo(db);

    // Vacuum database to reclaim space
    console.log('\n🗜️  Vacuuming database...');
    await runQuery(db, 'VACUUM');
    console.log('✅ Database vacuumed successfully');

    console.log('\n🎉 iOS Simulator Database Truncation Completed!');
    console.log('📦 Backup available at:', backupPath);
    console.log('🔄 Database is now ready for fresh Schema v2.0 data');

  } catch (error) {
    console.error('❌ Failed to truncate database:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Helper function to promisify database operations
function getRowCount(db, tableName) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function runQuery(db, query) {
  return new Promise((resolve, reject) => {
    db.run(query, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function getDatabaseInfo(db) {
  return new Promise((resolve, reject) => {
    const tables = [
      'users', 'passports', 'personal_info', 'travel_info',
      'entry_info', 'digital_arrival_cards', 'fund_items',
      'passport_countries', 'travel_history', 'audit_log',
      'settings', 'migrations'
    ];

    let completed = 0;
    const results = {};

    tables.forEach(tableName => {
      db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
        if (err) {
          results[tableName] = 'ERROR';
        } else {
          results[tableName] = row.count;
        }

        completed++;
        if (completed === tables.length) {
          console.log('   Tables:');
          Object.entries(results).forEach(([table, count]) => {
            console.log(`     ${table}: ${count} rows`);
          });

          // Get database size
          const stats = fs.statSync(SIMULATOR_DB_PATH);
          console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

          resolve(results);
        }
      });
    });
  });
}

// Run the truncation
truncateIOSSimulatorDatabase().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});