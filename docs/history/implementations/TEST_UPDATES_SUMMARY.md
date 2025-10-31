# Test Files Update Summary

## Overview
Updated test files to remove references to the deprecated `funding_proof` table and `FundingProof` model.

## Files Updated

### 1. ✅ SecureStorageService.test.js
- Removed `fundingProof` from batch save test
- Updated expected results count from 3 to 2

### 2. ✅ PassportDataService.crud.test.js
- Removed `FundingProof` import
- Removed `saveFundingProof` test section
- Removed `getFundingProof` test section
- Updated `getAllUserData` tests to not expect `fundingProof`

### 3. ⏳ PassportDataService.batch.test.js
**Needs updates:**
- Remove `FundingProof.load` mock calls
- Remove `fundingProof` from batch load expectations
- Remove `fundingProof` from batch save/update operations
- Update test data to not include `fundingProof`

### 4. ⏳ PassportDataService.consistency.test.js
**Needs updates:**
- Remove `FundingProof` import and mock
- Remove `fundingProof` validation tests
- Update consistency checks to not include `fundingProof`

### 5. ⏳ Migration.scenarios.test.js
**Needs updates:**
- Remove `FundingProof` import and mock
- Remove `fundingProof` from migration test data
- Update migration expectations

## Recommendation

Since the `funding_proof` table is completely removed and the app uses `fund_items` instead, these tests should either:

1. **Option A (Recommended):** Be updated to test the new `fund_items` functionality
2. **Option B:** Have funding_proof-specific tests removed/commented out
3. **Option C:** Skip tests that specifically test funding_proof (mark as `.skip()`)

For now, I'll remove/comment out the funding_proof-specific tests to prevent failures.

## Next Steps

1. ✅ Remove FundingProof model file
2. ✅ Update SecureStorageService.test.js
3. ✅ Update PassportDataService.crud.test.js  
4. ⏳ Update PassportDataService.batch.test.js
5. ⏳ Update PassportDataService.consistency.test.js
6. ⏳ Update Migration.scenarios.test.js
7. ⏳ Consider adding new tests for fund_items functionality
