/**
 * Query Entry Info Records
 * Direct database query to see all entry_info records
 */

const { openDatabaseAsync } = require('expo-sqlite');

async function queryEntryInfo() {
  try {
    console.log('Opening database...');
    const db = await openDatabaseAsync('tripsecretary_secure');
    
    // Query all entry_info records
    const query = `
      SELECT 
        id,
        user_id,
        destination_id,
        status,
        travel_info_id,
        passport_id,
        personal_info_id,
        created_at,
        last_updated_at
      FROM entry_info
      ORDER BY created_at DESC
    `;
    
    const rows = await db.getAllAsync(query);
    
    console.log(`\n📊 Total entry_info records: ${rows.length}\n`);
    
    if (rows.length === 0) {
      console.log('No entry_info records found in database.');
      return;
    }
    
    // Group by user_id
    const byUser = {};
    rows.forEach(row => {
      if (!byUser[row.user_id]) {
        byUser[row.user_id] = [];
      }
      byUser[row.user_id].push(row);
    });
    
    // Display results
    Object.keys(byUser).forEach(userId => {
      console.log(`\n👤 User: ${userId}`);
      console.log(`   Total entries: ${byUser[userId].length}`);
      console.log(`   Entries:`);
      byUser[userId].forEach((entry, index) => {
        console.log(`   ${index + 1}. ID: ${entry.id}`);
        console.log(`      Destination: ${entry.destination_id || 'NULL'}`);
        console.log(`      Status: ${entry.status || 'NULL'}`);
        console.log(`      Created: ${entry.created_at || 'NULL'}`);
        console.log(`      Travel Info ID: ${entry.travel_info_id || 'NULL'}`);
        console.log(`      Passport ID: ${entry.passport_id || 'NULL'}`);
        console.log(`      Personal Info ID: ${entry.personal_info_id || 'NULL'}`);
        console.log('');
      });
    });
    
    // Also check for user_001 specifically
    const user001Query = `
      SELECT COUNT(*) as count 
      FROM entry_info 
      WHERE user_id = 'user_001'
    `;
    const user001Count = await db.getFirstAsync(user001Query);
    console.log(`\n🔍 Specific query for user_001: ${user001Count?.count || 0} records\n`);
    
    await db.closeAsync();
  } catch (error) {
    console.error('Error querying entry_info:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  queryEntryInfo()
    .then(() => {
      console.log('✅ Query completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Query failed:', error);
      process.exit(1);
    });
}

module.exports = queryEntryInfo;

