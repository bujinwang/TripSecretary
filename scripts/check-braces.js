// Check brace balance in the japan section
const fs = require('fs');
const lines = fs.readFileSync('./app/i18n/locales.js', 'utf8').split('\n');

// Find the start of zh.japan
let japanStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === 'zh: {') {
    console.log('Found zh: { at line', i + 1);
    // Now find japan: { after this
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].match(/^\s{6}japan: \{/)) {
        japanStart = j;
        console.log('Found japan: { at line', j + 1);
        break;
      }
    }
    break;
  }
}

if (japanStart === -1) {
  console.log('Could not find japan section');
  process.exit(1);
}

// Count braces from japanStart until we find the matching closing brace
let braceCount = 0;
let japanEnd = -1;
const baseIndent = lines[japanStart].match(/^(\s*)/)[1].length;

console.log('\nBase indent:', baseIndent, 'spaces');
console.log('Starting brace count from line', japanStart + 1);

for (let i = japanStart; i < Math.min(japanStart + 500, lines.length); i++) {
  const line = lines[i];
  const indent = line.match(/^(\s*)/)[1].length;
  
  // Count opening braces
  const openBraces = (line.match(/\{/g) || []).length;
  const closeBraces = (line.match(/\}/g) || []).length;
  
  braceCount += openBraces - closeBraces;
  
  if (i < japanStart + 20 || (braceCount <= 1 && i > japanStart)) {
    console.log(`Line ${i + 1} (indent ${indent}): ${line.substring(0, 60)} | braces: ${braceCount}`);
  }
  
  // If we're back to 0 braces and at the same indent level, we found the end
  if (braceCount === 0 && i > japanStart) {
    japanEnd = i;
    console.log('\nFound matching closing brace at line', i + 1);
    console.log('Japan section spans lines', japanStart + 1, 'to', japanEnd + 1);
    break;
  }
}

if (japanEnd === -1) {
  console.log('\nWARNING: Could not find matching closing brace!');
  console.log('Final brace count:', braceCount);
}

// Check what comes after japan
if (japanEnd !== -1 && japanEnd + 1 < lines.length) {
  console.log('\nNext few lines after japan closes:');
  for (let i = japanEnd; i < Math.min(japanEnd + 5, lines.length); i++) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}
