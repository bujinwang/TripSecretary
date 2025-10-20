/**
 * Test script to verify the phone number extraction fix
 */

// Updated phone number extraction logic
function extractPhoneCode(phoneNumber) {
  if (!phoneNumber) return '';

  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Extract country code - be more specific to avoid false matches
  if (cleaned.startsWith('+86')) {
    return '86';
  } else if (cleaned.startsWith('86') && cleaned.length > 13) {
    // Only treat as country code if it's a long number (86 + 11+ digits)
    return '86';
  } else if (cleaned.startsWith('+852') || cleaned.startsWith('852')) {
    return '852';
  } else if (cleaned.startsWith('+853') || cleaned.startsWith('853')) {
    return '853';
  } else if (cleaned.startsWith('+1')) {
    return '1';
  } else if (cleaned.startsWith('1') && cleaned.length > 11) {
    // Only treat as US/Canada code if it's a long number (1 + 10+ digits)
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
  
  // Remove country codes - be more specific to avoid false matches
  if (cleaned.startsWith('+86')) {
    return cleaned.replace(/^\+86/, '');
  } else if (cleaned.startsWith('86') && cleaned.length > 13) {
    // Only treat as country code if it's a long number (86 + 11+ digits)
    return cleaned.replace(/^86/, '');
  } else if (cleaned.startsWith('+852') || cleaned.startsWith('852')) {
    return cleaned.replace(/^\+?852/, '');
  } else if (cleaned.startsWith('+853') || cleaned.startsWith('853')) {
    return cleaned.replace(/^\+?853/, '');
  } else if (cleaned.startsWith('+1')) {
    return cleaned.replace(/^\+1/, '');
  } else if (cleaned.startsWith('1') && cleaned.length > 11) {
    // Only treat as US/Canada code if it's a long number (1 + 10+ digits)
    return cleaned.replace(/^1/, '');
  } else if (cleaned.startsWith('+')) {
    // Remove any country code (1-3 digits after +)
    return cleaned.replace(/^\+\d{1,3}/, '');
  }

  return cleaned;
}

// Test with the database value
const databasePhoneNumber = "12341234132413";
console.log('=== UPDATED PHONE NUMBER EXTRACTION TEST ===');
console.log('Database phone number:', databasePhoneNumber);
console.log('Length:', databasePhoneNumber.length);

const phoneCode = extractPhoneCode(databasePhoneNumber);
const phoneNo = extractPhoneNumber(databasePhoneNumber);

console.log('Extracted phone code:', phoneCode);
console.log('Extracted phone number:', phoneNo);
console.log('Expected submission phone:', '23412341324413');
console.log('Actual extracted phone:', phoneNo);
console.log('Match?', phoneNo === '23412341324413');

// Test edge cases
console.log('\n=== EDGE CASE TESTS ===');
const testCases = [
  "12341234132413",      // Database value (14 digits, starts with 1)
  "8612341234132413",    // With 86 prefix (16 digits)
  "+8612341234132413",   // With +86 prefix
  "123456789012",        // 12 digits starting with 1 (should not remove 1)
  "1234567890123",       // 13 digits starting with 1 (should remove 1)
  "12345678901234"       // 14 digits starting with 1 (should remove 1)
];

testCases.forEach(testPhone => {
  const code = extractPhoneCode(testPhone);
  const number = extractPhoneNumber(testPhone);
  console.log(`${testPhone} (${testPhone.length} digits) -> Code: "${code}", Number: "${number}"`);
});