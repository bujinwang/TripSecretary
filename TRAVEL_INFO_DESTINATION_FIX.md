# Travel Info Destination Mismatch Fix

## Problem
Travel info was not persisting because of a destination identifier mismatch:
- **When saving**: Used `destination?.name` which could be localized (e.g., `'泰国'` in Chinese)
- **When loading**: Also used `destination?.name`, but the value could change based on locale
- **Result**: Data saved under `'泰国'` couldn't be found when looking for `'Thailand'`

## Root Cause
The destination object has both `id` and `name` properties:
- `destination.id` - Consistent identifier (e.g., `'thailand'`)
- `destination.name` - Localized display name (e.g., `'泰国'`, `'Thailand'`, `'ไทย'`)

Using `destination.name` as the database key caused issues because:
1. The name changes based on user's language settings
2. Data saved in one language couldn't be found in another language
3. Even in the same session, the name might be inconsistent

## Solution

### Changed to Use `destination.id`
Updated both save and load operations to use `destination.id` instead of `destination.name`:

**Before:**
```javascript
// Saving
travelInfoUpdates.destination = destination?.name || 'Thailand';

// Loading
const travelInfo = await PassportDataService.getTravelInfo(userId, destination?.name || 'Thailand');
```

**After:**
```javascript
// Saving
travelInfoUpdates.destination = destination?.id || 'thailand';

// Loading
const destinationId = destination?.id || 'thailand';
let travelInfo = await PassportDataService.getTravelInfo(userId, destinationId);
```

### Added Fallback for Existing Data
To handle data that was already saved with localized names, added a fallback:

```javascript
// Try loading with id first
let travelInfo = await PassportDataService.getTravelInfo(userId, destinationId);

// Fallback: try loading with localized name if id lookup fails
if (!travelInfo && destination?.name) {
  console.log('Trying fallback with destination name:', destination.name);
  travelInfo = await PassportDataService.getTravelInfo(userId, destination.name);
}
```

This ensures:
- New data is saved with consistent `id`
- Old data saved with localized names can still be loaded
- Gradual migration as users save new data

## Files Modified

**app/screens/thailand/ThailandTravelInfoScreen.js**
- Changed save operation to use `destination?.id || 'thailand'`
- Changed load operation to use `destination?.id || 'thailand'`
- Added fallback to try `destination.name` if `id` lookup fails
- Added debug logging to track destination values

## Testing

### Test Scenario 1: Fresh Data
1. Fill in flight number
2. Navigate away
3. Come back
4. ✅ Flight number should be there

### Test Scenario 2: Existing Data (Migration)
1. User has data saved under `'泰国'` (Chinese name)
2. App loads with `destination.id = 'thailand'`
3. First lookup with `'thailand'` fails
4. Fallback lookup with `'泰国'` succeeds
5. ✅ Old data is loaded
6. User edits and saves
7. New save uses `'thailand'` as destination
8. ✅ Data now accessible via consistent id

### Test Scenario 3: Language Change
1. Save data in English (destination.id = 'thailand')
2. Change app language to Chinese
3. Load screen (still uses destination.id = 'thailand')
4. ✅ Data loads correctly regardless of language

## Benefits

1. **Consistent Identifiers**: Using `id` instead of localized `name`
2. **Language Independent**: Works across all languages
3. **Backward Compatible**: Fallback handles old data
4. **Future Proof**: Won't break if destination names change

## Prevention

To prevent similar issues in the future:
1. Always use `id` fields for database keys, not display names
2. Use localized names only for UI display
3. Add logging to track what values are being used
4. Test with multiple languages/locales

## Migration Path

**Automatic Migration:**
- No manual migration needed
- Old data accessible via fallback
- New saves use correct identifier
- Over time, all data migrates to new format

**Manual Migration (Optional):**
If you want to migrate all existing data immediately, you could:
1. Query all travel_info records
2. For each record with localized destination name
3. Update destination to use consistent id
4. This would be a one-time database update

## Debug Logs

Added helpful logs to track the issue:
```
Loading travel info for destination: thailand
Trying fallback with destination name: 泰国
Loading saved travel info: {...}
```

These logs help identify:
- What destination value is being used
- Whether fallback is triggered
- Whether data is found

## Related Issues

This same pattern should be checked in other places:
- [ ] Entry data destination references
- [ ] Travel history destination references
- [ ] Any other place using destination.name as a key

## Conclusion

The fix ensures travel info persists correctly by using consistent, language-independent identifiers. The fallback mechanism provides backward compatibility for existing data.
