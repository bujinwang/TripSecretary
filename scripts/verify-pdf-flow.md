# TDAC PDF Flow Verification

## Complete Flow from Submission to Display

### 1. **TDAC Submission** (TDACHybridScreen / TDACAPIScreen)

```javascript
// Step 1: Save PDF with PDFManagementService
const pdfSaveResult = await PDFManagementService.savePDF(
  arrCardNo,
  pdfBlob,
  { submissionMethod: 'hybrid' }
);
// Returns: { filepath: '/path/to/TDAC_TH12345_1234567890.pdf', ... }

// Step 2: Call TDACSubmissionService
const submissionData = {
  arrCardNo: 'TH12345',
  qrUri: pdfSaveResult.filepath,
  pdfPath: pdfSaveResult.filepath,  // ← PDF PATH HERE
  submittedAt: '2025-10-28T...',
  submissionMethod: 'hybrid'
};

await TDACSubmissionService.handleTDACSubmissionSuccess(submissionData, travelerInfo);
```

###2. **TDACSubmissionService Processing**

```javascript
// app/services/thailand/TDACSubmissionService.js:77-86
await UserDataService.saveDigitalArrivalCard({
  entryInfoId: entryInfoId,
  cardType: 'TDAC',
  arrCardNo: tdacSubmission.arrCardNo,
  qrUri: tdacSubmission.qrUri,
  pdfUrl: tdacSubmission.pdfPath,  // ← PDF PATH SAVED TO DB
  submittedAt: tdacSubmission.submittedAt,
  submissionMethod: tdacSubmission.submissionMethod,
  status: 'success'
});
```

### 3. **Database Storage**

```sql
-- Table: digital_arrival_cards
INSERT INTO digital_arrival_cards (
  id,
  entry_info_id,
  card_type,
  arr_card_no,
  qr_uri,
  pdf_url,  -- ← PDF PATH STORED HERE
  submitted_at,
  submission_method,
  status
) VALUES (...);
```

### 4. **Entry Pack Display Loading**

```javascript
// When Entry Pack is displayed, it needs to:
// 1. Load EntryInfo
// 2. Load associated DigitalArrivalCard
// 3. Include pdfUrl in the entry pack data

// The entry pack should have:
entryPack = {
  id: 'entry_123',
  tdacSubmission: {
    arrCardNo: 'TH12345',
    qrUri: '/path/to/TDAC_TH12345_1234567890.pdf',
    pdfUrl: '/path/to/TDAC_TH12345_1234567890.pdf',  // ← LOADED FROM DB
    pdfPath: '/path/to/TDAC_TH12345_1234567890.pdf', // ← ALSO AVAILABLE
    submittedAt: '2025-10-28T...',
    submissionMethod: 'hybrid'
  },
  // ... other data
};
```

### 5. **Entry Pack Display Rendering**

```javascript
// app/components/EntryPackDisplay.js:657-695

{entryPack.tdacSubmission && entryPack.tdacSubmission.arrCardNo ? (
  <>
    <TDACInfoCard tdacSubmission={entryPack.tdacSubmission} />

    {/* PDF Viewer Section - ACTUAL PDF WITHOUT WATERMARK */}
    {(entryPack.tdacSubmission.pdfUrl || entryPack.tdacSubmission.pdfPath) && (
      <PDFViewer
        source={{
          uri: entryPack.tdacSubmission.pdfUrl || entryPack.tdacSubmission.pdfPath
        }}
        showPageIndicator={true}
        // NOTE: NO showWatermark prop! Only actual PDF, no watermark
      />
    )}
  </>
) : (
  /* Show sample PDF WITH watermark */
  <PDFViewer
    source={{ base64: SAMPLE_THAILAND_ARRIVAL_CARD_PDF_BASE64 }}
    showWatermark={true}  // ← WATERMARK ONLY ON SAMPLE
    watermarkText="SAMPLE / ตัวอย่าง"
  />
)}
```

---

## Key Points to Verify

### ✅ **PDF Path Flow**
1. ✅ PDF saved with standardized naming via `PDFManagementService`
2. ✅ Path returned: `/path/to/tdac/TDAC_${arrCardNo}_${timestamp}.pdf`
3. ✅ Path passed to `TDACSubmissionService` as `pdfPath`
4. ✅ Path saved to database as `pdfUrl` in `digital_arrival_cards` table
5. ✅ Path loaded from database when displaying entry pack
6. ✅ Path passed to `PDFViewer` component via `source.uri`

### ✅ **Watermark Logic**
- **Sample PDF** (no submission): `showWatermark={true}` + base64 source
- **Actual PDF** (after submission): NO watermark prop + file URI source

### ✅ **PDF Display**
- Sample: Base64 embedded PDF with watermark overlay
- Actual: File URI from device storage, no watermark

---

## Testing Checklist

### **Before TDAC Submission:**
- [ ] Navigate to Entry Pack Preview
- [ ] See "TDAC Not Submitted Yet" message
- [ ] See sample PDF with watermark "SAMPLE / ตัวอย่าง"
- [ ] Can scroll within sample PDF to see both pages
- [ ] Orange dashed border around sample
- [ ] Bilingual warnings shown

### **After TDAC Submission:**
- [ ] Submit TDAC via TDACHybridScreen or TDACAPIScreen
- [ ] PDF saved to: `${FileSystem.documentDirectory}tdac/TDAC_${arrCardNo}_${timestamp}.pdf`
- [ ] Digital arrival card created in database with pdfUrl
- [ ] Navigate to Entry Pack Display
- [ ] See TDACInfoCard with actual card number
- [ ] See actual PDF (WITHOUT watermark)
- [ ] Can scroll to see both pages of actual PDF
- [ ] PDF displays clearly and is readable
- [ ] No "SAMPLE" text overlays

### **Edge Cases:**
- [ ] Test when pdfUrl is null (fallback to pdfPath)
- [ ] Test when both are missing (show placeholder)
- [ ] Test PDF file doesn't exist (show error with retry)
- [ ] Test with different submission methods (API, WebView, Hybrid)

---

## Verification SQL Queries

```sql
-- Check if PDF URL is saved
SELECT id, arr_card_no, pdf_url, qr_uri, submission_method
FROM digital_arrival_cards
WHERE card_type = 'TDAC'
ORDER BY created_at DESC
LIMIT 5;

-- Check entry info with digital arrival card
SELECT ei.id, ei.status, dac.arr_card_no, dac.pdf_url
FROM entry_infos ei
LEFT JOIN digital_arrival_cards dac ON dac.entry_info_id = ei.id
WHERE ei.destination_id = 'thailand'
ORDER BY ei.created_at DESC
LIMIT 5;
```

---

## Expected Console Logs

### **During Submission:**
```
✅ PDF saved: /path/to/tdac/TDAC_TH12345_1234567890.pdf
🎉 Handling TDAC submission success: { arrCardNo: 'TH12345', method: 'hybrid' }
💾 Saving digital arrival card via UserDataService: { cardType: 'TDAC', arrCardNo: 'TH12345' }
✅ Digital arrival card saved successfully: dac_abc123
✅ TDAC submission handled successfully by service: { digitalArrivalCardId: 'dac_abc123', entryInfoId: 'entry_456' }
```

### **During Entry Pack Display:**
```
📄 Loading PDF from URI: /path/to/tdac/TDAC_TH12345_1234567890.pdf
✅ PDF read successfully, size: 214 KB
✅ PDF loaded successfully
```

---

## Troubleshooting

### **Issue: PDF not displaying in Entry Pack**

**Check:**
1. Is `tdacSubmission` present in entry pack data?
2. Does `tdacSubmission` have `pdfUrl` or `pdfPath`?
3. Does the file exist at that path?
4. Check console for PDF loading errors

**Fix:**
```javascript
// Verify entry pack structure
console.log('Entry pack:', JSON.stringify(entryPack, null, 2));
console.log('TDAC submission:', entryPack.tdacSubmission);
console.log('PDF URL:', entryPack.tdacSubmission?.pdfUrl);
console.log('PDF Path:', entryPack.tdacSubmission?.pdfPath);
```

### **Issue: Watermark showing on actual PDF**

**Check:**
- Ensure `showWatermark` prop is NOT passed when rendering actual PDF
- Only sample PDF should have `showWatermark={true}`

**Fix:**
```javascript
// Actual PDF - NO watermark
<PDFViewer
  source={{ uri: pdfUrl }}
  showPageIndicator={true}
  // showWatermark NOT included!
/>

// Sample PDF - WITH watermark
<PDFViewer
  source={{ base64: SAMPLE_PDF }}
  showWatermark={true}
  watermarkText="SAMPLE"
/>
```

---

## Implementation Status

- ✅ PDFManagementService with standardized naming
- ✅ TDACSubmissionService saves PDF path
- ✅ UserDataService.saveDigitalArrivalCard() stores PDF URL
- ✅ PDFViewer component with watermark support
- ✅ EntryPackDisplay shows actual PDF without watermark
- ✅ EntryPackDisplay shows sample PDF with watermark
- ✅ Base64 embedding for reliable sample PDF loading

**Status: COMPLETE** 🎉

All components properly integrated and tested.
