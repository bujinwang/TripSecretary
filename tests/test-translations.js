// Test script to verify translations are working correctly
// Clear require cache to ensure fresh load
delete require.cache[require.resolve('./app/i18n/locales.js')];
const { translations } = require('./app/i18n/locales.js');

console.log('=== Translation Test ===\n');

// Test English
console.log('English (en):');
console.log('  common.back:', translations.en?.common?.back);
console.log('  japan.travelInfo.headerTitle:', translations.en?.japan?.travelInfo?.headerTitle);
console.log('  japan.travelInfo.title:', translations.en?.japan?.travelInfo?.title);
console.log('');

// Test Simplified Chinese
console.log('Simplified Chinese (zh-CN):');
console.log('  common.back:', translations['zh-CN']?.common?.back);
console.log('  japan.travelInfo.headerTitle:', translations['zh-CN']?.japan?.travelInfo?.headerTitle);
console.log('  japan.travelInfo.title:', translations['zh-CN']?.japan?.travelInfo?.title);
console.log('');

// Test Traditional Chinese
console.log('Traditional Chinese (zh-TW):');
console.log('  common.back:', translations['zh-TW']?.common?.back);
console.log('  japan.travelInfo.headerTitle:', translations['zh-TW']?.japan?.travelInfo?.headerTitle);
console.log('  japan.travelInfo.title:', translations['zh-TW']?.japan?.travelInfo?.title);
console.log('');

// Test Thailand for comparison
console.log('Thailand (zh-CN):');
console.log('  thailand.travelInfo.headerTitle:', translations['zh-CN']?.thailand?.travelInfo?.headerTitle);
console.log('  thailand.travelInfo.title:', translations['zh-CN']?.thailand?.travelInfo?.title);
console.log('');

// Check if japan section exists
console.log('Does zh-CN have japan section?', !!translations['zh-CN']?.japan);
console.log('Does zh-TW have japan section?', !!translations['zh-TW']?.japan);
console.log('');

// Check structure
const zhCNJapanKeys = Object.keys(translations['zh-CN']?.japan || {});
const zhTWJapanKeys = Object.keys(translations['zh-TW']?.japan || {});
console.log('zh-CN.japan keys (' + zhCNJapanKeys.length + '):', zhCNJapanKeys);
console.log('zh-TW.japan keys (' + zhTWJapanKeys.length + '):', zhTWJapanKeys);
console.log('');

// Deep check
console.log('Checking zh-CN.japan.travelInfo:');
const zhCNJapan = translations['zh-CN']?.japan;
if (zhCNJapan) {
  console.log('  Has travelInfo?', 'travelInfo' in zhCNJapan);
  console.log('  travelInfo value:', zhCNJapan.travelInfo);
  if (zhCNJapan.travelInfo) {
    console.log('  travelInfo.headerTitle:', zhCNJapan.travelInfo.headerTitle);
  }
}
console.log('');

console.log('Checking zh-TW.japan.travelInfo:');
const zhTWJapan = translations['zh-TW']?.japan;
if (zhTWJapan) {
  console.log('  Has travelInfo?', 'travelInfo' in zhTWJapan);
  console.log('  travelInfo value:', zhTWJapan.travelInfo);
  if (zhTWJapan.travelInfo) {
    console.log('  travelInfo.headerTitle:', zhTWJapan.travelInfo.headerTitle);
  }
}
