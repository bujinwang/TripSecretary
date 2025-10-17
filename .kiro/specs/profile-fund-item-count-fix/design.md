# Design Document

## Overview

This design addresses the incorrect fund item count display in the ProfileScreen's funding section. The issue is in the `fundingFieldsCount` useMemo hook, which currently uses a hardcoded `total` value of 3, but the display logic expects both `filled` and `total` to match the actual number of fund items.

## Root Cause Analysis

The current implementation in `app/screens/ProfileScreen.js` (lines 349-354):

```javascript
const fundingFieldsCount = useMemo(() => {
  // Count fund items instead of legacy funding proof fields
  const filled = fundItems.length;
  const total = 3; // Expected minimum fund items (cash, bank card, supporting doc)
  return { filled, total };
}, [fundItems]);
```

The problem:
- `filled` is correctly set to `fundItems.length`
- `total` is hardcoded to `3`, representing an "expected minimum"
- The UI displays `{filled}/{total}`, which shows "3/3" when there are 3 items
- However, the screenshot shows "1/1", suggesting `fundItems.length` is returning 1, not 3

## Investigation Needed

Before implementing the fix, we need to verify:
1. Is `fundItems` state being populated correctly?
2. Is the useMemo dependency array working properly?
3. Are fund items being loaded from the database correctly?

## Architecture

### Current Flow
1. ProfileScreen loads fund items from PassportDataService on mount
2. `fundItems` state is set with the loaded items
3. `fundingFieldsCount` useMemo calculates the count
4. UI displays the count badge

### Proposed Fix

The count badge should show the actual number of items the user has, not compare against an arbitrary "expected" total. The design should be:

**Option 1: Show actual count only**
- Display: "3 items" or "3" (no fraction)
- Simpler, more intuitive
- No confusion about what the "total" means

**Option 2: Keep fraction but make both values equal**
- Display: "3/3" when user has 3 items
- Both values represent the actual count
- Maintains current visual style

**Recommended: Option 2** - Keep the current visual style but fix the logic.

## Components and Interfaces

### Modified Component: ProfileScreen

**File:** `app/screens/ProfileScreen.js`

**Changes:**
1. Update `fundingFieldsCount` useMemo to return matching filled/total values
2. Ensure the count updates when fund items are added/deleted

```javascript
const fundingFieldsCount = useMemo(() => {
  const count = fundItems.length;
  return { filled: count, total: count };
}, [fundItems]);
```

## Data Models

No data model changes required. The fix is purely in the presentation logic.

## Error Handling

No additional error handling needed. If `fundItems` is undefined or null, `fundItems.length` will safely return 0.

## Testing Strategy

### Manual Testing
1. Open ProfileScreen with 0 fund items → verify count shows "0/0"
2. Add 1 fund item → verify count shows "1/1"
3. Add 2 more fund items → verify count shows "3/3"
4. Delete 1 fund item → verify count shows "2/2"
5. Verify count updates immediately after add/delete operations

### Edge Cases
- Empty fund items array
- Single fund item
- Large number of fund items (10+)
- Rapid add/delete operations
