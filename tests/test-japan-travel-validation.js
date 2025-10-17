// Quick validation test for Japan travel info fields
// This tests the validation logic for arrivalFlightNumber, accommodationPhone, and lengthOfStay

const testValidation = () => {
  console.log('Testing Japan Travel Info Validation Logic\n');
  
  // Test arrivalFlightNumber validation
  console.log('=== Testing arrivalFlightNumber validation ===');
  const flightTests = [
    { value: 'NH123', expected: true, desc: 'Valid 2-letter + 3-digit' },
    { value: 'JAL456', expected: true, desc: 'Valid 3-letter + 3-digit' },
    { value: 'AA1', expected: true, desc: 'Valid 2-letter + 1-digit' },
    { value: 'BA9999', expected: true, desc: 'Valid 2-letter + 4-digit' },
    { value: 'A123', expected: false, desc: 'Invalid - only 1 letter' },
    { value: 'ABCD123', expected: false, desc: 'Invalid - 4 letters' },
    { value: 'NH12345', expected: false, desc: 'Invalid - 5 digits' },
    { value: 'NH', expected: false, desc: 'Invalid - no digits' },
    { value: '123NH', expected: false, desc: 'Invalid - digits first' },
    { value: '', expected: true, desc: 'Empty (allowed for progressive entry)' },
  ];
  
  const flightRegex = /^[A-Z]{2,3}\d{1,4}$/i;
  flightTests.forEach(test => {
    const result = test.value === '' || flightRegex.test(test.value.trim());
    const status = result === test.expected ? '✓' : '✗';
    console.log(`${status} ${test.desc}: "${test.value}" -> ${result}`);
  });
  
  // Test accommodationPhone validation
  console.log('\n=== Testing accommodationPhone validation ===');
  const phoneTests = [
    { value: '+81-3-1234-5678', expected: true, desc: 'Valid with country code and hyphens' },
    { value: '03-1234-5678', expected: true, desc: 'Valid local format' },
    { value: '(03) 1234 5678', expected: true, desc: 'Valid with parentheses and spaces' },
    { value: '+81312345678', expected: true, desc: 'Valid without separators' },
    { value: '1234567', expected: true, desc: 'Valid 7 digits minimum' },
    { value: '123456', expected: false, desc: 'Invalid - only 6 digits' },
    { value: 'abc-def-ghij', expected: false, desc: 'Invalid - contains letters' },
    { value: '', expected: true, desc: 'Empty (allowed for progressive entry)' },
  ];
  
  phoneTests.forEach(test => {
    const cleanPhone = test.value.replace(/[^\d+\s-()]/g, '');
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,}$/;
    const result = test.value === '' || phoneRegex.test(cleanPhone);
    const status = result === test.expected ? '✓' : '✗';
    console.log(`${status} ${test.desc}: "${test.value}" -> ${result}`);
  });
  
  // Test lengthOfStay validation
  console.log('\n=== Testing lengthOfStay validation ===');
  const stayTests = [
    { value: '1', expected: true, desc: 'Valid - 1 day' },
    { value: '7', expected: true, desc: 'Valid - 7 days' },
    { value: '30', expected: true, desc: 'Valid - 30 days' },
    { value: '90', expected: true, desc: 'Valid - 90 days' },
    { value: '180', expected: true, desc: 'Valid - 180 days (max)' },
    { value: '0', expected: false, desc: 'Invalid - zero days' },
    { value: '-5', expected: false, desc: 'Invalid - negative' },
    { value: '181', expected: false, desc: 'Invalid - exceeds 180 days' },
    { value: '365', expected: false, desc: 'Invalid - exceeds 180 days' },
    { value: 'abc', expected: false, desc: 'Invalid - not a number' },
    { value: '7.5', expected: false, desc: 'Invalid - decimal' },
    { value: '', expected: true, desc: 'Empty (allowed for progressive entry)' },
  ];
  
  stayTests.forEach(test => {
    if (test.value === '') {
      const status = test.expected ? '✓' : '✗';
      console.log(`${status} ${test.desc}: "${test.value}" -> true (empty allowed)`);
      return;
    }
    
    const stayDays = parseInt(test.value, 10);
    const result = !isNaN(stayDays) && stayDays > 0 && stayDays <= 180;
    const status = result === test.expected ? '✓' : '✗';
    console.log(`${status} ${test.desc}: "${test.value}" -> ${result}`);
  });
  
  console.log('\n=== Validation Test Complete ===');
};

testValidation();
