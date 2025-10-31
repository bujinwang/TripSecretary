# Digital Arrival Card Bug Fix Summary - 2025-10-28

## Problem Statement

After successful TDAC submission (Card No: 387778D), no records were being created in the `digital_arrival_cards` table, despite the submission succeeding and PDF being saved correctly.

## Root Cause Analysis

The issue was caused by **TWO SEPARATE BUGS** that both prevented digital arrival card records from being saved:

### Bug 1: Missing `userId` in Traveler Payload
**Location:** `ThailandTravelerContextBuilder.js:94`

**Problem:**
- The traveler payload didn't include `userId`
- When `TDACSubmissionService.findOrCreateEntryInfoId()` was called, it defaulted to `'current_user'`
- `getPassport('current_user')` returned null (no such user exists)
- Error: "User has no passport, cannot create entry info"
- `findOrCreateEntryInfoId()` returned `null`
- Since `entryInfoId` was null, `saveDigitalArrivalCard()` was **never called**

**Fix:**
```javascript
// BEFORE:
const travelerPayload = {
  ...tdacData,
  cloudflareToken: 'auto',
  tranModeId: ...,
};

// AFTER:
const travelerPayload = {
  ...tdacData,
  userId, // ← ADDED THIS
  cloudflareToken: 'auto',
  tranModeId: ...,
};
```

### Bug 2: Missing `userId` in saveDigitalArrivalCard Call
**Location:** `TDACSubmissionService.js:74,81`

**Problem:**
- Even if Bug 1 was fixed and `entryInfoId` was found, the second bug would still prevent saving
- `DigitalArrivalCardRepository.save()` requires **BOTH** `userId` AND `entryInfoId`
- TDACSubmissionService was only passing `entryInfoId`, not `userId`
- Repository validation would fail: "Digital arrival card data, userId, and entryInfoId are required"

**Fix:**
```javascript
// BEFORE:
const digitalArrivalCard = await UserDataService.saveDigitalArrivalCard({
  entryInfoId: entryInfoId,
  cardType: 'TDAC',
  arrCardNo: tdacSubmission.arrCardNo,
  // ... other fields
});

// AFTER:
const userId = travelerInfo?.userId || 'current_user';

const digitalArrivalCard = await UserDataService.saveDigitalArrivalCard({
  userId: userId,                     // ← ADDED THIS
  entryInfoId: entryInfoId,
  cardType: 'TDAC',
  arrCardNo: tdacSubmission.arrCardNo,
  // ... other fields
});
```

## Complete Data Flow

Here's the complete flow from TDAC submission to database record creation:

```
1. TDACHybridScreen.handleSubmissionSuccess(submissionData, travelerInfo)
   ↓
2. TDACSubmissionService.handleTDACSubmissionSuccess(submissionData, travelerInfo)
   ↓
3. Extract userId from travelerInfo
   → const userId = travelerInfo?.userId || 'current_user';
   ↓
4. findOrCreateEntryInfoId(travelerInfo)
   → Uses userId to find/create entry info
   → Returns entryInfoId
   ↓
5. saveDigitalArrivalCard({ userId, entryInfoId, ... })
   → Passes BOTH userId and entryInfoId
   ↓
6. UserDataService.saveDigitalArrivalCard(dacData)
   ↓
7. SecureStorageService.saveDigitalArrivalCard(dacData)
   ↓
8. DigitalArrivalCardRepository.save(dacData)
   → Validates: dacData.userId AND dacData.entryInfoId
   ↓
9. INSERT INTO digital_arrival_cards (
     id, entry_info_id, user_id, card_type, arr_card_no,
     qr_uri, pdf_url, submitted_at, submission_method, status, ...
   )
```

## Why No Records Existed Before

**Two cascading failures:**

1. **First Failure Point (Bug 1):**
   - `travelerInfo` had no `userId` (ThailandTravelerContextBuilder didn't include it)
   - `findOrCreateEntryInfoId()` defaulted to `'current_user'`
   - No passport found for `'current_user'`
   - `findOrCreateEntryInfoId()` returned `null`
   - Line 76: `if (entryInfoId)` evaluated to `false`
   - **`saveDigitalArrivalCard()` was never called**

2. **Second Failure Point (Bug 2):**
   - Even if Bug 1 was fixed and `entryInfoId` existed
   - `saveDigitalArrivalCard()` was called without `userId` in `dacData`
   - Repository validation at line 35 would fail:
   - `if (!dacData || !dacData.userId || !dacData.entryInfoId)`
   - Error thrown: "Digital arrival card data, userId, and entryInfoId are required"
   - **No database record created**

## All Fixes Applied (2025-10-28)

### Fix 1: userId in Traveler Payload
**File:** `app/services/thailand/ThailandTravelerContextBuilder.js:94`
**Change:** Added `userId` to travelerPayload
**Impact:** `findOrCreateEntryInfoId()` now receives correct userId

### Fix 2: PDF Not Saved to Photo Library
**File:** `app/screens/thailand/TDACHybridScreen.js:415-423`
**Change:** Removed `MediaLibrary.createAssetAsync()` call for PDFs
**Impact:** No more "This URL does not contain a valid asset type" errors

### Fix 3: Entry Info Lookup Uses Correct userId
**File:** `app/services/thailand/TDACSubmissionService.js:73`
**Change:** (Enabled by Fix 1) `findOrCreateEntryInfoId()` now works correctly
**Impact:** Entry info records can be found/created successfully

### Fix 4: userId Passed to saveDigitalArrivalCard
**File:** `app/services/thailand/TDACSubmissionService.js:74,81`
**Change:** Extract userId and pass to `saveDigitalArrivalCard()`
**Impact:** Repository validation passes, records can be inserted

## Verification

### Tests Created
1. **bugfixes-2025-10-28.test.js** - 10 tests covering all 4 fixes
2. **TDACSubmissionService.entryInfo.test.js** - Entry info creation tests
3. **ThailandTravelerContextBuilder.userId.test.js** - userId inclusion tests
4. **TDACHybridScreen.photoLibrary.test.js** - Photo library fix tests
5. **digital-arrival-card-save.test.js** - Complete save flow tests (9 tests)

### Test Results
- **bugfixes-2025-10-28.test.js:** ✅ 10/10 passed
- **digital-arrival-card-save.test.js:** ✅ 9/9 passed

Total: **19 tests passing** verifying all fixes

## Expected Behavior After Fixes

### Next TDAC Submission Should:

1. ✅ `ThailandTravelerContextBuilder.buildContext(userId)` includes userId in payload
2. ✅ TDAC submission succeeds → Card No assigned
3. ✅ PDF saved to app storage (not photo library)
4. ✅ `TDACSubmissionService.handleTDACSubmissionSuccess()` receives travelerInfo with userId
5. ✅ `findOrCreateEntryInfoId(travelerInfo)` uses correct userId
6. ✅ Passport found for the actual user
7. ✅ Entry info found/created successfully
8. ✅ `saveDigitalArrivalCard()` called with BOTH userId and entryInfoId
9. ✅ Repository validation passes
10. ✅ **Record created in `digital_arrival_cards` table**

## Database Schema Reference

**Table:** `digital_arrival_cards`

**Required Fields:**
- `user_id` - User who submitted the form
- `entry_info_id` - Reference to entry_info record
- `card_type` - Type of card (TDAC, MDAC, SDAC)
- `arr_card_no` - Arrival card number from API
- `qr_uri` - QR code URI (currently PDF path)
- `pdf_url` - PDF document path
- `submitted_at` - Submission timestamp
- `submission_method` - Method used (api/webview/hybrid)
- `status` - Submission status (success/failed)

**Validation:** Both `user_id` AND `entry_info_id` must be present

## Previous Submission Analysis

**Card No:** 387778D
**Date:** 2025-10-28
**Result:** Submission succeeded, PDF saved, BUT no digital_arrival_cards record

**Why:**
- Submission happened **BEFORE** the userId fixes
- Bug 1 caused `findOrCreateEntryInfoId()` to return null
- `saveDigitalArrivalCard()` was never called
- Even if called, Bug 2 would have prevented the save

**Resolution:**
- Fixes have been applied
- Next submission will create digital_arrival_cards record correctly
- The previous submission (387778D) cannot be recovered, but user can resubmit if needed

## Files Modified

1. `app/services/thailand/ThailandTravelerContextBuilder.js` - Line 94
2. `app/screens/thailand/TDACHybridScreen.js` - Lines 415-423
3. `app/services/thailand/TDACSubmissionService.js` - Lines 74, 81

## Files Created

1. `app/services/thailand/__tests__/bugfixes-2025-10-28.test.js`
2. `app/services/thailand/__tests__/TDACSubmissionService.entryInfo.test.js`
3. `app/services/thailand/__tests__/ThailandTravelerContextBuilder.userId.test.js`
4. `app/screens/thailand/__tests__/TDACHybridScreen.photoLibrary.test.js`
5. `app/services/thailand/__tests__/digital-arrival-card-save.test.js`
6. `DIGITAL_ARRIVAL_CARD_FIX_SUMMARY.md` (this file)

## Conclusion

The `digital_arrival_cards` table was empty due to two cascading bugs:
1. Missing userId in traveler payload prevented entry info lookup
2. Missing userId in saveDigitalArrivalCard call would have failed repository validation

Both bugs have been fixed and verified with comprehensive tests. The next TDAC submission will successfully create records in the `digital_arrival_cards` table.
