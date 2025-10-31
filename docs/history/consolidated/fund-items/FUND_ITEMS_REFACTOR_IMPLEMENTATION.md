# Fund Items Refactor Implementation

## Overview
Refactored the funding proof system to store individual fund items as separate database rows instead of storing all items in a single JSON blob. This provides better data normalization, easier CRUD operations, and proper photo persistence per item.

## Schema Design

### New `fund_items` Table
```sql
CREATE TABLE IF NOT EXISTS fund_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,              -- 'credit_card', 'cash', 'bank_balance', 'investment', 'other'
  amount TEXT,                     -- Amount value (nullable)
  currency TEXT,                   -- Currency code (nullable)
  details TEXT,                    -- Additional details/notes (nullable)
  photo_uri TEXT,                  -- Base64 encoded photo or file URI (nullable)
  created_at TEXT,                 -- ISO timestamp
  updated_at TEXT,                 -- ISO timestamp
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_fund_items_user_id ON fund_items(user_id);
```

### Benefits
- ✅ Each fund item is a separate row (proper normalization)
- ✅ Easy to add/remove individual items
- ✅ Photos are stored with their specific fund item
- ✅ Supports querying and filtering by type
- ✅ Scalable for future enhancements
- ✅ No more JSON parsing/serialization issues

## Implementation

### 1. Database Schema (SecureStorageService.js)
- Added `fund_items` table creation in `createTables()`
- Added index on `user_id` for faster queries
- Kept legacy `funding_proof` table for backward compatibility

### 2. FundItem Model (app/models/FundItem.js)
New model class with:
- **Properties**: id, userId, type, amount, currency, details, photoUri, timestamps
- **Methods**:
  - `save()` - Save fund item to database
  - `delete()` - Delete fund item from database
  - `validate()` - Validate fund item data
  - `static load(id)` - Load fund item by ID
  - `static loadByUserId(userId)` - Load all fund items for a user
  - `toJSON()` - Serialize to plain object

### 3. SecureStorageService Methods
Added new database operations:
- `saveFundItem(fundItem)` - Insert or replace fund item
- `getFundItem(id)` - Get single fund item by ID
- `getFundItemsByUserId(userId)` - Get all fund items for a user
- `deleteFundItem(id)` - Delete fund item by ID

All methods include comprehensive logging for debugging.

### 4. PassportDataService Methods
Added high-level data access methods:
- `saveFundItem(fundData, userId)` - Save fund item with caching
- `getFundItems(userId)` - Get all fund items with caching
- `deleteFundItem(fundItemId, userId)` - Delete fund item with cache invalidation

These methods integrate with the existing caching system.

## Data Flow

### Saving a Fund Item
```
UI Component
  ↓
PassportDataService.saveFundItem(fundData, userId)
  ↓
new FundItem(fundData)
  ↓
fundItem.save()
  ↓
SecureStorageService.saveFundItem(fundItem)
  ↓
SQLite INSERT/REPLACE
  ↓
Cache invalidation
```

### Loading Fund Items
```
UI Component
  ↓
PassportDataService.getFundItems(userId)
  ↓
Check cache (5 min TTL)
  ↓ (cache miss)
FundItem.loadByUserId(userId)
  ↓
SecureStorageService.getFundItemsByUserId(userId)
  ↓
SQLite SELECT
  ↓
Map to FundItem instances
  ↓
Update cache
```

## Next Steps

### 1. Update ThailandTravelInfoScreen
- Replace funding proof state with fund items array
- Update UI to show list of individual fund items
- Add/edit/delete individual items
- Each item has its own photo

### 2. Migration Strategy (Optional)
If there's existing data in the legacy `funding_proof` table:
- Create migration function to convert old data to fund items
- Parse JSON arrays from old schema
- Create individual fund item records
- Mark migration as complete

### 3. Update Other Screens
- Update any screens that display funding proof
- Use new `getFundItems()` API
- Display items as a list instead of single blob

## API Examples

### Save a Fund Item
```javascript
const fundItem = await PassportDataService.saveFundItem({
  type: 'credit_card',
  amount: '10000',
  currency: 'USD',
  details: 'Visa ending in 1234',
  photoUri: 'data:image/jpeg;base64,...'
}, userId);
```

### Load All Fund Items
```javascript
const fundItems = await PassportDataService.getFundItems(userId);
// Returns array of FundItem instances
fundItems.forEach(item => {
  console.log(item.type, item.amount, item.currency);
});
```

### Delete a Fund Item
```javascript
const success = await PassportDataService.deleteFundItem(fundItemId, userId);
```

## Testing Checklist
- [ ] Create new fund item
- [ ] Load fund items for user
- [ ] Update existing fund item
- [ ] Delete fund item
- [ ] Photo persistence per item
- [ ] Cache invalidation works
- [ ] Multiple items per user
- [ ] Empty state (no items)

## Files Modified
1. `app/services/security/SecureStorageService.js` - Database schema and CRUD operations
2. `app/models/FundItem.js` - New model class (created)
3. `app/services/data/PassportDataService.js` - High-level data access methods

## Files to Update Next
1. `app/screens/thailand/ThailandTravelInfoScreen.js` - Update UI to use fund items
2. Any other screens displaying funding proof data
