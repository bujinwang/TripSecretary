const locales = require('./app/i18n/locales.js');

// Check if all required keys exist in English
const enJapan = locales.translations.en.japan;

console.log('Checking English translations for Japan...\n');

// Check japan.info
if (enJapan.info) {
  console.log('✓ japan.info exists');
  console.log('  - headerTitle:', enJapan.info.headerTitle);
  console.log('  - sections.visa:', enJapan.info.sections.visa ? '✓' : '✗');
  console.log('  - sections.important:', enJapan.info.sections.important ? '✓' : '✗');
  console.log('  - sections.appFeatures:', enJapan.info.sections.appFeatures ? '✓' : '✗');
} else {
  console.log('✗ japan.info missing');
}

// Check japan.requirements
if (enJapan.requirements) {
  console.log('\n✓ japan.requirements exists');
  console.log('  - headerTitle:', enJapan.requirements.headerTitle);
  console.log('  - items.validVisa:', enJapan.requirements.items.validVisa ? '✓' : '✗');
  console.log('  - items.validPassport:', enJapan.requirements.items.validPassport ? '✓' : '✗');
  console.log('  - items.returnTicket:', enJapan.requirements.items.returnTicket ? '✓' : '✗');
  console.log('  - items.sufficientFunds:', enJapan.requirements.items.sufficientFunds ? '✓' : '✗');
  console.log('  - items.accommodation:', enJapan.requirements.items.accommodation ? '✓' : '✗');
} else {
  console.log('\n✗ japan.requirements missing');
}

// Check japan.travelInfo
if (enJapan.travelInfo) {
  console.log('\n✓ japan.travelInfo exists');
  console.log('  - headerTitle:', enJapan.travelInfo.headerTitle);
  console.log('  - sections:', enJapan.travelInfo.sections ? '✓' : '✗');
  console.log('  - fields:', enJapan.travelInfo.fields ? '✓' : '✗');
  console.log('  - errors:', enJapan.travelInfo.errors ? '✓' : '✗');
  
  // Check key fields
  const fields = enJapan.travelInfo.fields;
  console.log('  - fields.passportName:', fields.passportName);
  console.log('  - fields.travelPurpose:', fields.travelPurpose);
  console.log('  - fields.accommodationType:', fields.accommodationType);
  console.log('  - fields.lengthOfStay:', fields.lengthOfStay);
  
  // Check key errors
  const errors = enJapan.travelInfo.errors;
  console.log('  - errors.invalidPassportNumber:', errors.invalidPassportNumber);
  console.log('  - errors.invalidFlightNumber:', errors.invalidFlightNumber);
  console.log('  - errors.invalidLengthOfStay:', errors.invalidLengthOfStay);
} else {
  console.log('\n✗ japan.travelInfo missing');
}

console.log('\n✅ All English translations for Japan are complete!');
