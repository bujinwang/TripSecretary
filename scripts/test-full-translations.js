/**
 * Comprehensive test for all Chinese translations (main + country-specific)
 */

const { translations } = require('./app/i18n/locales.js');

console.log('=== Full Translation System Test ===\n');

// Test 1: Check structure
console.log('✓ Test 1: Translation structure check');
const requiredKeys = ['en', 'zh', 'zh-CN', 'zh-TW', 'zh-HK', 'fr', 'de', 'es'];
requiredKeys.forEach(key => {
  const exists = translations[key] !== undefined;
  console.log(`  ${key.padEnd(8)}: ${exists ? '✓' : '✗'}`);
});

// Test 2: Main translations (common strings)
console.log('\n✓ Test 2: Main translation conversions');
const mainKeys = [
  'common.appName',
  'common.ok',
  'tabs.home',
  'profile.passport.title',
];

mainKeys.forEach(key => {
  const keys = key.split('.');
  const getVal = (obj, keys) => keys.reduce((curr, k) => curr?.[k], obj);
  
  const zhCN = getVal(translations['zh-CN'], keys);
  const zhTW = getVal(translations['zh-TW'], keys);
  const zhHK = getVal(translations['zh-HK'], keys);
  
  if (zhCN || zhTW || zhHK) {
    console.log(`\n  ${key}:`);
    if (zhCN) console.log(`    zh-CN: ${zhCN}`);
    if (zhTW) console.log(`    zh-TW: ${zhTW}`);
    if (zhHK) console.log(`    zh-HK: ${zhHK}`);
    
    const converted = (zhCN !== zhTW) || (zhCN !== zhHK);
    if (zhCN && zhTW && zhHK) {
      console.log(`    ${converted ? '✓ CONVERTED' : '⚠ NO CHANGE'}`);
    }
  } else {
    console.log(`\n  ${key}: ⚠ NOT FOUND`);
  }
});

// Test 3: Country-specific translations
console.log('\n✓ Test 3: Country-specific translations');
const countryKeys = [
  'malaysia.info.title',
  'singapore.requirements.headerTitle',
  'thailand.info.subtitle',
];

countryKeys.forEach(key => {
  const keys = key.split('.');
  const getVal = (obj, keys) => keys.reduce((curr, k) => curr?.[k], obj);
  
  const zhCN = getVal(translations['zh-CN'], keys);
  const zhTW = getVal(translations['zh-TW'], keys);
  
  if (zhCN && zhTW) {
    const converted = zhCN !== zhTW;
    console.log(`  ${key}: ${converted ? '✓' : '⚠'}`);
  } else {
    console.log(`  ${key}: ✗ MISSING`);
  }
});

// Test 4: Verify specific character conversions
console.log('\n✓ Test 4: Character conversion verification');
const conversionTests = [
  { simplified: '护照', traditional: '護照', name: 'passport' },
  { simplified: '签证', traditional: '簽證', name: 'visa' },
  { simplified: '入境', traditional: '入境', name: 'entry (same)' },
];

conversionTests.forEach(({ simplified, traditional, name }) => {
  // Search in zh-CN for simplified
  const zhCNStr = JSON.stringify(translations['zh-CN']).substring(0, 50000);
  const zhTWStr = JSON.stringify(translations['zh-TW']).substring(0, 50000);
  
  const foundSimplified = zhCNStr.includes(simplified);
  const foundTraditional = zhTWStr.includes(traditional);
  
  const status = (foundSimplified && foundTraditional) ? '✓' : 
                 (foundSimplified && !foundTraditional) ? '⚠' : '✗';
  
  console.log(`  ${name} (${simplified}→${traditional}): ${status}`);
});

// Test 5: Performance check
console.log('\n✓ Test 5: Lazy loading performance');
const start = Date.now();
const _ = translations['zh-TW'];
const firstAccess = Date.now() - start;

const start2 = Date.now();
const _2 = translations['zh-TW'];
const secondAccess = Date.now() - start2;

console.log(`  First access (conversion): ${firstAccess}ms`);
console.log(`  Second access (cached): ${secondAccess}ms`);
console.log(`  ${firstAccess > secondAccess ? '✓ Caching works' : '⚠ Check caching'}`);

console.log('\n=== All Tests Complete ===\n');
