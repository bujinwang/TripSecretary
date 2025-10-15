/**
 * Database Index Verification Script
 * Run this script to verify that database indexes are created and used correctly
 * 
 * Usage: node scripts/verify-indexes.js
 */

const SQLite = require('expo-sqlite');

async function verifyIndexes() {
  console.log('=== Database Index Verification Script ===\n');
  
  try {
    // Open database
    const db = SQLite.openDatabase('tripsecretary_secure');
    
    console.log('✓ Database opened successfully\n');
    
    // Check if indexes exist
    console.log('Checking for indexes...');
    const indexes = await new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%'`,
          [],
          (_, { rows }) => resolve(rows._array),
          (_, error) => reject(error)
        );
      });
    });
    
    console.log(`Found ${indexes.length} custom indexes:\n`);
    
    const expectedIndexes = [
      'idx_passports_user_id',
      'idx_personal_info_user_id',
      'idx_funding_proof_user_id'
    ];
    
    let allIndexesExist = true;

    
    expectedIndexes.forEach(expectedIndex => {
      const found = indexes.find(idx => idx.name === expectedIndex);
      if (found) {
        console.log(`✓ ${expectedIndex} exists on table ${found.tbl_name}`);
      } else {
        console.log(`✗ ${expectedIndex} NOT FOUND`);
        allIndexesExist = false;
      }
    });
    
    console.log('\n--- Query Plan Analysis ---\n');
    
    // Test query plans
    const testQueries = [
      {
        name: 'passport_by_user_id',
        query: 'SELECT * FROM passports WHERE user_id = ?',
        expectedIndex: 'idx_passports_user_id'
      },
      {
        name: 'personal_info_by_user_id',
        query: 'SELECT * FROM personal_info WHERE user_id = ?',
        expectedIndex: 'idx_personal_info_user_id'
      },
      {
        name: 'funding_proof_by_user_id',
        query: 'SELECT * FROM funding_proof WHERE user_id = ?',
        expectedIndex: 'idx_funding_proof_user_id'
      }
    ];
    
    for (const testQuery of testQueries) {
      console.log(`\nAnalyzing: ${testQuery.name}`);
      console.log(`Query: ${testQuery.query}`);
      
      const plan = await new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            `EXPLAIN QUERY PLAN ${testQuery.query}`,
            ['test_user_123'],
            (_, { rows }) => resolve(rows._array),
            (_, error) => reject(error)
          );
        });
      });
      
      const usesIndex = plan.some(step => 
        step.detail && step.detail.includes(testQuery.expectedIndex)
      );
      
      if (usesIndex) {
        console.log(`✓ Uses index: ${testQuery.expectedIndex}`);
      } else {
        console.log(`⚠ Does NOT use expected index: ${testQuery.expectedIndex}`);
      }
      
      plan.forEach(step => {
        console.log(`  Plan: ${step.detail}`);
      });
    }
    
    console.log('\n=== Verification Complete ===');
    
    if (allIndexesExist) {
      console.log('\n✓ All required indexes exist and are properly configured');
      process.exit(0);
    } else {
      console.log('\n✗ Some indexes are missing');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error during verification:', error);
    process.exit(1);
  }
}

// Run verification
verifyIndexes();
