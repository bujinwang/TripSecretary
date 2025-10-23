#!/usr/bin/env node

/**
 * Debug Personal Info Saving Issue
 *
 * This script helps debug why personal info fields are not being saved properly.
 * It checks the current database state and tests the save process.
 *
 * Usage: node scripts/debug-personal-info.js
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// iOS Simulator database path
const SIMULATOR_DB_PATH = '/Users/bujin/Library/Developer/CoreSimulator/Devices/69A62B34-93E6-4C79-89E8-3674756671DA/data/Containers/Data/Application/D2C892B1-6872-4624-BA10-5AEABC8E69C2/Documents/ExponentExperienceData/@anonymous/chujingtong-949aa9fd-5f29-4180-8e63-54175ac2c5e3/SQLite/tripsecretary_secure';

async function debugPersonalInfo() {
  console.log('🔍 Debugging Personal Info Saving Issue...\n');

  // Check if database file exists
  if (!fs.existsSync(SIMULATOR_DB_PATH)) {
    console.error('❌ Database file not found at:', SIMULATOR_DB_PATH);
    return;
  }

  const db = new sqlite3.Database(SIMULATOR_DB_PATH);

  try {
    console.log('📊 Current Database State:');
    await printDatabaseInfo(db);

    console.log('\n🔍 Checking Personal Info Table Schema:');
    await printTableSchema(db, 'personal_info');

    console.log('\n📋 Current Personal Info Records:');
    await printPersonalInfoRecords(db);

    console.log('\n🔍 Checking Settings Table:');
    await printSettings(db);

    console.log('\n🔍 Checking Users Table:');
    await printUsers(db);

    console.log('\n🧪 Testing Personal Info Save Process:');
    await testPersonalInfoSave(db);

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  } finally {
    db.close();
  }
}

function printDatabaseInfo(db) {
  return new Promise((resolve, reject) => {
    const tables = [
      'users', 'passports', 'personal_info', 'travel_info',
      'entry_info', 'digital_arrival_cards', 'fund_items',
      'passport_countries', 'travel_history', 'audit_log',
      'settings', 'migrations'
    ];

    let completed = 0;
    const results = {};

    tables.forEach(tableName => {
      db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
        if (err) {
          results[tableName] = 'ERROR: ' + err.message;
        } else {
          results[tableName] = row.count;
        }

        completed++;
        if (completed === tables.length) {
          console.log('   Tables:');
          Object.entries(results).forEach(([table, count]) => {
            console.log(`     ${table}: ${count} rows`);
          });

          const stats = fs.statSync(SIMULATOR_DB_PATH);
          console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
          resolve(results);
        }
      });
    });
  });
}

function printTableSchema(db, tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
      if (err) {
        console.error(`❌ Failed to get schema for ${tableName}:`, err.message);
        resolve();
        return;
      }

      console.log(`   ${tableName} columns:`);
      columns.forEach(col => {
        console.log(`     ${col.name} (${col.type})${col.pk ? ' PRIMARY KEY' : ''}${col.notnull ? ' NOT NULL' : ''}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''}`);
      });
      resolve();
    });
  });
}

function printPersonalInfoRecords(db) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM personal_info', (err, rows) => {
      if (err) {
        console.error('❌ Failed to get personal_info records:', err.message);
        resolve();
        return;
      }

      if (rows.length === 0) {
        console.log('   No personal_info records found');
        resolve();
        return;
      }

      console.log('   Personal Info Records:');
      rows.forEach((row, index) => {
        console.log(`   Record ${index + 1}:`);
        console.log(`     ID: ${row.id}`);
        console.log(`     User ID: ${row.user_id}`);
        console.log(`     Gender: ${row.gender}`);
        console.log(`     Phone Code: ${row.phone_code}`);
        console.log(`     Phone Number: ${row.encrypted_phone_number || 'null'}`);
        console.log(`     Email: ${row.encrypted_email || 'null'}`);
        console.log(`     Home Address: ${row.encrypted_home_address || 'null'}`);
        console.log(`     Occupation: ${row.occupation || 'null'}`);
        console.log(`     Province City: ${row.province_city || 'null'}`);
        console.log(`     Country Region: ${row.country_region || 'null'}`);
        console.log(`     Passport ID: ${row.passport_id || 'null'}`);
        console.log(`     Is Default: ${row.is_default}`);
        console.log(`     Label: ${row.label || 'null'}`);
        console.log(`     Created: ${row.created_at}`);
        console.log(`     Updated: ${row.updated_at}`);
        console.log('');
      });
      resolve();
    });
  });
}

function printSettings(db) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM settings', (err, rows) => {
      if (err) {
        console.error('❌ Failed to get settings:', err.message);
        resolve();
        return;
      }

      console.log('   Settings:');
      rows.forEach(row => {
        console.log(`     ${row.key}: ${row.value}`);
      });
      resolve();
    });
  });
}

function printUsers(db) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users', (err, rows) => {
      if (err) {
        console.error('❌ Failed to get users:', err.message);
        resolve();
        return;
      }

      console.log('   Users:');
      rows.forEach(row => {
        console.log(`     ID: ${row.id}`);
        console.log(`     External ID: ${row.external_id || 'null'}`);
        console.log(`     Display Name: ${row.display_name || 'null'}`);
        console.log(`     Created: ${row.created_at}`);
        console.log(`     Updated: ${row.updated_at}`);
        console.log('');
      });
      resolve();
    });
  });
}

function testPersonalInfoSave(db) {
  return new Promise((resolve, reject) => {
    console.log('   Testing save process...');

    // Test data that should be saved
    const testData = {
      userId: 'user_001',
      phoneCode: '+86',
      phoneNumber: '13800138000',
      email: 'test@example.com',
      occupation: 'Software Engineer',
      provinceCity: 'Guangdong',
      countryRegion: 'CHN',
      gender: 'Male',
      isDefault: 1,
      label: 'China Profile'
    };

    console.log('   Test data to save:', JSON.stringify(testData, null, 2));

    // Check if user exists
    db.get('SELECT * FROM users WHERE id = ?', [testData.userId], (err, user) => {
      if (err) {
        console.error('❌ Failed to check user:', err.message);
        resolve();
        return;
      }

      if (!user) {
        console.log('   Creating test user...');
        db.run('INSERT INTO users (id, created_at, updated_at) VALUES (?, ?, ?)',
          [testData.userId, new Date().toISOString(), new Date().toISOString()], (err) => {
          if (err) {
            console.error('❌ Failed to create user:', err.message);
            resolve();
            return;
          }
          console.log('   ✅ Test user created');
          performSaveTest(db, testData);
        });
      } else {
        console.log('   ✅ Test user exists');
        performSaveTest(db, testData);
      }
    });

    function performSaveTest(db, testData) {
      // Simulate the save process
      const now = new Date().toISOString();
      const personalInfoId = `personal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log('   Simulating save with ID:', personalInfoId);

      // Since encryption is disabled, data should be stored as-is
      db.run(`INSERT OR REPLACE INTO personal_info (
        id, user_id, passport_id, encrypted_phone_number, encrypted_email,
        encrypted_home_address, occupation, province_city, country_region,
        phone_code, gender, is_default, label, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        personalInfoId,
        testData.userId,
        null, // passport_id
        testData.phoneNumber, // encrypted_phone_number (no encryption)
        testData.email, // encrypted_email (no encryption)
        null, // encrypted_home_address
        testData.occupation,
        testData.provinceCity,
        testData.countryRegion,
        testData.phoneCode,
        testData.gender,
        testData.isDefault,
        testData.label,
        now,
        now
      ], function(err) {
        if (err) {
          console.error('❌ Failed to simulate save:', err.message);
          resolve();
          return;
        }

        console.log('   ✅ Test save completed successfully');
        console.log('   Rows affected:', this.changes);

        // Verify the save
        db.get('SELECT * FROM personal_info WHERE id = ?', [personalInfoId], (err, row) => {
          if (err) {
            console.error('❌ Failed to verify save:', err.message);
            resolve();
            return;
          }

          if (row) {
            console.log('   ✅ Verification successful:');
            console.log('     Phone Code:', row.phone_code);
            console.log('     Phone Number:', row.encrypted_phone_number);
            console.log('     Email:', row.encrypted_email);
            console.log('     Occupation:', row.occupation);
            console.log('     Province City:', row.province_city);
            console.log('     Country Region:', row.country_region);
            console.log('     Gender:', row.gender);
            console.log('     Label:', row.label);
          } else {
            console.error('❌ Save verification failed - record not found');
          }

          resolve();
        });
      });
    }
  });
}

// Run the debug script
debugPersonalInfo().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});