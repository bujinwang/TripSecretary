# Entry Requirements Engine - Design Document

**Version:** 1.1
**Date:** 2025-10-26
**Status:** Design Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Current Architecture Analysis](#current-architecture-analysis)
4. [Proposed Solution Architecture](#proposed-solution-architecture)
5. [Data Model Design](#data-model-design)
6. [Rules Engine Design](#rules-engine-design)
7. [Integration Strategy](#integration-strategy)
8. [Scalability & Extensibility](#scalability--extensibility)
9. [Implementation Roadmap](#implementation-roadmap)
10. [Appendix](#appendix)

---

## Executive Summary

### The Challenge

TripSecretary currently handles **50+ destinations** but lacks a systematic way to handle the **combinatorial complexity** of:

- **200+ passport-issuing countries** × **50+ destinations** = **10,000+ unique combinations**
- Each combination has different requirements:
  - Visa policies (visa-free, visa required, visa on arrival, eVisa)
  - Stay duration limits
  - Entry forms (digital or paper)
  - Additional documents (proof of funds, return tickets, accommodation)
  - Special notes and restrictions

### Current State

- ✅ **Destination-level** requirements configured (`destinationRequirements.js`)
- ✅ **Partial nationality awareness** for 3 destinations (`nationalityRequirements.js`)
- ✅ **PassportCountry model** exists but underutilized
- ❌ **No centralized rules engine** to compute requirements dynamically
- ❌ **No way to merge** general destination rules + specific nationality exceptions
- ❌ **Difficult to scale** - adding new countries requires manual configuration in multiple places

### Proposed Solution

A **three-tier architecture** with:

1. **Rules Engine Service** - Centralized logic to compute requirements based on passport + destination
2. **Hierarchical Configuration** - Base rules + country-specific overrides
3. **Smart Defaults** - Graceful fallback for unconfigured combinations

### Key Benefits

- 🎯 **Scalability**: Add new passport × destination combinations declaratively
- 🔄 **Maintainability**: Single source of truth for entry requirements
- 🚀 **Performance**: In-memory caching with 5-minute TTL
- 🧩 **Extensibility**: Plugin architecture for country-specific logic
- 📱 **User Experience**: Personalized checklist based on actual passport nationality

---

## Problem Statement

### 1. Combinatorial Explosion

**Example Scenario:**
```
🇨🇳 Chinese passport → 🇹🇭 Thailand:
  - Visa: Not required
  - Stay: 30 days
  - Form: TDAC (digital)
  - Funds: 10,000 THB
  - Documents: Return ticket, accommodation proof

🇺🇸 US passport → 🇹🇭 Thailand:
  - Visa: Not required
  - Stay: 30 days
  - Form: TDAC (digital)
  - Funds: 10,000 THB
  - Documents: Return ticket, accommodation proof

🇮🇳 Indian passport → 🇹🇭 Thailand:
  - Visa: REQUIRED (must apply in advance)
  - Stay: 60 days (with visa)
  - Form: TDAC (digital)
  - Funds: 20,000 THB
  - Documents: Return ticket, accommodation, visa copy
```

**Multiply this by:**
- 50 popular destinations
- 200 passport countries
- = **10,000 unique combinations**

### 2. Current Limitations

#### **File:** `app/config/destinationRequirements.js`
```javascript
th: {
  needsPaperForm: false,
  entryMethod: 'digital',
  digitalSystem: 'TDAC',
  // ❌ No passport-nationality awareness!
  // ❌ Assumes all travelers have same requirements
}
```

#### **File:** `app/config/nationalityRequirements.js`
```javascript
'us': {
  'CHN': { visaRequired: true, ... },
  'CAN': { visaRequired: false, ... }
}
// ✅ Has passport awareness
// ❌ Only 3 destinations configured (US, JP, SG)
// ❌ Only 2-3 nationalities per destination
// ❌ Not integrated with destinationRequirements.js
```

### 3. Code Duplication

**Current Pattern (11 Thailand screens!):**
```
app/screens/thailand/
  - ThailandInfoScreen.js
  - ThailandRequirementsScreen.js
  - ThailandTravelInfoScreen.js
  - ThailandEntryFlowScreen.js
  - TDACWebViewScreen.js
  - TDACAPIScreen.js
  - ... 5 more screens
```

**This pattern is repeated for:**
- Japan (6 screens)
- Singapore (5 screens)
- Malaysia (5 screens)
- Taiwan (5 screens)
- Hong Kong (3 screens)
- Korea (5 screens)

**Result:** ~40+ screens with duplicated logic for requirements display, forms, guides, etc.

---

## Current Architecture Analysis

### Existing Components

#### 1. Data Models

| Model | Purpose | Status |
|-------|---------|--------|
| `Passport` | Store passport info (nationality, expiry, etc.) | ✅ Used |
| `TravelInfo` | Store trip details (flights, accommodation) | ✅ Used |
| `EntryInfo` | Store entry pack metadata | ✅ Used |
| `PassportCountry` | Store visa requirements per passport-country | ⚠️ **Underutilized** |

#### 2. Configuration Files

| File | Purpose | Coverage |
|------|---------|----------|
| `destinationRequirements.js` | Destination-level config | 15 destinations |
| `nationalityRequirements.js` | Nationality-specific rules | 3 destinations, 2-3 nationalities each |
| `entryGuide/*.js` | Country-specific guide content | 9 countries |

#### 3. Services

| Service | Purpose | Passport-Aware? |
|---------|---------|-----------------|
| `UserDataService` | Main data access layer | No |
| `EntryInfoService` | Manage entry packs | No |
| `EntryGuideService` | Multi-country guide base | No |
| `ThailandEntryGuideService` | Thailand-specific | No |
| `TDACAPIService` | TDAC API integration | No |

### Architecture Gaps

1. **No Rules Engine**: No centralized service to compute `getRequirements(passport, destination)`
2. **No Merging Logic**: Can't combine base rules + nationality exceptions
3. **No Fallbacks**: If combination not configured, app has no graceful handling
4. **No Caching**: Repeated lookups hit config files each time
5. **No Validation**: No type checking or schema validation for config data

---

## Proposed Solution Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────────────────────┐     │
│  │  Passport    │      │  SelectDestinationScreen     │     │
│  │  Model       │──────▶  (Choose destination)        │     │
│  │  (CN, US..)  │      └──────────────────────────────┘     │
│  └──────────────┘                    │                      │
│                                      │                      │
│                                      ▼                      │
│                        ┌────────────────────────────┐       │
│                        │ EntryRequirementsEngine    │       │
│                        │ .getRequirements(CN, TH)   │       │
│                        └────────────────────────────┘       │
│                                      │                      │
│                   ┌──────────────────┼────────────────┐     │
│                   ▼                  ▼                ▼     │
│          ┌────────────────┐  ┌──────────────┐  ┌─────────┐ │
│          │ Base Rules     │  │ Nationality  │  │ Cache   │ │
│          │ Config         │  │ Overrides    │  │ Layer   │ │
│          └────────────────┘  └──────────────┘  └─────────┘ │
│                   │                  │                │     │
│                   └──────────────────┴────────────────┘     │
│                                      │                      │
│                                      ▼                      │
│                        ┌────────────────────────────┐       │
│                        │   Computed Checklist       │       │
│                        │   - Visa required?         │       │
│                        │   - Forms needed           │       │
│                        │   - Documents needed       │       │
│                        │   - Special notes          │       │
│                        └────────────────────────────┘       │
│                                      │                      │
│                                      ▼                      │
│                        ┌────────────────────────────┐       │
│                        │   ChecklistScreen          │       │
│                        │   (Personalized UI)        │       │
│                        └────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Three-Tier Architecture

#### Tier 1: Configuration Layer (JSON/JS Objects)

```javascript
// Base destination rules (applies to ALL travelers)
const baseDestinationRules = {
  TH: {
    code: 'TH',
    name: 'Thailand',
    nameZh: '泰国',
    defaultRequirements: [
      { type: 'passport_validity', months: 6 },
      { type: 'return_ticket', required: true },
      { type: 'accommodation_proof', required: true }
    ],
    entryMethod: 'digital',
    digitalSystem: 'TDAC',
    digitalUrl: 'https://tdac.immigration.go.th'
  },
  // ... other countries
};

// Nationality-specific overrides
const nationalityOverrides = {
  TH: {
    CN: {  // Chinese passport to Thailand
      visaRequired: false,
      stayDuration: 30,
      forms: [{ id: 'TDAC', name: 'Thailand Digital Arrival Card', canAutoFill: true }],
      additionalDocs: [{ type: 'funds_proof', amount: 10000, currency: 'THB' }]
    },
    US: {  // US passport to Thailand
      visaRequired: false,
      stayDuration: 30,
      forms: [{ id: 'TDAC', name: 'Thailand Digital Arrival Card', canAutoFill: true }],
      additionalDocs: [{ type: 'funds_proof', amount: 10000, currency: 'THB' }]
    },
    IN: {  // Indian passport to Thailand
      visaRequired: true,
      visaType: 'tourist',
      stayDuration: 60,
      forms: [{ id: 'TDAC', name: 'Thailand Digital Arrival Card', canAutoFill: true }],
      additionalDocs: [
        { type: 'visa_copy', required: true },
        { type: 'funds_proof', amount: 20000, currency: 'THB' }
      ]
    }
  },
  // ... other destinations
};
```

#### Tier 2: Rules Engine Service

```javascript
class EntryRequirementsEngine {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Main API: Get requirements for a passport-destination combination
   * @param {string} passportNationality - ISO 3166-1 alpha-3 code (e.g., 'CHN', 'USA')
   * @param {string} destinationCode - ISO 3166-1 alpha-2 code (e.g., 'TH', 'JP')
   * @returns {ComputedRequirements}
   */
  getRequirements(passportNationality, destinationCode) {
    // 1. Check cache first
    const cacheKey = `${passportNationality}_${destinationCode}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    // 2. Load base destination rules
    const baseRules = baseDestinationRules[destinationCode];
    if (!baseRules) {
      return this._handleUnsupportedDestination(destinationCode);
    }

    // 3. Load nationality-specific overrides
    const nationalityRules = nationalityOverrides[destinationCode]?.[passportNationality];

    // 4. Merge rules (nationality overrides base)
    const computed = this._mergeRules(baseRules, nationalityRules, passportNationality);

    // 5. Cache and return
    this._setCache(cacheKey, computed);
    return computed;
  }

  /**
   * Get a user-friendly checklist for UI display
   */
  getChecklist(passportNationality, destinationCode) {
    const reqs = this.getRequirements(passportNationality, destinationCode);
    return this._buildChecklist(reqs);
  }

  /**
   * Check if a combination is supported
   */
  isSupported(passportNationality, destinationCode) {
    return !!nationalityOverrides[destinationCode]?.[passportNationality];
  }
}
```

#### Tier 3: UI Components

```javascript
// In SelectDestinationScreen.js
import EntryRequirementsEngine from '../services/EntryRequirementsEngine';

const SelectDestinationScreen = ({ route, navigation }) => {
  const { passport } = route.params;
  const engine = new EntryRequirementsEngine();

  const handleSelectDestination = (destCode) => {
    // Get personalized checklist based on passport nationality
    const checklist = engine.getChecklist(passport.nationality, destCode);

    if (!checklist.supported) {
      Alert.alert('Not Configured', checklist.message);
      return;
    }

    // Navigate to checklist screen with personalized requirements
    navigation.navigate('ChecklistScreen', {
      passport,
      destination: destCode,
      checklist
    });
  };

  return (
    <ScrollView>
      {destinations.map(dest => (
        <DestinationCard
          key={dest.code}
          destination={dest}
          passport={passport}
          onPress={() => handleSelectDestination(dest.code)}
        />
      ))}
    </ScrollView>
  );
};
```

---

## Data Model Design

### 1. Configuration Schema

#### Base Destination Rule Schema

```typescript
interface BaseDestinationRule {
  code: string;                      // ISO 3166-1 alpha-2 (e.g., 'TH')
  name: string;                      // English name
  nameZh: string;                    // Chinese name
  defaultRequirements: Requirement[];
  entryMethod: 'digital' | 'paper' | 'both' | 'none';
  digitalSystem?: string;            // e.g., 'TDAC', 'MDAC'
  digitalUrl?: string;
  kioskName?: string;
  hasAutoKiosk?: boolean;
}

interface Requirement {
  type: 'passport_validity' | 'return_ticket' | 'accommodation_proof' | 'funds_proof' | 'visa_copy';
  required: boolean;
  months?: number;                   // For passport_validity
  amount?: number;                   // For funds_proof
  currency?: string;                 // For funds_proof
}
```

#### Nationality Override Schema

```typescript
interface NationalityOverride {
  visaRequired: boolean;
  visaType?: string;                 // 'tourist', 'business', 'eVisa', 'on-arrival'
  stayDuration: number;              // Days
  forms: EntryForm[];
  additionalDocs: Requirement[];
  specialNotes?: string[];
  kioskEligible?: boolean;
}

interface EntryForm {
  id: string;                        // 'TDAC', 'I94', 'SG_ARRIVAL_CARD'
  name: string;
  nameZh?: string;
  required: boolean;
  canAutoFill: boolean;
  url?: string;
}
```

#### Computed Requirements Schema

```typescript
interface ComputedRequirements {
  passportNationality: string;
  destinationCode: string;
  supported: boolean;

  // Visa info
  visaRequired: boolean;
  visaType?: string;
  stayDuration?: number;

  // Requirements
  requirements: Requirement[];
  forms: EntryForm[];

  // Metadata
  specialNotes?: string[];
  kioskEligible?: boolean;
  digitalSystem?: string;
  digitalUrl?: string;
}
```

### 2. Database Schema Extensions

#### Extend `passport_countries` table

```sql
CREATE TABLE IF NOT EXISTS passport_countries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  passport_id TEXT NOT NULL,
  country_code TEXT NOT NULL,

  -- Visa requirements
  visa_required INTEGER DEFAULT 0,     -- 0 = no, 1 = yes
  visa_type TEXT,                       -- 'tourist', 'eVisa', etc.
  max_stay_days INTEGER,

  -- Cached from rules engine
  requirements_json TEXT,               -- JSON blob of computed requirements
  last_updated_at TEXT,                 -- Timestamp of last cache update

  notes TEXT,
  created_at TEXT NOT NULL,

  UNIQUE(passport_id, country_code),
  FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE CASCADE
);
```

**Purpose:** Cache computed requirements per user's passport to avoid re-computation

#### Add `entry_requirements_cache` table

```sql
CREATE TABLE IF NOT EXISTS entry_requirements_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  passport_nationality TEXT NOT NULL,   -- ISO 3166-1 alpha-3 (e.g., 'CHN')
  destination_code TEXT NOT NULL,       -- ISO 3166-1 alpha-2 (e.g., 'TH')

  requirements_json TEXT NOT NULL,      -- Full ComputedRequirements JSON

  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,             -- TTL-based expiration

  UNIQUE(passport_nationality, destination_code)
);
```

**Purpose:** Global cache for rules engine lookups (not user-specific)

### 3. In-Memory Cache Structure

```javascript
// CacheManager extension for EntryRequirementsEngine
class EntryRequirementsCacheManager {
  constructor(ttl = 5 * 60 * 1000) {
    this.cache = new Map();
    this.ttl = ttl;
    this.stats = { hits: 0, misses: 0 };
  }

  get(passportNationality, destinationCode) {
    const key = `${passportNationality}_${destinationCode}`;
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  set(passportNationality, destinationCode, data) {
    const key = `${passportNationality}_${destinationCode}`;
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttl
    });
  }

  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }
}
```

---

## Rules Engine Design

### Core Service Implementation

**File:** `app/services/requirements/EntryRequirementsEngine.js`

```javascript
import baseDestinationRules from '../../config/requirements/baseDestinationRules';
import nationalityOverrides from '../../config/requirements/nationalityOverrides';
import EntryRequirementsCacheManager from './EntryRequirementsCacheManager';

class EntryRequirementsEngine {
  constructor() {
    this.cache = new EntryRequirementsCacheManager(5 * 60 * 1000);
  }

  /**
   * Main API: Get computed requirements
   * @param {string} passportNationality - ISO 3166-1 alpha-3 (e.g., 'CHN', 'USA', 'GBR')
   * @param {string} destinationCode - ISO 3166-1 alpha-2 (e.g., 'TH', 'JP', 'SG')
   * @returns {ComputedRequirements}
   */
  getRequirements(passportNationality, destinationCode) {
    // 1. Check cache
    const cached = this.cache.get(passportNationality, destinationCode);
    if (cached) {
      return cached;
    }

    // 2. Load base rules
    const baseRules = baseDestinationRules[destinationCode];
    if (!baseRules) {
      return this._handleUnsupportedDestination(passportNationality, destinationCode);
    }

    // 3. Load nationality overrides
    const overrides = nationalityOverrides[destinationCode]?.[passportNationality];

    if (!overrides) {
      return this._handleUnsupportedNationality(passportNationality, destinationCode, baseRules);
    }

    // 4. Merge rules
    const computed = this._mergeRules(baseRules, overrides, passportNationality, destinationCode);

    // 5. Cache and return
    this.cache.set(passportNationality, destinationCode, computed);
    return computed;
  }

  /**
   * Get user-friendly checklist for UI
   */
  getChecklist(passportNationality, destinationCode) {
    const reqs = this.getRequirements(passportNationality, destinationCode);

    if (!reqs.supported) {
      return {
        supported: false,
        message: reqs.message || 'This combination is not yet configured.',
        checklist: []
      };
    }

    const checklist = [];

    // 1. Visa check
    if (reqs.visaRequired) {
      checklist.push({
        id: 'visa',
        icon: '🛂',
        title: 'Visa Required',
        titleZh: '需要签证',
        description: `You need a ${reqs.visaType || 'visa'} to enter this country.`,
        descriptionZh: `需要办理${reqs.visaType || ''}签证`,
        required: true,
        canHelp: false,
        status: 'pending'
      });
    } else {
      checklist.push({
        id: 'visa',
        icon: '✅',
        title: 'Visa-Free Entry',
        titleZh: '免签入境',
        description: `Stay up to ${reqs.stayDuration} days without a visa`,
        descriptionZh: `可免签停留${reqs.stayDuration}天`,
        required: false,
        canHelp: false,
        status: 'completed'
      });
    }

    // 2. Passport validity
    const validityReq = reqs.requirements.find(r => r.type === 'passport_validity');
    if (validityReq) {
      checklist.push({
        id: 'passport_validity',
        icon: '📘',
        title: 'Passport Validity',
        titleZh: '护照有效期',
        description: `Your passport must be valid for at least ${validityReq.months} months`,
        descriptionZh: `护照有效期需至少${validityReq.months}个月`,
        required: true,
        canHelp: true,
        autoCheck: true,
        status: 'pending'
      });
    }

    // 3. Return ticket
    if (reqs.requirements.find(r => r.type === 'return_ticket')) {
      checklist.push({
        id: 'return_ticket',
        icon: '✈️',
        title: 'Return or Onward Ticket',
        titleZh: '返程或续程机票',
        description: 'Confirmed departure ticket',
        descriptionZh: '已确认的离境机票',
        required: true,
        canHelp: false,
        status: 'pending'
      });
    }

    // 4. Accommodation proof
    if (reqs.requirements.find(r => r.type === 'accommodation_proof')) {
      checklist.push({
        id: 'accommodation',
        icon: '🏨',
        title: 'Accommodation Proof',
        titleZh: '住宿证明',
        description: 'Hotel booking or invitation letter',
        descriptionZh: '酒店预订或邀请函',
        required: true,
        canHelp: false,
        status: 'pending'
      });
    }

    // 5. Funds proof
    const fundsReq = reqs.requirements.find(r => r.type === 'funds_proof');
    if (fundsReq) {
      checklist.push({
        id: 'funds',
        icon: '💰',
        title: 'Proof of Funds',
        titleZh: '资金证明',
        description: `At least ${fundsReq.amount} ${fundsReq.currency}`,
        descriptionZh: `至少${fundsReq.amount} ${fundsReq.currency}`,
        required: true,
        canHelp: false,
        status: 'pending'
      });
    }

    // 6. Entry forms
    reqs.forms.forEach(form => {
      checklist.push({
        id: form.id,
        icon: form.canAutoFill ? '✨' : '📝',
        title: form.name,
        titleZh: form.nameZh || form.name,
        description: form.canAutoFill
          ? 'We can auto-fill this for you'
          : 'You need to fill this manually',
        descriptionZh: form.canAutoFill
          ? '我们可以帮您自动填写'
          : '需要手动填写',
        required: form.required,
        canHelp: form.canAutoFill,
        autoFillable: form.canAutoFill,
        url: form.url,
        status: 'pending'
      });
    });

    return {
      supported: true,
      passportNationality,
      destinationCode,
      visaRequired: reqs.visaRequired,
      stayDuration: reqs.stayDuration,
      checklist,
      specialNotes: reqs.specialNotes,
      kioskEligible: reqs.kioskEligible,
      digitalSystem: reqs.digitalSystem,
      digitalUrl: reqs.digitalUrl
    };
  }

  /**
   * Check if a combination is supported
   */
  isSupported(passportNationality, destinationCode) {
    return !!nationalityOverrides[destinationCode]?.[passportNationality];
  }

  /**
   * Get all supported destinations for a passport nationality
   */
  getSupportedDestinations(passportNationality) {
    const supported = [];

    Object.keys(nationalityOverrides).forEach(destCode => {
      if (nationalityOverrides[destCode][passportNationality]) {
        supported.push({
          code: destCode,
          ...baseDestinationRules[destCode]
        });
      }
    });

    return supported;
  }

  /**
   * PRIVATE: Merge base rules with nationality overrides
   */
  _mergeRules(baseRules, overrides, passportNationality, destinationCode) {
    return {
      passportNationality,
      destinationCode,
      supported: true,

      // From overrides
      visaRequired: overrides.visaRequired,
      visaType: overrides.visaType,
      stayDuration: overrides.stayDuration,

      // Merge requirements (base + additional)
      requirements: [
        ...baseRules.defaultRequirements,
        ...(overrides.additionalDocs || [])
      ],

      // Forms from overrides
      forms: overrides.forms || [],

      // Metadata
      specialNotes: overrides.specialNotes || [],
      kioskEligible: overrides.kioskEligible ?? false,

      // From base rules
      digitalSystem: baseRules.digitalSystem,
      digitalUrl: baseRules.digitalUrl,
      entryMethod: baseRules.entryMethod
    };
  }

  /**
   * PRIVATE: Handle unsupported destination
   */
  _handleUnsupportedDestination(passportNationality, destinationCode) {
    return {
      passportNationality,
      destinationCode,
      supported: false,
      message: `Destination ${destinationCode} is not configured yet.`,
      messageZh: `目的地 ${destinationCode} 尚未配置`,
      requirements: [],
      forms: []
    };
  }

  /**
   * PRIVATE: Handle unsupported nationality for a destination
   */
  _handleUnsupportedNationality(passportNationality, destinationCode, baseRules) {
    return {
      passportNationality,
      destinationCode,
      supported: false,
      message: `Requirements for ${passportNationality} passport to ${destinationCode} are not configured yet. Please check with the embassy.`,
      messageZh: `${passportNationality} 护照前往 ${destinationCode} 的要求尚未配置，请咨询使馆`,

      // Return base requirements as fallback
      requirements: baseRules.defaultRequirements,
      forms: [],
      visaRequired: true,  // Assume visa required by default for safety

      // Suggest manual verification
      specialNotes: [
        'This combination is not fully configured.',
        'Please verify requirements with the embassy or consulate.',
        '该组合尚未完全配置，请向使领馆核实具体要求。'
      ]
    };
  }

  /**
   * Clear cache (useful for testing or config updates)
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.stats;
  }
}

export default EntryRequirementsEngine;
```

### Configuration Files Structure

**File Structure:**
```
app/config/requirements/
  ├── baseDestinationRules.js       # General rules for each destination
  ├── nationalityOverrides.js       # Passport-specific overrides
  ├── index.js                      # Export all configs
  └── schemas/                      # TypeScript schemas for validation
      ├── BaseDestinationRule.ts
      ├── NationalityOverride.ts
      └── ComputedRequirements.ts
```

**File:** `app/config/requirements/baseDestinationRules.js`

```javascript
/**
 * Base destination rules - applies to ALL travelers
 * These are general requirements regardless of passport nationality
 */

export const baseDestinationRules = {
  // Thailand
  TH: {
    code: 'TH',
    name: 'Thailand',
    nameZh: '泰国',
    defaultRequirements: [
      { type: 'passport_validity', required: true, months: 6 },
      { type: 'return_ticket', required: true },
      { type: 'accommodation_proof', required: true }
    ],
    entryMethod: 'digital',
    digitalSystem: 'TDAC',
    digitalUrl: 'https://tdac.immigration.go.th',
    hasAutoKiosk: false
  },

  // Singapore
  SG: {
    code: 'SG',
    name: 'Singapore',
    nameZh: '新加坡',
    defaultRequirements: [
      { type: 'passport_validity', required: true, months: 6 },
      { type: 'return_ticket', required: true }
    ],
    entryMethod: 'digital',
    digitalSystem: 'SG Arrival Card',
    digitalUrl: 'https://eservices.ica.gov.sg/sgarrivalcard',
    hasAutoKiosk: true
  },

  // Japan
  JP: {
    code: 'JP',
    name: 'Japan',
    nameZh: '日本',
    defaultRequirements: [
      { type: 'passport_validity', required: true, months: 6 },
      { type: 'return_ticket', required: true },
      { type: 'accommodation_proof', required: true }
    ],
    entryMethod: 'paper',
    hasAutoKiosk: false
  },

  // USA
  US: {
    code: 'US',
    name: 'United States',
    nameZh: '美国',
    defaultRequirements: [
      { type: 'passport_validity', required: true, months: 6 },
      { type: 'return_ticket', required: true },
      { type: 'accommodation_proof', required: true }
    ],
    entryMethod: 'both',
    hasAutoKiosk: true,
    kioskName: 'APC Kiosk'
  },

  // Hong Kong
  HK: {
    code: 'HK',
    name: 'Hong Kong',
    nameZh: '香港',
    defaultRequirements: [
      { type: 'passport_validity', required: true, months: 1 },
      { type: 'return_ticket', required: true }
    ],
    entryMethod: 'visa-free',
    hasAutoKiosk: true,
    kioskName: 'e-Channel'
  },

  // Add more destinations...
};

export default baseDestinationRules;
```

**File:** `app/config/requirements/nationalityOverrides.js`

```javascript
/**
 * Nationality-specific overrides
 * Structure: { DESTINATION_CODE: { PASSPORT_NATIONALITY: { rules } } }
 */

export const nationalityOverrides = {
  // Thailand
  TH: {
    CHN: {  // Chinese passport
      visaRequired: false,
      stayDuration: 30,
      forms: [
        {
          id: 'TDAC',
          name: 'Thailand Digital Arrival Card',
          nameZh: '泰国电子入境卡',
          required: true,
          canAutoFill: true,
          url: 'https://tdac.immigration.go.th'
        }
      ],
      additionalDocs: [
        { type: 'funds_proof', required: true, amount: 10000, currency: 'THB' }
      ],
      kioskEligible: false,
      specialNotes: [
        'Visa-free for 30 days',
        'Must show 10,000 THB or equivalent',
        '30天免签，需携带1万泰铢或等值外币'
      ]
    },

    USA: {  // US passport
      visaRequired: false,
      stayDuration: 30,
      forms: [
        {
          id: 'TDAC',
          name: 'Thailand Digital Arrival Card',
          required: true,
          canAutoFill: true
        }
      ],
      additionalDocs: [
        { type: 'funds_proof', required: true, amount: 10000, currency: 'THB' }
      ],
      kioskEligible: false
    },

    IND: {  // Indian passport
      visaRequired: true,
      visaType: 'Tourist Visa (apply online or at embassy)',
      stayDuration: 60,
      forms: [
        {
          id: 'TDAC',
          name: 'Thailand Digital Arrival Card',
          required: true,
          canAutoFill: true
        }
      ],
      additionalDocs: [
        { type: 'visa_copy', required: true },
        { type: 'funds_proof', required: true, amount: 20000, currency: 'THB' }
      ],
      kioskEligible: false,
      specialNotes: [
        'Visa required - apply in advance',
        'Need 20,000 THB proof of funds',
        '需要提前办理签证',
        '需携带2万泰铢资金证明'
      ]
    },

    // Add more nationalities for Thailand...
  },

  // Singapore
  SG: {
    CHN: {
      visaRequired: false,
      stayDuration: 30,
      forms: [
        {
          id: 'SG_ARRIVAL_CARD',
          name: 'SG Arrival Card',
          nameZh: '新加坡入境卡',
          required: true,
          canAutoFill: true,
          url: 'https://eservices.ica.gov.sg/sgarrivalcard'
        }
      ],
      additionalDocs: [],
      kioskEligible: true,
      specialNotes: [
        'Submit 3 days before arrival',
        '需在抵达前3天内提交'
      ]
    },

    USA: {
      visaRequired: false,
      stayDuration: 90,
      forms: [
        {
          id: 'SG_ARRIVAL_CARD',
          name: 'SG Arrival Card',
          required: true,
          canAutoFill: true
        }
      ],
      additionalDocs: [],
      kioskEligible: true
    },

    IND: {
      visaRequired: true,
      visaType: 'eVisa or Embassy Visa',
      stayDuration: 30,
      forms: [
        {
          id: 'SG_ARRIVAL_CARD',
          name: 'SG Arrival Card',
          required: true,
          canAutoFill: true
        }
      ],
      additionalDocs: [
        { type: 'visa_copy', required: true }
      ],
      kioskEligible: false
    },

    // Add more nationalities for Singapore...
  },

  // Japan
  JP: {
    CHN: {
      visaRequired: true,
      visaType: 'Tourist Visa',
      stayDuration: 90,
      forms: [
        {
          id: 'JP_ENTRY_CARD',
          name: 'Japan Entry Card',
          nameZh: '日本入境卡',
          required: true,
          canAutoFill: false  // Paper form at airport
        },
        {
          id: 'JP_CUSTOMS',
          name: 'Japan Customs Declaration',
          nameZh: '日本海关申报单',
          required: true,
          canAutoFill: false
        }
      ],
      additionalDocs: [
        { type: 'visa_copy', required: true }
      ],
      kioskEligible: false,
      specialNotes: [
        'Visa required for Chinese passport',
        'Paper forms filled at airport',
        '中国护照需要签证',
        '机场填写纸质表格'
      ]
    },

    USA: {
      visaRequired: false,
      stayDuration: 90,
      forms: [
        {
          id: 'JP_ENTRY_CARD',
          name: 'Japan Entry Card',
          required: true,
          canAutoFill: false
        },
        {
          id: 'JP_CUSTOMS',
          name: 'Japan Customs Declaration',
          required: true,
          canAutoFill: false
        }
      ],
      additionalDocs: [],
      kioskEligible: false,
      specialNotes: [
        'Visa waiver program - 90 days',
        'Paper forms filled at airport'
      ]
    },

    // Add more nationalities for Japan...
  },

  // USA
  US: {
    CHN: {
      visaRequired: true,
      visaType: 'B1/B2 Visa + EVUS',
      stayDuration: 180,  // Max, but determined by CBP
      forms: [
        {
          id: 'I94',
          name: 'I-94 Arrival/Departure Record',
          nameZh: 'I-94入境记录',
          required: true,
          canAutoFill: true
        },
        {
          id: 'US_CUSTOMS',
          name: 'US Customs Declaration',
          nameZh: '美国海关申报表',
          required: true,
          canAutoFill: true
        }
      ],
      additionalDocs: [
        { type: 'visa_copy', required: true }
      ],
      kioskEligible: false,  // Chinese passports cannot use APC kiosks
      specialNotes: [
        'Visa + EVUS required',
        'CBP interview required',
        'Cannot use APC kiosks',
        '需要签证和EVUS',
        '需接受CBP面谈',
        '不能使用APC自助机'
      ]
    },

    GBR: {  // UK passport
      visaRequired: false,
      visaType: 'ESTA',
      stayDuration: 90,
      forms: [
        {
          id: 'I94',
          name: 'I-94 Arrival/Departure Record',
          required: false,  // Auto-generated
          canAutoFill: false
        }
      ],
      additionalDocs: [],
      kioskEligible: true,  // Can use APC kiosks
      specialNotes: [
        'ESTA required (apply online)',
        'Can use APC kiosks',
        'Visa waiver program - 90 days'
      ]
    },

    // Add more nationalities for USA...
  },

  // Hong Kong
  HK: {
    CHN: {
      visaRequired: false,
      stayDuration: 7,
      forms: [
        {
          id: 'HK_ARRIVAL_CARD',
          name: 'Hong Kong Arrival Card',
          nameZh: '香港入境申报表',
          required: true,
          canAutoFill: true
        }
      ],
      additionalDocs: [],
      kioskEligible: true,
      specialNotes: [
        'Visa-free for 7 days',
        'Can use e-Channel if registered',
        '免签7天',
        '可使用e道（需注册）'
      ]
    },

    USA: {
      visaRequired: false,
      stayDuration: 90,
      forms: [],
      additionalDocs: [],
      kioskEligible: true,
      specialNotes: [
        'Visa-free for 90 days',
        'Can use e-Channel'
      ]
    },

    // Add more nationalities for Hong Kong...
  },

  // Add more destinations (Taiwan, Malaysia, Korea, etc.)...
};

export default nationalityOverrides;
```

---

## Integration Strategy

### Phase 1: Add Rules Engine Without Breaking Existing Code

**Goal:** Introduce `EntryRequirementsEngine` alongside existing system

**Steps:**

1. **Create new service files**
   - `app/services/requirements/EntryRequirementsEngine.js`
   - `app/services/requirements/EntryRequirementsCacheManager.js`
   - `app/config/requirements/baseDestinationRules.js`
   - `app/config/requirements/nationalityOverrides.js`

2. **Migrate existing data**
   - Migrate `destinationRequirements.js` → `baseDestinationRules.js`
   - Migrate `nationalityRequirements.js` → `nationalityOverrides.js`
   - Keep old files for backward compatibility

3. **Add to `SelectDestinationScreen`**
   ```javascript
   import EntryRequirementsEngine from '../services/requirements/EntryRequirementsEngine';

   const SelectDestinationScreen = ({ route, navigation }) => {
     const { passport } = route.params;
     const engine = new EntryRequirementsEngine();

     const handleSelectDestination = (destCode) => {
       // NEW: Get personalized checklist
       const checklist = engine.getChecklist(passport.nationality, destCode);

       if (!checklist.supported) {
         Alert.alert('Not Yet Configured', checklist.message);
         // Fall back to old flow
         navigation.navigate(`${destCode}InfoScreen`, { passport });
         return;
       }

       // NEW: Navigate to unified checklist screen
       navigation.navigate('ChecklistScreen', {
         passport,
         destination: destCode,
         checklist
       });
     };

     // ... rest of component
   };
   ```

### Phase 2: Create Unified Checklist Screen

**Goal:** Replace country-specific `RequirementsScreen` with unified `ChecklistScreen`

**File:** `app/screens/ChecklistScreen.js`

```javascript
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import EntryRequirementsEngine from '../services/requirements/EntryRequirementsEngine';
import ChecklistItem from '../components/ChecklistItem';

const ChecklistScreen = ({ route, navigation }) => {
  const { passport, destination, checklist: initialChecklist } = route.params;
  const [checklist, setChecklist] = useState(initialChecklist.checklist);

  const handleItemCheck = (itemId, checked) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, status: checked ? 'completed' : 'pending' } : item
      )
    );
  };

  const handleNavigateToForm = (formId) => {
    // Navigate to form filling screen
    navigation.navigate('FormFillingScreen', {
      formId,
      passport,
      destination
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Entry Requirements</Text>
        <Text style={styles.subtitle}>
          {passport.nationality} → {destination}
        </Text>
      </View>

      {initialChecklist.visaRequired && (
        <View style={styles.visaWarning}>
          <Text style={styles.warningText}>⚠️ Visa Required</Text>
          <Text>You must obtain a visa before traveling.</Text>
        </View>
      )}

      <View style={styles.checklistContainer}>
        {checklist.map(item => (
          <ChecklistItem
            key={item.id}
            item={item}
            onCheck={handleItemCheck}
            onNavigateToForm={handleNavigateToForm}
          />
        ))}
      </View>

      {initialChecklist.specialNotes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesTitle}>Special Notes</Text>
          {initialChecklist.specialNotes.map((note, index) => (
            <Text key={index} style={styles.noteText}>• {note}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // ... styles
});

export default ChecklistScreen;
```

### Phase 3: Deprecate Country-Specific RequirementsScreens

**Goal:** Reduce code duplication by using unified screens

**Before:**
```
app/screens/thailand/ThailandRequirementsScreen.js  (200 lines)
app/screens/japan/JapanRequirementsScreen.js        (200 lines)
app/screens/singapore/SingaporeRequirementsScreen.js (200 lines)
... (8 more screens)
= 2000+ lines of duplicated code
```

**After:**
```
app/screens/ChecklistScreen.js  (300 lines, handles all countries)
= 300 lines of unified code
```

**Migration:**
- Keep old screens for backward compatibility initially
- Add deprecation warnings
- Redirect to `ChecklistScreen` after user confirmation
- Remove old screens in v2.0

### Phase 4: Database Caching

**Goal:** Cache computed requirements in database to avoid re-computation

**Implementation:**

```javascript
// In EntryRequirementsEngine.js
async getRequirementsWithDBCache(passportNationality, destinationCode) {
  // 1. Check in-memory cache
  const memCached = this.cache.get(passportNationality, destinationCode);
  if (memCached) return memCached;

  // 2. Check database cache
  const dbCached = await this._getFromDBCache(passportNationality, destinationCode);
  if (dbCached && !this._isCacheExpired(dbCached)) {
    // Load into memory cache
    this.cache.set(passportNationality, destinationCode, dbCached.requirements);
    return dbCached.requirements;
  }

  // 3. Compute from rules
  const computed = this.getRequirements(passportNationality, destinationCode);

  // 4. Save to DB cache
  await this._saveToDBCache(passportNationality, destinationCode, computed);

  return computed;
}

async _getFromDBCache(passportNationality, destinationCode) {
  const result = await SecureStorageService.query(
    'SELECT * FROM entry_requirements_cache WHERE passport_nationality = ? AND destination_code = ?',
    [passportNationality, destinationCode]
  );

  if (result.length === 0) return null;

  return {
    requirements: JSON.parse(result[0].requirements_json),
    expiresAt: new Date(result[0].expires_at)
  };
}

async _saveToDBCache(passportNationality, destinationCode, requirements) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await SecureStorageService.execute(
    `INSERT OR REPLACE INTO entry_requirements_cache
     (passport_nationality, destination_code, requirements_json, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      passportNationality,
      destinationCode,
      JSON.stringify(requirements),
      new Date().toISOString(),
      expiresAt.toISOString()
    ]
  );
}
```

---

## Scalability & Extensibility

### Scalability Analysis

#### Current System (Without Rules Engine)

**Complexity:** O(D) where D = number of destinations
- Each destination requires separate screens (5-11 screens per destination)
- Adding 1 destination = adding ~8 screens = ~1500 lines of code

**Storage:** O(D × S) where S = screens per destination
- Thailand: 11 screens
- Japan: 6 screens
- Singapore: 5 screens
- **Total:** ~40 screens across 8 destinations

**Maintenance Burden:**
- Updating common logic (e.g., passport validation) requires changing 40+ files
- Inconsistencies arise easily

#### New System (With Rules Engine)

**Complexity:** O(P × D) where P = passports, D = destinations
- Configuration-driven, not code-driven
- Adding 1 destination = adding JSON config (~50 lines)
- Adding 1 passport nationality to 1 destination = adding JSON config (~15 lines)

**Storage:** O(P × D) in configuration, O(1) in code
- Configuration grows linearly
- Code remains constant (EntryRequirementsEngine handles all)

**Example:**

| Metric | Old System | New System |
|--------|-----------|------------|
| Add Thailand support | 11 screens × 150 lines = 1650 lines | 50 lines of JSON config |
| Add Chinese passport to Thailand | Hardcoded in ThailandRequirementsScreen | 15 lines of JSON config |
| Add US passport to Thailand | Hardcoded in ThailandRequirementsScreen | 15 lines of JSON config |
| **Total for 50 destinations × 10 nationalities** | ~82,500 lines of code | ~7,500 lines of JSON config |

### Extensibility Features

#### 1. Plugin Architecture for Country-Specific Logic

Some countries require custom processing (e.g., TDAC API submission, EVUS check).

**Design:**

```javascript
// app/services/requirements/plugins/ThailandPlugin.js
class ThailandRequirementsPlugin {
  /**
   * Custom post-processing for Thailand
   */
  async enhanceRequirements(baseRequirements, passport, travelInfo) {
    const enhanced = { ...baseRequirements };

    // Check if TDAC already submitted
    const tdacStatus = await TDACAPIService.checkStatus(passport.passportNumber);
    if (tdacStatus.submitted) {
      enhanced.forms = enhanced.forms.map(form => {
        if (form.id === 'TDAC') {
          return {
            ...form,
            status: 'completed',
            qrCode: tdacStatus.qrCode,
            submittedAt: tdacStatus.submittedAt
          };
        }
        return form;
      });
    }

    return enhanced;
  }

  /**
   * Custom validation for Thailand
   */
  async validateRequirements(passport, travelInfo) {
    const errors = [];

    // Thailand requires proof of funds
    if (!travelInfo.fundItems || travelInfo.fundItems.length === 0) {
      errors.push({
        field: 'funds',
        message: 'Thailand requires proof of at least 10,000 THB'
      });
    }

    return errors;
  }
}

export default ThailandRequirementsPlugin;
```

**Integration:**

```javascript
// In EntryRequirementsEngine.js
import ThailandPlugin from './plugins/ThailandPlugin';
import USAPlugin from './plugins/USAPlugin';

class EntryRequirementsEngine {
  constructor() {
    this.plugins = {
      TH: new ThailandPlugin(),
      US: new USAPlugin(),
      // Add more plugins as needed
    };
  }

  async getRequirements(passportNationality, destinationCode, passport, travelInfo) {
    // Get base requirements
    let requirements = this._computeBaseRequirements(passportNationality, destinationCode);

    // Apply plugin enhancements if available
    if (this.plugins[destinationCode]) {
      requirements = await this.plugins[destinationCode].enhanceRequirements(
        requirements,
        passport,
        travelInfo
      );
    }

    return requirements;
  }
}
```

#### 2. Dynamic Configuration Updates

**Remote Config Support:**

```javascript
// app/services/requirements/RemoteConfigService.js
class RemoteConfigService {
  async fetchLatestRules() {
    try {
      const response = await fetch('https://api.tripsecretary.com/v1/entry-rules', {
        headers: { 'X-API-Version': '1.0' }
      });

      const { baseRules, nationalityRules, version } = await response.json();

      // Save to local storage
      await AsyncStorage.setItem('entry_rules_version', version);
      await AsyncStorage.setItem('base_rules', JSON.stringify(baseRules));
      await AsyncStorage.setItem('nationality_rules', JSON.stringify(nationalityRules));

      return { baseRules, nationalityRules };
    } catch (error) {
      console.error('Failed to fetch remote config:', error);
      return null;
    }
  }

  async getLocalRules() {
    const baseRulesStr = await AsyncStorage.getItem('base_rules');
    const nationalityRulesStr = await AsyncStorage.getItem('nationality_rules');

    if (!baseRulesStr || !nationalityRulesStr) {
      // Fall back to bundled config
      return {
        baseRules: require('../../config/requirements/baseDestinationRules').default,
        nationalityRules: require('../../config/requirements/nationalityOverrides').default
      };
    }

    return {
      baseRules: JSON.parse(baseRulesStr),
      nationalityRules: JSON.parse(nationalityRulesStr)
    };
  }
}
```

**Benefits:**
- Update entry requirements without app releases
- A/B testing of requirement checklists
- Emergency updates (e.g., COVID restrictions)

#### 3. Multi-Language Support

**Configuration with i18n:**

```javascript
forms: [
  {
    id: 'TDAC',
    name: {
      en: 'Thailand Digital Arrival Card',
      zh: '泰国电子入境卡',
      ja: 'タイ電子入国カード',
      ko: '태국 전자 입국 카드'
    },
    // ...
  }
]
```

**Engine Enhancement:**

```javascript
getChecklist(passportNationality, destinationCode, locale = 'en') {
  const reqs = this.getRequirements(passportNationality, destinationCode);

  // Localize form names
  const localizedForms = reqs.forms.map(form => ({
    ...form,
    displayName: typeof form.name === 'object' ? form.name[locale] : form.name
  }));

  // ... build checklist
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal:** Build core rules engine without disrupting existing code

- [ ] Create `EntryRequirementsEngine` service
- [ ] Create `EntryRequirementsCacheManager`
- [ ] Migrate `destinationRequirements.js` → `baseDestinationRules.js`
- [ ] Migrate `nationalityRequirements.js` → `nationalityOverrides.js`
- [ ] Add unit tests for rules engine
- [ ] Add database schema for cache table

**Deliverables:**
- `app/services/requirements/EntryRequirementsEngine.js` (✅ Tested)
- `app/config/requirements/baseDestinationRules.js`
- `app/config/requirements/nationalityOverrides.js`
- Test coverage: 80%+

### Phase 2: Integration (Week 3-4)

**Goal:** Integrate rules engine into one destination as proof-of-concept

- [ ] Create unified `ChecklistScreen.js`
- [ ] Integrate rules engine into `SelectDestinationScreen`
- [ ] Add passport nationality detection
- [ ] Test with **Thailand** as pilot destination
  - Chinese passport → Thailand
  - US passport → Thailand
  - Indian passport → Thailand
- [ ] Add fallback for unconfigured combinations

**Deliverables:**
- `app/screens/ChecklistScreen.js` (✅ Tested with Thailand)
- Updated `SelectDestinationScreen.js`
- User testing with 3 passport nationalities

### Phase 3: Expansion (Week 5-8)

**Goal:** Expand to 20 destinations × top 5 passport nationalities

**20 Destinations:**
1. Thailand (TH)
2. Singapore (SG)
3. Japan (JP)
4. Hong Kong (HK)
5. USA (US)
6. Canada (CA)
7. Taiwan (TW)
8. Malaysia (MY)
9. Korea (KR)
10. United Kingdom (UK)
11. Australia (AU)
12. New Zealand (NZ)
13. Vietnam (VN)
14. Indonesia (ID)
15. Philippines (PH)
16. UAE (AE) - Dubai
17. France (FR)
18. Germany (DE)
19. Italy (IT)
20. Spain (ES)

**Top 5 Passport Nationalities:**
1. CHN (China) - Primary target market
2. USA (United States) - Major international traveler base
3. IND (India) - Large growing market
4. GBR (United Kingdom) - Common international traveler
5. CAN (Canada) - Frequent traveler demographic

**Work Breakdown:**
- Week 5: Configure Asia-Pacific destinations (TH, SG, JP, HK, TW, MY, KR, VN, ID, PH) - 10 destinations × 5 nationalities
- Week 6: Configure North America + Oceania (US, CA, AU, NZ) - 4 destinations × 5 nationalities
- Week 7: Configure Europe + Middle East (UK, FR, DE, IT, ES, AE) - 6 destinations × 5 nationalities
- Week 8: Testing, bug fixes, performance tuning across all 100 combinations

**Deliverables:**
- 20 destinations × 5 nationalities = 100 configurations
- Integration tests for all 100 combinations
- Performance benchmarks
- Regional coverage across Asia-Pacific, North America, Europe, and Middle East

### Phase 4: Plugin System (Week 9-10)

**Goal:** Add country-specific plugins for advanced features

- [ ] Design plugin interface
- [ ] Implement `ThailandPlugin` (TDAC status check, auto-submission)
- [ ] Implement `USAPlugin` (EVUS check, ESTA validation)
- [ ] Implement `SingaporePlugin` (SG Arrival Card auto-fill)
- [ ] Add plugin registration system

**Deliverables:**
- Plugin architecture documentation
- 3 working plugins (Thailand, USA, Singapore)
- Plugin API guide for future extensions

### Phase 5: Deprecation & Cleanup (Week 11-12)

**Goal:** Deprecate old country-specific screens

- [ ] Add deprecation warnings to old screens
- [ ] Redirect old screens to new `ChecklistScreen`
- [ ] Migrate user flows to new system
- [ ] Remove deprecated screens (mark for v2.0)
- [ ] Update documentation

**Deliverables:**
- Migration guide
- Deprecation timeline
- Updated user documentation
- Code size reduction report (estimated -30% reduction)

### Phase 6: Optimization & Remote Config (Week 13-14)

**Goal:** Add remote config support for dynamic updates

- [ ] Build remote config API
- [ ] Implement client-side remote config fetching
- [ ] Add version control for config updates
- [ ] Implement A/B testing framework
- [ ] Add analytics for requirement completion rates

**Deliverables:**
- Remote config API (Node.js + PostgreSQL)
- Client SDK for config updates
- Analytics dashboard
- A/B testing framework

---

## Appendix

### A. Example Usage Scenarios

#### Scenario 1: Chinese Passport to Thailand

```javascript
const engine = new EntryRequirementsEngine();
const checklist = engine.getChecklist('CHN', 'TH');

console.log(checklist);
// Output:
{
  supported: true,
  passportNationality: 'CHN',
  destinationCode: 'TH',
  visaRequired: false,
  stayDuration: 30,
  checklist: [
    {
      id: 'visa',
      icon: '✅',
      title: 'Visa-Free Entry',
      description: 'Stay up to 30 days without a visa',
      required: false,
      status: 'completed'
    },
    {
      id: 'passport_validity',
      icon: '📘',
      title: 'Passport Validity',
      description: 'Your passport must be valid for at least 6 months',
      required: true,
      canHelp: true,
      status: 'pending'
    },
    {
      id: 'return_ticket',
      icon: '✈️',
      title: 'Return or Onward Ticket',
      description: 'Confirmed departure ticket',
      required: true,
      status: 'pending'
    },
    {
      id: 'TDAC',
      icon: '✨',
      title: 'Thailand Digital Arrival Card',
      description: 'We can auto-fill this for you',
      required: true,
      canHelp: true,
      autoFillable: true,
      status: 'pending'
    },
    {
      id: 'funds',
      icon: '💰',
      title: 'Proof of Funds',
      description: 'At least 10000 THB',
      required: true,
      status: 'pending'
    }
  ],
  specialNotes: [
    'Visa-free for 30 days',
    'Must show 10,000 THB or equivalent'
  ]
}
```

#### Scenario 2: Indian Passport to Thailand

```javascript
const checklist = engine.getChecklist('IND', 'TH');

console.log(checklist.visaRequired); // true
console.log(checklist.checklist[0]);
// Output:
{
  id: 'visa',
  icon: '🛂',
  title: 'Visa Required',
  description: 'You need a Tourist Visa (apply online or at embassy) to enter this country.',
  required: true,
  canHelp: false,
  status: 'pending'
}
```

#### Scenario 3: Unsupported Combination

```javascript
const checklist = engine.getChecklist('AFG', 'TH'); // Afghanistan passport to Thailand

console.log(checklist);
// Output:
{
  supported: false,
  message: 'Requirements for AFG passport to TH are not configured yet. Please check with the embassy.',
  checklist: []
}
```

### B. Configuration Migration Guide

**Migrating from old `destinationRequirements.js` to new system:**

**Old:**
```javascript
// destinationRequirements.js
th: {
  needsPaperForm: false,
  entryMethod: 'digital',
  digitalSystem: 'TDAC',
  digitalUrl: 'https://tdac.immigration.go.th',
  requiresContactInfo: true
}
```

**New:**
```javascript
// baseDestinationRules.js
TH: {
  code: 'TH',
  name: 'Thailand',
  nameZh: '泰国',
  defaultRequirements: [
    { type: 'passport_validity', required: true, months: 6 },
    { type: 'return_ticket', required: true },
    { type: 'accommodation_proof', required: true }
  ],
  entryMethod: 'digital',
  digitalSystem: 'TDAC',
  digitalUrl: 'https://tdac.immigration.go.th'
}

// nationalityOverrides.js
TH: {
  CHN: {
    visaRequired: false,
    stayDuration: 30,
    forms: [
      {
        id: 'TDAC',
        name: 'Thailand Digital Arrival Card',
        required: true,
        canAutoFill: true
      }
    ],
    additionalDocs: [
      { type: 'funds_proof', required: true, amount: 10000, currency: 'THB' }
    ]
  }
}
```

### C. Performance Benchmarks (Expected)

| Operation | Without Cache | With Memory Cache | With DB Cache |
|-----------|--------------|-------------------|---------------|
| First lookup | 5ms | 5ms | 15ms |
| Subsequent lookup (same combo) | 5ms | <0.1ms | 2ms |
| 100 lookups (same combo) | 500ms | 10ms | 200ms |
| 100 lookups (different combos) | 500ms | 500ms | 1500ms (initial), then 200ms |

**Memory Usage:**
- Rules engine instance: ~50KB
- Cache for 100 combinations: ~500KB
- Total: <1MB

### D. TypeScript Schemas (for type safety)

```typescript
// schemas/BaseDestinationRule.ts
export interface BaseDestinationRule {
  code: string;
  name: string;
  nameZh: string;
  defaultRequirements: Requirement[];
  entryMethod: 'digital' | 'paper' | 'both' | 'none' | 'visa-free';
  digitalSystem?: string;
  digitalUrl?: string;
  hasAutoKiosk?: boolean;
  kioskName?: string;
}

export interface Requirement {
  type: 'passport_validity' | 'return_ticket' | 'accommodation_proof' | 'funds_proof' | 'visa_copy';
  required: boolean;
  months?: number;
  amount?: number;
  currency?: string;
}

// schemas/NationalityOverride.ts
export interface NationalityOverride {
  visaRequired: boolean;
  visaType?: string;
  stayDuration: number;
  forms: EntryForm[];
  additionalDocs: Requirement[];
  specialNotes?: string[];
  kioskEligible?: boolean;
}

export interface EntryForm {
  id: string;
  name: string | LocalizedString;
  nameZh?: string;
  required: boolean;
  canAutoFill: boolean;
  url?: string;
}

export interface LocalizedString {
  en: string;
  zh: string;
  ja?: string;
  ko?: string;
}

// schemas/ComputedRequirements.ts
export interface ComputedRequirements {
  passportNationality: string;
  destinationCode: string;
  supported: boolean;
  visaRequired?: boolean;
  visaType?: string;
  stayDuration?: number;
  requirements: Requirement[];
  forms: EntryForm[];
  specialNotes?: string[];
  kioskEligible?: boolean;
  digitalSystem?: string;
  digitalUrl?: string;
  message?: string;
  messageZh?: string;
}

// schemas/Checklist.ts
export interface Checklist {
  supported: boolean;
  passportNationality?: string;
  destinationCode?: string;
  visaRequired?: boolean;
  stayDuration?: number;
  checklist: ChecklistItem[];
  specialNotes?: string[];
  kioskEligible?: boolean;
  digitalSystem?: string;
  digitalUrl?: string;
  message?: string;
}

export interface ChecklistItem {
  id: string;
  icon: string;
  title: string;
  titleZh?: string;
  description: string;
  descriptionZh?: string;
  required: boolean;
  canHelp: boolean;
  autoCheck?: boolean;
  autoFillable?: boolean;
  url?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}
```

---

## Summary

This design document proposes a **scalable, maintainable, and extensible** architecture for handling multi-country × multi-passport entry requirements in TripSecretary.

### Key Advantages

1. **Scalability:** From 40 screens to 1 unified screen + JSON configs
2. **Maintainability:** Single source of truth for all entry requirements
3. **Performance:** In-memory + DB caching reduces computation overhead
4. **Extensibility:** Plugin architecture for country-specific logic
5. **User Experience:** Personalized checklists based on actual passport nationality

### Next Steps

1. **Review & Approve:** Stakeholders review this design
2. **Proof of Concept:** Implement Phase 1-2 for Thailand as pilot
3. **Iterate:** Gather feedback and refine
4. **Scale:** Roll out to 20 destinations × 5 nationalities
5. **Optimize:** Add remote config, analytics, A/B testing

---

**Document Version:** 1.1
**Last Updated:** 2025-10-26
**Author:** Claude (AI Assistant)
**Status:** 🟡 Awaiting Approval
**Changelog:** v1.1 - Updated Phase 3 scope from "5 destinations × 20 nationalities" to "20 destinations × 5 nationalities" for broader destination coverage
