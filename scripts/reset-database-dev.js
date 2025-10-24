/**
 * Database Reset Script for Development
 *
 * Purpose: Drop and recreate database with latest schema (v1.3.0)
 * Use this when you change the database schema during development
 *
 * ⚠️  WARNING: This will DELETE ALL DATA in the database!
 * ⚠️  Only use in development - NOT for production!
 *
 * Usage:
 *   node scripts/reset-database-dev.js
 *   node scripts/reset-database-dev.js --confirm  # Skip confirmation prompt
 */

import SecureStorageService from '../app/services/security/SecureStorageService.js';
import readline from 'readline';

const DEV_USER_ID = 'user_001'; // Default dev user

/**
 * Prompt user for confirmation
 */
async function confirmReset() {
  const args = process.argv.slice(2);
  if (args.includes('--confirm')) {
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(
      '\n⚠️  This will DELETE ALL DATA in the database!\n' +
      'Are you sure you want to continue? (yes/no): ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      }
    );
  });
}

/**
 * Reset database to latest schema
 */
async function resetDatabase() {
  console.log('\n🔧 Database Reset Script (Development Mode)\n');
  console.log('Target: tripsecretary_secure');
  console.log('Schema Version: 1.3.0 (v2.0)\n');

  // Confirm before proceeding
  const confirmed = await confirmReset();
  if (!confirmed) {
    console.log('\n❌ Reset cancelled by user');
    process.exit(0);
  }

  try {
    const service = new SecureStorageService();

    console.log('\n📂 Opening database...');
    await service.initialize(DEV_USER_ID);

    console.log('🗑️  Dropping all tables...');

    // Get list of all tables
    const tables = await service.modernDb.getAllAsync(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
    );

    console.log(`   Found ${tables.length} tables to drop`);

    // Drop all tables
    for (const {name} of tables) {
      await service.modernDb.execAsync(`DROP TABLE IF EXISTS ${name}`);
      console.log(`   ✓ Dropped: ${name}`);
    }

    // Drop all triggers
    const triggers = await service.modernDb.getAllAsync(
      `SELECT name FROM sqlite_master WHERE type='trigger'`
    );

    for (const {name} of triggers) {
      await service.modernDb.execAsync(`DROP TRIGGER IF EXISTS ${name}`);
      console.log(`   ✓ Dropped trigger: ${name}`);
    }

    // Drop all indexes (except auto-generated ones)
    const indexes = await service.modernDb.getAllAsync(
      `SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'`
    );

    for (const {name} of indexes) {
      await service.modernDb.execAsync(`DROP INDEX IF EXISTS ${name}`);
      console.log(`   ✓ Dropped index: ${name}`);
    }

    console.log('\n🏗️  Creating fresh schema (v1.3.0)...');

    // Create all tables with latest schema
    await service.createTables();

    // Ensure user record exists
    await service.ensureUser(DEV_USER_ID);

    // Vacuum to reclaim space
    console.log('\n🧹 Vacuuming database...');
    await service.modernDb.execAsync('VACUUM');

    // Get final database size
    const dbPath = service.modernDb._db._name;
    console.log(`\n✅ Database reset complete!`);
    console.log(`📊 Database: ${dbPath}`);
    console.log(`🎯 Schema Version: 1.3.0`);
    console.log(`👤 Default User: ${DEV_USER_ID}`);
    console.log('\n💡 Tip: You can now run your app with a fresh database.\n');

    await service.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Database reset failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the reset
resetDatabase();
