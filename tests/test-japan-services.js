/**
 * Test script for Japan services
 * Quick verification that the services are working correctly
 */

// Test JapanDataValidator
console.log('=== Testing JapanDataValidator ===');

// Mock passport data
const mockPassport = {
  passportNumber: 'E12345678',
  fullName: 'ZHANG, WEI',
  nationality: 'CHN',
  dateOfBirth: '1990-05-15',
  expiryDate: '2030-12-31',
  gender: 'Male'
};

const mockPersonalInfo = {
  occupation: 'ENGINEER',
  phoneNumber: '+86 13800138000',
  email: 'test@example.com'
};

const mockTravelInfo = {
  arrivalFlightNumber: 'CA981',
  arrivalDepartureAirport: 'PEK',
  arrivalArrivalAirport: 'BKK',
  arrivalDepartureDate: '2025-10-13',
  arrivalArrivalDate: '2025-10-13',
  departureFlightNumber: 'CA982',
  departureDepartureAirport: 'BKK',
  departureArrivalAirport: 'PEK',
  departureDepartureDate: '2025-10-20',
  departureArrivalDate: '2025-10-20',
  hotelName: 'Bangkok Hotel',
  hotelAddress: '123 Sukhumvit Road, Bangkok'
};

const mockFundItems = [
  { type: 'credit_card', amount: 5000, currency: 'USD' }
];

try {
  // Import the validator
  const JapanDataValidator = require('./app/services/japan/JapanDataValidator').default;
  
  // Test passport validation
  const passportResult = JapanDataValidator.validatePassportData(mockPassport);
  console.log('Passport validation:', passportResult);
  
  // Test personal info validation (Japan requires gender)
  const mockPersonalInfoJapan = { ...mockPersonalInfo, gender: 'Male', cityOfResidence: 'Beijing', residentCountry: 'China' };
  const personalInfoResult = JapanDataValidator.validatePersonalInfo(mockPersonalInfoJapan);
  console.log('Personal info validation:', personalInfoResult);
  
  // Test travel info validation (Japan-specific fields)
  const mockTravelInfoJapan = {
    travelPurpose: 'Tourism',
    arrivalFlightNumber: 'NH955',
    arrivalDate: '2025-10-20',
    accommodationAddress: '1-2-3 Shibuya, Shibuya-ku, Tokyo 150-0002',
    accommodationPhone: '03-1234-5678',
    lengthOfStay: '7'
  };
  const travelInfoResult = JapanDataValidator.validateTravelInfo(mockTravelInfoJapan);
  console.log('Travel info validation:', travelInfoResult);
  
  // Test fund items validation
  const fundItemsResult = JapanDataValidator.validateFundItems(mockFundItems);
  console.log('Fund items validation:', fundItemsResult);
  
} catch (error) {
  console.error('JapanDataValidator test failed:', error);
}

console.log('\n=== Testing JapanFormHelper ===');

try {
  // Import the form helper
  const JapanFormHelper = require('./app/utils/japan/JapanFormHelper').default;
  
  // Test field counting
  const mockData = {
    passport: mockPassport,
    personalInfo: { ...mockPersonalInfo, gender: 'Male', cityOfResidence: 'Beijing', residentCountry: 'China' },
    travelInfo: {
      travelPurpose: 'Tourism',
      arrivalFlightNumber: 'NH955',
      arrivalDate: '2025-10-20',
      accommodationAddress: '1-2-3 Shibuya, Shibuya-ku, Tokyo 150-0002',
      accommodationPhone: '03-1234-5678',
      lengthOfStay: '7'
    },
    fundItems: mockFundItems
  };
  
  const passportCount = JapanFormHelper.getFieldCount(mockData.passport, 'passport');
  const personalCount = JapanFormHelper.getFieldCount(mockData.personalInfo, 'personal');
  const travelCount = JapanFormHelper.getFieldCount(mockData.travelInfo, 'travel');
  const fundsCount = JapanFormHelper.getFieldCount(mockData.fundItems, 'funds');
  
  console.log('Passport field count:', passportCount);
  console.log('Personal field count:', personalCount);
  console.log('Travel field count:', travelCount);
  console.log('Funds field count:', fundsCount);
  
  const isComplete = JapanFormHelper.isFormComplete(mockData);
  console.log('Form is complete:', isComplete);
  
} catch (error) {
  console.error('JapanFormHelper test failed:', error);
}

console.log('\n=== Testing JapanTravelerContextBuilder ===');

try {
  // Import the context builder
  const JapanTravelerContextBuilder = require('./app/services/japan/JapanTravelerContextBuilder').default;
  
  // Test name parsing
  const nameTests = [
    'ZHANG, WEI MING',
    'ZHANG WEI MING',
    'ZHANG WEI',
    'ZHANG'
  ];
  
  nameTests.forEach(name => {
    const parsed = JapanTravelerContextBuilder.parseFullName(name);
    console.log(`Name: "${name}" -> Family: "${parsed.familyName}", Given: "${parsed.givenName}"`);
  });
  
  // Test phone number parsing
  const phoneTests = [
    '+86 13800138000',
    '86 13800138000',
    '+852 12345678',
    '13800138000'
  ];
  
  phoneTests.forEach(phone => {
    const code = JapanTravelerContextBuilder.extractPhoneCode(phone);
    const number = JapanTravelerContextBuilder.extractPhoneNumber(phone);
    console.log(`Phone: "${phone}" -> Code: "${code}", Number: "${number}"`);
  });
  
} catch (error) {
  console.error('JapanTravelerContextBuilder test failed:', error);
}

console.log('\n=== All tests completed ===');
