# TripSecretary Multi-Country Architecture

**Version:** 2.0 (Post-Refactoring)
**Last Updated:** 2025-10-30
**Status:** Production Ready

> **Note:** This is the consolidated architecture document. For architecture decisions (ADRs), see [architecture/Architecture-Decision-Records.md](architecture/Architecture-Decision-Records.md). Historical architecture docs are in [history/architecture/](history/architecture/).

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [System Layers](#system-layers)
4. [Design Patterns](#design-patterns)
5. [Data Flow](#data-flow)
6. [Multi-Country Support](#multi-country-support)
7. [Key Components](#key-components)
8. [Best Practices](#best-practices)
9. [Future Enhancements](#future-enhancements)

---

## Overview

TripSecretary is a React Native mobile application that helps Chinese travelers prepare for international entry requirements. The system supports multiple destination countries, each with its own:

- Entry requirements and documentation
- Digital arrival card systems (where available)
- Emergency contacts and travel information
- Validation rules and field mappings

### Core Capabilities

- **Progressive Data Collection**: Multi-step forms with auto-save
- **Digital Card Integration**: Automated submission to government APIs
- **Offline Support**: Works without internet (forms and guides)
- **Multi-Language**: Chinese and English throughout
- **Data Persistence**: SQLite with AsyncStorage backup

---

## Architecture Principles

### 1. Separation of Concerns

**Generic Infrastructure vs. Country-Specific Configuration**

```
┌─────────────────────────────────────────────────┐
│         Generic Infrastructure Layer            │
│  (Utilities, Validation Engine, Base Services)  │
│              Reusable Across Countries          │
└─────────────────────────────────────────────────┘
                      ▲
                      │
┌─────────────────────────────────────────────────┐
│      Country-Specific Configuration Layer       │
│    (Metadata, Rules, Mappings per Country)      │
│          Thailand / Vietnam / Malaysia          │
└─────────────────────────────────────────────────┘
```

**Benefits:**
- New countries don't require changes to core infrastructure
- Bug fixes in utilities benefit all countries
- Reduced code duplication (~70% reduction)

---

### 2. Configuration Over Code

**Before Refactoring:**
```javascript
// ❌ Hardcoded in services
if (accommodationType === 'HOTEL' ||
    accommodationType === '酒店' ||
    accommodationType === 'Hotel') {
  return 'HOTEL_ID';
}
```

**After Refactoring:**
```javascript
// ✅ Externalized to config
import { normalizeAccommodationType } from '../config/destinations/thailand/accommodationTypes';

const normalized = normalizeAccommodationType(accommodationType);
```

**Benefits:**
- Easy to update without code changes
- Non-developers can update configs
- Reduces testing surface area

---

### 3. Parameterization

All services accept destination parameter:

```javascript
// Generic service
class EntryInfoService {
  static async create(userId, destinationId) {
    // Works for any destination
  }
}

// Country-specific service with fallback
class TDACSubmissionService {
  static async submit(userId, destinationId = 'th') {
    // Thailand-specific but parameterized
  }
}
```

**Benefits:**
- Services can work with multiple destinations
- Backward compatible with defaults
- Clear country boundaries

---

### 4. Rule-Based Validation

**Validation Engine Pattern:**

```
┌──────────────────────────────────┐
│   ValidationRuleEngine (Base)   │
│   - Default rules (email, phone) │
│   - Rule composition             │
│   - Context-aware validation     │
└──────────────────────────────────┘
              ▲
              │ extends
┌──────────────────────────────────┐
│  Thailand Validation Rules       │
│  - Country-specific overrides    │
│  - Custom field rules            │
└──────────────────────────────────┐
              ▲
              │ extends
┌──────────────────────────────────┐
│  Vietnam Validation Rules        │
│  - Vietnam-specific overrides    │
└──────────────────────────────────┘
```

**Benefits:**
- DRY (Don't Repeat Yourself)
- Easy to customize per country
- Consistent validation behavior

---

## System Layers

### Layer 1: Presentation (UI)

**Components:**
- Screen components (`app/screens/`)
- Reusable UI components (`app/components/`)
- Navigation (`app/navigation/`)

**Responsibilities:**
- Display data
- Capture user input
- Handle user interactions
- Minimal business logic

**Pattern:** Presentational vs. Container Components

```javascript
// Container (Smart Component)
const ThailandEntryFlowScreen = () => {
  const [formData, setFormData] = useState({});
  const destination = getDestination('th');

  return (
    <ProgressiveEntryFlowScreen
      destination={destination}
      formData={formData}
      onDataChange={setFormData}
    />
  );
};

// Presentational (Dumb Component)
const ProgressiveEntryFlowScreen = ({ destination, formData, onDataChange }) => {
  // Pure UI rendering
  return <View>...</View>;
};
```

---

### Layer 2: Business Logic (Services)

**Services:**
- User data management (`UserDataService`)
- Entry info lifecycle (`EntryInfoService`)
- Digital card submission (`TDACSubmissionService`, `VietnamEVisaService`, etc.)
- Data validation (`ValidationRuleEngine`)

**Responsibilities:**
- Business rules enforcement
- Data transformation
- API communication
- Error handling

**Pattern:** Service Layer

```javascript
class TDACSubmissionService {
  // Public API
  static async submitTDAC(userId, destinationId = 'th') {
    const context = await this._buildContext(userId);
    const response = await this._callAPI(context);
    await this._saveRecord(response, destinationId);
    return response;
  }

  // Private helpers
  static async _buildContext(userId) { /*...*/ }
  static async _callAPI(context) { /*...*/ }
  static async _saveRecord(response, destinationId) { /*...*/ }
}
```

---

### Layer 3: Data Access (Persistence)

**Storage:**
- SQLite (primary) - Structured data
- AsyncStorage (secondary) - Simple key-value
- File system - PDFs, images

**Responsibilities:**
- CRUD operations
- Data schema management
- Migrations
- Backups

**Pattern:** Repository Pattern (via Services)

```javascript
class EntryInfoService {
  static async findByDestination(userId, destinationId) {
    return await Database.getFirstAsync(
      'SELECT * FROM entry_info WHERE user_id = ? AND destination_id = ?',
      [userId, destinationId]
    );
  }

  static async create(userId, destinationId) {
    const id = generateUUID();
    await Database.runAsync(
      'INSERT INTO entry_info (...) VALUES (...)',
      [id, userId, destinationId, ...]
    );
    return id;
  }
}
```

---

### Layer 4: Utilities (Helpers)

**Utilities:**
- Name parsing (`nameUtils.js`)
- Phone number parsing (`phoneUtils.js`)
- Location formatting (`locationUtils.js`)
- Date formatting (`dateUtils.js`)
- Validation engine (`ValidationRuleEngine.js`)

**Responsibilities:**
- Pure functions
- No side effects
- Highly reusable
- Well-tested

**Pattern:** Utility Functions

```javascript
// Pure function - no dependencies, no side effects
export const parseFullName = (fullName, options = {}) => {
  // Input: "ZHANG, WEI MING"
  // Output: { familyName: 'ZHANG', middleName: 'WEI', firstName: 'MING' }

  // Implementation...
};
```

---

### Layer 5: Configuration (Country Data)

**Configuration:**
- Destination metadata (`app/config/destinations/`)
- Validation rules
- Type mappings (accommodation, travel purpose)
- Financial info, emergency contacts

**Responsibilities:**
- Single source of truth
- Easy updates
- No code changes needed

**Pattern:** Configuration as Data

```javascript
// app/config/destinations/thailand/metadata.js
export const THAILAND_METADATA = {
  id: 'th',
  name: 'Thailand',
  currency: { code: 'THB', symbol: '฿' },
  timezone: 'Asia/Bangkok',
  // ...
};
```

---

## Design Patterns

### 1. Factory Pattern

**Usage:** Destination loading

```javascript
// app/config/destinations/index.js
export const getDestination = (destinationId) => {
  const destination = DESTINATIONS[destinationId];
  if (!destination) {
    throw new Error(`Unknown destination: ${destinationId}`);
  }
  return destination;
};

// Usage
const thailand = getDestination('th');
const vietnam = getDestination('vn');
```

---

### 2. Strategy Pattern

**Usage:** Validation rules

```javascript
// Different validation strategies per field type
const strategies = {
  email: (value) => validateEmail(value),
  phone: (value) => validatePhone(value),
  date: (value) => validateDate(value),
};

// Select strategy at runtime
const validator = strategies[fieldType];
const result = validator(value);
```

---

### 3. Builder Pattern

**Usage:** Context building

```javascript
class ThailandTravelerContextBuilder {
  static async buildContext(userId) {
    const userData = await this._getUserData(userId);
    const personalInfo = await this._buildPersonalInfo(userData);
    const passportInfo = await this._buildPassportInfo(userData);
    const travelInfo = await this._buildTravelInfo(userData);

    return {
      ...personalInfo,
      ...passportInfo,
      ...travelInfo
    };
  }
}
```

---

### 4. Observer Pattern

**Usage:** Progressive entry flow

```javascript
// Hooks observe form state changes
const useProgressiveEntry = (destinationId) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});

  // Auto-save on form data change
  useEffect(() => {
    saveFormData(destinationId, formData);
  }, [formData, destinationId]);

  return { currentStep, formData, setFormData };
};
```

---

### 5. Adapter Pattern

**Usage:** API integration

```javascript
// Adapt internal data to API format
class TDACAPIService {
  static async submit(travelerContext) {
    // Adapt context to TDAC API format
    const apiPayload = {
      fullname: travelerContext.fullName,
      passportno: travelerContext.passportNo,
      // ... field mapping
    };

    return await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(apiPayload)
    });
  }
}
```

---

## Data Flow

### User Registration → Digital Card Submission

```
┌────────────┐
│    User    │
└─────┬──────┘
      │ 1. Opens app
      ▼
┌────────────────────────────┐
│  HomeScreen (UI Layer)     │
│  - Shows destinations      │
│  - User selects Thailand   │
└─────┬──────────────────────┘
      │ 2. Navigate to Thailand
      ▼
┌────────────────────────────────────────┐
│  ThailandEntryFlowScreen (UI Layer)    │
│  - Progressive form (7 steps)          │
│  - Auto-save to UserDataService        │
└─────┬──────────────────────────────────┘
      │ 3. Form completion
      ▼
┌────────────────────────────────────────┐
│  UserDataService (Service Layer)       │
│  - Validates data                      │
│  - Stores in AsyncStorage              │
└─────┬──────────────────────────────────┘
      │ 4. Submit digital card
      ▼
┌────────────────────────────────────────┐
│  TDACSubmissionService (Service)       │
│  - Checks data completeness            │
│  - Builds traveler context             │
└─────┬──────────────────────────────────┘
      │ 5. Build context
      ▼
┌────────────────────────────────────────┐
│  ThailandTravelerContextBuilder        │
│  - Parses names (nameUtils)            │
│  - Normalizes phones (phoneUtils)      │
│  - Formats locations (locationUtils)   │
│  - Maps types (accommodationTypes)     │
└─────┬──────────────────────────────────┘
      │ 6. Call API
      ▼
┌────────────────────────────────────────┐
│  TDACAPIService                        │
│  - Maps to TDAC API format             │
│  - Submits to Thai immigration         │
│  - Returns QR code & PDF               │
└─────┬──────────────────────────────────┘
      │ 7. Save result
      ▼
┌────────────────────────────────────────┐
│  EntryInfoService + DigitalArrivalCard │
│  Service (Persistence Layer)           │
│  - Creates entry_info record           │
│  - Saves digital_arrival_cards record  │
│  - Stores PDF and QR locally           │
└─────┬──────────────────────────────────┘
      │ 8. Display result
      ▼
┌────────────────────────────────────────┐
│  EntryPackDisplay (UI Layer)           │
│  - Shows QR code                       │
│  - Displays PDF                        │
│  - Ready for airport                   │
└────────────────────────────────────────┘
```

---

## Multi-Country Support

### How Multiple Countries Work

#### 1. Central Registry

```javascript
// app/config/destinations/index.js
export const DESTINATIONS = {
  th: thailand,
  vn: vietnam,
  my: malaysia,
  sg: singapore
};
```

#### 2. Country-Specific Directories

```
app/
├── config/destinations/
│   ├── thailand/
│   │   ├── index.js
│   │   ├── metadata.js
│   │   ├── financialInfo.js
│   │   └── validationRules.js
│   ├── vietnam/
│   │   ├── index.js
│   │   ├── metadata.js
│   │   └── ...
│   └── malaysia/
│       └── ...
├── services/
│   ├── thailand/
│   │   ├── TDACAPIService.js
│   │   └── TDACSubmissionService.js
│   ├── vietnam/
│   │   ├── VietnamEVisaService.js
│   │   └── ...
│   └── generic/
│       ├── UserDataService.js
│       └── EntryInfoService.js
└── screens/
    ├── thailand/
    │   ├── ThailandInfo.js
    │   └── ThailandEntryFlowScreen.js
    ├── vietnam/
    │   └── ...
    └── common/
        └── ProgressiveEntryFlowScreen.js
```

#### 3. Dynamic Loading

```javascript
// Load country config dynamically
const destination = getDestination(destinationId);

// Use country metadata
const currency = destination.currency.symbol;
const timezone = destination.timezone;

// Load country validation rules
import validationRules from `../config/destinations/${destinationId}/validationRules`;
```

---

## Key Components

### 1. Progressive Entry Flow

**Purpose:** Multi-step form with auto-save and progress tracking

**Features:**
- 7-step process (Passport → Contact → Travel → Financial → Review → Submit)
- Auto-save every change
- Progress indicators
- Back/forward navigation
- Field validation

**Files:**
- `app/screens/common/ProgressiveEntryFlowScreen.js`
- `app/hooks/useProgressiveEntryFlow.js`

---

### 2. Validation Engine

**Purpose:** Flexible, rule-based field validation

**Features:**
- Default rules for common types (email, phone, date)
- Country-specific rule overrides
- Context-aware validation (e.g., "departure date must be after arrival date")
- Composable rules

**Files:**
- `app/utils/validation/ValidationRuleEngine.js`
- `app/config/destinations/{country}/validationRules.js`

---

### 3. Context Builder

**Purpose:** Transform user data into API-ready format

**Responsibilities:**
- Parse names (handle "FAMILY, GIVEN" format)
- Extract phone country codes
- Normalize accommodation types
- Format locations
- Map field IDs

**Files:**
- `app/services/thailand/ThailandTravelerContextBuilder.js`
- (Future) `app/services/vietnam/VietnamTravelerContextBuilder.js`

---

### 4. Digital Card Services

**Purpose:** Submit forms to government APIs and save results

**Pattern:** Each country has its own service

**Thailand Example:**
```javascript
class TDACSubmissionService {
  static async submitTDAC(userId, destinationId = 'th') {
    // Build context
    const context = await ThailandTravelerContextBuilder.buildContext(userId);

    // Submit to API
    const response = await TDACAPIService.submitApplication(context);

    // Save result
    await this.saveSubmissionRecord(userId, response, destinationId);

    return response;
  }
}
```

---

## Best Practices

### 1. Always Parameterize Destination

❌ **Bad:**
```javascript
const entryInfo = await findEntryInfo(userId, 'th');  // Hardcoded
```

✅ **Good:**
```javascript
const entryInfo = await findEntryInfo(userId, destinationId);  // Parameterized
```

---

### 2. Use Config, Not Code

❌ **Bad:**
```javascript
if (type === 'HOTEL' || type === '酒店') {
  return 'HOTEL_ID';
}
```

✅ **Good:**
```javascript
const normalized = normalizeAccommodationType(type);
```

---

### 3. Centralize Utilities

❌ **Bad:**
```javascript
// Duplicate parsing logic in multiple files
const parts = fullName.split(',');
const familyName = parts[0];
```

✅ **Good:**
```javascript
import { parseFullName } from '../../utils/nameUtils';
const { familyName } = parseFullName(fullName);
```

---

### 4. Validate with Engine

❌ **Bad:**
```javascript
switch (fieldName) {
  case 'email':
    if (!email.includes('@')) return 'Invalid';
    break;
  // ... 300 lines
}
```

✅ **Good:**
```javascript
const validator = new ValidationRuleEngine(COUNTRY_RULES);
const result = validator.validate(fieldName, value, context);
```

---

## Future Enhancements

### 1. TypeScript Migration

**Benefits:**
- Type safety
- Better IDE support
- Fewer runtime errors
- Self-documenting code

**Approach:**
- Start with types (`types.ts`)
- Convert utilities
- Convert services
- Convert components

---

### 2. Offline Sync Queue

**Problem:** Digital card submission fails if offline

**Solution:** Queue system
```javascript
class SubmissionQueue {
  async add(submission) {
    await queueDB.insert(submission);
  }

  async processPending() {
    const pending = await queueDB.findPending();
    for (const submission of pending) {
      await this.retry(submission);
    }
  }
}
```

---

### 3. Real-Time Exchange Rates

**Problem:** Exchange rates hardcoded in config

**Solution:** External API integration
```javascript
class ExchangeRateService {
  static async getRate(from, to) {
    // Call external API
    const response = await fetch(`https://api.exchangerate.com/${from}/${to}`);
    return response.rate;
  }
}
```

---

### 4. Analytics Integration

**Track:**
- Form completion rates
- Submission success rates
- Error patterns
- Popular destinations

**Implementation:**
```javascript
Analytics.track('digital_card_submission', {
  destination: 'th',
  success: true,
  duration: 45000  // ms
});
```

---

## Conclusion

The TripSecretary architecture follows modern software engineering principles:

✅ **Separation of Concerns** - Clear layers with distinct responsibilities
✅ **Configuration Over Code** - Easy to update without deployments
✅ **DRY (Don't Repeat Yourself)** - Reusable utilities and patterns
✅ **SOLID Principles** - Single responsibility, open/closed, etc.
✅ **Scalable** - Easy to add new countries
✅ **Maintainable** - Well-documented and consistent patterns

**Result:** Clean, extensible system ready for multi-country expansion.

---

**Document Version:** 2.0
**Last Updated:** 2025-01-30
**Authors:** TripSecretary Development Team + Claude
**Next Review:** After 3rd country implementation
