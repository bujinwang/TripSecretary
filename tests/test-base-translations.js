// Test to check baseTranslations directly
const fs = require('fs');
const code = fs.readFileSync('./app/i18n/locales.js', 'utf8');

// Find where baseTranslations is defined
const match = code.match(/const baseTranslations = \{([\s\S]*?)\n\};/);
if (!match) {
  console.log('Could not find baseTranslations definition');
  process.exit(1);
}

// Count occurrences of 'japan:' in the zh section
const zhMatch = code.match(/zh: \{([\s\S]*?)\n  \},\n/);
if (zhMatch) {
  const zhSection = zhMatch[1];
  console.log('Found zh section, length:', zhSection.length);
  
  // Count how many times 'japan' appears
  const japanMatches = zhSection.match(/japan:/g);
  console.log('Number of "japan:" occurrences:', japanMatches ? japanMatches.length : 0);
  
  // Find the japan section
  const japanMatch = zhSection.match(/japan: \{([\s\S]*?)\n      \},/);
  if (japanMatch) {
    const japanSection = japanMatch[1];
    console.log('\nJapan section length:', japanSection.length);
    
    // Count top-level keys in japan section
    const keyMatches = japanSection.match(/\n        \w+: \{/g);
    console.log('Top-level keys in japan:', keyMatches ? keyMatches.length : 0);
    if (keyMatches) {
      keyMatches.forEach(m => console.log('  -', m.trim()));
    }
    
    // Check if travelInfo exists
    const hasTravelInfo = japanSection.includes('travelInfo:');
    console.log('\nHas travelInfo:', hasTravelInfo);
    
    if (hasTravelInfo) {
      const travelInfoIndex = japanSection.indexOf('travelInfo:');
      console.log('travelInfo found at position:', travelInfoIndex);
      console.log('Context:', japanSection.substring(travelInfoIndex - 50, travelInfoIndex + 100));
    }
  } else {
    console.log('Could not find japan section in zh');
  }
}
