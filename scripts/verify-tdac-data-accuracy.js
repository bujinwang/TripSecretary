/**
 * TDAC Data Accuracy Verification Script
 * Analyzes the submitted TDAC data for potential issues and inconsistencies
 */

// Submitted TDAC data from the log
const submittedData = {
  "cloudflareToken": "已获取 (1093字符)",
  "email": "aaa@bbb.com",
  "familyName": "LI,",
  "middleName": "A,",
  "firstName": "MAO",
  "gender": "MALE",
  "nationality": "CHN",
  "passportNo": "E12341433",
  "birthDate": "1987-01-10",
  "occupation": "Manager",
  "cityResidence": "Anhui",
  "countryResidence": "CHN",
  "visaNo": "123412312",
  "phoneCode": "86",
  "phoneNo": "12341234132413",
  "arrivalDate": "2025-10-21",
  "departureDate": "2025-10-27",
  "countryBoarded": "",
  "recentStayCountry": "CHN",
  "purpose": "HOLIDAY",
  "travelMode": "AIR",
  "flightNo": "AC111",
  "tranModeId": "",
  "accommodationType": "HOTEL",
  "province": "BANGKOK",
  "district": "",
  "subDistrict": "",
  "postCode": "",
  "address": "Add add Adidas Dad"
};

// Expected data format based on logs
const expectedFormat = {
  familyName: "Should not have comma",
  middleName: "Should not have comma", 
  firstName: "Should be clean",
  phoneNo: "Should be reasonable length",
  address: "Should be meaningful",
  countryBoarded: "Should not be empty for international flights"
};

console.log('🔍 TDAC Data Accuracy Verification');
console.log('=====================================\n');

// Check 1: Name formatting issues
console.log('1. 👤 NAME FORMATTING ANALYSIS:');
console.log('   familyName:', `"${submittedData.familyName}"`);
console.log('   middleName:', `"${submittedData.middleName}"`);
console.log('   firstName:', `"${submittedData.firstName}"`);

const nameIssues = [];
if (submittedData.familyName.includes(',')) {
  nameIssues.push('❌ Family name contains comma - should be "LI" not "LI,"');
}
if (submittedData.middleName.includes(',')) {
  nameIssues.push('❌ Middle name contains comma - should be "A" not "A,"');
}

if (nameIssues.length > 0) {
  console.log('   🚨 ISSUES FOUND:');
  nameIssues.forEach(issue => console.log('     ', issue));
} else {
  console.log('   ✅ Names look correct');
}

// Check 2: Phone number validation
console.log('\n2. 📱 PHONE NUMBER ANALYSIS:');
console.log('   phoneCode:', submittedData.phoneCode);
console.log('   phoneNo:', submittedData.phoneNo);
console.log('   phoneNo length:', submittedData.phoneNo.length);

const phoneIssues = [];
if (submittedData.phoneNo.length > 15) {
  phoneIssues.push('❌ Phone number too long - typical mobile numbers are 11 digits for China');
}
if (submittedData.phoneNo.length < 8) {
  phoneIssues.push('❌ Phone number too short');
}

if (phoneIssues.length > 0) {
  console.log('   🚨 ISSUES FOUND:');
  phoneIssues.forEach(issue => console.log('     ', issue));
} else {
  console.log('   ✅ Phone number length acceptable');
}

// Check 3: Address validation
console.log('\n3. 🏠 ADDRESS ANALYSIS:');
console.log('   address:', `"${submittedData.address}"`);

const addressIssues = [];
if (submittedData.address === "Add add Adidas Dad") {
  addressIssues.push('❌ Address appears to be test/dummy data - not a real hotel address');
}
if (submittedData.address.length < 10) {
  addressIssues.push('❌ Address too short for a hotel address');
}

if (addressIssues.length > 0) {
  console.log('   🚨 ISSUES FOUND:');
  addressIssues.forEach(issue => console.log('     ', issue));
} else {
  console.log('   ✅ Address looks reasonable');
}

// Check 4: Travel information validation
console.log('\n4. ✈️ TRAVEL INFORMATION ANALYSIS:');
console.log('   flightNo:', submittedData.flightNo);
console.log('   countryBoarded:', `"${submittedData.countryBoarded}"`);
console.log('   arrivalDate:', submittedData.arrivalDate);
console.log('   departureDate:', submittedData.departureDate);

const travelIssues = [];
if (!submittedData.countryBoarded || submittedData.countryBoarded.trim() === '') {
  travelIssues.push('❌ Country boarded is empty - should indicate departure country');
}

// Validate flight number format
if (!/^[A-Z]{2}\d+$/.test(submittedData.flightNo)) {
  console.log('   ⚠️ Flight number format unusual - typical format is 2 letters + numbers (e.g., AC111)');
}

if (travelIssues.length > 0) {
  console.log('   🚨 ISSUES FOUND:');
  travelIssues.forEach(issue => console.log('     ', issue));
} else {
  console.log('   ✅ Travel information looks reasonable');
}

// Check 5: Date validation
console.log('\n5. 📅 DATE VALIDATION:');
const arrivalDate = new Date(submittedData.arrivalDate);
const departureDate = new Date(submittedData.departureDate);
const today = new Date();

console.log('   arrivalDate:', submittedData.arrivalDate, '(', arrivalDate.toDateString(), ')');
console.log('   departureDate:', submittedData.departureDate, '(', departureDate.toDateString(), ')');

const dateIssues = [];
if (arrivalDate < today) {
  dateIssues.push('❌ Arrival date is in the past');
}
if (departureDate <= arrivalDate) {
  dateIssues.push('❌ Departure date should be after arrival date');
}

const tripDuration = Math.ceil((departureDate - arrivalDate) / (1000 * 60 * 60 * 24));
console.log('   Trip duration:', tripDuration, 'days');

if (tripDuration > 90) {
  dateIssues.push('⚠️ Trip duration over 90 days - may require special visa');
}

if (dateIssues.length > 0) {
  console.log('   🚨 ISSUES FOUND:');
  dateIssues.forEach(issue => console.log('     ', issue));
} else {
  console.log('   ✅ Dates look reasonable');
}

// Summary
console.log('\n📊 VERIFICATION SUMMARY:');
console.log('========================');

const allIssues = [...nameIssues, ...phoneIssues, ...addressIssues, ...travelIssues, ...dateIssues];
const criticalIssues = allIssues.filter(issue => issue.includes('❌'));
const warnings = allIssues.filter(issue => issue.includes('⚠️'));

console.log('🔴 Critical Issues:', criticalIssues.length);
console.log('🟡 Warnings:', warnings.length);

if (criticalIssues.length > 0) {
  console.log('\n🚨 CRITICAL ISSUES TO FIX:');
  criticalIssues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue.replace('❌ ', '')}`);
  });
}

if (warnings.length > 0) {
  console.log('\n⚠️ WARNINGS TO REVIEW:');
  warnings.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue.replace('⚠️ ', '')}`);
  });
}

// Recommendations
console.log('\n💡 RECOMMENDATIONS:');
console.log('===================');

if (criticalIssues.length > 0) {
  console.log('1. 🔧 Fix name parsing in ThailandTravelerContextBuilder.parseFullName()');
  console.log('   - Remove trailing commas from family and middle names');
  console.log('   - Ensure clean name separation');
  
  console.log('\n2. 🔧 Validate phone number format');
  console.log('   - Check if phone number is reasonable length');
  console.log('   - Verify country code extraction');
  
  console.log('\n3. 🔧 Improve address validation');
  console.log('   - Ensure real hotel addresses are provided');
  console.log('   - Add address format validation');
  
  console.log('\n4. 🔧 Fix country boarded field');
  console.log('   - Should not be empty for international flights');
  console.log('   - Derive from departure airport or user input');
} else {
  console.log('✅ No critical issues found - data appears to be in acceptable format');
}

console.log('\n🎯 NEXT STEPS:');
console.log('==============');
console.log('1. Review and fix the identified issues in the data transformation logic');
console.log('2. Test with real user data to ensure accuracy');
console.log('3. Add validation rules to prevent similar issues');
console.log('4. Consider adding user confirmation step before submission');