# Province, District, and Sub-District Persistence Fix

## Issue

The province (省), district (区), sub-district (乡), postal code, accommodation type, and travel purpose fields were not being saved to the database. Users would fill in these fields on the ThailandTravelInfoScreen, but the data would not persist after navigating away or closing the app.

## Root Cause

The `travel_info` table schema in `SecureStorageService.js` was missing the following columns:
- `travel_purpose`
- `accommodation_type`
- `province`
- `district`
- `sub_district`
- `postal_code`

The screen was attempting to save these fields through `PassportDataService.updateTravelInfo()`, but the underlying database schema didn't support them.

## Solution

### 1. Database Schema Update

Updated the `travel_info` table schema in `app/services/security/SecureStorageService.js` to include the missing columns:

```sql
CREATE TABLE IF NOT EXISTS travel_info (
  -- ... existing columns ...
  travel_purpose TEXT,
  accommodation_type TEXT,
  province TEXT,
  district TEXT,
  sub_district TEXT,
  postal_code TEXT,
  -- ... existing columns ...
)
```

### 2. Database Migration

Added ALTER TABLE statements to add the missing columns to existing databases:

```sql
ALTER TABLE travel_info ADD COLUMN travel_purpose TEXT;
ALTER TABLE travel_info ADD COLUMN accommodation_type TEXT;
ALTER TABLE travel_info ADD COLUMN province TEXT;
ALTER TABLE travel_info ADD COLUMN district TEXT;
ALTER TABLE travel_info ADD COLUMN sub_district TEXT;
ALTER TABLE travel_info ADD COLUMN postal_code TEXT;
```

These migrations are wrapped in error handlers to gracefully handle cases where columns already exist.

### 3. Save Method Update

Updated the `saveTravelInfo()` method to include the new fields in INSERT/REPLACE statements:

```javascript
INSERT OR REPLACE INTO travel_info (
  id, user_id, destination,
  travel_purpose, boarding_country, visa_number,
  // ... other fields ...
  accommodation_type, province, district, sub_district, postal_code,
  hotel_name, hotel_address, status,
  created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ..., ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

### 4. Retrieve Method Update

Updated the `getTravelInfo()` method to retrieve and map the new fields:

```javascript
const travelInfo = {
  id: result.id,
  userId: result.user_id,
  destination: result.destination,
  travelPurpose: result.travel_purpose,
  // ... other fields ...
  accommodationType: result.accommodation_type,
  province: result.province,
  district: result.district,
  subDistrict: result.sub_district,
  postalCode: result.postal_code,
  // ... other fields ...
};
```

### 5. TravelInfo Model Update

Updated the `TravelInfo` model in `app/models/TravelInfo.js` to properly initialize and save all fields, including the missing flight detail fields that were in the database but not in the model.

## Testing

To verify the fix works:

1. **Fresh Install Test**:
   - Install the app on a fresh device/emulator
   - Fill in the Thailand travel info form including province, district, sub-district
   - Navigate away and return - data should persist

2. **Existing Database Test**:
   - Update the app on a device with existing data
   - The migration should add the new columns automatically
   - Fill in the new fields - data should persist

3. **Field Validation Test**:
   - Test with hotel accommodation type (only province and address required)
   - Test with non-hotel types (province, district, sub-district, postal code, and address required)
   - Verify all fields save and load correctly

## Files Modified

1. `app/services/security/SecureStorageService.js`
   - Updated `travel_info` table schema
   - Added migration ALTER TABLE statements
   - Updated `saveTravelInfo()` method
   - Updated `getTravelInfo()` method

2. `app/models/TravelInfo.js`
   - Updated constructor to include all flight detail fields
   - Updated `save()` method to include all fields

## Impact

- **Backward Compatible**: The migration approach ensures existing databases are updated without data loss
- **No Breaking Changes**: Existing code continues to work, new fields are optional
- **Data Integrity**: All Thailand travel info fields now persist correctly

## Next Steps

This fix resolves the immediate data persistence issue. The Thailand Entry Flow spec (`.kiro/specs/thailand-entry-flow/`) outlines additional features that will build on this foundation, including:
- Data validation and preflight checks
- TDAC submission workflow
- Entry pack generation
- Arrival window calculations
