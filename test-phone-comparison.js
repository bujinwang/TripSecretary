/**
 * Detailed comparison of phone numbers
 */

const databasePhone = "12341234132413";
const submissionPhone = "23412341324413";

console.log('=== DETAILED PHONE NUMBER COMPARISON ===');
console.log('Database phone: ', databasePhone);
console.log('Submission phone:', submissionPhone);
console.log('Length match:', databasePhone.length === submissionPhone.length);

console.log('\nDigit by digit comparison:');
for (let i = 0; i < Math.max(databasePhone.length, submissionPhone.length); i++) {
  const dbDigit = databasePhone[i] || '?';
  const subDigit = submissionPhone[i] || '?';
  const match = dbDigit === subDigit ? '✅' : '❌';
  console.log(`Position ${i}: DB="${dbDigit}" vs SUB="${subDigit}" ${match}`);
}

console.log('\nAnalysis:');
console.log('The phone numbers are completely different, not just a country code issue.');
console.log('This suggests either:');
console.log('1. The database contains incorrect data');
console.log('2. The submission is using data from a different source');
console.log('3. There\'s a data transformation error somewhere');

// Let's see if removing the first digit from database matches submission
const dbWithoutFirst = databasePhone.substring(1);
console.log('\nTesting if database without first digit matches submission:');
console.log('Database without first digit:', dbWithoutFirst);
console.log('Submission phone:           ', submissionPhone);
console.log('Match?', dbWithoutFirst === submissionPhone);

// Let's see if the submission is the database with +86 prefix removed incorrectly
const possibleOriginal = '86' + submissionPhone;
console.log('\nTesting if submission + 86 prefix gives us a clue:');
console.log('86 + submission:', possibleOriginal);
console.log('Database:       ', databasePhone);
console.log('Match?', possibleOriginal === databasePhone);