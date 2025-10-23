#!/usr/bin/env node

/**
 * Test User Creation Fix
 *
 * This script tests if the user_001 record is properly created
 * when PassportDataService is initialized.
 *
 * Usage: node scripts/test-user-creation.js
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// iOS Simulator database path
const SIMULATOR_DB_PATH = '/Users/bujin/Library/Developer/CoreSimulator/Devices/69A62B34-93E6-4C79-89E8-3674756671DA/data/Containers/Data/Application/D2C892B1-6872-4624-BA10-5AEABC8E69C2/Documents/ExponentExperienceData/@anonymous/chujingtong-949aa9fd-5f29-4180-8e63-54175ac2c5e3/SQLite/tripsecretary_secure';

async function testUserCreation() {
  console.log('🔍 Testing User Creation Fix...\n');

  // Check if database file exists
  if (!fs.existsSync(SIMULATOR_DB_PATH)) {
    console.error('❌ Database file not found at:', SIMULATOR_DB_PATH);
    console.log('💡 This is expected if the app hasn\'t been run yet.');
    console.log('💡 Run the app first to create the database, then run this script.');
    return;
  }

  const db = new sqlite3.Database(SIMULATOR_DB_PATH);

  try {
    console.log('📊 Checking Users Table:');
    
    // Check if users table exists
    const tableExists = await new Promise((resolve) => {
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
        if (err) {
          console.error('❌ Error checking table:', err.message);
          resolve(false);
        } else {
          resolve(!!row);
        }
      });
    });

    if (!tableExists) {
      console.log('❌ Users table does not exist');
      return;
    }

    console.log('✅ Users table exists');

    // Check if user_001 exists
    const userExists = await new Promise((resolve) => {
      db.get("SELECT * FROM users WHERE id = 'user_001'", (err, row) => {
        if (err) {
          console.error('❌ Error checking user:', err.message);
          resolve(false);
        } else {
          resolve(row);
        }
      });
    });

    if (userExists) {
      console.log('✅ user_001 record exists:');
      console.log('   ID:', userExists.id);
      console.log('   Created:', userExists.created_at);
      console.log('   Updated:', userExists.updated_at);
      console.log('   External ID:', userExists.external_id || 'null');
      console.log('   Display Name:', userExists.display_name || 'null');
    } else {
      console.log('❌ user_001 record does NOT exist');
      console.log('💡 The fix may not have been applied yet, or the app needs to be restarted.');
    }

    // Show all users
    console.log('\n📋 All Users in Database:');
    const allUsers = await new Promise((resolve) => {
      db.all("SELECT * FROM users ORDER BY created_at DESC", (err, rows) => {
        if (err) {
          console.error('❌ Error fetching users:', err.message);
          resolve([]);
        } else {
          resolve(rows);
        }
      });
    });

    if (allUsers.length === 0) {
      console.log('   No users found in database');
    } else {
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}, Created: ${user.created_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Test script failed:', error);
  } finally {
    db.close();
  }
}

// Run the test
testUserCreation().catch(console.error);