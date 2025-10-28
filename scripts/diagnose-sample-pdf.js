/**
 * Diagnostic Script for Sample PDF Loading
 *
 * Checks if the sample PDF exists and can be accessed
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing Sample PDF Issue...\n');

const pdfPath = path.join(__dirname, '../assets/sampleThailandArrivalCard.pdf');

console.log('📁 Checking PDF file:');
console.log('   Path:', pdfPath);

if (fs.existsSync(pdfPath)) {
  const stats = fs.statSync(pdfPath);
  console.log('   ✅ File exists');
  console.log('   📊 Size:', (stats.size / 1024).toFixed(2), 'KB');
  console.log('   📅 Modified:', stats.mtime.toISOString());

  // Read first few bytes to verify it's a valid PDF
  const buffer = fs.readFileSync(pdfPath);
  const header = buffer.slice(0, 5).toString();

  if (header === '%PDF-') {
    console.log('   ✅ Valid PDF file (header: %PDF-)');
  } else {
    console.log('   ❌ Invalid PDF file (header:', header, ')');
  }

  console.log('\n💡 Recommendations:');
  console.log('   1. The PDF file exists and appears valid');
  console.log('   2. The issue is with Expo Asset API not loading it properly');
  console.log('   3. Options to fix:');
  console.log('      a) Add PDF to assetBundlePatterns in app.json');
  console.log('      b) Use a web URL instead');
  console.log('      c) Convert to base64 and embed directly');
  console.log('      d) Copy to public directory (for web)');

  console.log('\n🔧 Suggested Fix:');
  console.log('   Add to app.json:');
  console.log('   {');
  console.log('     "expo": {');
  console.log('       "assetBundlePatterns": [');
  console.log('         "**/*",');
  console.log('         "assets/**/*.pdf"');
  console.log('       ]');
  console.log('     }');
  console.log('   }');

} else {
  console.log('   ❌ File NOT found!');
  console.log('\n❌ ERROR: Sample PDF is missing!');
  console.log('   Expected location:', pdfPath);
}
