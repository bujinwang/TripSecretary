#!/usr/bin/env node

/**
 * Check fund item photo_uri in database
 */

// No special module path setup needed

async function checkFundPhoto() {
  try {
    console.log('Loading SecureStorageService...');
    const SecureStorageService = require('../app/services/security/SecureStorageService').default;

    console.log('Initializing database...');
    await SecureStorageService.initialize();

    console.log('\nFetching fund items for user_001...');
    const fundItems = await SecureStorageService.getFundItemsByUserId('user_001');

    console.log(`\nFound ${fundItems.length} fund items:\n`);

    fundItems.forEach((item, index) => {
      console.log(`Fund Item ${index + 1}:`);
      console.log(`  ID: ${item.id}`);
      console.log(`  Type: ${item.type}`);
      console.log(`  Amount: ${item.amount}`);
      console.log(`  Currency: ${item.currency}`);
      console.log(`  Photo URI: ${item.photoUri || 'NULL'}`);
      console.log(`  Photo URI length: ${item.photoUri?.length || 0}`);
      console.log(`  Created: ${item.createdAt}`);
      console.log(`  Updated: ${item.updatedAt}`);
      console.log('');
    });

    // Check the raw database
    console.log('\nChecking raw database table...');
    const db = SecureStorageService.modernDb;
    const rows = await db.getAllAsync('SELECT * FROM fund_items WHERE user_id = ?', ['user_001']);

    console.log(`\nRaw database rows (${rows.length} total):\n`);
    rows.forEach((row, index) => {
      console.log(`Row ${index + 1}:`);
      console.log(JSON.stringify(row, null, 2));
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  }
}

checkFundPhoto();
