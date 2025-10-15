// Test script to verify funding proof database writes
// Run this in the app to test if the database is writable

import * as SQLite from 'expo-sqlite';

async function testFundingProofWrite() {
  console.log('=== TESTING FUNDING PROOF DATABASE WRITE ===');
  
  const db = SQLite.openDatabase('tripsecretary_secure.db');
  
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Try to read current data
      tx.executeSql(
        'SELECT * FROM funding_proof WHERE user_id = ?',
        ['default_user'],
        (_, { rows }) => {
          console.log('Current funding_proof rows:', rows.length);
          if (rows.length > 0) {
            console.log('Current data:', JSON.stringify(rows._array[0], null, 2));
          }
          
          // Try to update it
          const testData = JSON.stringify([{id: Date.now(), type: 'test', photo: 'test_uri'}]);
          const now = new Date().toISOString();
          
          tx.executeSql(
            `UPDATE funding_proof 
             SET encrypted_supporting_docs = ?, updated_at = ? 
             WHERE user_id = ?`,
            [testData, now, 'default_user'],
            (_, result) => {
              console.log('✅ UPDATE successful, rows affected:', result.rowsAffected);
              
              // Read it back to verify
              tx.executeSql(
                'SELECT * FROM funding_proof WHERE user_id = ?',
                ['default_user'],
                (_, { rows }) => {
                  console.log('After update:', JSON.stringify(rows._array[0], null, 2));
                  resolve(true);
                },
                (_, error) => {
                  console.error('❌ Failed to read back:', error);
                  reject(error);
                }
              );
            },
            (_, error) => {
              console.error('❌ UPDATE failed:', error);
              reject(error);
            }
          );
        },
        (_, error) => {
          console.error('❌ SELECT failed:', error);
          reject(error);
        }
      );
    });
  });
}

// Export for use in app
export default testFundingProofWrite;
