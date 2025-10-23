#!/usr/bin/env node

/**
 * Direct Database Truncation Script
 *
 * This script directly manipulates the SQLite database file to truncate all user data tables.
 * This approach works outside of the React Native environment and doesn't require expo-sqlite.
 *
 * Usage: node scripts/truncate-database-direct.js
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

async function truncateDatabaseDirect() {
  try {
    console.log('🚀 Starting direct database truncation...');
    console.log('This will delete ALL user data while preserving the database schema.\n');

    // Find the database file
    const possiblePaths = [
      path.join(__dirname, '..', 'data', 'tripsecretary_secure.db'),
      path.join(__dirname, '..', 'tripsecretary_secure.db'),
      path.join(process.cwd(), 'data', 'tripsecretary_secure.db'),
      path.join(process.cwd(), 'tripsecretary_secure.db')
    ];

    let dbPath = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        dbPath = testPath;
        break;
      }
    }

    if (!dbPath) {
      console.log('🔍 Searching for database file...');
      console.log('Checked paths:');
      possiblePaths.forEach(p => console.log(`  - ${p} ${fs.existsSync(p) ? '(found)' : '(not found)'}`));

      // Try to find any .db files in the project
      const findDbFiles = (dir) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            const found = findDbFiles(fullPath);
            if (found) return found;
          } else if (file.endsWith('.db')) {
            return fullPath;
          }
        }
        return null;
      };

      dbPath = findDbFiles(process.cwd());
      if (!dbPath) {
        console.log('\n❌ Could not find database file (.db) in the project directory.');
        console.log('Please ensure the React Native app has been run at least once to create the database.');
        process.exit(1);
      }
    }

    console.log(`📁 Found database at: ${dbPath}`);

    // Create backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${dbPath}.backup.${timestamp}`;
    console.log(`📦 Creating backup: ${backupPath}`);
    fs.copyFileSync(dbPath, backupPath);
    console.log('✅ Backup created successfully');

    // Connect to database
    console.log('🔌 Connecting to database...');
    const db = new sqlite3.Database(dbPath);

    // Wrap database operations in a promise
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
      // Get current database statistics
      console.log('\n📊 Current database statistics:');
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
        'users',
        'settings',
        'migrations'
      ];

      for (const tableName of tablesToTruncate) {
        try {
          const countResult = await dbGet(`SELECT COUNT(*) as count FROM ${tableName}`);
          const count = countResult ? countResult.count : 0;
          if (count > 0) {
            console.log(`   ${tableName}: ${count} rows`);
          }
        } catch (error) {
          // Table might not exist
          console.log(`   ${tableName}: table does not exist or error (${error.message})`);
        }
      }

      // Confirm before proceeding
      console.log('\n⚠️  WARNING: This will permanently delete all user data!');
      console.log('The following tables will be truncated:');
      tablesToTruncate.forEach(table => console.log(`   - ${table}`));
      console.log('\nThe database schema, triggers, and indexes will be preserved.');
      console.log('A backup has been created.\n');

      // For automated execution, skip confirmation
      const proceed = process.argv.includes('--yes') || process.argv.includes('-y');

      if (!proceed) {
        console.log('❌ Truncation cancelled. Use --yes flag to proceed without confirmation.');
        db.close();
        process.exit(1);
      }

      // Perform the truncation
      console.log('🗑️  Starting truncation...');
      const results = {
        truncated: [],
        errors: [],
        rowCounts: {}
      };

      for (const tableName of tablesToTruncate) {
        try {
          // Get row count before truncation
          const countResult = await dbGet(`SELECT COUNT(*) as count FROM ${tableName}`);
          const rowCount = countResult ? countResult.count : 0;
          results.rowCounts[tableName] = rowCount;

          console.log(`📊 ${tableName}: ${rowCount} rows to truncate`);

          // Truncate the table
          await dbRun(`DELETE FROM ${tableName}`);

          // Verify truncation
          const verifyResult = await dbGet(`SELECT COUNT(*) as count FROM ${tableName}`);
          const remainingCount = verifyResult ? verifyResult.count : 0;

          if (remainingCount === 0) {
            results.truncated.push(tableName);
            console.log(`✅ ${tableName} truncated successfully (${rowCount} rows deleted)`);
          } else {
            throw new Error(`Truncation verification failed for ${tableName}: ${remainingCount} rows remaining`);
          }

        } catch (error) {
          console.error(`❌ Failed to truncate ${tableName}:`, error.message);
          results.errors.push({ table: tableName, error: error.message });
        }
      }

      // Vacuum the database to reclaim space
      console.log('🧹 Vacuuming database to reclaim space...');
      await dbRun('VACUUM');
      console.log('✅ Database vacuumed successfully');

      console.log('\n✅ Truncation completed successfully!');
      console.log(`📊 Summary:`);
      console.log(`   Tables truncated: ${results.truncated.length}`);
      console.log(`   Errors: ${results.errors.length}`);

      if (results.errors.length > 0) {
        console.log('\n⚠️  Errors encountered:');
        results.errors.forEach(error => {
          console.log(`   - ${error.table}: ${error.error}`);
        });
      }

      // Show final database statistics
      console.log('\n📊 Final database statistics:');
      for (const tableName of tablesToTruncate) {
        try {
          const countResult = await dbGet(`SELECT COUNT(*) as count FROM ${tableName}`);
          const count = countResult ? countResult.count : 0;
          console.log(`   ${tableName}: ${count} rows ${count === 0 ? '(empty)' : '(ERROR!)'}`);
        } catch (error) {
          console.log(`   ${tableName}: Error checking (${error.message})`);
        }
      }

      // Get database file size
      const stats = fs.statSync(dbPath);
      console.log(`   Database file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      console.log('\n🎉 All tables successfully truncated!');
      console.log('The database is now ready for fresh Schema v2.0 data.');
      console.log(`📦 Backup saved as: ${backupPath}`);

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

    console.log('\n✨ Direct database truncation script completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Database truncation failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
truncateDatabaseDirect();