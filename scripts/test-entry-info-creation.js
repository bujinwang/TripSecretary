/**
 * Test Script: Entry Info Creation
 *
 * This script tests the entry_info creation flow by:
 * 1. Checking if entry_info records exist
 * 2. Testing creation of new entry_info
 * 3. Verifying fund item associations
 *
 * This can be copy-pasted into the React Native app console for testing
 */

// Test function that can be run in the app
const testEntryInfoCreation = async () => {
  console.log('🧪 Testing Entry Info Creation');
  console.log('==============================\n');

  try {
    // Import required services
    const PassportDataService = require('../app/services/data/PassportDataService').default;
    const SecureStorageService = require('../app/services/security/SecureStorageService').default;

    // Test user ID
    const userId = 'user_001';
    const destinationId = 'thailand';

    // 1. Initialize storage
    console.log('1️⃣  Initializing secure storage...');
    await SecureStorageService.initialize(userId);
    console.log('✅ Storage initialized\n');

    // 2. Check existing entry_info records
    console.log('2️⃣  Checking existing entry_info records...');
    const existingEntryInfos = await PassportDataService.getAllEntryInfosForUser(userId);
    console.log(`   Found ${existingEntryInfos.length} existing entry_info records`);

    if (existingEntryInfos.length > 0) {
      existingEntryInfos.forEach((entry, index) => {
        console.log(`   ${index + 1}. ID: ${entry.id}, Destination: ${entry.destinationId}, Status: ${entry.status}`);
      });
    }
    console.log('');

    // 3. Check if entry_info exists for Thailand
    const existingThailandEntry = existingEntryInfos.find(e => e.destinationId === destinationId);

    if (existingThailandEntry) {
      console.log(`3️⃣  ✅ Entry info already exists for Thailand: ${existingThailandEntry.id}`);

      // 4. Get fund items for this entry
      console.log('\n4️⃣  Checking fund item associations...');
      const fundItems = await SecureStorageService.getFundItemsForEntryInfo(existingThailandEntry.id);
      console.log(`   Found ${fundItems.length} fund items linked to this entry`);

      if (fundItems.length > 0) {
        fundItems.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.type}: ${item.amount} ${item.currency}`);
        });
      } else {
        console.log('   ⚠️  No fund items linked yet');
      }
    } else {
      console.log('3️⃣  Creating new entry info for Thailand...');

      // Create new entry_info
      const entryInfoData = {
        userId,
        destinationId,
        status: 'incomplete',
        completionMetrics: {
          passport: { complete: 0, total: 5, state: 'missing' },
          personalInfo: { complete: 0, total: 6, state: 'missing' },
          funds: { complete: 0, total: 1, state: 'missing' },
          travel: { complete: 0, total: 6, state: 'missing' }
        },
        fundItemIds: [],
        lastUpdatedAt: new Date().toISOString()
      };

      const savedEntry = await PassportDataService.saveEntryInfo(entryInfoData, userId);
      console.log(`   ✅ Created entry info: ${savedEntry.id}\n`);

      // 5. Verify it was saved
      console.log('4️⃣  Verifying entry info was saved...');
      const verifyEntry = await PassportDataService.getEntryInfo(userId, destinationId);

      if (verifyEntry) {
        console.log('   ✅ Entry info verified in database');
        console.log(`   ID: ${verifyEntry.id}`);
        console.log(`   Status: ${verifyEntry.status}`);
        console.log(`   Destination: ${verifyEntry.destinationId}`);
      } else {
        console.log('   ❌ Failed to verify - entry info not found');
      }
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Navigate to Thailand Travel Info screen');
    console.log('   2. Fill in some data and save');
    console.log('   3. Check console logs for entry_info creation');
    console.log('   4. Run verification script to check database\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
  }
};

// Export for use in app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testEntryInfoCreation;
}

// Auto-run if executed directly
if (require.main === module) {
  testEntryInfoCreation();
}
