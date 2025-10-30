#!/usr/bin/env node
/**
 * Migrate iOS Simulator Database to New Schema
 *
 * This script:
 * 1. Backs up the old schema travel_info data
 * 2. Drops and recreates the travel_info table with new JSON-based schema
 * 3. Migrates existing data to the new format
 * 4. Creates sample snapshots for one of the migrated records
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// iOS Simulator database path
const DB_PATH = '/Users/bujin/Library/Developer/CoreSimulator/Devices/69A62B34-93E6-4C79-89E8-3674756671DA/data/Containers/Data/Application/D2C892B1-6872-4624-BA10-5AEABC8E69C2/Documents/ExponentExperienceData/@anonymous/chujingtong-949aa9fd-5f29-4180-8e63-54175ac2c5e3/SQLite/tripsecretary_secure';

const SNAPSHOTS_DIR = '/Users/bujin/Library/Developer/CoreSimulator/Devices/69A62B34-93E6-4C79-89E8-3674756671DA/data/Containers/Data/Application/D2C892B1-6872-4624-BA10-5AEABC8E69C2/Documents/ExponentExperienceData/@anonymous/chujingtong-949aa9fd-5f29-4180-8e63-54175ac2c5e3/snapshots';

// Helper to execute SQL
function executeSql(sql, silent = false) {
  try {
    const result = execSync(`sqlite3 "${DB_PATH}" "${sql.replace(/"/g, '\\"')}"`, {
      encoding: 'utf8'
    });
    return result;
  } catch (error) {
    if (!silent) {
      console.error('SQL Error:', error.message);
      throw error;
    }
    return ''; // Return empty string on error if silent
  }
}

// Helper to get all records as JSON
function getAllRecords(table) {
  try {
    const result = executeSql(`SELECT * FROM ${table}`);
    if (!result.trim()) return [];

    // Parse pipe-separated output
    const lines = result.trim().split('\n');
    const rows = lines.map(line => line.split('|'));
    return rows;
  } catch (error) {
    console.error(`Error reading ${table}:`, error.message);
    return [];
  }
}

console.log('=== Migrating Simulator Database Schema ===\n');

// Step 1: Get column names
console.log('Step 1: Reading current schema...');
const schemaInfo = executeSql('PRAGMA table_info(travel_info)');
const columns = schemaInfo.trim().split('\n').map(line => {
  const parts = line.split('|');
  return parts[1]; // column name
});
console.log(`Found ${columns.length} columns in old schema\n`);

// Step 2: Export existing data
console.log('Step 2: Exporting existing travel_info data...');
let oldRecords = [];
try {
  // Export to a temp file using sqlite3's .output command
  const tempFile = '/tmp/travel_info_export.json';
  execSync(`sqlite3 "${DB_PATH}" <<EOF
.mode json
.output ${tempFile}
SELECT * FROM travel_info;
.output stdout
EOF`, { encoding: 'utf8' });

  if (fs.existsSync(tempFile)) {
    const exportData = fs.readFileSync(tempFile, 'utf8');
    oldRecords = JSON.parse(exportData || '[]');
    fs.unlinkSync(tempFile); // Clean up
  }
} catch (e) {
  console.log('No existing records or error parsing:', e.message);
}
console.log(`Exported ${oldRecords.length} records\n`);

if (oldRecords.length > 0) {
  console.log('Sample of first record (old format):');
  console.log(JSON.stringify(oldRecords[0], null, 2));
  console.log();
}

// Step 3: Create backup table
console.log('Step 3: Creating backup...');
try {
  executeSql('DROP TABLE IF EXISTS travel_info_backup');
  executeSql('CREATE TABLE travel_info_backup AS SELECT * FROM travel_info');
  console.log('✅ Backup created\n');
} catch (error) {
  console.error('⚠️  Backup failed:', error.message);
}

// Step 4: Drop old tables and create new schema
console.log('Step 4: Recreating tables with new schema...');

// Drop and recreate travel_info
executeSql('DROP TABLE IF EXISTS travel_info');
executeSql(`
  CREATE TABLE travel_info (
    id TEXT PRIMARY KEY,
    country TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

// Drop and recreate snapshots (old schema is incompatible)
executeSql('DROP TABLE IF EXISTS snapshots_old');
executeSql('ALTER TABLE snapshots RENAME TO snapshots_old', true); // Backup old snapshots
executeSql(`
  CREATE TABLE snapshots (
    id TEXT PRIMARY KEY,
    travel_info_id TEXT NOT NULL,
    country TEXT NOT NULL,
    file_path TEXT NOT NULL,
    checksum TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (travel_info_id) REFERENCES travel_info(id) ON DELETE CASCADE
  )
`);

console.log('✅ New schema created\n');

// Step 5: Migrate data
console.log('Step 5: Migrating data to new format...');
let migratedCount = 0;

for (const oldRecord of oldRecords) {
  try {
    // Map old schema to new JSON structure
    const country = oldRecord.destination || 'thailand';

    const newData = {
      personalInfo: {
        // These would come from personal_info table in practice
        // For now, we'll leave them empty as they're in a separate table
      },
      travelDetails: {
        arrivalDate: oldRecord.arrival_arrival_date,
        arrivalFlight: oldRecord.arrival_flight_number,
        departureDate: oldRecord.departure_departure_date,
        departureFlight: oldRecord.departure_flight_number,
        purposeOfVisit: oldRecord.travel_purpose || 'HOLIDAY',
      },
      thailandSpecific: {
        accommodationType: oldRecord.accommodation_type || 'HOTEL',
        hotelName: oldRecord.hotel_name,
        hotelAddress: oldRecord.hotel_address,
        province: oldRecord.province,
        district: oldRecord.district,
        subDistrict: oldRecord.sub_district,
        postalCode: oldRecord.postal_code,
        accommodationPhone: oldRecord.accommodation_phone,
      },
      // Preserve other fields
      status: oldRecord.status || 'draft',
      entryInfoId: oldRecord.entry_info_id,
      userId: oldRecord.user_id,
    };

    const dataJson = JSON.stringify(newData).replace(/'/g, "''");
    const createdAt = oldRecord.created_at ? new Date(oldRecord.created_at).getTime() : Date.now();
    const updatedAt = oldRecord.updated_at ? new Date(oldRecord.updated_at).getTime() : Date.now();

    executeSql(`
      INSERT INTO travel_info (id, country, data, created_at, updated_at)
      VALUES ('${oldRecord.id}', '${country}', '${dataJson}', ${createdAt}, ${updatedAt})
    `);

    migratedCount++;
  } catch (error) {
    console.error(`Failed to migrate record ${oldRecord.id}:`, error.message);
  }
}

console.log(`✅ Migrated ${migratedCount} records\n`);

// Step 6: Create snapshots for the most recent record
console.log('Step 6: Creating sample snapshots...');

// Ensure snapshots directory exists
if (!fs.existsSync(SNAPSHOTS_DIR)) {
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  console.log('Created snapshots directory');
}

if (migratedCount > 0) {
  // Get the most recently updated record
  const tempFile = '/tmp/recent_record.json';
  execSync(`sqlite3 "${DB_PATH}" <<EOF
.mode json
.output ${tempFile}
SELECT * FROM travel_info ORDER BY updated_at DESC LIMIT 1;
.output stdout
EOF`, { encoding: 'utf8' });

  const recentRecord = fs.readFileSync(tempFile, 'utf8');
  const record = JSON.parse(recentRecord)[0];
  fs.unlinkSync(tempFile);

  console.log(`Creating snapshots for travel_info: ${record.id}`);

  const data = JSON.parse(record.data);
  const now = Date.now();

  // Create 2 snapshots
  for (let i = 0; i < 2; i++) {
    const snapshotId = crypto.randomUUID();
    const fileName = `${snapshotId}.json`;
    const filePath = path.join(SNAPSHOTS_DIR, fileName);

    // Write snapshot file
    const snapshotData = {
      id: snapshotId,
      travelInfoId: record.id,
      country: record.country,
      data: data,
      createdAt: now + i * 1000
    };

    fs.writeFileSync(filePath, JSON.stringify(snapshotData, null, 2));

    // Calculate checksum
    const fileContent = fs.readFileSync(filePath);
    const checksum = crypto.createHash('sha256').update(fileContent).digest('hex');

    // Insert snapshot record
    executeSql(`
      INSERT INTO snapshots (id, travel_info_id, country, file_path, checksum, created_at)
      VALUES ('${snapshotId}', '${record.id}', '${record.country}', '${fileName}', '${checksum}', ${now + i * 1000})
    `);

    console.log(`  ✅ Created snapshot ${i + 1}: ${snapshotId}`);
  }
}

// Verification
console.log('\n=== Verification ===');
const travelInfoCount = executeSql('SELECT COUNT(*) FROM travel_info').trim();
console.log(`Travel info records: ${travelInfoCount}`);

const snapshotsCount = executeSql('SELECT COUNT(*) FROM snapshots').trim();
console.log(`Snapshot records: ${snapshotsCount}`);

if (fs.existsSync(SNAPSHOTS_DIR)) {
  const snapshotFiles = fs.readdirSync(SNAPSHOTS_DIR).filter(f => f.endsWith('.json'));
  console.log(`Snapshot files: ${snapshotFiles.length}`);
}

console.log('\n✅ Migration complete!');
console.log('\nNote: The backup table "travel_info_backup" has been created.');
console.log('You can drop it later with: DROP TABLE travel_info_backup;');
