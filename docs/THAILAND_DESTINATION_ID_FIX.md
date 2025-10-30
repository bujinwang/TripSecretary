# Thailand Destination ID Fix

## Problem
Thailand entries were appearing in BOTH "My Trips" (已提交) and "In Progress" (填写中) sections on HomeScreen due to:

1. **Duplicate entry_info records**: Two Thailand records with different `destination_id` values
2. **Inconsistent destination_id**: Some code used `'thailand'` while others used `'th'`

## Root Cause

### 1. Hardcoded 'thailand' instead of 'th'

Found 8 locations where `'thailand'` was hardcoded instead of using the standard two-letter country code `'th'`:

#### Files Fixed:

**useThailandDataPersistence.js** (4 occurrences)
- Line 150: `const destinationId = destination?.id || 'thailand';` → `'th'`
- Line 567: `const destinationId = destination?.id || 'thailand';` → `'th'`
- Line 769: `const destinationId = destination?.id || 'thailand';` → `'th'`
- Line 1043: `const destinationId = destination?.id || 'thailand';` → `'th'`

**ThailandEntryFlowScreen.js** (3 occurrences)
- Line 106: `const destinationId = route.params?.destination?.id || 'thailand';` → `'th'`
- Line 279: `const destinationId = route.params?.destination?.id || 'thailand';` → `'th'`
- Line 281: Removed fallback check `|| info.destinationId === 'thailand'`

**TDACSubmissionService.js** (1 occurrence)
- Line 336: `const destinationId = 'thailand';` → `'th'`

### 2. Database Cleanup

Removed duplicate entry_info records:
- Deleted: `entry_1761781405645_8ztf0sf1u` (destination_id='thailand', empty data)
- Kept: `entry_1761348094096_5kg7bla7e` (destination_id='th', complete data)

## Solution

### Code Changes
All Thailand-specific code now consistently uses `'th'` as the destination_id, matching the convention used by other countries:
- 🇹🇭 Thailand: `'th'`
- 🇭🇰 Hong Kong: `'hk'`
- 🇯🇵 Japan: `'jp'`
- 🇸🇬 Singapore: `'sg'`
- 🇲🇾 Malaysia: `'my'`
- 🇹🇼 Taiwan: `'tw'`
- 🇰🇷 Korea: `'kr'`
- 🇺🇸 USA: `'us'`

### Database Reconstruction

For testing purposes, created a script to rebuild a successful Thailand TDAC submission:

**Script**: `scripts/rebuild-thailand-submission.sql`

**Records Created**:
1. **entry_info**: Updated status to 'submitted' and linked to correct travel_info
2. **digital_arrival_card**: Created successful DAC record with ARR Card No: 0836C73
3. **snapshots**: Updated country from 'thailand' to 'th'

## Testing

### Expected UI Behavior

After the fix, HomeScreen should display:

#### Section 1: "我的行程" (My Trips)
- ✅ Thailand (th): status='submitted', has successful DAC
  - Shows ARR Card No: 0836C73
  - Shows PDF download link
  - Displays submission timestamp

#### Section 2: "填写中" (In Progress)
- ✅ Hong Kong (hk): status='incomplete', 95% complete, no DAC
- ❌ Thailand should NOT appear here

### Verification Steps

1. Restart the app
2. Navigate to HomeScreen
3. Verify Thailand appears ONLY in "My Trips" section
4. Verify Thailand does NOT appear in "In Progress" section
5. Verify Hong Kong appears in "In Progress" section

## Database State

### Current State (After Fix)

```sql
-- Entry Info
entry_1761498113630_671h97bpx | hk | incomplete
entry_1761348094096_5kg7bla7e | th | submitted

-- Digital Arrival Cards
dac_thailand_0836c73_success | entry_1761348094096_5kg7bla7e | TDAC | success | 0836C73

-- Snapshots
2f7d5c8b-2e9c-43b7-9330-f6eaad504f4d | mh9pqhp5fziejfhtta7 | th
6bbb6d60-26b5-4386-8dc1-9c46619021e0 | mh9pqhp5fziejfhtta7 | th
```

## Prevention

To prevent this issue in the future:

1. **Always use two-letter country codes** for destination_id
2. **Use destination?.id** parameter instead of hardcoding
3. **Ensure foreign key constraints** prevent orphaned records
4. **Add database migration** to fix any existing 'thailand' → 'th' inconsistencies

## Related Files

- `app/hooks/thailand/useThailandDataPersistence.js`
- `app/screens/thailand/ThailandEntryFlowScreen.js`
- `app/services/thailand/TDACSubmissionService.js`
- `app/services/EntryInfoService.js`
- `scripts/rebuild-thailand-submission.sql`
