/**
 * TDAC Dropdown IDs Extraction from HAR File
 * Complete mapping of all form field IDs from the TDAC API
 */

console.log('🔍 TDAC Complete Dropdown IDs Extraction');
console.log('========================================\n');

// Extracted from HAR file: scripts/tdac.immigration.go.th1.har
const tdacDropdownData = {
  
  // Gender Options
  gender: [
    { key: "JGb85pWhehCWn5EM6PeL5A==", value: "FEMALE" },
    { key: "g5iW15ADyFWOAxDewREkVA==", value: "MALE" },
    { key: "W6iZt0z/ayaCvyGt6LXKIA==", value: "UNDEFINED" }
  ],

  // Travel Mode (General)
  travelMode: [
    { key: "ZUSsbcDrA+GoD4mQxvf7Ag==", value: "AIR" },
    { key: "roui+vydIOBtjzLaEq6hCg==", value: "LAND" },
    { key: "kFiGEpiBus5ZgYvP6i3CNQ==", value: "SEA" }
  ],

  // Transport Mode (Specific - Air Transport Subtypes)
  transportMode: [
    { key: "6XcrGmsUxFe9ua1gehBv/Q==", code: "2", value: "COMMERCIAL FLIGHT" },
    { key: "yYdaVPLIpwqddAuVOLDorQ==", code: "1", value: "PRIVATE/CARGO AIRLINE" },
    { key: "mhapxYyzDmGnIyuZ0XgD8Q==", code: "99", value: "OTHERS (PLEASE SPECIFY)" }
  ],

  // Accommodation Types
  accommodation: [
    { key: "kSqK152aNAx9HQigxwgnUg==", code: "01", value: "HOTEL" },
    { key: "Bsldsb4eRsgtHy+rwxGvyQ==", code: "02", value: "YOUTH HOSTEL" },
    { key: "xyft2pbI953g9FKKER4OZw==", code: "03", value: "GUEST HOUSE" },
    { key: "ze+djQZsddZtZdi37G7mZg==", code: "04", value: "FRIEND'S HOUSE" },
    { key: "PUB3ud2M4eOVGBmCEe4q2Q==", code: "05", value: "APARTMENT" },
    { key: "lIaJ6Z7teVjIeRF2RT97Hw==", code: "99", value: "OTHERS (PLEASE SPECIFY)" }
  ],

  // Purpose of Travel
  purpose: [
    { key: "ZUSsbcDrA+GoD4mQxvf7Ag==", code: "01", value: "HOLIDAY" },
    { key: "roui+vydIOBtjzLaEq6hCg==", code: "02", value: "MEETING" },
    { key: "kFiGEpiBus5ZgYvP6i3CNQ==", code: "03", value: "SPORTS" },
    { key: "//wEUc0hKyGLuN5vojDBgA==", code: "04", value: "BUSINESS" },
    { key: "g3Kfs7hn033IoeTa5VYrKQ==", code: "05", value: "INCENTIVE" },
    { key: "Khu8eZW5Xt/2dVTwRTc7oA==", code: "06", value: "MEDICAL & WELLNESS" },
    { key: "/LDehQQnXbGFGUe2mSC2lw==", code: "07", value: "EDUCATION" },
    { key: "a7NwNw5YbtyIQQClpkDxiQ==", code: "08", value: "CONVENTION" },
    { key: "MIIPKOQBf05A/1ueNg8gSA==", code: "10", value: "EMPLOYMENT" },
    { key: "DeSHtTxpXJk+XIG5nUlW6w==", code: "11", value: "EXHIBITION" },
    { key: "J4Ru2J4RqpnDSHeA0k32PQ==", code: "99", value: "OTHERS (PLEASE SPECIFY)" }
  ],

  // Vaccination Certificate
  vaccinationCert: [
    { key: "wH/wyuuJdYgu+nPbPD22xg==", value: "YES" },
    { key: "0iZOoF/WBrkCPjDjN7ntjQ==", value: "NO" }
  ],

  // Health Symptoms
  symptoms: [
    { key: "ZUSsbcDrA+GoD4mQxvf7Ag==", code: "N", value: "Diarrhea" },
    { key: "roui+vydIOBtjzLaEq6hCg==", code: "N", value: "Vomiting" },
    { key: "kFiGEpiBus5ZgYvP6i3CNQ==", code: "N", value: "Abdominal pain" },
    { key: "//wEUc0hKyGLuN5vojDBgA==", code: "N", value: "Fever" },
    { key: "g3Kfs7hn033IoeTa5VYrKQ==", code: "N", value: "Rash" },
    { key: "Khu8eZW5Xt/2dVTwRTc7oA==", code: "N", value: "Headache" },
    { key: "/LDehQQnXbGFGUe2mSC2lw==", code: "N", value: "Sore throat" },
    { key: "a7NwNw5YbtyIQQClpkDxiQ==", code: "N", value: "Jaundice" },
    { key: "9imS1wnlptm0lhHV9ggvDA==", code: "N", value: "Cough or shortness of breath" },
    { key: "MIIPKOQBf05A/1ueNg8gSA==", code: "N", value: "Enlarge lymph glands or tender lumps" },
    { key: "DeSHtTxpXJk+XIG5nUlW6w==", code: "N", value: "No Symptom" },
    { key: "J4Ru2J4RqpnDSHeA0k32PQ==", code: "Y", value: "Other (Please Specify)" }
  ],

  // Nationality (Sample - China related)
  nationality: [
    { key: "n8NVa/feQ+F5Ok859Oywuw==", code: "45", value: "CHN : PEOPLE'S REPUBLIC OF CHINA" },
    { key: "g6ud3ID/+b3U95emMTZsBw==", value: "HKG : CHINESE - HONG KONG" },
    { key: "6H4SM3pACzdpLaJx/SR7sg==", value: "MAC : CHINESE - MACAO" }
  ]
};

console.log('📋 COMPLETE TDAC DROPDOWN MAPPINGS:');
console.log('===================================\n');

Object.entries(tdacDropdownData).forEach(([category, options]) => {
  console.log(`${category.toUpperCase()}:`);
  console.log('─'.repeat(category.length + 1));
  
  options.forEach((option, index) => {
    const codeStr = option.code ? ` (code: ${option.code})` : '';
    console.log(`  ${index + 1}. ${option.value}${codeStr}`);
    console.log(`     ID: ${option.key}`);
  });
  console.log('');
});

console.log('🎯 KEY FINDINGS:');
console.log('================');

console.log('\n1. 🛩️ TRANSPORT MODE (Air Travel Subtypes):');
console.log('   ✅ Commercial Flight: 6XcrGmsUxFe9ua1gehBv/Q==');
console.log('   ✅ Private/Cargo Airline: yYdaVPLIpwqddAuVOLDorQ==');
console.log('   ✅ Others: mhapxYyzDmGnIyuZ0XgD8Q==');

console.log('\n2. 👤 GENDER:');
console.log('   ✅ Male: g5iW15ADyFWOAxDewREkVA==');
console.log('   ✅ Female: JGb85pWhehCWn5EM6PeL5A==');
console.log('   ✅ Undefined: W6iZt0z/ayaCvyGt6LXKIA==');

console.log('\n3. 🏨 ACCOMMODATION:');
console.log('   ✅ Hotel: kSqK152aNAx9HQigxwgnUg==');
console.log('   ✅ Guest House: xyft2pbI953g9FKKER4OZw==');
console.log('   ✅ Friend\'s House: ze+djQZsddZtZdi37G7mZg==');
console.log('   ✅ Apartment: PUB3ud2M4eOVGBmCEe4q2Q==');

console.log('\n4. 🎯 PURPOSE OF TRAVEL:');
console.log('   ✅ Holiday: ZUSsbcDrA+GoD4mQxvf7Ag==');
console.log('   ✅ Business: //wEUc0hKyGLuN5vojDBgA==');
console.log('   ✅ Meeting: roui+vydIOBtjzLaEq6hCg==');
console.log('   ✅ Education: /LDehQQnXbGFGUe2mSC2lw==');

console.log('\n5. 🌍 NATIONALITY:');
console.log('   ✅ China: n8NVa/feQ+F5Ok859Oywuw==');
console.log('   ✅ Hong Kong: g6ud3ID/+b3U95emMTZsBw==');
console.log('   ✅ Macao: 6H4SM3pACzdpLaJx/SR7sg==');

console.log('\n💡 IMPLEMENTATION RECOMMENDATIONS:');
console.log('==================================');

console.log('\n1. 🔧 Update ThailandTravelerContextBuilder:');
console.log('   • Add gender transformation method');
console.log('   • Add accommodation type mapping');
console.log('   • Add purpose transformation');
console.log('   • Add nationality mapping');

console.log('\n2. 🎯 Priority Updates:');
console.log('   • Transport Mode: ✅ Already implemented');
console.log('   • Gender: 🔄 Needs implementation');
console.log('   • Accommodation: 🔄 Needs implementation');
console.log('   • Purpose: 🔄 Needs implementation');

console.log('\n3. 📊 Data Quality Improvements:');
console.log('   • Use specific encoded IDs instead of strings');
console.log('   • Add validation for all dropdown selections');
console.log('   • Implement fallback logic for each category');

console.log('\n🚀 NEXT STEPS:');
console.log('==============');

const nextSteps = [
  'Update getTransportModeId() with all air transport subtypes',
  'Add getGenderId() method with proper gender mapping',
  'Add getAccommodationTypeId() method',
  'Add getPurposeId() method with all travel purposes',
  'Add getNationalityId() method',
  'Update validation to use encoded IDs',
  'Test all mappings with real TDAC submissions'
];

nextSteps.forEach((step, index) => {
  console.log(`${index + 1}. ${step}`);
});

console.log('\n🎉 COMPLETE DROPDOWN DATA EXTRACTED!');
console.log('====================================');
console.log('All major TDAC form dropdown IDs have been successfully extracted');
console.log('from the HAR file and are ready for implementation.');

// Export the data for use in implementation
console.log('\n📝 JAVASCRIPT OBJECT FOR IMPLEMENTATION:');
console.log('=======================================');
console.log('const TDAC_DROPDOWN_IDS = ');
console.log(JSON.stringify(tdacDropdownData, null, 2));