#!/usr/bin/env node

/**
 * Database Truncation Script
 *
 * This script truncates all user data tables while preserving the database schema.
 * Use this to start fresh with Schema v2.0 without losing table structure, triggers, and indexes.
 *
 * Usage: node scripts/truncate-database.js
 */

const path = require('path');

// Add the app directory to the module path so we can import our services
require.main.paths.push(path.join(__dirname, '..'));

async function truncateDatabase() {
  try {
    console.log('🚀 Starting database truncation...');
    console.log('This will delete ALL user data while preserving the database schema.\n');

    // Import the SecureStorageService
    const SecureStorageService = require('../app/services/security/SecureStorageService').default;

    // Initialize the service (this will create the database if it doesn't exist)
    console.log('📱 Initializing SecureStorageService...');
    await SecureStorageService.initialize('system_user_for_truncation');

    // Show current database stats before truncation
    console.log('\n📊 Current database statistics:');
    const stats = await SecureStorageService.getIndexStats();
    console.log(`   Total indexes: ${stats.totalIndexes}`);
    console.log(`   Custom indexes: ${stats.customIndexes.length}`);

    Object.entries(stats.tableStats).forEach(([table, info]) => {
      if (info.rowCount > 0) {
        console.log(`   ${table}: ${info.rowCount} rows`);
      }
    });

    // Confirm before proceeding
    console.log('\n⚠️  WARNING: This will permanently delete all user data!');
    console.log('The following tables will be truncated:');
    console.log('   - audit_log');
    console.log('   - digital_arrival_cards');
    console.log('   - entry_info');
    console.log('   - entry_info_fund_items');
    console.log('   - fund_items');
    console.log('   - passport_countries');
    console.log('   - passports');
    console.log('   - personal_info');
    console.log('   - travel_history');
    console.log('   - travel_info');
    console.log('   - users');
    console.log('   - settings');
    console.log('   - migrations');

    console.log('\nThe database schema, triggers, and indexes will be preserved.');
    console.log('A backup will be created before truncation.\n');

    // For automated execution, skip confirmation
    const proceed = process.argv.includes('--yes') || process.argv.includes('-y');

    if (!proceed) {
      console.log('❌ Truncation cancelled. Use --yes flag to proceed without confirmation.');
      process.exit(1);
    }

    // Perform the truncation
    console.log('🗑️  Starting truncation...');
    const results = await SecureStorageService.truncateAllUserData(true);

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

    // Show final database stats
    console.log('\n📊 Final database statistics:');
    const finalStats = await SecureStorageService.getIndexStats();
    console.log(`   Total indexes: ${finalStats.totalIndexes}`);
    console.log(`   Custom indexes: ${finalStats.customIndexes.length}`);

    Object.entries(finalStats.tableStats).forEach(([table, info]) => {
      if (info.rowCount > 0) {
        console.log(`   ${table}: ${info.rowCount} rows`);
      }
    });

    // Verify all tables are empty
    const tablesToCheck = [
      'audit_log', 'digital_arrival_cards', 'entry_info', 'entry_info_fund_items',
      'fund_items', 'passport_countries', 'passports', 'personal_info',
      'travel_history', 'travel_info', 'users', 'settings', 'migrations'
    ];

    console.log('\n🔍 Verifying truncation...');
    let allEmpty = true;

    for (const tableName of tablesToCheck) {
      try {
        const countResult = await SecureStorageService.modernDb.getFirstAsync(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = countResult ? countResult.count : 0;

        if (count === 0) {
          console.log(`   ✅ ${tableName}: ${count} rows (empty)`);
        } else {
          console.log(`   ⚠️  ${tableName}: ${count} rows (not empty!)`);
          allEmpty = false;
        }
      } catch (error) {
        console.log(`   ❌ ${tableName}: Error checking (${error.message})`);
      }
    }

    if (allEmpty) {
      console.log('\n🎉 All tables successfully truncated!');
      console.log('The database is now ready for fresh Schema v2.0 data.');
    } else {
      console.log('\n⚠️  Some tables may still contain data. Please check the output above.');
    }

    // Close the database connection
    await SecureStorageService.close();

    console.log('\n✨ Database truncation script completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Database truncation failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);

    // Try to close the database connection even on error
    try {
      const SecureStorageService = require('../app/services/security/SecureStorageService').default;
      await SecureStorageService.close();
    } catch (closeError) {
      console.error('Failed to close database connection:', closeError.message);
    }

    process.exit(1);
  }
}

// Run the script
truncateDatabase();