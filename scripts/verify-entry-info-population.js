/**
 * Verification Script: Check entry_info and entry_info_fund_items Population
 *
 * This script verifies that:
 * 1. entry_info records are being created
 * 2. entry_info_fund_items junction table is populated with fund item associations
 * 3. All foreign key relationships are correct
 *
 * Usage: node scripts/verify-entry-info-population.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path - adjust based on your setup
// For iOS Simulator:
const DB_PATH = path.join(
  process.env.HOME,
  'Library/Developer/CoreSimulator/Devices',
  // You'll need to find your device UUID
  // Run: xcrun simctl list devices | grep Booted
  // Then look for: <DEVICE_UUID>/data/Containers/Data/Application/<APP_UUID>/Documents/SQLite/tripsecretary_secure
  // For now, we'll just show the pattern
  'YOUR_DEVICE_UUID/data/Containers/Data/Application/YOUR_APP_UUID/Documents/SQLite/tripsecretary_secure'
);

// Alternative: Use the direct database path if you know it
// const DB_PATH = '/path/to/your/database/tripsecretary_secure';

console.log('🔍 Entry Info Population Verification Script');
console.log('=============================================\n');

console.log('📝 Instructions:');
console.log('1. Find your simulator device UUID:');
console.log('   xcrun simctl list devices | grep Booted\n');
console.log('2. Find your app UUID:');
console.log('   ls -la ~/Library/Developer/CoreSimulator/Devices/<DEVICE_UUID>/data/Containers/Data/Application/\n');
console.log('3. Update DB_PATH in this script\n');
console.log('4. Run the script: node scripts/verify-entry-info-population.js\n');

// Check if database exists
const fs = require('fs');
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Database not found at:', DB_PATH);
  console.error('\n💡 Update the DB_PATH variable with your actual database path');
  process.exit(1);
}

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Failed to open database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database:', DB_PATH, '\n');
});

// Verification queries
const queries = {
  entryInfoCount: 'SELECT COUNT(*) as count FROM entry_info',
  entryInfoList: `
    SELECT
      id,
      user_id,
      passport_id,
      personal_info_id,
      travel_info_id,
      destination_id,
      status,
      last_updated_at
    FROM entry_info
    ORDER BY last_updated_at DESC
  `,
  fundItemsCount: 'SELECT COUNT(*) as count FROM entry_info_fund_items',
  fundItemsList: `
    SELECT
      eifi.entry_info_id,
      eifi.fund_item_id,
      eifi.user_id,
      eifi.linked_at,
      fi.type as fund_type,
      fi.amount,
      fi.currency
    FROM entry_info_fund_items eifi
    LEFT JOIN fund_items fi ON fi.id = eifi.fund_item_id
    ORDER BY eifi.linked_at DESC
  `,
  entryInfoWithFunds: `
    SELECT
      ei.id as entry_info_id,
      ei.destination_id,
      ei.status,
      COUNT(eifi.fund_item_id) as fund_count,
      GROUP_CONCAT(fi.type) as fund_types
    FROM entry_info ei
    LEFT JOIN entry_info_fund_items eifi ON ei.id = eifi.entry_info_id
    LEFT JOIN fund_items fi ON fi.id = eifi.fund_item_id
    GROUP BY ei.id
    ORDER BY ei.last_updated_at DESC
  `,
  detailedEntryInfo: `
    SELECT
      ei.id,
      ei.user_id,
      ei.destination_id,
      ei.status,
      ei.last_updated_at,
      p.encrypted_full_name as passport_name,
      p.encrypted_nationality as nationality,
      pi.occupation,
      ti.travel_purpose,
      ti.arrival_flight_number,
      COUNT(DISTINCT eifi.fund_item_id) as fund_item_count
    FROM entry_info ei
    LEFT JOIN passports p ON p.id = ei.passport_id
    LEFT JOIN personal_info pi ON pi.id = ei.personal_info_id
    LEFT JOIN travel_info ti ON ti.id = ei.travel_info_id
    LEFT JOIN entry_info_fund_items eifi ON eifi.entry_info_id = ei.id
    GROUP BY ei.id
    ORDER BY ei.last_updated_at DESC
  `
};

// Run verification
async function verifyDatabase() {
  return new Promise((resolve, reject) => {
    console.log('📊 VERIFICATION RESULTS');
    console.log('======================\n');

    // 1. Check entry_info table
    db.get(queries.entryInfoCount, (err, row) => {
      if (err) {
        console.error('❌ Error querying entry_info count:', err.message);
        return reject(err);
      }

      console.log(`1️⃣  Entry Info Records: ${row.count}`);

      if (row.count === 0) {
        console.log('   ⚠️  No entry_info records found!');
        console.log('   💡 This means entry_info records are not being created\n');
      } else {
        console.log('   ✅ Entry info records exist\n');
      }

      // 2. List entry_info records
      if (row.count > 0) {
        db.all(queries.entryInfoList, (err, rows) => {
          if (err) {
            console.error('❌ Error listing entry_info:', err.message);
            return reject(err);
          }

          console.log('   Entry Info Details:');
          rows.forEach((row, index) => {
            console.log(`   ${index + 1}. ID: ${row.id}`);
            console.log(`      Destination: ${row.destination_id}`);
            console.log(`      Status: ${row.status}`);
            console.log(`      Passport ID: ${row.passport_id || 'NULL'}`);
            console.log(`      Personal Info ID: ${row.personal_info_id || 'NULL'}`);
            console.log(`      Travel Info ID: ${row.travel_info_id || 'NULL'}`);
            console.log(`      Updated: ${row.last_updated_at}`);
            console.log('');
          });
        });
      }

      // 3. Check entry_info_fund_items table
      db.get(queries.fundItemsCount, (err, row) => {
        if (err) {
          console.error('❌ Error querying fund items count:', err.message);
          return reject(err);
        }

        console.log(`2️⃣  Fund Item Links: ${row.count}`);

        if (row.count === 0) {
          console.log('   ⚠️  No fund item links found!');
          console.log('   💡 Fund items are not being linked to entry_info\n');
        } else {
          console.log('   ✅ Fund item links exist\n');
        }

        // 4. List fund item links
        if (row.count > 0) {
          db.all(queries.fundItemsList, (err, rows) => {
            if (err) {
              console.error('❌ Error listing fund item links:', err.message);
              return reject(err);
            }

            console.log('   Fund Item Link Details:');
            rows.forEach((row, index) => {
              console.log(`   ${index + 1}. Entry Info: ${row.entry_info_id}`);
              console.log(`      Fund Item: ${row.fund_item_id}`);
              console.log(`      Type: ${row.fund_type || 'N/A'}`);
              console.log(`      Amount: ${row.amount || 'N/A'} ${row.currency || ''}`);
              console.log(`      Linked: ${row.linked_at}`);
              console.log('');
            });
          });
        }

        // 5. Show entry_info with fund counts
        db.all(queries.entryInfoWithFunds, (err, rows) => {
          if (err) {
            console.error('❌ Error querying entry info with funds:', err.message);
            return reject(err);
          }

          console.log('\n3️⃣  Entry Info Summary (with Fund Counts):');
          if (rows.length === 0) {
            console.log('   No entry info records found\n');
          } else {
            rows.forEach((row, index) => {
              console.log(`   ${index + 1}. Entry ID: ${row.entry_info_id}`);
              console.log(`      Destination: ${row.destination_id}`);
              console.log(`      Status: ${row.status}`);
              console.log(`      Fund Items: ${row.fund_count}`);
              console.log(`      Fund Types: ${row.fund_types || 'None'}`);
              console.log('');
            });
          }

          // 6. Show detailed entry info with all relationships
          db.all(queries.detailedEntryInfo, (err, rows) => {
            if (err) {
              console.error('❌ Error querying detailed entry info:', err.message);
              return reject(err);
            }

            console.log('\n4️⃣  Detailed Entry Info (with Relationships):');
            if (rows.length === 0) {
              console.log('   No entry info records found\n');
            } else {
              rows.forEach((row, index) => {
                console.log(`   ${index + 1}. Entry ID: ${row.id}`);
                console.log(`      User: ${row.user_id}`);
                console.log(`      Destination: ${row.destination_id}`);
                console.log(`      Status: ${row.status}`);
                console.log(`      Passport Name: ${row.passport_name || 'N/A'}`);
                console.log(`      Nationality: ${row.nationality || 'N/A'}`);
                console.log(`      Occupation: ${row.occupation || 'N/A'}`);
                console.log(`      Travel Purpose: ${row.travel_purpose || 'N/A'}`);
                console.log(`      Flight: ${row.arrival_flight_number || 'N/A'}`);
                console.log(`      Fund Items: ${row.fund_item_count}`);
                console.log(`      Updated: ${row.last_updated_at}`);
                console.log('');
              });
            }

            console.log('\n✅ Verification Complete!');
            console.log('\n📋 Summary:');
            console.log('   - If entry_info count is 0: Entry info records are NOT being created');
            console.log('   - If fund item links count is 0: Fund items are NOT being linked');
            console.log('   - Check the logs above for details\n');

            db.close(() => {
              resolve();
            });
          });
        });
      });
    });
  });
}

verifyDatabase().catch((err) => {
  console.error('Verification failed:', err);
  db.close();
  process.exit(1);
});
