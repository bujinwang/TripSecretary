#!/usr/bin/env node
/**
 * Diagnose Travel Info SQLite Error
 *
 * This script:
 * 1. Opens the database
 * 2. Checks for duplicate travel_info records
 * 3. Identifies conflicting entry_info_id values
 * 4. Provides recommendations for fixing
 */

const SQLite = require('expo-sqlite');
const path = require('path');

async function diagnoseTravelInfoError() {
  console.log('=== Travel Info Error Diagnosis ===\n');

  try {
    // Open database
    const db = await SQLite.openDatabaseAsync('tripsecretary_secure');
    console.log('✅ Database opened successfully\n');

    // Check travel_info table structure
    console.log('1. Checking travel_info table structure:');
    const tableInfo = await db.getAllAsync("PRAGMA table_info(travel_info)");
    console.log('Columns:', tableInfo.map(col => `${col.name} (${col.type})`).join(', '));
    console.log();

    // Check for indexes and constraints
    console.log('2. Checking indexes:');
    const indexes = await db.getAllAsync("SELECT * FROM sqlite_master WHERE type='index' AND tbl_name='travel_info'");
    console.log('Indexes:', indexes.length);
    indexes.forEach(idx => console.log(`  - ${idx.name}: ${idx.sql}`));
    console.log();

    // Get all travel_info records
    console.log('3. Checking all travel_info records:');
    const allRecords = await db.getAllAsync('SELECT * FROM travel_info');
    console.log(`Total records: ${allRecords.length}\n`);

    if (allRecords.length > 0) {
      console.log('Records details:');
      allRecords.forEach((record, idx) => {
        console.log(`\n  Record ${idx + 1}:`);
        console.log(`    id: ${record.id}`);
        console.log(`    user_id: ${record.user_id}`);
        console.log(`    entry_info_id: ${record.entry_info_id || 'NULL'}`);
        console.log(`    destination: ${record.destination}`);
        console.log(`    created_at: ${record.created_at}`);
        console.log(`    updated_at: ${record.updated_at}`);
      });
      console.log();

      // Check for duplicates by user_id + destination
      console.log('4. Checking for duplicate (user_id, destination) combinations:');
      const duplicateCheck = await db.getAllAsync(`
        SELECT user_id, destination, COUNT(*) as count
        FROM travel_info
        GROUP BY user_id, destination
        HAVING COUNT(*) > 1
      `);

      if (duplicateCheck.length > 0) {
        console.log(`⚠️  Found ${duplicateCheck.length} duplicate(s):`);
        duplicateCheck.forEach(dup => {
          console.log(`  - user_id: ${dup.user_id}, destination: ${dup.destination}, count: ${dup.count}`);
        });
      } else {
        console.log('✅ No duplicates found by (user_id, destination)');
      }
      console.log();

      // Check for duplicate entry_info_id (excluding NULL)
      console.log('5. Checking for duplicate entry_info_id values:');
      const entryInfoIdDuplicates = await db.getAllAsync(`
        SELECT entry_info_id, COUNT(*) as count
        FROM travel_info
        WHERE entry_info_id IS NOT NULL
        GROUP BY entry_info_id
        HAVING COUNT(*) > 1
      `);

      if (entryInfoIdDuplicates.length > 0) {
        console.log(`❌ Found ${entryInfoIdDuplicates.length} duplicate entry_info_id(s) - THIS IS THE PROBLEM:`);
        entryInfoIdDuplicates.forEach(dup => {
          console.log(`  - entry_info_id: ${dup.entry_info_id}, count: ${dup.count}`);
        });
        console.log('\n  The UNIQUE constraint on entry_info_id is being violated!');
      } else {
        console.log('✅ No duplicate entry_info_id values found');
      }
      console.log();

      // Check entry_info records
      console.log('6. Checking related entry_info records:');
      const entryInfoRecords = await db.getAllAsync('SELECT * FROM entry_info');
      console.log(`Total entry_info records: ${entryInfoRecords.length}`);
      entryInfoRecords.forEach((record, idx) => {
        console.log(`\n  Entry Info ${idx + 1}:`);
        console.log(`    id: ${record.id}`);
        console.log(`    user_id: ${record.user_id}`);
        console.log(`    destination_id: ${record.destination_id}`);
        console.log(`    travel_info_id: ${record.travel_info_id || 'NULL'}`);
      });
    }

    console.log('\n=== Diagnosis Complete ===');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
}

// Run the diagnosis
diagnoseTravelInfoError().catch(console.error);
