/**
 * Script to list all iOS simulators and their database locations
 * Run with: node scripts/list-simulators-and-databases.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SIMULATOR_DEVICES_PATH = path.join(
  process.env.HOME,
  'Library',
  'Developer',
  'CoreSimulator',
  'Devices'
);

function getSimulatorInfo() {
  try {
    // Get list of all simulators using xcrun simctl
    const output = execSync('xcrun simctl list devices --json', { encoding: 'utf-8' });
    const data = JSON.parse(output);
    
    const devices = [];
    for (const [runtime, runtimeDevices] of Object.entries(data.devices)) {
      for (const device of runtimeDevices) {
        if (device.state === 'Booted') {
          devices.push({ ...device, runtime, isBooted: true });
        } else {
          devices.push({ ...device, runtime, isBooted: false });
        }
      }
    }
    
    return devices;
  } catch (error) {
    console.error('Error getting simulator info:', error.message);
    return [];
  }
}

function findDatabases(deviceId) {
  const devicePath = path.join(SIMULATOR_DEVICES_PATH, deviceId, 'data', 'Containers', 'Data', 'Application');
  
  if (!fs.existsSync(devicePath)) {
    return [];
  }
  
  const databases = [];
  const apps = fs.readdirSync(devicePath);
  
  for (const app of apps) {
    const dbPath = path.join(devicePath, app, 'Library', 'LocalDatabase', 'tripsecretary_secure.db');
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      databases.push({
        path: dbPath,
        size: stats.size,
        modified: stats.mtime
      });
    }
  }
  
  return databases;
}

function countEntryInfoRecords(dbPath) {
  try {
    // Try to read the database using sqlite3 command line tool
    const sqlite3Path = '/usr/bin/sqlite3';
    if (!fs.existsSync(sqlite3Path)) {
      return null; // sqlite3 not available
    }
    
    const query = `SELECT COUNT(*) as count FROM entry_info WHERE user_id = 'user_001';`;
    const result = execSync(`${sqlite3Path} "${dbPath}" "${query}"`, { encoding: 'utf-8' }).trim();
    return parseInt(result) || 0;
  } catch (error) {
    return null; // Can't read database
  }
}

async function main() {
  console.log('🔍 Finding iOS Simulators and Databases...\n');
  
  const simulators = getSimulatorInfo();
  
  if (simulators.length === 0) {
    console.log('❌ No simulators found');
    return;
  }
  
  console.log(`Found ${simulators.length} simulator(s):\n`);
  
  const bootedSimulators = simulators.filter(s => s.isBooted);
  if (bootedSimulators.length > 0) {
    console.log('✅ Currently Booted Simulators:');
    bootedSimulators.forEach(sim => {
      console.log(`   📱 ${sim.name} (${sim.runtime}) - ${sim.udid}`);
      console.log(`      State: ${sim.state}`);
    });
    console.log('');
  }
  
  // Check each simulator for databases
  for (const sim of simulators) {
    const databases = findDatabases(sim.udid);
    
    if (databases.length > 0) {
      const status = sim.isBooted ? '✅ BOOTED' : '⏸️  Stopped';
      console.log(`${status} ${sim.name} (${sim.runtime})`);
      console.log(`   Device ID: ${sim.udid}`);
      
      for (const db of databases) {
        const recordCount = countEntryInfoRecords(db.path);
        const countInfo = recordCount !== null ? ` - ${recordCount} entry_info records` : '';
        
        console.log(`   📊 Database: ${db.path}`);
        console.log(`      Size: ${(db.size / 1024).toFixed(2)} KB`);
        console.log(`      Modified: ${db.modified.toISOString()}${countInfo}`);
        
        if (recordCount !== null) {
          if (recordCount === 9) {
            console.log(`      ⭐ This database has 9 records!`);
          } else if (recordCount === 1) {
            console.log(`      ⚠️  This database only has 1 record`);
          }
        }
      }
      console.log('');
    }
  }
  
  // Summary
  console.log('\n📋 Summary:');
  console.log(`   Total simulators: ${simulators.length}`);
  console.log(`   Booted simulators: ${bootedSimulators.length}`);
  
  const allDatabases = simulators.flatMap(sim => {
    const dbs = findDatabases(sim.udid);
    return dbs.map(db => ({ ...db, simulator: sim.name, deviceId: sim.udid, isBooted: sim.isBooted }));
  });
  
  console.log(`   Databases found: ${allDatabases.length}`);
  
  const databasesWith9Records = allDatabases.filter(db => {
    const count = countEntryInfoRecords(db.path);
    return count === 9;
  });
  
  if (databasesWith9Records.length > 0) {
    console.log(`\n⭐ Found ${databasesWith9Records.length} database(s) with 9 records:`);
    databasesWith9Records.forEach(db => {
      console.log(`   - ${db.simulator} (${db.isBooted ? 'BOOTED' : 'stopped'})`);
      console.log(`     ${db.path}`);
    });
  } else {
    console.log(`\n⚠️  No databases found with 9 records`);
  }
  
  const bootedDatabases = allDatabases.filter(db => db.isBooted);
  if (bootedDatabases.length > 0) {
    console.log(`\n💡 Currently active database (from booted simulator):`);
    bootedDatabases.forEach(db => {
      const count = countEntryInfoRecords(db.path);
      console.log(`   ${db.path}`);
      console.log(`   Records: ${count !== null ? count : 'unknown'}`);
    });
  }
}

main().catch(console.error);

