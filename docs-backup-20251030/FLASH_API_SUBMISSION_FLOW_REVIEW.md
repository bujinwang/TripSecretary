# Flash API Submission Flow - Complete Review

**Date**: 2025-10-28
**Flow**: "闪电提交" (Flash Submission) via TDACAPIScreen

---

## 🔄 Complete Submission Flow

### Step 1: User Submits Form (TDACAPIScreen.js)

**Location**: `TDACAPIScreen.js:169-174`

```javascript
// Submit via API
const result = await TDACAPIService.submitArrivalCard(travelerData);
```

**What happens:**
- User fills out TDAC form (passport, personal info, travel details)
- Clicks "提交" (Submit) button
- `TDACAPIService.submitArrivalCard()` is called

**Returns:**
```javascript
{
  success: true,
  arrCardNo: 'TH12345',    // Arrival card number from Thai immigration
  pdfBlob: Blob,           // PDF blob from TDAC API
  duration: '2.34',        // Submission time in seconds
  submittedAt: '2025-10-28T...'
}
```

---

### Step 2: Save PDF to Filesystem (TDACAPIScreen.js)

**Location**: `TDACAPIScreen.js:174, 268-320`

```javascript
// Save QR code
const pdfSaveResult = await saveQRCode(result.arrCardNo, result.pdfBlob, result);
```

#### Inside `saveQRCode()` function:

##### 2a. Save PDF to Documents Folder

**Location**: `TDACAPIScreen.js:278-284`

```javascript
// Save PDF using PDFManagementService (standardized naming)
const pdfSaveResult = await PDFManagementService.savePDF(
  arrCardNo,
  pdfBlob,
  { submissionMethod: 'api' }
);
```

**What `PDFManagementService.savePDF()` does:**
**Location**: `PDFManagementService.js:86-131`

1. **Initialize PDF directory** (`Documents/tdac/`)
2. **Generate filename**: `TDAC_{arrCardNo}_{timestamp}.pdf`
3. **Convert blob to base64**
4. **Decode to Uint8Array** (binary data)
5. **Write to file**: `Documents/tdac/TDAC_TH12345_1730000000.pdf`

**Returns:**
```javascript
{
  filepath: 'file:///...Documents/tdac/TDAC_TH12345_1730000000.pdf',
  filename: 'TDAC_TH12345_1730000000.pdf',
  size: 214567,  // bytes
  savedAt: '2025-10-28T...',
  arrCardNo: 'TH12345',
  metadata: { submissionMethod: 'api' }
}
```

##### 2b. Save to AsyncStorage

**Location**: `TDACAPIScreen.js:287-308`

```javascript
const entryData = {
  arrCardNo,
  travelerName: `${formData.firstName} ${formData.familyName}`,
  passportNo: formData.passportNo,
  arrivalDate: formData.arrivalDate,
  savedAt: new Date().toISOString(),
  submittedAt: result.submittedAt || new Date().toISOString(),
  duration: result.duration,
  submissionMethod: 'api',
  // TDAC submission metadata for EntryPackService
  cardNo: arrCardNo,
  qrUri: pdfSaveResult.filepath,
  pdfPath: pdfSaveResult.filepath,
  timestamp: Date.now(),
  alreadySubmitted: true
};

await AsyncStorage.setItem(`tdac_${arrCardNo}`, JSON.stringify(entryData));
await AsyncStorage.setItem('recent_tdac_submission', JSON.stringify(entryData));
```

**Purpose:**
- Legacy storage for backward compatibility
- Quick access without database query
- Recent submission flag for entry pack integration

##### 2c. Save PDF to Photo Album

**Location**: `TDACAPIScreen.js:310-312`

```javascript
// Save PDF to photo album
await MediaLibrary.createAssetAsync(pdfSaveResult.filepath);
console.log('✅ QR code saved to photo album');
```

⚠️ **NOTE**: This saves the **FULL PDF** to photo album, not just QR code!

---

### Step 3: Create Digital Arrival Card Record (TDACAPIScreen.js)

**Location**: `TDACAPIScreen.js:177-214`

```javascript
const submissionData = {
  arrCardNo: result.arrCardNo,
  qrUri: pdfSaveResult.filepath,
  pdfPath: pdfSaveResult.filepath,
  submittedAt: result.submittedAt || new Date().toISOString(),
  submissionMethod: 'api',
  duration: result.duration,
  travelerName: `${formData.firstName} ${formData.familyName}`,
  passportNo: formData.passportNo,
  arrivalDate: formData.arrivalDate
};

const serviceResult = await TDACSubmissionService.handleTDACSubmissionSuccess(
  submissionData,
  travelerData
);
```

#### Inside `TDACSubmissionService.handleTDACSubmissionSuccess()`

**Location**: `TDACSubmissionService.js:33-143`

##### 3a. Extract and Validate Metadata

**Location**: `TDACSubmissionService.js:40-52`

```javascript
// Extract all necessary fields from TDAC submission
const tdacSubmission = this.extractTDACSubmissionMetadata(submissionData);
// Returns:
{
  arrCardNo: 'TH12345',
  qrUri: 'file:///.../TDAC_TH12345_1730000000.pdf',
  pdfPath: 'file:///.../TDAC_TH12345_1730000000.pdf',
  submittedAt: '2025-10-28T06:00:00.000Z',
  submissionMethod: 'api'
}

// Validate metadata completeness
const validationResult = this.validateTDACSubmissionMetadata(tdacSubmission);
```

##### 3b. Find or Create Entry Info ID

**Location**: `TDACSubmissionService.js:73, 315-359`

```javascript
const entryInfoId = await this.findOrCreateEntryInfoId(travelerInfo);
```

**What it does:**
1. Looks for existing `entry_info` for user + destination
2. If found: returns existing ID
3. If not found: creates new `entry_info` record
4. Returns: `entry_info_123`

##### 3c. Save to digital_arrival_cards Table

**Location**: `TDACSubmissionService.js:77-92`

```javascript
const digitalArrivalCard = await UserDataService.saveDigitalArrivalCard({
  entryInfoId: entryInfoId,
  cardType: 'TDAC',
  arrCardNo: tdacSubmission.arrCardNo,
  qrUri: tdacSubmission.qrUri,
  pdfUrl: tdacSubmission.pdfPath,  // ← PDF PATH SAVED HERE
  submittedAt: tdacSubmission.submittedAt,
  submissionMethod: tdacSubmission.submissionMethod,
  status: 'success'
});
```

**Calls:** `UserDataService.saveDigitalArrivalCard()`
**Location**: `UserDataService.js:842-873`

Which calls: `SecureStorageService.saveDigitalArrivalCard()`
**Location**: `SecureStorageService.js:494-503`

Which calls: `DigitalArrivalCardRepository.save()`
**Location**: `DigitalArrivalCardRepository.js:23-68`

**Final INSERT SQL:**
```sql
INSERT OR REPLACE INTO digital_arrival_cards (
  id, entry_info_id, user_id, card_type, destination_id, arr_card_no,
  qr_uri, pdf_url, submitted_at, submission_method, status,
  api_response, processing_time, retry_count, error_details,
  is_superseded, superseded_at, superseded_by, superseded_reason,
  version, created_at, updated_at
) VALUES (
  'dac_abc123',
  'entry_info_456',
  'user_001',
  'TDAC',
  'THA',
  'TH12345',
  'file:///.../TDAC_TH12345_1730000000.pdf',  -- qr_uri
  'file:///.../TDAC_TH12345_1730000000.pdf',  -- pdf_url ← PDF PATH
  '2025-10-28T06:00:00.000Z',
  'api',
  'success',
  NULL,  -- api_response
  NULL,  -- processing_time
  0,     -- retry_count
  NULL,  -- error_details
  0,     -- is_superseded
  NULL,  -- superseded_at
  NULL,  -- superseded_by
  NULL,  -- superseded_reason
  1,     -- version
  '2025-10-28T06:00:00.000Z',  -- created_at
  '2025-10-28T06:00:00.000Z'   -- updated_at
);
```

##### 3d. Create Entry Info Snapshot

**Location**: `TDACSubmissionService.js:98-103`

```javascript
await this.createEntryInfoSnapshot(entryInfoId, 'submission', {
  appVersion: '1.0.0',
  deviceInfo: 'mobile',
  creationMethod: 'auto',
  submissionMethod: tdacSubmission.submissionMethod
});
```

**Purpose:** Immutable snapshot of entry data at submission time

##### 3e. Update Entry Info Status

**Location**: `TDACSubmissionService.js:106, 369-423`

```javascript
await this.updateEntryInfoStatus(entryInfoId, tdacSubmission);
```

**Updates:** `entry_info.status` from `'ready'` → `'submitted'`

---

## 📊 Data Storage Summary

After Flash API submission, data is stored in **4 locations**:

### 1. Filesystem (Documents)
**Location:** `Documents/tdac/TDAC_{cardNo}_{timestamp}.pdf`
**Size:** ~200-500 KB
**Content:** Full TDAC PDF with QR code and personal data

### 2. Photo Album
**Location:** iOS Photos / Android Gallery
**Size:** Same as filesystem
**Content:** Full TDAC PDF (NOT just QR code!)
**Security Risk:** ⚠️ Sensitive data accessible in photo album

### 3. AsyncStorage
**Keys:**
- `tdac_{arrCardNo}` - Individual submission
- `recent_tdac_submission` - Latest submission flag

**Content:**
```json
{
  "arrCardNo": "TH12345",
  "travelerName": "John Doe",
  "passportNo": "A12345678",
  "arrivalDate": "2025-11-15",
  "savedAt": "2025-10-28T06:00:00.000Z",
  "submittedAt": "2025-10-28T06:00:00.000Z",
  "duration": "2.34",
  "submissionMethod": "api",
  "cardNo": "TH12345",
  "qrUri": "file:///.../TDAC_TH12345_1730000000.pdf",
  "pdfPath": "file:///.../TDAC_TH12345_1730000000.pdf",
  "timestamp": 1730000000000,
  "alreadySubmitted": true
}
```

### 4. Database (SQLite)

#### Table: `digital_arrival_cards`

| Field | Example Value | Notes |
|-------|--------------|-------|
| id | `dac_abc123` | Generated UUID |
| entry_info_id | `entry_info_456` | Links to entry_info |
| user_id | `user_001` | User identifier |
| card_type | `TDAC` | Card type |
| destination_id | `THA` | Thailand |
| arr_card_no | `TH12345` | **Arrival card number** |
| qr_uri | `file:///.../TDAC_TH12345_1730000000.pdf` | QR code URI |
| **pdf_url** | `file:///.../TDAC_TH12345_1730000000.pdf` | **PDF path** ← |
| submitted_at | `2025-10-28T06:00:00.000Z` | Submission timestamp |
| submission_method | `api` | Flash submission |
| status | `success` | Success status |
| version | `1` | Card version |

#### Table: `entry_info`

Updated status from `incomplete` → `submitted`

---

## 🔍 Key Observations

### ✅ What Works Well

1. **Multiple Storage Layers**
   - Filesystem: Permanent, backed up
   - Database: Structured, queryable
   - AsyncStorage: Fast access

2. **Standardized PDF Naming**
   - Format: `TDAC_{cardNo}_{timestamp}.pdf`
   - Easy to identify and manage

3. **Comprehensive Metadata**
   - Full submission details captured
   - Useful for analytics and debugging

4. **Error Handling**
   - Try-catch blocks at each level
   - Graceful degradation (submission succeeds even if metadata save fails)

5. **Database Record Creation**
   - Properly links to `entry_info`
   - Stores PDF path for later retrieval
   - Creates immutable snapshot

### ⚠️ Potential Issues

1. **Photo Album Security**
   - **Issue**: Full PDF saved to photo album
   - **Risk**: Sensitive data (passport no, DOB, name) accessible in photos
   - **Better**: Only save QR code image to photos

2. **Misleading Comment**
   - Line 312: Says "QR code saved" but actually saves full PDF
   - Should be: "PDF saved to photo album"

3. **Duplicate Path Storage**
   - `qrUri` and `pdfUrl` both point to same PDF path
   - Could be confusing - should clarify naming

4. **AsyncStorage Redundancy**
   - Data duplicated in database and AsyncStorage
   - AsyncStorage could become stale
   - Consider using database as single source of truth

### 🤔 Questions to Consider

1. **Is AsyncStorage still needed?**
   - Database provides same functionality
   - AsyncStorage adds maintenance burden
   - Consider deprecating in favor of database

2. **Should we extract QR code separately?**
   - Current: Full PDF in photos
   - Better: QR image only in photos
   - Requires: PDF manipulation library

3. **PDF path consistency**
   - `qrUri` naming is misleading (it's a PDF, not just QR)
   - Should rename to `pdfUri` or similar

---

## 🎯 Current vs Ideal State

### Current State

```
User Submits
    ↓
TDACAPIService.submitArrivalCard()
    ↓ returns pdfBlob
PDFManagementService.savePDF()
    ↓ saves to Documents/tdac/*.pdf
MediaLibrary.createAssetAsync()
    ↓ saves FULL PDF to photo album ← SECURITY ISSUE
TDACSubmissionService.handleTDACSubmissionSuccess()
    ↓
UserDataService.saveDigitalArrivalCard()
    ↓
Database INSERT into digital_arrival_cards
    ✓ pdf_url = Documents path
```

### Ideal State (Future)

```
User Submits
    ↓
TDACAPIService.submitArrivalCard()
    ↓ returns pdfBlob
PDFManagementService.savePDF()
    ↓ saves to Documents/tdac/*.pdf
QRCodeExtractor.extractQRCodeFromPDF()  ← NEW
    ↓ extracts QR image only
MediaLibrary.createAssetAsync()
    ↓ saves ONLY QR image to photo album ← SECURE
TDACSubmissionService.handleTDACSubmissionSuccess()
    ↓
UserDataService.saveDigitalArrivalCard()
    ↓
Database INSERT into digital_arrival_cards
    ✓ pdf_url = Documents path
    ✓ qr_image_url = QR image path ← NEW
```

---

## 📋 Summary

### Where PDF is Saved

1. **Documents Folder**: ✅ `Documents/tdac/TDAC_{cardNo}_{timestamp}.pdf`
2. **Photo Album**: ⚠️ Full PDF saved (security concern)
3. **Database**: ✅ Path stored in `digital_arrival_cards.pdf_url`

### Where digital_arrival_cards Record is Created

**Complete chain:**
```
TDACAPIScreen.js:191
  → TDACSubmissionService.handleTDACSubmissionSuccess():77
    → UserDataService.saveDigitalArrivalCard():842
      → SecureStorageService.saveDigitalArrivalCard():494
        → DigitalArrivalCardRepository.save():23
          → SQLite INSERT
```

### Critical Fields in Database

- ✅ `entry_info_id` - Links to entry_info
- ✅ `arr_card_no` - Arrival card number for display
- ✅ `pdf_url` - Path to PDF file
- ✅ `qr_uri` - Currently same as pdf_url
- ✅ `submission_method` - 'api' for Flash submission
- ✅ `status` - 'success' for successful submissions

---

## 🔧 Recommended Improvements

### Priority 1: Security (Photo Album)
- Remove full PDF save to photo album
- Implement QR code extraction
- Save only QR image to photos

### Priority 2: Code Clarity
- Fix misleading comment on line 312
- Rename `qrUri` to `pdfUri` or separate QR path
- Add clear documentation

### Priority 3: Data Architecture
- Consider deprecating AsyncStorage in favor of database
- Implement data migration if needed
- Single source of truth

### Priority 4: Error Recovery
- Add retry logic for failed database saves
- Graceful fallback if photo save fails
- Better user feedback

---

**Status**: Documentation Complete ✅
**Next Steps**: Review and implement improvements as needed
