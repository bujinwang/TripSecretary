# QR Code Extraction from TDAC PDF - Implementation Guide

## 📋 Overview

**Problem**: The "闪电提交" (Flash Submission) flow currently saves the **full multi-page PDF** (containing sensitive personal information) to the photo album.

**Solution**: Extract only the QR code image from the PDF and save that to photos.

---

## ✅ Phase 1: Security Fix (COMPLETED)

### What Was Fixed

1. **Removed insecure photo album save** (TDACAPIScreen.js:315)
   - Old code: `await MediaLibrary.createAssetAsync(pdfSaveResult.filepath)`
   - This saved the full PDF with passport number, name, DOB, etc. to Photos
   - **Security risk**: Sensitive data accessible in photo album

2. **Created QRCodeExtractor service structure** (app/services/QRCodeExtractor.js)
   - Placeholder for future QR extraction logic
   - Documented implementation approaches
   - Validation methods ready

3. **Updated documentation**
   - Clear TODOs for Phase 2
   - Security notes added
   - Implementation path defined

### Current Behavior

**After "闪电提交" submission:**
- ✅ Full PDF saved to: `Documents/tdac/TDAC_{cardNo}_{timestamp}.pdf`
- ✅ PDF path saved to database: `digital_arrival_cards.pdfUrl`
- ✅ PDF accessible in app for viewing
- ❌ **Nothing saved to photo album** (security improvement)
- ℹ️ Console message: "Full PDF saved to app Documents folder only (not photo album)"

---

## 🚀 Phase 2: QR Code Extraction (TODO)

### Required Dependencies

Install PDF manipulation library:

```bash
# Option 1: react-native-pdf (most popular)
npm install react-native-pdf

# Option 2: react-native-blob-util (for file operations)
npm install react-native-blob-util

# Option 3: react-native-view-shot (for capturing rendered views)
npm install react-native-view-shot

# Recommended: All three for complete solution
npm install react-native-pdf react-native-blob-util react-native-view-shot
```

### Implementation Approach

#### Method 1: Render PDF Page & Capture (Recommended)

```javascript
// app/services/QRCodeExtractor.js

import Pdf from 'react-native-pdf';
import ViewShot from 'react-native-view-shot';
import { File } from 'expo-file-system';

/**
 * Extract QR code from PDF by rendering first page
 */
static async extractQRCodeFromPDF(pdfBlob, arrCardNo) {
  try {
    // 1. Save PDF blob to temporary file
    const tempPdfPath = `${FileSystem.cacheDirectory}temp_${arrCardNo}.pdf`;
    const tempFile = new File(tempPdfPath);

    // Convert blob to Uint8Array
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    tempFile.create();
    tempFile.write(bytes);

    // 2. Render PDF first page (QR code is on first page)
    // This would be done in a hidden component
    const pdfSource = { uri: tempFile.uri };

    // 3. Capture rendered page as image
    const imageUri = await this.capturePDFPage(pdfSource);

    // 4. Crop to QR code region
    // TDAC PDFs typically have QR in top-right corner
    const qrImageUri = await this.cropToQRRegion(imageUri);

    // 5. Convert to base64
    const qrBase64 = await this.imageToBase64(qrImageUri);

    // 6. Cleanup temp files
    tempFile.delete();

    return qrBase64;

  } catch (error) {
    console.error('QR extraction failed:', error);
    return null;
  }
}

/**
 * Crop image to QR code region
 * TDAC QR codes are typically in top-right quadrant
 */
static async cropToQRRegion(imageUri) {
  const { manipulateAsync, SaveFormat } = require('expo-image-manipulator');

  // QR code estimated position on TDAC PDF
  // These values may need adjustment based on actual PDF layout
  const cropRegion = {
    originX: 400,  // pixels from left
    originY: 100,  // pixels from top
    width: 200,    // QR code width
    height: 200    // QR code height
  };

  const manipResult = await manipulateAsync(
    imageUri,
    [{ crop: cropRegion }],
    { compress: 1, format: SaveFormat.PNG }
  );

  return manipResult.uri;
}
```

#### Method 2: Canvas-Based Extraction (Alternative)

```javascript
/**
 * Use canvas to extract QR from PDF
 */
static async extractQRCodeViaCanvas(pdfBlob, arrCardNo) {
  // Requires react-native-canvas or similar
  // 1. Load PDF into canvas
  // 2. Extract pixel data from QR region
  // 3. Convert to image blob
  // 4. Return base64

  // TODO: Implement when canvas library is available
}
```

#### Method 3: API-Based Extraction (If Available)

```javascript
/**
 * Check if TDAC API provides QR code separately
 */
static async extractQRCodeFromAPI(submissionResponse) {
  // Check if TDAC API has endpoints like:
  // - GET /arrivalcard/qrcode?arrCardNo={cardNo}
  // - Response includes: { qrCodeUrl, qrCodeBase64 }

  // If available, this is the simplest approach

  // TODO: Investigate TDAC API documentation
}
```

### Integration into TDACAPIScreen.js

```javascript
// app/screens/thailand/TDACAPIScreen.js

import QRCodeExtractor from '../services/QRCodeExtractor';

const saveQRCode = async (arrCardNo, pdfBlob, result = {}) => {
  try {
    // ... existing PDF save code ...

    // NEW: Extract and save QR code to photo album
    console.log('📸 Extracting QR code from PDF...');
    const qrCodeBase64 = await QRCodeExtractor.extractQRCodeFromPDF(pdfBlob, arrCardNo);

    if (qrCodeBase64) {
      // Save QR image to temp file
      const qrImagePath = `${FileSystem.cacheDirectory}qr_${arrCardNo}.png`;
      const qrFile = new File(qrImagePath);

      // Convert base64 to bytes
      const base64Data = qrCodeBase64.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      qrFile.create();
      qrFile.write(bytes);

      // Save to photo album
      const asset = await MediaLibrary.createAssetAsync(qrFile.uri);
      await MediaLibrary.createAlbumAsync('BorderBuddy', asset, false);

      console.log('✅ QR code image saved to photo album');

      // Cleanup
      qrFile.delete();
    } else {
      console.warn('⚠️ QR code extraction failed, skipping photo album save');
    }

    return pdfSaveResult;

  } catch (error) {
    console.error('Failed to save QR code:', error);
    return null;
  }
};
```

---

## 🧪 Testing Plan

### Test 1: QR Extraction Accuracy
- [ ] Submit TDAC via "闪电提交"
- [ ] Verify QR code image is created
- [ ] Scan QR with phone camera - should decode correctly
- [ ] Compare with QR in original PDF

### Test 2: Photo Album Save
- [ ] Check photo album for QR image
- [ ] Verify only QR is saved (not full PDF)
- [ ] Verify image quality is sufficient for scanning
- [ ] Check file size (should be <100KB)

### Test 3: Security Verification
- [ ] Confirm full PDF NOT in photo album
- [ ] Confirm full PDF still in Documents folder
- [ ] Verify no sensitive data visible in QR image crop

### Test 4: Edge Cases
- [ ] Test when PDF download fails
- [ ] Test when QR extraction fails (should skip photo save)
- [ ] Test when photo permissions denied
- [ ] Test with different arrival card layouts

---

## 📐 QR Code Position Detection

### Automatic Detection (Advanced)

```javascript
/**
 * Automatically detect QR code position in PDF page
 */
static async detectQRPosition(imageUri) {
  // Use image processing to find QR code
  // 1. Convert to grayscale
  // 2. Apply edge detection
  // 3. Find square patterns (QR codes are square)
  // 4. Return bounding box

  // Libraries that can help:
  // - react-native-opencv
  // - jsqr (JavaScript QR detection)

  return { x, y, width, height };
}
```

### Manual Position Definition (Simpler)

Based on TDAC PDF analysis:
- **First page**: Personal information + QR code
- **Second page**: Additional details
- **QR location**: Top-right corner
- **Estimated coordinates**: (400, 100, 200, 200) in pixels at 300 DPI

---

## 🔧 Troubleshooting

### Issue: "Cannot read PDF blob"
- Check blob format and size
- Verify PDF is valid (try opening in app first)
- Ensure temp file permissions are correct

### Issue: "QR code crop is wrong"
- Adjust crop coordinates in `cropToQRRegion()`
- Test with different TDAC PDFs to find common position
- Consider implementing automatic QR detection

### Issue: "Scanned QR doesn't work"
- Increase crop area to include full QR + quiet zone
- Verify image resolution is sufficient (minimum 200x200px)
- Check if image is too compressed

---

## 📊 Performance Expectations

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| PDF render | 1-2 seconds | First page only |
| Image crop | <500ms | Simple region crop |
| Save to photos | <1 second | Small PNG file |
| **Total** | **2-3 seconds** | Acceptable UX |

---

## 🎯 Success Criteria

Phase 2 is complete when:
- [ ] QR code successfully extracted from PDF
- [ ] Only QR image saved to photo album (not full PDF)
- [ ] QR code scannable at immigration
- [ ] No sensitive data exposed in photo album
- [ ] Clear user feedback during extraction
- [ ] Graceful fallback if extraction fails
- [ ] All tests pass
- [ ] Code documented and maintainable

---

## 📝 Implementation Checklist

### Step 1: Dependencies
- [ ] Install `react-native-pdf`
- [ ] Install `react-native-view-shot`
- [ ] Install `expo-image-manipulator` (if not already)
- [ ] Test library compatibility with Expo

### Step 2: Core Logic
- [ ] Implement `extractQRCodeFromPDF()` in QRCodeExtractor
- [ ] Implement `cropToQRRegion()` with coordinates
- [ ] Implement `imageToBase64()` helper
- [ ] Add error handling and logging

### Step 3: Integration
- [ ] Update `saveQRCode()` in TDACAPIScreen
- [ ] Add QR extraction call after PDF save
- [ ] Add user feedback (loading indicator)
- [ ] Update success message

### Step 4: Testing
- [ ] Unit tests for QRCodeExtractor methods
- [ ] Integration test for full flow
- [ ] Manual testing on real device
- [ ] Test different TDAC PDF formats

### Step 5: Polish
- [ ] Add progress indicators
- [ ] Add retry logic for failures
- [ ] Update user-facing messages
- [ ] Document in user guide

---

## 📚 References

- [react-native-pdf Documentation](https://github.com/wonday/react-native-pdf)
- [expo-image-manipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)
- [MediaLibrary API](https://docs.expo.dev/versions/latest/sdk/media-library/)
- [QR Code Specifications](https://www.qrcode.com/en/about/standards.html)

---

**Status**: Phase 1 Complete ✅ | Phase 2 Ready to Implement ⏳

**Estimated Phase 2 Time**: 4-6 hours of development + testing
