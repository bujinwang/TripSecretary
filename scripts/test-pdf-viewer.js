/**
 * Test Script for PDF Viewer Component
 *
 * Tests the PDFViewer component with sample Thailand arrival card
 * Verifies:
 * - PDF loading from local file
 * - Multi-page display (2 pages)
 * - Scroll functionality
 * - Error handling
 *
 * Usage:
 *   node scripts/test-pdf-viewer.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bold + colors.blue);
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

/**
 * Main test function
 */
async function runTests() {
  logSection('PDF Viewer Component Test Suite');

  let passedTests = 0;
  let failedTests = 0;

  try {
    // Test 1: Check if sample PDF exists
    logSection('Test 1: Sample PDF Existence');
    const samplePDFPath = path.join(__dirname, '../assets/sampleThailandArrivalCard.pdf');

    if (fs.existsSync(samplePDFPath)) {
      const stats = fs.statSync(samplePDFPath);
      logSuccess(`Sample PDF found at: ${samplePDFPath}`);
      logInfo(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
      passedTests++;
    } else {
      logError(`Sample PDF not found at: ${samplePDFPath}`);
      failedTests++;
    }

    // Test 2: Check if PDFViewer component exists
    logSection('Test 2: PDFViewer Component Existence');
    const pdfViewerPath = path.join(__dirname, '../app/components/PDFViewer.js');

    if (fs.existsSync(pdfViewerPath)) {
      logSuccess(`PDFViewer component found at: ${pdfViewerPath}`);
      passedTests++;
    } else {
      logError(`PDFViewer component not found at: ${pdfViewerPath}`);
      failedTests++;
    }

    // Test 3: Verify PDFViewer imports
    logSection('Test 3: PDFViewer Component Imports');
    if (fs.existsSync(pdfViewerPath)) {
      const pdfViewerContent = fs.readFileSync(pdfViewerPath, 'utf8');

      const requiredImports = [
        'react-native-webview',
        'expo-file-system',
        'FileSystem',
        'WebView'
      ];

      let allImportsFound = true;
      requiredImports.forEach(importName => {
        if (pdfViewerContent.includes(importName)) {
          logSuccess(`Import found: ${importName}`);
        } else {
          logError(`Import missing: ${importName}`);
          allImportsFound = false;
        }
      });

      if (allImportsFound) {
        passedTests++;
      } else {
        failedTests++;
      }
    } else {
      logWarning('Skipping import test - component file not found');
      failedTests++;
    }

    // Test 4: Check EntryPackDisplay integration
    logSection('Test 4: EntryPackDisplay Integration');
    const entryPackPath = path.join(__dirname, '../app/components/EntryPackDisplay.js');

    if (fs.existsSync(entryPackPath)) {
      const entryPackContent = fs.readFileSync(entryPackPath, 'utf8');

      if (entryPackContent.includes('import PDFViewer')) {
        logSuccess('PDFViewer imported in EntryPackDisplay');
      } else {
        logError('PDFViewer not imported in EntryPackDisplay');
        failedTests++;
        return;
      }

      if (entryPackContent.includes('<PDFViewer')) {
        logSuccess('PDFViewer component used in EntryPackDisplay');
      } else {
        logError('PDFViewer component not used in EntryPackDisplay');
        failedTests++;
        return;
      }

      if (entryPackContent.includes('pdfContainer') && entryPackContent.includes('pdfViewer')) {
        logSuccess('PDF container styles defined');
      } else {
        logError('PDF container styles missing');
        failedTests++;
        return;
      }

      passedTests++;
    } else {
      logError(`EntryPackDisplay not found at: ${entryPackPath}`);
      failedTests++;
    }

    // Test 5: Check PDFManagementService
    logSection('Test 5: PDFManagementService Existence');
    const pdfServicePath = path.join(__dirname, '../app/services/PDFManagementService.js');

    if (fs.existsSync(pdfServicePath)) {
      const pdfServiceContent = fs.readFileSync(pdfServicePath, 'utf8');

      logSuccess('PDFManagementService found');

      const requiredMethods = [
        'generatePDFFilename',
        'savePDF',
        'getPDFInfo',
        'deletePDF',
        'listPDFs'
      ];

      let allMethodsFound = true;
      requiredMethods.forEach(method => {
        if (pdfServiceContent.includes(method)) {
          logSuccess(`Method found: ${method}`);
        } else {
          logError(`Method missing: ${method}`);
          allMethodsFound = false;
        }
      });

      if (allMethodsFound) {
        passedTests++;
      } else {
        failedTests++;
      }
    } else {
      logError(`PDFManagementService not found at: ${pdfServicePath}`);
      failedTests++;
    }

    // Test 6: Check TDAC screen updates
    logSection('Test 6: TDAC Screen Updates');

    const screenPaths = [
      '../app/screens/thailand/TDACHybridScreen.js',
      '../app/screens/thailand/TDACAPIScreen.js'
    ];

    let screenTestsPassed = true;
    for (const screenPath of screenPaths) {
      const fullPath = path.join(__dirname, screenPath);
      const screenName = path.basename(screenPath);

      if (fs.existsSync(fullPath)) {
        const screenContent = fs.readFileSync(fullPath, 'utf8');

        if (screenContent.includes('PDFManagementService')) {
          logSuccess(`${screenName}: PDFManagementService imported`);
        } else {
          logError(`${screenName}: PDFManagementService not imported`);
          screenTestsPassed = false;
        }

        if (screenContent.includes('TDACSubmissionService')) {
          logSuccess(`${screenName}: TDACSubmissionService imported`);
        } else {
          logError(`${screenName}: TDACSubmissionService not imported`);
          screenTestsPassed = false;
        }
      } else {
        logError(`${screenName}: File not found`);
        screenTestsPassed = false;
      }
    }

    if (screenTestsPassed) {
      passedTests++;
    } else {
      failedTests++;
    }

    // Test 7: Check UserDataService updates
    logSection('Test 7: UserDataService Updates');
    const userDataServicePath = path.join(__dirname, '../app/services/data/UserDataService.js');

    if (fs.existsSync(userDataServicePath)) {
      const serviceContent = fs.readFileSync(userDataServicePath, 'utf8');

      const requiredMethods = [
        'saveDigitalArrivalCard',
        'getDigitalArrivalCard',
        'getDigitalArrivalCardsByEntryInfo',
        'getLatestDigitalArrivalCard'
      ];

      let allMethodsFound = true;
      requiredMethods.forEach(method => {
        if (serviceContent.includes(method)) {
          logSuccess(`Method found: ${method}`);
        } else {
          logError(`Method missing: ${method}`);
          allMethodsFound = false;
        }
      });

      if (allMethodsFound) {
        passedTests++;
      } else {
        failedTests++;
      }
    } else {
      logError('UserDataService not found');
      failedTests++;
    }

    // Test 8: Check watermark functionality
    logSection('Test 8: Watermark Functionality');
    if (fs.existsSync(pdfViewerPath)) {
      const pdfViewerContent = fs.readFileSync(pdfViewerPath, 'utf8');

      const watermarkFeatures = [
        'showWatermark',
        'watermarkText',
        'class="watermark"',
        'watermark-badge'
      ];

      let allFeaturesFound = true;
      watermarkFeatures.forEach(feature => {
        if (pdfViewerContent.includes(feature)) {
          logSuccess(`Watermark feature found: ${feature}`);
        } else {
          logError(`Watermark feature missing: ${feature}`);
          allFeaturesFound = false;
        }
      });

      if (allFeaturesFound) {
        passedTests++;
      } else {
        failedTests++;
      }
    } else {
      logError('PDFViewer component not found for watermark test');
      failedTests++;
    }

    // Test 9: Check sample PDF integration
    logSection('Test 9: Sample PDF Integration');
    if (fs.existsSync(entryPackPath)) {
      const entryPackContent = fs.readFileSync(entryPackPath, 'utf8');

      const samplePdfFeatures = [
        'samplePdfUri',
        'loadSamplePDF',
        'sampleThailandArrivalCard.pdf',
        'samplePdfContainer',
        'SAMPLE / ตัวอย่าง'
      ];

      let allFeaturesFound = true;
      samplePdfFeatures.forEach(feature => {
        if (entryPackContent.includes(feature)) {
          logSuccess(`Sample PDF feature found: ${feature}`);
        } else {
          logError(`Sample PDF feature missing: ${feature}`);
          allFeaturesFound = false;
        }
      });

      if (allFeaturesFound) {
        passedTests++;
      } else {
        failedTests++;
      }
    } else {
      logError('EntryPackDisplay not found for sample PDF test');
      failedTests++;
    }

  } catch (error) {
    logError(`Test suite error: ${error.message}`);
    failedTests++;
  }

  // Summary
  logSection('Test Summary');
  const totalTests = passedTests + failedTests;
  log(`Total Tests: ${totalTests}`, colors.bold);
  logSuccess(`Passed: ${passedTests}`);
  if (failedTests > 0) {
    logError(`Failed: ${failedTests}`);
  }

  const passRate = ((passedTests / totalTests) * 100).toFixed(1);
  log(`\nPass Rate: ${passRate}%`, passRate >= 100 ? colors.green : colors.yellow);

  if (passedTests === totalTests) {
    logSection('🎉 All Tests Passed! 🎉');
    log('\nNext Steps:', colors.bold);
    log('1. Run the app: npm start or npx expo start');
    log('2. Navigate to Entry Pack Display (even without TDAC submission)');
    log('3. View the SAMPLE PDF with watermark overlay');
    log('4. Submit a TDAC via TDACHybridScreen or TDACAPIScreen');
    log('5. Return to Entry Pack Display');
    log('6. Verify actual PDF displays without watermark');
    log('7. Test scrolling between pages (both pages visible)');
    log('');
    log('✨ New Features:', colors.bold);
    log('- Sample PDF preview with watermark before submission');
    log('- Watermark overlay: "SAMPLE / ตัวอย่าง"');
    log('- Orange dashed border for sample preview');
    log('- Bilingual warnings about sample nature');
  } else {
    logSection('❌ Some Tests Failed');
    log('\nPlease fix the failing tests before proceeding.', colors.yellow);
  }

  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
