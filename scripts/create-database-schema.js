#!/usr/bin/env node

/**
 * Database Schema Creation Script
 *
 * This script creates the database schema for Schema v2.0 without running the full React Native app.
 * It initializes the SecureStorageService to create all tables, triggers, and indexes.
 *
 * Usage: node scripts/create-database-schema.js
 */

const path = require('path');

// Add the app directory to the module path so we can import our services
require.main.paths.push(path.join(__dirname, '..'));

async function createDatabaseSchema() {
  try {
    console.log('🚀 Creating database schema for Schema v2.0...');

    // Import the SecureStorageService
    const SecureStorageService = require('../app/services/security/SecureStorageService').default;

    // Initialize the service (this will create the database schema)
    console.log('📱 Initializing SecureStorageService...');
    await SecureStorageService.initialize('system_user_for_schema_creation');

    console.log('\n📊 Database schema created successfully!');
    console.log('✅ All tables, triggers, and indexes for Schema v2.0 are now ready.');

    // Show database statistics
    console.log('\n📊 Database statistics:');
    const stats = await SecureStorageService.getIndexStats();
    console.log(`   Total indexes: ${stats.totalIndexes}`);
    console.log(`   Custom indexes: ${stats.customIndexes.length}`);

    // List all tables
    console.log('\n📋 Created tables:');
    const tables = await SecureStorageService.modernDb.getAllAsync(`SELECT name FROM sqlite_master WHERE type='table'`);
    tables.forEach(table => {
      console.log(`   - ${table.name}`);
    });

    // List all indexes
    console.log('\n📋 Created indexes:');
    const indexes = await SecureStorageService.modernDb.getAllAsync(`SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'`);
    indexes.forEach(index => {
      console.log(`   - ${index.name} (on ${index.tbl_name})`);
    });

    // List all triggers
    console.log('\n📋 Created triggers:');
    const triggers = await SecureStorageService.modernDb.getAllAsync(`SELECT name, tbl_name FROM sqlite_master WHERE type='trigger'`);
    triggers.forEach(trigger => {
      console.log(`   - ${trigger.name} (on ${trigger.tbl_name})`);
    });

    // Close the database connection
    await SecureStorageService.close();

    console.log('\n✨ Database schema creation completed successfully!');
    console.log('The database is now ready for Schema v2.0 operations.');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Database schema creation failed:', error);
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
createDatabaseSchema();