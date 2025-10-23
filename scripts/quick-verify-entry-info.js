/**
 * Quick Verification: Check if entry_info and entry_info_fund_items are populated
 *
 * Run this in the iOS Simulator to check the database
 * Usage: node scripts/quick-verify-entry-info.js <database_path>
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Get database path from command line argument
const dbPath = process.argv[2];

if (!dbPath) {
  console.log('❌ Please provide database path as argument\n');
  console.log('Usage: node scripts/quick-verify-entry-info.js <path_to_db>\n');
  console.log('To find your database path:');
  console.log('1. Check the app logs for "Opening database:" message');
  console.log('2. Or look in:');
  console.log('   ~/Library/Developer/CoreSimulator/Devices/<DEVICE_UUID>/data/Containers/Data/Application/<APP_UUID>/Documents/SQLite/');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Failed to open database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database\n');
});

// Query 1: Check entry_info records
console.log('📊 ENTRY_INFO TABLE');
console.log('===================\n');

db.all('SELECT * FROM entry_info', [], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err.message);
    return;
  }

  if (rows.length === 0) {
    console.log('⚠️  No records found in entry_info table\n');
  } else {
    console.log(`✅ Found ${rows.length} entry_info record(s):\n`);
    rows.forEach((row, i) => {
      console.log(`Record ${i + 1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  User ID: ${row.user_id}`);
      console.log(`  Passport ID: ${row.passport_id || 'NULL'}`);
      console.log(`  Personal Info ID: ${row.personal_info_id || 'NULL'}`);
      console.log(`  Travel Info ID: ${row.travel_info_id || 'NULL'}`);
      console.log(`  Destination: ${row.destination_id}`);
      console.log(`  Status: ${row.status}`);
      console.log(`  Last Updated: ${row.last_updated_at}`);
      console.log('');
    });
  }

  // Query 2: Check entry_info_fund_items links
  console.log('📊 ENTRY_INFO_FUND_ITEMS TABLE');
  console.log('==============================\n');

  db.all('SELECT * FROM entry_info_fund_items', [], (err, rows) => {
    if (err) {
      console.error('❌ Error:', err.message);
      db.close();
      return;
    }

    if (rows.length === 0) {
      console.log('⚠️  No records found in entry_info_fund_items table');
      console.log('💡 This means fund items are NOT being linked to entry_info\n');
    } else {
      console.log(`✅ Found ${rows.length} fund item link(s):\n`);
      rows.forEach((row, i) => {
        console.log(`Link ${i + 1}:`);
        console.log(`  Entry Info ID: ${row.entry_info_id}`);
        console.log(`  Fund Item ID: ${row.fund_item_id}`);
        console.log(`  User ID: ${row.user_id}`);
        console.log(`  Linked At: ${row.linked_at}`);
        console.log('');
      });
    }

    // Query 3: Join to show complete picture
    console.log('📊 COMPLETE PICTURE (with JOIN)');
    console.log('================================\n');

    const joinQuery = `
      SELECT
        ei.id as entry_info_id,
        ei.destination_id,
        ei.status,
        COUNT(eifi.fund_item_id) as fund_count,
        GROUP_CONCAT(fi.type || ':' || fi.amount || ' ' || fi.currency) as funds
      FROM entry_info ei
      LEFT JOIN entry_info_fund_items eifi ON ei.id = eifi.entry_info_id
      LEFT JOIN fund_items fi ON fi.id = eifi.fund_item_id
      GROUP BY ei.id
    `;

    db.all(joinQuery, [], (err, rows) => {
      if (err) {
        console.error('❌ Error:', err.message);
      } else if (rows.length === 0) {
        console.log('⚠️  No entry_info records found\n');
      } else {
        rows.forEach((row, i) => {
          console.log(`Entry Pack ${i + 1}:`);
          console.log(`  ID: ${row.entry_info_id}`);
          console.log(`  Destination: ${row.destination_id}`);
          console.log(`  Status: ${row.status}`);
          console.log(`  Fund Items: ${row.fund_count}`);
          console.log(`  Funds: ${row.funds || 'None'}`);
          console.log('');
        });
      }

      console.log('✅ Verification complete!\n');
      db.close();
    });
  });
});
