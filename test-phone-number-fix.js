/**
 * Test script to debug phone number extraction issue
 * Database shows: "12341234132413"
 * Submission shows: "23412341324413"
 */

// Simulate the phone number extraction logic from ThailandTravelerContextBuilder
function extractPhoneCode(phoneNumber) {
  if (!phoneNumber) return '';

  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Extract country code
  if (cleaned.startsWith('+86') || cleaned.startsWith('86')) {
    return '86';
  } else if (cleaned.startsWith('+852') || cleaned.startsWith('852')) {
    return '852';
  } else if (cleaned.startsWith('+853') || cleaned.startsWith('853')) {
    return '853';
  } else if (cleaned.startsWith('+1') || cleaned.startsWith('1')) {
    return '1';
  } else if (cleaned.startsWith('+')) {
    // Extract first 1-3 digits after +
    const match = cleaned.match(/^\+(\d{1,3})/);
    return match ? match[1] : '';
  }

  return '';
}

function extractPhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';

  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Remove country codes
  if (cleaned.startsWith('+86') || cleaned.startsWith('86')) {
    return cleaned.replace(/^\+?86/, '');
  } else if (cleaned.startsWith('+852') || cleaned.startsWith('852')) {
    return cleaned.replace(/^\+?852/, '');
  } else if (cleaned.startsWith('+853') || cleaned.startsWith('853')) {
    return cleaned.replace(/^\+?853/, '');
  } else if (cleaned.startsWith('+1') || cleaned.startsWith('1')) {
    return cleaned.replace(/^\+?1/, '');
  } else if (cleaned.startsWith('+')) {
    // Remove any country code (1-3 digits after +)
    return cleaned.replace(/^\+\d{1,3}/, '');
  }

  return cleaned;
}

// Test with the database value
const databasePhoneNumber = "12341234132413";
console.log('=== PHONE NUMBER EXTRACTION TEST ===');
console.log('Database phone number:', databasePhoneNumber);

const phoneCode = extractPhoneCode(databasePhoneNumber);
const phoneNo = extractPhoneNumber(databasePhoneNumber);

console.log('Extracted phone code:', phoneCode);
console.log('Extracted phone number:', phoneNo);
console.log('Expected submission phone:', '23412341324413');
console.log('Actual extracted phone:', phoneNo);
console.log('Match?', phoneNo === '23412341324413');

// Test with +86 prefix
const withCountryCode = "+86" + databasePhoneNumber;
console.log('\n=== WITH +86 PREFIX ===');
console.log('With country code:', withCountryCode);
const phoneCode2 = extractPhoneCode(withCountryCode);
const phoneNo2 = extractPhoneNumber(withCountryCode);
console.log('Extracted phone code:', phoneCode2);
console.log('Extracted phone number:', phoneNo2);

// Test the expected submission value
console.log('\n=== REVERSE TEST ===');
console.log('If submission phone is correct, what should database contain?');
const expectedSubmission = '23412341324413';
const possibleDatabaseValues = [
  expectedSubmission,
  '+86' + expectedSubmission,
  '86' + expectedSubmission
];

possibleDatabaseValues.forEach(testValue => {
  const code = extractPhoneCode(testValue);
  const number = extractPhoneNumber(testValue);
  console.log(`Input: ${testValue} -> Code: ${code}, Number: ${number}`);
});