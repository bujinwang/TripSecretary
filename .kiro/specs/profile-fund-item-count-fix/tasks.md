# Implementation Plan

- [ ] 1. Fix fund item count calculation in ProfileScreen
  - Locate the `fundingFieldsCount` useMemo hook in app/screens/ProfileScreen.js (around line 349)
  - Update the calculation to set both `filled` and `total` to `fundItems.length`
  - Remove the hardcoded `total = 3` value
  - Ensure the useMemo dependency array includes `fundItems`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Verify the fix works correctly
  - Test with 0 fund items - count should show "0/0"
  - Test with 1 fund item - count should show "1/1"
  - Test with 3 fund items - count should show "3/3"
  - Test adding a new fund item - count should update immediately
  - Test deleting a fund item - count should update immediately
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
