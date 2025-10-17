/**
 * Quick test for ThailandDataValidator implementation
 */

import ThailandDataValidator from './app/services/thailand/ThailandDataValidator.js';

// Test passport validation
console.log('=== Testing Passport Validation ===');

const validPassport = {
  passportNumber: 'E12345678',
  fullName: 'ZHANG WEI',
  nationality: 'CHN',
  dateOfBirth: '1990-01-01',
  expiryDate: '2030-01-01',
  gender: 'Male'
};

const passportResult = ThailandDataValidator.validatePassportData(validPassport);
console.log('Valid passport result:', passportResult);

const incompletePassport = {
  passportNumber: 'E12345678',
  fullName: 'ZHANG WEI'
  // Missing nationality, dateOfBirth, expiryDate
};

const incompleteResult = ThailandDataValidator.validatePassportData(incompletePassport);
console.log('Incomplete passport result:', incompleteResult);

// Test personal info validation
console.log('\n=== Testing Personal Info Validation ===');

const validPersonalInfo = {
  occupation: 'Software Engineer',
  phoneNumber: '+86 138 0013 8000',
  email: 'test@example.com'
};

const personalInfoResult = ThailandDataValidator.validatePersonalInfo(validPersonalInfo);
console.log('Valid personal info result:', personalInfoResult);

// Test fund items validation
console.log('\n=== Testing Fund Items Validation ===');

const validFundItems = [
  {
    type: 'credit_card',
    amount: 5000,
    currency: 'CNY'
  }
];

const fundItemsResult = ThailandDataValidator.validateFundItems(validFundItems);
console.log('Valid fund items result:', fundItemsResult);

// Test submission window
console.log('\n=== Testing Submission Window ===');

const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 2); // 2 days from now
const futureDateStr = futureDate.toISOString().split('T')[0];

const windowResult = ThailandDataValidator.checkSubmissionWindow(futureDateStr);
console.log('Submission window result:', windowResult);

console.log('\n=== All tests completed ===');