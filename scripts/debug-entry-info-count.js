/**
 * Debug script to check entry_info records in the database
 * Run with: node scripts/debug-entry-info-count.js
 */

const path = require('path');
const SQLite = require('react-native-sqlite-storage').default;

// Database path for iOS simulator
const DB_PATH = path.join(
  process.env.HOME || process.env.USERPROFILE,
  'Library',
  'Developer',
  'CoreSimulator',
  'Devices'
);

async function findSimulatorDB() {
  const fs = require('fs');
  const { execSync } = require('child_process');
  
  try {
    // Try to find the most recent simulator device
    const devicesPath = DB_PATH;
    if (!fs.existsSync(devicesPath)) {
      console.error('Simulator devices path not found:', devicesPath);
      return null;
    }
    
    // List all device directories
    const devices = fs.readdirSync(devicesPath);
    console.log('Found simulator devices:', devices.length);
    
    // For each device, check for the app's database
    for (const device of devices) {
      const devicePath = path.join(devicesPath, device, 'data', 'Containers', 'Data', 'Application');
      if (fs.existsSync(devicePath)) {
        const apps = fs.readdirSync(devicePath);
        for (const app of apps) {
          const dbPath = path.join(devicePath, app, 'Library', 'LocalDatabase', 'tripsecretary_secure.db');
          if (fs.existsSync(dbPath)) {
            console.log('Found database at:', dbPath);
            return dbPath;
          }
        }
      }
    }
    
    console.error('Database not found in simulator');
    return null;
  } catch (error) {
    console.error('Error finding database:', error);
    return null;
  }
}

async function checkEntryInfoRecords() {
  try {
    // Try to find the database
    const dbPath = await findSimulatorDB();
    
    if (!dbPath) {
      console.log('\n⚠️  Could not find simulator database automatically.');
      console.log('Please provide the database path manually or check the console logs from the app.');
      console.log('\nTo find the database path:');
      console.log('1. Check the console logs when the app starts');
      console.log('2. Look for: "[SecureStorageService] Database path: ..."');
      return;
    }
    
    console.log('\n📊 Checking entry_info records...\n');
    
    // Open database
    const db = SQLite.openDatabase({
      name: 'tripsecretary_secure.db',
      location: 'default',
      createFromLocation: dbPath
    });
    
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        // Count all records
        tx.executeSql(
          'SELECT COUNT(*) as count FROM entry_info',
          [],
          (tx, results) => {
            const totalCount = results.rows.item(0).count;
            console.log(`Total entry_info records: ${totalCount}`);
            
            // Count by user
            tx.executeSql(
              'SELECT user_id, COUNT(*) as count FROM entry_info GROUP BY user_id',
              [],
              (tx, results) => {
                console.log('\nBy user_id:');
                for (let i = 0; i < results.rows.length; i++) {
                  const row = results.rows.item(i);
                  console.log(`  ${row.user_id}: ${row.count} records`);
                }
                
                // Get all records for user_001
                tx.executeSql(
                  'SELECT id, destination_id, status, created_at FROM entry_info WHERE user_id = ? ORDER BY created_at DESC',
                  ['user_001'],
                  (tx, results) => {
                    console.log(`\nAll records for user_001 (${results.rows.length} total):`);
                    for (let i = 0; i < results.rows.length; i++) {
                      const row = results.rows.item(i);
                      console.log(`  ${i + 1}. ${row.destination_id || 'NULL'} - ${row.status} (${row.id})`);
                    }
                    
                    // Breakdown by destination
                    tx.executeSql(
                      'SELECT destination_id, COUNT(*) as count FROM entry_info WHERE user_id = ? GROUP BY destination_id',
                      ['user_001'],
                      (tx, results) => {
                        console.log('\nBy destination_id:');
                        for (let i = 0; i < results.rows.length; i++) {
                          const row = results.rows.item(i);
                          console.log(`  ${row.destination_id || 'NULL'}: ${row.count} record(s)`);
                        }
                        
                        db.close();
                        resolve();
                      },
                      (error) => {
                        console.error('Error querying by destination:', error);
                        db.close();
                        reject(error);
                      }
                    );
                  },
                  (error) => {
                    console.error('Error querying user_001 records:', error);
                    db.close();
                    reject(error);
                  }
                );
              },
              (error) => {
                console.error('Error querying by user:', error);
                db.close();
                reject(error);
              }
            );
          },
          (error) => {
            console.error('Error counting records:', error);
            db.close();
            reject(error);
          }
        );
      });
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the check
checkEntryInfoRecords().catch(console.error);

