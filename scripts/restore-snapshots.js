/**
 * Script to restore snapshot records and files for testing
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Paths
const DB_PATH = path.join(__dirname, '../app/data/tripsecretary_secure.db');
const SNAPSHOTS_DIR = path.join(__dirname, '../app/data/snapshots');

// Helper to execute SQLite commands
function executeSql(sql) {
  try {
    return execSync(`sqlite3 "${DB_PATH}" "${sql.replace(/"/g, '\\"')}"`, {
      encoding: 'utf8'
    });
  } catch (error) {
    console.error('SQL Error:', error.message);
    throw error;
  }
}

// Ensure snapshots directory exists
if (!fs.existsSync(SNAPSHOTS_DIR)) {
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

// Create schema
console.log('Creating database schema...');

// Create travel_info table
executeSql(`
  CREATE TABLE IF NOT EXISTS travel_info (
    id TEXT PRIMARY KEY,
    country TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

// Create snapshots table
executeSql(`
  CREATE TABLE IF NOT EXISTS snapshots (
    id TEXT PRIMARY KEY,
    travel_info_id TEXT NOT NULL,
    country TEXT NOT NULL,
    file_path TEXT NOT NULL,
    checksum TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (travel_info_id) REFERENCES travel_info(id) ON DELETE CASCADE
  )
`);

console.log('Schema created successfully!');

// Sample Thailand travel info data
const sampleThailandData = {
  personalInfo: {
    email: 'test@example.com',
    passportNumber: 'AB1234567',
    nationality: 'US',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    gender: 'M'
  },
  travelDetails: {
    arrivalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    arrivalFlight: 'TG123',
    departureDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
    accommodationAddress: '123 Bangkok Street, Bangkok, Thailand',
    purposeOfVisit: 'Tourism'
  },
  thailandSpecific: {
    accommodationType: 'Hotel',
    hotelName: 'Test Hotel Bangkok'
  }
};

// Create travel info records
console.log('\nCreating sample travel info records...');

const travelInfoId1 = crypto.randomUUID();
const now = Date.now();

const dataJson = JSON.stringify(sampleThailandData).replace(/'/g, "''");
executeSql(`
  INSERT INTO travel_info (id, country, data, created_at, updated_at)
  VALUES ('${travelInfoId1}', 'thailand', '${dataJson}', ${now}, ${now})
`);

console.log(`Created travel info record: ${travelInfoId1}`);

// Create snapshots
console.log('\nCreating snapshot records and files...');

const createSnapshot = (travelInfoId, country, data, index) => {
  const snapshotId = crypto.randomUUID();
  const fileName = `${snapshotId}.json`;
  const filePath = path.join(SNAPSHOTS_DIR, fileName);

  // Write snapshot file
  const snapshotData = {
    id: snapshotId,
    travelInfoId,
    country,
    data,
    createdAt: now + index * 1000 // Slight time difference for multiple snapshots
  };

  fs.writeFileSync(filePath, JSON.stringify(snapshotData, null, 2));

  // Calculate checksum
  const fileContent = fs.readFileSync(filePath);
  const checksum = crypto.createHash('sha256').update(fileContent).digest('hex');

  // Insert snapshot record
  executeSql(`
    INSERT INTO snapshots (id, travel_info_id, country, file_path, checksum, created_at)
    VALUES ('${snapshotId}', '${travelInfoId}', '${country}', '${fileName}', '${checksum}', ${now + index * 1000})
  `);

  console.log(`Created snapshot: ${snapshotId} -> ${fileName}`);
  return snapshotId;
};

// Create 2 snapshots for the Thailand travel info
createSnapshot(travelInfoId1, 'thailand', sampleThailandData, 0);

// Create a second snapshot with slightly modified data
const modifiedData = {
  ...sampleThailandData,
  travelDetails: {
    ...sampleThailandData.travelDetails,
    arrivalFlight: 'TG456' // Different flight
  }
};
createSnapshot(travelInfoId1, 'thailand', modifiedData, 1);

// Verify
console.log('\n=== Verification ===');
const travelInfoCount = executeSql('SELECT COUNT(*) as count FROM travel_info').trim();
console.log(`Travel info records: ${travelInfoCount}`);

const snapshotsCount = executeSql('SELECT COUNT(*) as count FROM snapshots').trim();
console.log(`Snapshot records: ${snapshotsCount}`);

const snapshotFiles = fs.readdirSync(SNAPSHOTS_DIR).filter(f => f.endsWith('.json'));
console.log(`Snapshot files: ${snapshotFiles.length}`);

console.log('\n=== Snapshot Details ===');
const snapshots = executeSql('SELECT id, travel_info_id, country, file_path, created_at FROM snapshots ORDER BY created_at');
console.log(snapshots);

console.log('\n✅ Restoration complete!');
