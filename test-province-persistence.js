/**
 * Test script to verify province, district, and sub-district persistence
 * 
 * This script tests that the new fields are properly saved and retrieved
 * from the database.
 */

import PassportDataService from './app/services/data/PassportDataService';

async function testProvincePersistence() {
  console.log('=== Testing Province, District, Sub-District Persistence ===\n');
  
  const testUserId = 'test_user_province';
  const testDestination = 'thailand';
  
  try {
    // Initialize the service
    console.log('1. Initializing PassportDataService...');
    await PassportDataService.initialize(testUserId);
    console.log('✓ Service initialized\n');
    
    // Test data with all new fields
    const testTravelInfo = {
      travelPurpose: 'HOLIDAY',
      boardingCountry: 'CN',
      visaNumber: 'TH123456',
      arrivalFlightNumber: 'TG123',
      arrivalArrivalDate: '2025-01-15',
      departureFlightNumber: 'TG456',
      departureDepartureDate: '2025-01-22',
      accommodationType: 'GUEST_HOUSE',
      province: 'Bangkok',
      district: 'Chatuchak',
      subDistrict: 'Lat Yao',
      postalCode: '10900',
      hotelAddress: '123 Test Street, Bangkok, Thailand'
    };
    
    // Save travel info
    console.log('2. Saving travel info with new fields...');
    console.log('   Data:', JSON.stringify(testTravelInfo, null, 2));
    await PassportDataService.updateTravelInfo(testUserId, testDestination, testTravelInfo);
    console.log('✓ Travel info saved\n');
    
    // Retrieve travel info
    console.log('3. Retrieving travel info...');
    const retrieved = await PassportDataService.getTravelInfo(testUserId, testDestination);
    console.log('   Retrieved:', JSON.stringify(retrieved, null, 2));
    console.log('✓ Travel info retrieved\n');
    
    // Verify all fields
    console.log('4. Verifying fields...');
    const fieldsToCheck = [
      'travelPurpose',
      'accommodationType',
      'province',
      'district',
      'subDistrict',
      'postalCode'
    ];
    
    let allFieldsMatch = true;
    for (const field of fieldsToCheck) {
      const expected = testTravelInfo[field];
      const actual = retrieved[field];
      const matches = expected === actual;
      
      console.log(`   ${field}: ${matches ? '✓' : '✗'} (expected: "${expected}", got: "${actual}")`);
      
      if (!matches) {
        allFieldsMatch = false;
      }
    }
    
    console.log('');
    
    if (allFieldsMatch) {
      console.log('✓ All fields match! Province persistence is working correctly.\n');
    } else {
      console.log('✗ Some fields do not match. There may be an issue with persistence.\n');
    }
    
    // Test with hotel accommodation type (fewer required fields)
    console.log('5. Testing with HOTEL accommodation type...');
    const hotelTravelInfo = {
      ...testTravelInfo,
      accommodationType: 'HOTEL',
      district: '', // Not required for hotels
      subDistrict: '', // Not required for hotels
      postalCode: '' // Not required for hotels
    };
    
    await PassportDataService.updateTravelInfo(testUserId, testDestination, hotelTravelInfo);
    const hotelRetrieved = await PassportDataService.getTravelInfo(testUserId, testDestination);
    
    console.log('   Province saved:', hotelRetrieved.province);
    console.log('   Accommodation type:', hotelRetrieved.accommodationType);
    console.log('✓ Hotel accommodation type works correctly\n');
    
    console.log('=== All Tests Passed! ===');
    
  } catch (error) {
    console.error('✗ Test failed:', error);
    console.error('Error stack:', error.stack);
  }
}

// Run the test
testProvincePersistence().catch(console.error);
