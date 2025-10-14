/**
 * Test script to verify Chinese conversion is working correctly
 */

const countryTranslations = require('./app/i18n/translations/index.js');

console.log('=== Testing Chinese Conversion ===\n');

// Test 1: Check if all variants are accessible
console.log('✓ Test 1: Checking if all Chinese variants exist...');
const variants = ['zh-CN', 'zh-TW', 'zh-HK'];
variants.forEach(variant => {
  const exists = countryTranslations[variant] !== undefined;
  console.log(`  ${variant}: ${exists ? '✓ EXISTS' : '✗ MISSING'}`);
});

// Test 2: Sample conversions
console.log('\n✓ Test 2: Sample text conversions...');

const sampleKeys = [
  'malaysia.info.title',
  'thailand.requirements.items.validPassport.title',
  'singapore.info.subtitle',
];

sampleKeys.forEach(key => {
  const keys = key.split('.');
  
  // Get values from each variant
  const getNestedValue = (obj, keys) => {
    return keys.reduce((current, key) => current?.[key], obj);
  };
  
  const zhCN = getNestedValue(countryTranslations['zh-CN'], keys);
  const zhTW = getNestedValue(countryTranslations['zh-TW'], keys);
  const zhHK = getNestedValue(countryTranslations['zh-HK'], keys);
  
  console.log(`\n  Key: ${key}`);
  console.log(`    zh-CN: ${zhCN || 'NOT FOUND'}`);
  console.log(`    zh-TW: ${zhTW || 'NOT FOUND'}`);
  console.log(`    zh-HK: ${zhHK || 'NOT FOUND'}`);
  
  if (zhCN && zhTW && zhHK) {
    const allSame = zhCN === zhTW && zhTW === zhHK;
    const converted = zhCN !== zhTW || zhCN !== zhHK;
    console.log(`    Status: ${converted ? '✓ CONVERTED' : allSame ? '⚠ NO CHANGE' : '✗ ERROR'}`);
  }
});

// Test 3: Verify common character conversions
console.log('\n✓ Test 3: Verifying common character conversions...');

const commonTests = [
  { simplified: '信息', traditional: '資訊', key: 'info' },
  { simplified: '护照', traditional: '護照', key: 'passport' },
  { simplified: '签证', traditional: '簽證', key: 'visa' },
  { simplified: '酒店', traditional: '酒店', key: 'hotel' }, // Same in both
];

const searchInObject = (obj, searchText) => {
  if (typeof obj === 'string') {
    return obj.includes(searchText);
  }
  if (Array.isArray(obj)) {
    return obj.some(item => searchInObject(item, searchText));
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj).some(val => searchInObject(val, searchText));
  }
  return false;
};

commonTests.forEach(({ simplified, traditional, key }) => {
  const foundInCN = searchInObject(countryTranslations['zh-CN'], simplified);
  const foundInTW = searchInObject(countryTranslations['zh-TW'], traditional);
  
  if (foundInCN) {
    console.log(`  "${simplified}" → "${traditional}": ${foundInTW ? '✓ CONVERTED' : '⚠ NOT FOUND IN TW'}`);
  }
});

console.log('\n=== Test Complete ===\n');

// Exit with success
process.exit(0);
