# Repository API Reference

## Overview
This document provides a quick reference for all repository classes and their methods.

## PassportRepository

**Location:** `app/services/security/repositories/PassportRepository.js`

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `save(passportData)` | Object | Promise<Object> | Save or update passport |
| `getById(id)` | string | Promise<Object\|null> | Get passport by ID |
| `getByUserId(userId)` | string | Promise<Array> | Get all passports for user |
| `getPrimaryByUserId(userId)` | string | Promise<Object\|null> | Get primary passport |
| `setPrimary(passportId, userId)` | string, string | Promise<void> | Set passport as primary |
| `delete(id)` | string | Promise<void> | Delete passport |
| `deleteByUserId(userId)` | string | Promise<number> | Delete all user passports |
| `countByUserId(userId)` | string | Promise<number> | Count user passports |
| `exists(id)` | string | Promise<boolean> | Check if exists |
| `getCountries(passportId)` | string | Promise<Array> | Get countries for passport |
| `addCountry(passportId, countryData)` | string, Object | Promise<void> | Add country to passport |
| `removeCountry(passportId, countryCode)` | string, string | Promise<void> | Remove country |

## PersonalInfoRepository

**Location:** `app/services/security/repositories/PersonalInfoRepository.js`

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `save(personalData)` | Object | Promise<Object> | Save or update personal info |
| `getById(id)` | string | Promise<Object\|null> | Get by ID |
| `getByUserId(userId)` | string | Promise<Array> | Get all for user |
| `getDefaultByUserId(userId)` | string | Promise<Object\|null> | Get default |
| `setDefault(personalInfoId, userId)` | string, string | Promise<void> | Set as default |
| `getByPassportId(passportId)` | string | Promise<Array> | Get by passport |
| `delete(id)` | string | Promise<void> | Delete |
| `deleteByUserId(userId)` | string | Promise<number> | Delete all for user |
| `countByUserId(userId)` | string | Promise<number> | Count for user |
| `exists(id)` | string | Promise<boolean> | Check if exists |
| `updateLabel(id, label)` | string, string | Promise<void> | Update label |
| `getByCountryRegion(userId, countryRegion)` | string, string | Promise<Array> | Get by country |

## TravelInfoRepository

**Location:** `app/services/security/repositories/TravelInfoRepository.js`

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `save(travelData)` | Object | Promise<Object> | Save or update travel info |
| `getById(id)` | string | Promise<Object\|null> | Get by ID |
| `getByUserId(userId)` | string | Promise<Array> | Get all for user |
| `getByDestination(userId, destination)` | string, string | Promise<Array> | Get by destination |
| `getDraftByUserId(userId)` | string | Promise<Array> | Get draft records |
| `delete(id)` | string | Promise<void> | Delete |
| `deleteByUserId(userId)` | string | Promise<number> | Delete all for user |
| `countByUserId(userId)` | string | Promise<number> | Count for user |
| `exists(id)` | string | Promise<boolean> | Check if exists |
| `updateStatus(id, status)` | string, string | Promise<void> | Update status |

## FundItemRepository

**Location:** `app/services/security/repositories/FundItemRepository.js`

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `save(fundData)` | Object | Promise<Object> | Save or update fund item |
| `getById(id)` | string | Promise<Object\|null> | Get by ID |
| `getByUserId(userId)` | string | Promise<Array> | Get all for user |
| `getByType(userId, type)` | string, string | Promise<Array> | Get by type |
| `getWithPhotos(userId)` | string | Promise<Array> | Get items with photos |
| `delete(id)` | string | Promise<void> | Delete |
| `deleteByUserId(userId)` | string | Promise<number> | Delete all for user |
| `countByUserId(userId)` | string | Promise<number> | Count for user |
| `countByType(userId, type)` | string, string | Promise<number> | Count by type |
| `exists(id)` | string | Promise<boolean> | Check if exists |
| `updatePhotoUri(id, photoUri)` | string, string | Promise<void> | Update photo |

## EntryInfoRepository

**Location:** `app/services/security/repositories/EntryInfoRepository.js`

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `save(entryData)` | Object | Promise<Object> | Save or update entry info |
| `getById(id)` | string | Promise<Object\|null> | Get by ID |
| `getByUserId(userId)` | string | Promise<Array> | Get all for user |
| `getByDestination(userId, destinationId)` | string, string | Promise<Array> | Get by destination |
| `getByStatus(userId, status)` | string, string | Promise<Array> | Get by status |
| `delete(id)` | string | Promise<void> | Delete |
| `deleteByUserId(userId)` | string | Promise<number> | Delete all for user |
| `countByUserId(userId)` | string | Promise<number> | Count for user |
| `exists(id)` | string | Promise<boolean> | Check if exists |
| `updateStatus(id, status)` | string, string | Promise<void> | Update status |
| `linkFundItem(entryInfoId, fundItemId, userId)` | string, string, string | Promise<void> | Link fund item |
| `unlinkFundItem(entryInfoId, fundItemId)` | string, string | Promise<void> | Unlink fund item |
| `getLinkedFundItems(entryInfoId)` | string | Promise<Array> | Get linked fund items |

## DigitalArrivalCardRepository

**Location:** `app/services/security/repositories/DigitalArrivalCardRepository.js`

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `save(dacData)` | Object | Promise<Object> | Save or update DAC |
| `getById(id)` | string | Promise<Object\|null> | Get by ID |
| `getByUserId(userId)` | string | Promise<Array> | Get all for user |
| `getByEntryInfo(entryInfoId)` | string | Promise<Array> | Get by entry info |
| `getLatestByEntryInfo(entryInfoId, cardType)` | string, string | Promise<Object\|null> | Get latest |
| `getByStatus(userId, status)` | string, string | Promise<Array> | Get by status |
| `delete(id)` | string | Promise<void> | Delete |
| `deleteByUserId(userId)` | string | Promise<number> | Delete all for user |
| `countByUserId(userId)` | string | Promise<number> | Count for user |
| `exists(id)` | string | Promise<boolean> | Check if exists |
| `markSuperseded(id, supersededById, reason)` | string, string, string | Promise<void> | Mark superseded |

## Usage Example

```javascript
import secureStorageService from './services/security/SecureStorageService';

// Initialize service
await secureStorageService.initialize(userId);

// Use repositories through SecureStorageService
const passport = await secureStorageService.passportRepository.save({
  userId: 'user123',
  passportNumber: 'ABC123456',
  fullName: 'John Doe',
  dateOfBirth: '1990-01-01',
  nationality: 'CHN'
});

// Or use delegated methods
const passport2 = await secureStorageService.savePassport({
  userId: 'user123',
  passportNumber: 'XYZ789012',
  fullName: 'Jane Doe',
  dateOfBirth: '1992-05-15',
  nationality: 'HKG'
});
```

## Common Patterns

### Save/Update
```javascript
const result = await repository.save(data);
// Returns: { id, ...data, createdAt, updatedAt }
```

### Get Single
```javascript
const item = await repository.getById(id);
// Returns: Object or null
```

### Get Multiple
```javascript
const items = await repository.getByUserId(userId);
// Returns: Array (empty if none found)
```

### Delete
```javascript
await repository.delete(id);
// Returns: void
```

### Count
```javascript
const count = await repository.countByUserId(userId);
// Returns: number
```

### Check Existence
```javascript
const exists = await repository.exists(id);
// Returns: boolean
```

---

**Last Updated:** 2025-10-24

