# TripSecretary Code Standards

This document outlines the coding standards and naming conventions for the TripSecretary project.

## Table of Contents
- [Naming Conventions](#naming-conventions)
- [Database Layer Conventions](#database-layer-conventions)
- [File Organization](#file-organization)
- [Code Style](#code-style)
- [Best Practices](#best-practices)

---

## Naming Conventions

### 1. Variables and Functions: camelCase
All variables and function names must use camelCase.

**✅ Correct:**
```javascript
const userId = '123';
const firstName = 'John';
const isActive = true;

function getUserById(id) { }
function calculateTotalAmount() { }
```

**❌ Incorrect:**
```javascript
const user_id = '123';          // snake_case
const FirstName = 'John';       // PascalCase
const is_active = true;         // snake_case

function get_user_by_id(id) { } // snake_case
function CalculateTotal() { }   // PascalCase
```

### 2. Constants: UPPER_SNAKE_CASE
All constants (including configuration values, enums, and immutable values) must use UPPER_SNAKE_CASE.

**✅ Correct:**
```javascript
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT = 5000;

const VISA_REQUIREMENTS = { /* ... */ };
const STORAGE_KEYS = {
  USER_DATA: 'userData',
  AUTH_TOKEN: 'authToken'
};
```

**❌ Incorrect:**
```javascript
const apiBaseUrl = 'https://api.example.com';  // camelCase
const maxRetryCount = 3;                       // camelCase
```

### 3. Classes, Interfaces, and Types: PascalCase
All class names, interface names, and type definitions must use PascalCase.

**✅ Correct:**
```javascript
class UserRepository { }
class PassportValidator { }

interface PersonalInfo { }
type EntryInfoStatus = 'draft' | 'completed';
```

**❌ Incorrect:**
```javascript
class userRepository { }        // camelCase
class passport_validator { }    // snake_case

interface personalInfo { }      // camelCase
```

### 4. React Components: PascalCase
All React component names (both files and component functions) must use PascalCase.

**✅ Correct:**
```javascript
// File: PassportForm.js
export default function PassportForm() { }

// File: TDACInfoCard.js
export default function TDACInfoCard() { }
```

**❌ Incorrect:**
```javascript
// File: passportForm.js
export default function passportForm() { }
```

### 5. Private Properties/Methods: Prefix with underscore (optional)
Private class properties and methods may optionally be prefixed with an underscore.

**✅ Acceptable:**
```javascript
class SecureStorage {
  _encryptionKey = null;

  _encrypt(data) { }

  public store(data) {
    return this._encrypt(data);
  }
}
```

### 6. Boolean Variables: Use 'is', 'has', 'should' prefixes
Boolean variables should clearly indicate they are boolean values.

**✅ Correct:**
```javascript
const isActive = true;
const hasPermission = false;
const shouldValidate = true;
const canEdit = false;
```

**❌ Incorrect:**
```javascript
const active = true;            // Ambiguous
const permission = false;       // Ambiguous
```

---

## Database Layer Conventions

### Special Case: Database Columns
**Database column names use snake_case** to follow SQL naming conventions. This is an intentional exception to the camelCase rule.

**✅ Correct (Database Schema):**
```javascript
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  display_name TEXT
);
```

### Serialization Layer
The codebase maintains a **clean separation** between database layer (snake_case) and application layer (camelCase) using the DataSerializer utility.

**Database → JavaScript Conversion:**
```javascript
// Database uses snake_case
const dbRow = {
  user_id: '123',
  display_name: 'John Doe',
  created_at: '2024-01-01'
};

// DataSerializer converts to camelCase for JavaScript
const user = DataSerializer.deserialize(dbRow, User);
// Result: { userId: '123', displayName: 'John Doe', createdAt: '2024-01-01' }
```

**JavaScript → Database Conversion:**
```javascript
// JavaScript uses camelCase
const user = {
  userId: '123',
  displayName: 'John Doe',
  createdAt: '2024-01-01'
};

// DataSerializer converts to snake_case for database
const dbData = DataSerializer.serialize(user);
// Result: { user_id: '123', display_name: 'John Doe', created_at: '2024-01-01' }
```

### Repository Pattern
All database repositories must:
1. Use snake_case for SQL column names
2. Convert to camelCase when returning data to application layer
3. Use DataSerializer for automatic conversion

**✅ Correct:**
```javascript
class PassportRepository {
  async getById(id) {
    const row = await db.get(
      'SELECT passport_id, encrypted_passport_number, created_at FROM passports WHERE id = ?',
      [id]
    );
    // Convert snake_case to camelCase before returning
    return DataSerializer.deserialize(row, Passport);
  }
}
```

---

## File Organization

### File Naming Conventions

1. **React Components**: PascalCase
   - `PassportForm.js`
   - `TDACInfoCard.js`
   - `EntryGuideScreen.js`

2. **Utilities and Services**: camelCase
   - `dataSerializer.js`
   - `encryptionService.js`
   - `apiClient.js`

3. **Constants and Configuration**: camelCase
   - `visaRequirements.js`
   - `phoneCode.js`
   - `appConfig.js`

4. **Test Files**: Match the file being tested with `.test` suffix
   - `PassportForm.test.js`
   - `useThailandFundManagement.test.js`

### Directory Structure
```
app/
├── components/          # React components (PascalCase files)
├── hooks/              # Custom React hooks (camelCase, prefixed with 'use')
├── services/           # Business logic services (camelCase)
│   ├── security/       # Security-related services
│   │   ├── repositories/  # Database repositories
│   │   ├── schema/       # Database schemas
│   │   └── utils/        # Security utilities
├── utils/              # Utility functions (camelCase)
├── data/               # Static data and constants (camelCase)
└── screens/            # Screen components (PascalCase)
```

---

## Code Style

### Imports
Organize imports in the following order:
1. React and React Native imports
2. Third-party libraries
3. Project components
4. Project utilities and services
5. Constants and types

```javascript
// ✅ Correct import order
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import PassportForm from '../components/PassportForm';
import TDACInfoCard from '../components/TDACInfoCard';

import { encryptData, decryptData } from '../utils/encryption';
import { PassportRepository } from '../services/security/repositories/PassportRepository';

import { STORAGE_KEYS } from '../constants/storage';
import { EntryInfoStatus } from '../types/entryInfo';
```

### Destructuring
Prefer destructuring for cleaner code:

```javascript
// ✅ Correct
const { userId, displayName, email } = user;
const { navigate } = useNavigation();

// ❌ Avoid
const userId = user.userId;
const displayName = user.displayName;
```

### Arrow Functions vs. Function Declarations
- Use arrow functions for callbacks and inline functions
- Use function declarations for top-level functions and React components

```javascript
// ✅ Correct
export default function PassportForm() {
  const handleSubmit = (data) => {
    // Arrow function for callback
  };
}

// ✅ Also correct for utilities
export function calculateArrivalWindow(departureDate) {
  // Function declaration
}
```

---

## Best Practices

### 1. Avoid Magic Numbers and Strings
Always define constants for repeated values:

```javascript
// ✅ Correct
const MAX_PASSWORD_LENGTH = 20;
const MIN_PASSWORD_LENGTH = 8;

if (password.length > MAX_PASSWORD_LENGTH) { }

// ❌ Avoid
if (password.length > 20) { }
```

### 2. Use Meaningful Variable Names
Variable names should be descriptive and self-documenting:

```javascript
// ✅ Correct
const activePassports = passports.filter(p => p.isActive);
const totalDurationInDays = calculateDuration(startDate, endDate);

// ❌ Avoid
const temp = passports.filter(p => p.isActive);
const d = calculateDuration(startDate, endDate);
```

### 3. Comment Complex Logic
Add comments for non-obvious logic:

```javascript
// ✅ Correct
// Calculate the arrival window (60 days before to 30 days after departure)
const arrivalWindow = {
  startDate: addDays(departureDate, -60),
  endDate: addDays(departureDate, 30)
};
```

### 4. Consistent Error Handling
Use try-catch blocks and proper error messages:

```javascript
// ✅ Correct
try {
  const passport = await PassportRepository.getById(id);
  return passport;
} catch (error) {
  console.error('Failed to fetch passport:', error);
  throw new Error(`Failed to fetch passport with ID ${id}: ${error.message}`);
}
```

### 5. Async/Await over Promises
Prefer async/await syntax for better readability:

```javascript
// ✅ Correct
async function fetchUserData(userId) {
  const user = await UserRepository.getById(userId);
  const passports = await PassportRepository.getByUserId(userId);
  return { user, passports };
}

// ❌ Avoid
function fetchUserData(userId) {
  return UserRepository.getById(userId)
    .then(user => PassportRepository.getByUserId(userId)
      .then(passports => ({ user, passports })));
}
```

### 6. Immutable Data Updates
Use spread operators for updating state:

```javascript
// ✅ Correct
const updatedUser = {
  ...user,
  displayName: newName
};

setState(prevState => ({
  ...prevState,
  isLoading: false
}));

// ❌ Avoid
user.displayName = newName;  // Mutating directly
```

---

## Linting and Enforcement

This project uses ESLint to enforce naming conventions. The configuration includes:

- `camelcase` rule: Enforces camelCase for variables and functions
- `id-match` rule: Pattern matching for identifier names
- Exceptions for database-related snake_case in serialization layer
- Special overrides for repository and schema files

### Installation

If ESLint is not yet installed, run:
```bash
npm install --save-dev eslint eslint-plugin-react eslint-plugin-react-native eslint-plugin-react-hooks
```

### Usage

Run linting with:
```bash
npm run lint
```

Fix automatically fixable issues:
```bash
npm run lint:fix
```

### ESLint Configuration

The `.eslintrc.json` file includes:
- **Strict camelCase enforcement** for all variables and functions
- **Exceptions for database layer**: Repository and schema files allow snake_case for database columns
- **Constants allowed**: UPPER_SNAKE_CASE constants are permitted
- **Test file support**: Special configuration for Jest test files

---

## Summary

| Type | Convention | Example |
|------|-----------|---------|
| Variables | camelCase | `userId`, `firstName` |
| Functions | camelCase | `getUserById()`, `calculateTotal()` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRIES` |
| Classes | PascalCase | `UserRepository`, `PassportValidator` |
| Interfaces/Types | PascalCase | `PersonalInfo`, `EntryInfoStatus` |
| React Components | PascalCase | `PassportForm`, `TDACInfoCard` |
| Database Columns | snake_case | `user_id`, `created_at` (intentional) |
| Booleans | is/has/should prefix | `isActive`, `hasPermission` |

---

## Questions?

If you have questions about these standards or need clarification, please:
1. Check existing code for examples
2. Refer to this document
3. Ask the team for guidance

Remember: **Consistency is key!** Following these standards makes our codebase more maintainable and easier to understand.
