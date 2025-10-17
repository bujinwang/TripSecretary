// Direct test of the zh.japan object
const fs = require('fs');
const code = fs.readFileSync('./app/i18n/locales.js', 'utf8');

// Extract just the zh.japan section
const lines = code.split('\n');
let japanStart = -1;
let japanEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].match(/^\s{6}japan: \{/) && i > 1800) {  // After line 1800 to get the zh section
    japanStart = i;
    console.log('Found japan at line', i + 1);
    
    // Find the matching closing brace
    let braceCount = 0;
    for (let j = i; j < lines.length; j++) {
      const openBraces = (lines[j].match(/\{/g) || []).length;
      const closeBraces = (lines[j].match(/\}/g) || []).length;
      braceCount += openBraces - closeBraces;
      
      if (braceCount === 0 && j > i) {
        japanEnd = j;
        console.log('Japan closes at line', j + 1);
        break;
      }
    }
    break;
  }
}

if (japanStart === -1 || japanEnd === -1) {
  console.log('Could not find japan section');
  process.exit(1);
}

// Extract the japan section
const japanLines = lines.slice(japanStart, japanEnd + 1);
console.log('\nJapan section has', japanLines.length, 'lines');
console.log('First line:', japanLines[0]);
console.log('Last line:', japanLines[japanLines.length - 1]);

// Try to eval it
try {
  // Remove the "japan: " part and just eval the object
  const firstLine = japanLines[0].replace(/^\s*japan:\s*/, '');
  japanLines[0] = firstLine;
  const japanCode = 'const japan = ' + japanLines.join('\n');
  eval(japanCode);
  console.log('\nSuccessfully evaluated japan object');
  console.log('Keys:', Object.keys(japan));
  console.log('Has travelInfo?', 'travelInfo' in japan);
  if ('travelInfo' in japan) {
    console.log('travelInfo keys:', Object.keys(japan.travelInfo));
  }
} catch (error) {
  console.log('\nError evaluating japan object:', error.message);
  console.log('Error at:', error.stack);
  // Show the problematic line
  const match = error.stack.match(/<anonymous>:(\d+):/);
  if (match) {
    const lineNum = parseInt(match[1]) - 1;
    console.log('\nProblematic line', lineNum + 1, ':', japanLines[lineNum]);
  }
}
