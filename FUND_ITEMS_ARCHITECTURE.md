# Fund Items Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer                                  │
│              ThailandTravelInfoScreen                        │
│                                                              │
│  State: funds = [                                            │
│    { id, type, amount, currency, details, photo }           │
│  ]                                                           │
│                                                              │
│  Actions:                                                    │
│  • addFund(type)                                             │
│  • removeFund(id)                                            │
│  • updateFundField(id, key, value)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ PassportDataService API
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Service Layer                                   │
│           PassportDataService                                │
│                                                              │
│  Methods:                                                    │
│  • saveFundItem(fundData, userId)                            │
│  • getFundItems(userId)                                      │
│  • deleteFundItem(fundItemId, userId)                        │
│                                                              │
│  Features:                                                   │
│  • Caching (5 min TTL)                                       │
│  • Cache invalidation                                        │
│  • Error handling                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Model API
                     │
┌────────────────────▼────────────────────────────────────────┐
│                Model Layer                                   │
│                 FundItem                                     │
│                                                              │
│  Properties:                                                 │
│  • id, userId, type, amount, currency                        │
│  • details, photoUri, timestamps                             │
│                                                              │
│  Methods:                                                    │
│  • save()                                                    │
│  • delete()                                                  │
│  • validate()                                                │
│  • static load(id)                                           │
│  • static loadByUserId(userId)                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Database API
                     │
┌────────────────────▼────────────────────────────────────────┐
│            Database Layer                                    │
│         SecureStorageService                                 │
│                                                              │
│  Methods:                                                    │
│  • saveFundItem(fundItem)                                    │
│  • getFundItem(id)                                           │
│  • getFundItemsByUserId(userId)                              │
│  • deleteFundItem(id)                                        │
│                                                              │
│  Features:                                                   │
│  • Transaction support                                       │
│  • Audit logging                                             │
│  • Error handling                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ SQL
                     │
┌────────────────────▼────────────────────────────────────────┐
│                SQLite Database                               │
│                                                              │
│  Table: fund_items                                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ id (PK)  │ user_id │ type │ amount │ currency │ ... │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ fund_123 │ user_1  │ cash │ 5000   │ USD      │ ... │   │
│  │ fund_456 │ user_1  │ card │ 10000  │ USD      │ ... │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Index: idx_fund_items_user_id                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Examples

### Adding a Fund Item
```
User clicks "Add Credit Card"
  ↓
addFund('credit_card')
  ↓
PassportDataService.saveFundItem({ type: 'credit_card', ... }, userId)
  ↓
new FundItem({ type: 'credit_card', ... })
  ↓
fundItem.save()
  ↓
SecureStorageService.saveFundItem(fundItem)
  ↓
SQL: INSERT INTO fund_items ...
  ↓
Cache invalidation
  ↓
Update UI state
```

### Loading Fund Items
```
Screen mounts
  ↓
PassportDataService.getFundItems(userId)
  ↓
Check cache (miss)
  ↓
FundItem.loadByUserId(userId)
  ↓
SecureStorageService.getFundItemsByUserId(userId)
  ↓
SQL: SELECT * FROM fund_items WHERE user_id = ?
  ↓
Map to FundItem instances
  ↓
Update cache
  ↓
Return to UI
  ↓
setFunds(fundItems)
```

### Deleting a Fund Item
```
User clicks delete button
  ↓
removeFund(fundItemId)
  ↓
PassportDataService.deleteFundItem(fundItemId, userId)
  ↓
FundItem.load(fundItemId)
  ↓
fundItem.delete()
  ↓
SecureStorageService.deleteFundItem(fundItemId)
  ↓
SQL: DELETE FROM fund_items WHERE id = ?
  ↓
Cache invalidation
  ↓
Update UI state (filter out deleted item)
```

## Key Design Decisions

### 1. Separate Rows vs JSON Blob
**Decision**: Use separate rows
**Reason**: Better normalization, easier CRUD, reliable photo persistence

### 2. Caching Strategy
**Decision**: 5-minute TTL with invalidation on updates
**Reason**: Balance between performance and data freshness

### 3. Photo Storage
**Decision**: Store as base64 in `photo_uri` column
**Reason**: Simple, works with current infrastructure, no file management

### 4. Backward Compatibility
**Decision**: Keep legacy `funding_proof` table
**Reason**: Allows gradual migration, no breaking changes

### 5. Validation
**Decision**: Optional validation with `skipValidation` flag
**Reason**: Supports progressive data entry in UI
