# Fund Items API - Quick Reference

## Import
```javascript
import PassportDataService from './app/services/data/PassportDataService';
```

## Save Fund Item
```javascript
const fundItem = await PassportDataService.saveFundItem({
  type: 'credit_card',      // Required: 'credit_card', 'cash', 'bank_balance', 'investment', 'other'
  amount: '10000',          // Optional
  currency: 'USD',          // Optional
  details: 'Visa 1234',     // Optional
  photoUri: 'data:image...' // Optional: base64 or file URI
}, userId);
```

## Load All Fund Items
```javascript
const fundItems = await PassportDataService.getFundItems(userId);
// Returns array of FundItem instances
```

## Delete Fund Item
```javascript
const success = await PassportDataService.deleteFundItem(fundItemId, userId);
```

## Fund Item Properties
- `id` - Unique identifier
- `userId` - User ID
- `type` - Fund type
- `amount` - Amount value
- `currency` - Currency code
- `details` - Additional notes
- `photoUri` - Photo data
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Valid Fund Types
- `credit_card`
- `cash`
- `bank_balance`
- `investment`
- `other`
