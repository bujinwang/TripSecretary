/**
 * Analysis and fix for phone number storage issue
 * 
 * PROBLEM IDENTIFIED:
 * The system stores phone numbers in two separate fields:
 * 1. encrypted_phone_number: The actual phone number (e.g., "12341234132413")
 * 2. phone_code: The country code (e.g., "+86")
 * 
 * But ThailandTravelerContextBuilder tries to extract both from phoneNumber field alone.
 * This causes incorrect parsing and data mismatch.
 * 
 * SOLUTION:
 * 1. Update phone number input to always store complete phone number with country code
 * 2. Fix ThailandTravelerContextBuilder to use both phoneCode and phoneNumber fields
 * 3. Ensure phone number validation and storage is consistent
 */

console.log('=== PHONE NUMBER STORAGE ANALYSIS ===');

// Current database structure (from SecureStorageService)
const databaseSchema = {
  personal_info: {
    encrypted_phone_number: "12341234132413", // Just the number part
    phone_code: "+86", // Country code
    // Other fields...
  }
};

// Current ThailandTravelerContextBuilder logic (INCORRECT)
const currentLogic = {
  phoneCode: "extractPhoneCode(personalInfo?.phoneNumber)", // Tries to extract from number
  phoneNo: "extractPhoneNumber(personalInfo?.phoneNumber)" // Tries to extract from number
};

// CORRECT logic should be:
const correctLogic = {
  phoneCode: "personalInfo?.phoneCode || extractPhoneCode(personalInfo?.phoneNumber)",
  phoneNo: "personalInfo?.phoneNumber || extractPhoneNumber(personalInfo?.phoneNumber)"
};

console.log('Database schema:', databaseSchema);
console.log('Current (incorrect) logic:', currentLogic);
console.log('Correct logic:', correctLogic);

console.log('\n=== RECOMMENDATIONS ===');
console.log('1. Fix ThailandTravelerContextBuilder to use phoneCode field directly');
console.log('2. Update phone input to store complete phone number with country code');
console.log('3. Ensure phone validation handles international formats properly');
console.log('4. Update phone extraction logic to be more robust');

// Test the correct approach
function getPhoneDataCorrectly(personalInfo) {
  // Use phoneCode field directly if available
  let phoneCode = personalInfo?.phoneCode || '';
  let phoneNumber = personalInfo?.phoneNumber || '';
  
  // Clean up phone code (remove + if present for TDAC format)
  if (phoneCode.startsWith('+')) {
    phoneCode = phoneCode.substring(1);
  }
  
  // If no phoneCode but phoneNumber contains country code, extract it
  if (!phoneCode && phoneNumber) {
    // Try to extract country code from full number
    if (phoneNumber.startsWith('+86') || phoneNumber.startsWith('86')) {
      phoneCode = '86';
      phoneNumber = phoneNumber.replace(/^\+?86/, '');
    } else if (phoneNumber.startsWith('+1') || (phoneNumber.startsWith('1') && phoneNumber.length > 11)) {
      phoneCode = '1';
      phoneNumber = phoneNumber.replace(/^\+?1/, '');
    }
    // Add more country codes as needed
  }
  
  return {
    phoneCode,
    phoneNo: phoneNumber
  };
}

// Test with database data
const testPersonalInfo = {
  phoneNumber: "12341234132413",
  phoneCode: "+86"
};

const result = getPhoneDataCorrectly(testPersonalInfo);
console.log('\n=== TEST RESULT ===');
console.log('Input:', testPersonalInfo);
console.log('Output:', result);
console.log('Expected TDAC submission phoneCode:', '86');
console.log('Expected TDAC submission phoneNo:', '12341234132413');
console.log('Matches expected?', result.phoneCode === '86' && result.phoneNo === '12341234132413');