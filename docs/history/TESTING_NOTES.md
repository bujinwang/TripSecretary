# Testing Notes - Thailand TDAC UI Behavior

## Issue Fixed
**Error**: `Cannot read property 'getByUserId' of null` in EntryInfoService.js:171:20

**Root Cause**: `EntryInfoService.getAllEntryInfos()` called `SecureStorageService.getAllEntryInfos()` without ensuring SecureStorageService was initialized first.

**Fix**: Added `await SecureStorageService.initialize(userId)` at the beginning of `EntryInfoService.getAllEntryInfos()`.

## Current State

### Database Records

**Entry Info:**
```
entry_1761348094096_5kg7bla7e
  destination_id: 'th'
  status: 'submitted'
  travel_info_id: 'mh9pqhp5fziejfhtta7'
```

**Digital Arrival Card:**
```
dac_thailand_0836c73_success
  entry_info_id: 'entry_1761348094096_5kg7bla7e'
  card_type: 'TDAC'
  status: 'success'
  arr_card_no: '0836C73'
  is_superseded: 0
```

**Hong Kong Entry:**
```
entry_1761498113630_671h97bpx
  destination_id: 'hk'
  status: 'incomplete'
```

## Expected UI Behavior

### HomeScreen Display

#### Section 1: "我的行程" (My Trips)
Should display:
- ✅ **Thailand**
  - Country flag: 🇹🇭
  - Status: 已提交 (Submitted)
  - ARR Card No: 0836C73
  - QR code placeholder
  - Arrival countdown/date
  - Clickable to view details

#### Section 2: "填写中" (In Progress)
Should display:
- ✅ **Hong Kong**
  - Country flag: 🇭🇰
  - Status: 准备提交 (Ready to submit) or 填写中 (In progress)
  - Completion: 95%
  - Progress indicator
  - Clickable to continue editing

Should NOT display:
- ❌ Thailand (should not appear here)

## Testing Steps

1. **Restart the app**
   ```bash
   # Stop the current Expo server
   # Then restart:
   npx expo start --clear
   ```

2. **Navigate to HomeScreen**
   - App should load without the previous error
   - HomeScreen should display both sections

3. **Verify Section 1 - "我的行程"**
   - [ ] Thailand entry appears
   - [ ] Shows "已提交" status
   - [ ] Displays ARR Card No: 0836C73
   - [ ] Has QR code placeholder
   - [ ] Shows arrival date/countdown

4. **Verify Section 2 - "填写中"**
   - [ ] Hong Kong entry appears
   - [ ] Shows 95% completion
   - [ ] Shows progress indicator
   - [ ] Thailand does NOT appear here

5. **Click Thailand Entry**
   - [ ] Navigate to EntryInfoDetailScreen
   - [ ] Should show PDF download link
   - [ ] Should show QR code (if available)
   - [ ] Should show submission details

6. **Click Hong Kong Entry**
   - [ ] Navigate to HongKongTravelInfo or similar
   - [ ] Should allow continuing data entry
   - [ ] Should show current progress

## Related Code Changes

### Files Modified:
1. `app/services/EntryInfoService.js`
   - Added SecureStorageService initialization in `getAllEntryInfos()`

2. `app/hooks/thailand/useThailandDataPersistence.js`
   - Fixed 4 hardcoded 'thailand' → 'th'

3. `app/screens/thailand/ThailandEntryFlowScreen.js`
   - Fixed 3 hardcoded 'thailand' → 'th'

4. `app/services/thailand/TDACSubmissionService.js`
   - Fixed 1 hardcoded 'thailand' → 'th'

### Database Changes:
- Deleted duplicate entry_info with destination_id='thailand'
- Updated entry_info status to 'submitted'
- Created digital_arrival_card record
- Fixed snapshots country from 'thailand' to 'th'

## Potential Issues to Watch

1. **PDF Path**: Ensure the PDF file path is accessible
   ```
   file:///Users/bujin/Library/.../tdac/TDAC_0836C73_1761781405619.pdf
   ```

2. **QR Code**: If QR code extraction was implemented, verify it displays correctly

3. **Arrival Date**: Check if arrival date from travel_info is displayed correctly

4. **Navigation**: Verify clicking entries navigates to correct screens

## Next Steps

After confirming UI works correctly:
- [ ] Test PDF download/viewing
- [ ] Test QR code display (if implemented)
- [ ] Test navigation from entry cards
- [ ] Verify countdown timer updates
- [ ] Test with multiple submitted entries

## Rollback Plan

If issues occur, you can restore the database to previous state:
```bash
# Delete the reconstructed DAC record
sqlite3 "$DB_PATH" "DELETE FROM digital_arrival_cards WHERE id = 'dac_thailand_0836c73_success';"

# Reset entry_info status
sqlite3 "$DB_PATH" "UPDATE entry_info SET status = 'incomplete' WHERE id = 'entry_1761348094096_5kg7bla7e';"
```
