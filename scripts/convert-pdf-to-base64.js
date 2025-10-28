/**
 * Convert Sample PDF to Base64 Module
 *
 * Converts the sample Thailand arrival card PDF to a base64 string
 * that can be imported directly into the app, avoiding Asset API issues
 */

const fs = require('fs');
const path = require('path');

const pdfPath = path.join(__dirname, '../assets/sampleThailandArrivalCard.pdf');
const outputPath = path.join(__dirname, '../app/assets/samplePdfBase64.js');

console.log('🔄 Converting PDF to base64...\n');

if (!fs.existsSync(pdfPath)) {
  console.error('❌ ERROR: PDF file not found:', pdfPath);
  process.exit(1);
}

// Read PDF file
const pdfBuffer = fs.readFileSync(pdfPath);
const base64String = pdfBuffer.toString('base64');

console.log('✅ PDF read successfully');
console.log('   Size:', (pdfBuffer.length / 1024).toFixed(2), 'KB');
console.log('   Base64 length:', Math.round(base64String.length / 1024), 'KB');

// Create JavaScript module
const moduleContent = `/**
 * Sample Thailand Arrival Card PDF (Base64)
 *
 * This file contains the base64-encoded sample TDAC PDF
 * Auto-generated from assets/sampleThailandArrivalCard.pdf
 *
 * DO NOT EDIT MANUALLY
 * Regenerate with: node scripts/convert-pdf-to-base64.js
 */

export const SAMPLE_THAILAND_ARRIVAL_CARD_PDF_BASE64 = '${base64String}';

export default SAMPLE_THAILAND_ARRIVAL_CARD_PDF_BASE64;
`;

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write module file
fs.writeFileSync(outputPath, moduleContent, 'utf8');

console.log('✅ Base64 module created:', outputPath);
console.log('\n📝 Usage in your component:');
console.log('   import { SAMPLE_THAILAND_ARRIVAL_CARD_PDF_BASE64 } from \'../assets/samplePdfBase64\';');
console.log('');
console.log('   <PDFViewer');
console.log('     source={{ base64: SAMPLE_THAILAND_ARRIVAL_CARD_PDF_BASE64 }}');
console.log('     showWatermark={true}');
console.log('     watermarkText="SAMPLE / ตัวอย่าง"');
console.log('   />');
console.log('\n✨ Done!');
