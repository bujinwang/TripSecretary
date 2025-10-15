# Data Not Persisting Fix

## Issue
When filling in personal info fields (city of residence, phone number, email, occupation) in ThailandTravelInfoScreen:
- Data appeared to save successfully (logs showed "Personal info saved successfully")
- But when navigating away and back, or when the screen reloaded, all the data was gone
- Fields would reset to empty values

## Root Cause
The issue had two parts:

### Part 1: Empty Strings Overwriting Existing Data
In `saveDataToSecureStorage()`, the code was passing ALL fields to the update function, including empty strings:

```javascript
await PassportDataService.upsertPersonalInfo(userId, {
  phoneNumber,        // might be empty string ""
  email,              // might be empty string ""
  homeAddress: '',    // always empty string ""
  occupation,         // might be empty string ""
  provinceCity: cityOfResidence,   // might be empty string ""
  countryRegion: residentCountry   // might be empty string ""
});
```

When a user filled in only ONE field (e.g., city of residence), the other fields would be empty strings, and these empty strings would OVERWRITE any existing data in the database.

### Part 2: Using `update()` Instead of `mergeUpdates()`
The `PersonalInfo` model has two update methods:
- `update(updates)` - Uses `Object.assign()` which overwrites ALL fields, including with empty values
- `mergeUpdates(updates)` - Only updates non-empty fields, preserving existing data

The `PassportDataService.updatePersonalInfo()` was using `update()`, which meant empty strings would overwrite existing data.

## Solution

### Fix 1: Filter Out Empty Fields Before Saving
Modified `saveDataToSecureStorage()` in ThailandTravelInfoScreen to only include non-empty fields:

```javascript
// Only include non-empty fields to avoid overwriting existing data with empty values
const personalInfoUpdates = {};
if (phoneNumber && phoneNumber.trim()) personalInfoUpdates.phoneNumber = phoneNumber;
if (email && email.trim()) personalInfoUpdates.email = email;
if (occupation && occupation.trim()) personalInfoUpdates.occupation = occupation;
if (cityOfResidence && cityOfResidence.trim()) personalInfoUpdates.provinceCity = cityOfResidence;
if (residentCountry && residentCountry.trim()) personalInfoUpdates.countryRegion = residentCountry;

if (Object.keys(personalInfoUpdates).length > 0) {
  const savedPersonalInfo = await PassportDataService.upsertPersonalInfo(userId, personalInfoUpdates);
  // ...
}
```

### Fix 2: Use `mergeUpdates()` Instead of `update()`
Modified `PassportDataService.updatePersonalInfo()` to use `mergeUpdates()`:

```javascript
// Apply updates using mergeUpdates to avoid overwriting existing data with empty values
await personalInfo.mergeUpdates(updates, { skipValidation: true });
```

This ensures that:
1. Only non-empty values are sent to the update function
2. The update function only modifies fields that have actual values
3. Existing data is preserved when updating individual fields

## Files Modified
1. `app/screens/thailand/ThailandTravelInfoScreen.js`
   - Modified `saveDataToSecureStorage()` to filter out empty fields before saving

2. `app/services/data/PassportDataService.js`
   - Changed `updatePersonalInfo()` to use `mergeUpdates()` instead of `update()`

## Testing
After this fix:
1. Fill in "City of Residence" (e.g., "Hefei")
2. Navigate away and come back
3. ✅ City should still be "Hefei"
4. Fill in "Phone Number" (e.g., "123456789")
5. Navigate away and come back
6. ✅ Both city AND phone number should be preserved
7. Fill in "Email" (e.g., "test@example.com")
8. Navigate away and come back
9. ✅ All three fields should be preserved

## Technical Details

### Progressive Data Filling Pattern
This fix implements a proper progressive data filling pattern where:
- Users can fill in fields one at a time
- Each field save preserves previously saved data
- Empty fields don't overwrite existing data
- The UI state and database state stay in sync

### The `mergeUpdates()` Method
The `PersonalInfo.mergeUpdates()` method filters updates to only include non-empty values:

```javascript
async mergeUpdates(updates, options = {}) {
  const nonEmptyUpdates = {};
  
  for (const [key, value] of Object.entries(updates)) {
    if (key === 'id' || key === 'createdAt') continue;
    
    if (value !== null && value !== undefined) {
      if (typeof value === 'string') {
        if (value.trim().length > 0) {
          nonEmptyUpdates[key] = value;
        }
      } else {
        nonEmptyUpdates[key] = value;
      }
    }
  }
  
  Object.assign(this, nonEmptyUpdates);
  return await this.save(options);
}
```

This ensures that:
- `null` and `undefined` values are ignored
- Empty strings and whitespace-only strings are ignored
- Only actual data values are merged into the existing record

## Prevention
To prevent similar issues in the future:
1. Always use `mergeUpdates()` for progressive data filling scenarios
2. Filter out empty values before calling update methods
3. Use `update()` only when you want to explicitly set fields to empty/null
4. Add logging to track what data is being saved vs loaded
