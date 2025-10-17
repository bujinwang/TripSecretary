// Count braces in detail
const fs = require('fs');
const lines = fs.readFileSync('./app/i18n/locales.js', 'utf8').split('\n');

let japanStart = 2308;  // Line 2309 (0-indexed)
let japanEnd = 2565;    // Line 2566 (0-indexed)

console.log('Analyzing lines', japanStart + 1, 'to', japanEnd + 1);

let totalOpen = 0;
let totalClose = 0;

for (let i = japanStart; i <= japanEnd; i++) {
  const line = lines[i];
  const openBraces = (line.match(/\{/g) || []).length;
  const closeBraces = (line.match(/\}/g) || []).length;
  
  totalOpen += openBraces;
  totalClose += closeBraces;
}

console.log('Total opening braces:', totalOpen);
console.log('Total closing braces:', totalClose);
console.log('Difference:', totalOpen - totalClose);

if (totalOpen !== totalClose) {
  console.log('\nWARNING: Braces are not balanced!');
  console.log('Missing', totalOpen - totalClose, 'closing braces');
}
