/**
 * Test file for TDAC API Service
 * Run this to verify the API implementation
 * 
 * Note: These are manual tests, not Jest tests
 * To run: node app/services/TDACAPIService.test.js
 */

import TDACAPIService from './TDACAPIService';

// Skip this file in Jest test runs
describe.skip('TDAC API Service - Manual Tests', () => {
  test('placeholder', () => {
    expect(true).toBe(true);
  });
});

// Test data - Chinese tourist with visa exemption
const testTraveler = {
  // Cloudflare token (need to get from actual Cloudflare verification)
  cloudflareToken: 'YOUR_CLOUDFLARE_TOKEN_HERE',
  
  // Email for receiving confirmation
  email: 'test@example.com',
  
  // Personal Information
  familyName: 'WANG',
  middleName: '',
  firstName: 'XIAOMING',
  gender: 'MALE', // or 'FEMALE'
  nationality: 'CHN',
  passportNo: 'E12345678',
  birthDate: {
    day: '15',
    month: '06',
    year: '1990'
  },
  occupation: 'Engineer',
  cityResidence: 'BEIJING',
  countryResidence: 'CHN',
  visaNo: '', // Empty for visa exemption
  phoneCode: '86',
  phoneNo: '13800138000',
  
  // Trip Information
  // Note: TDAC can only be submitted within 72 hours (3 days) before arrival
  arrivalDate: '2025/10/13',
  departureDate: null, // Can be null
  countryBoarded: 'CHN',
  purpose: 'HOLIDAY',
  travelMode: 'AIR',
  flightNo: 'CA123',
  tranModeId: '', // Optional vehicle type ID
  
  // Accommodation Information
  accommodationType: 'HOTEL',
  province: 'BANGKOK',
  district: 'BANG BON',
  subDistrict: 'BANG BON NUEA',
  postCode: '10150',
  address: 'EXAMPLE HOTEL, 88 MOO 5, EKKACHAI ROAD, BANG BON NUEA, BANG BON, BANGKOK 10150'
};

/**
 * Test 1: submitId generation
 */
function testSubmitIdGeneration() {
  console.log('\n🧪 Test 1: submitId Generation');
  const submitId = TDACAPIService.generateSubmitId();
  console.log('Generated submitId:', submitId);
  console.log('Length:', submitId.length);
  console.log('Starts with mgh4r:', submitId.startsWith('mgh4r'));
  console.log(submitId.length === 23 && submitId.startsWith('mgh4r') ? '✅ PASS' : '❌ FAIL');
}

/**
 * Test 2: Build form data
 */
function testBuildFormData() {
  console.log('\n🧪 Test 2: Build Form Data');
  const formData = TDACAPIService.buildFormData(testTraveler);
  console.log('Form Data:', JSON.stringify(formData, null, 2));
  console.log(formData.personalInfo && formData.tripInfo && formData.healthInfo ? '✅ PASS' : '❌ FAIL');
}

/**
 * Test 3: ID mapping functions
 */
function testIdMappings() {
  console.log('\n🧪 Test 3: ID Mappings');
  
  const genderId = TDACAPIService.getGenderId('MALE');
  console.log('Male Gender ID:', genderId);
  console.log('Expected: g5iW15ADyFWOAxDewREkVA==');
  console.log(genderId === 'g5iW15ADyFWOAxDewREkVA==' ? '✅ PASS' : '❌ FAIL');
  
  const nationalityId = TDACAPIService.getNationalityId('CHN');
  console.log('\nCHN Nationality ID:', nationalityId);
  console.log('Expected: n8NVa/feQ+F5Ok859Oywuw==');
  console.log(nationalityId === 'n8NVa/feQ+F5Ok859Oywuw==' ? '✅ PASS' : '❌ FAIL');
  
  const travelModeId = TDACAPIService.getTravelModeId('AIR');
  console.log('\nAIR Travel Mode ID:', travelModeId);
  console.log('Expected: ZUSsbcDrA+GoD4mQxvf7Ag==');
  console.log(travelModeId === 'ZUSsbcDrA+GoD4mQxvf7Ag==' ? '✅ PASS' : '❌ FAIL');
}

/**
 * Test 4: Complete API flow (requires Cloudflare token)
 */
async function testCompleteFlow() {
  console.log('\n🧪 Test 4: Complete API Flow');
  console.log('⚠️  This test requires a valid Cloudflare token');
  console.log('⚠️  Make sure to update testTraveler.cloudflareToken before running');
  
  if (testTraveler.cloudflareToken === 'YOUR_CLOUDFLARE_TOKEN_HERE') {
    console.log('❌ SKIP - No Cloudflare token provided');
    return;
  }
  
  try {
    const result = await TDACAPIService.submitArrivalCard(testTraveler);
    
    if (result.success) {
      console.log('✅ SUCCESS!');
      console.log('Arrival Card No:', result.arrCardNo);
      console.log('Duration:', result.duration + 's');
      console.log('PDF Blob size:', result.pdfBlob.size, 'bytes');
    } else {
      console.log('❌ FAIL:', result.error);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 TDAC API Service Tests\n');
  console.log('='.repeat(50));
  
  testSubmitIdGeneration();
  testBuildFormData();
  testIdMappings();
  
  // Uncomment to run complete flow test (requires Cloudflare token)
  // await testCompleteFlow();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Tests Complete\n');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

export { runAllTests, testTraveler };
