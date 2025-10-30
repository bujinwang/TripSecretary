# Adding a New Country to TripSecretary

**Complete Guide for Implementing Country-Specific Features**

This guide walks you through adding a new country destination to TripSecretary, using Thailand as the reference implementation.

---

## Overview

The TripSecretary app uses a **modular country configuration system** that separates:
- **Generic infrastructure** (utilities, validation engine, data models) - reusable across countries
- **Country-specific configuration** (metadata, rules, mappings) - isolated per country
- **Country-specific services** (API integrations, submission logic) - when needed

**Time Estimate:** 12-20 hours for a complete country implementation with digital arrival card integration.

---

## Prerequisites

Before starting:
1. ✅ Review Thailand implementation: `app/config/destinations/thailand/`
2. ✅ Understand the destination config system: `app/config/destinations/index.js`
3. ✅ Familiarize yourself with utilities: `app/utils/`
4. ✅ Check if the country has a digital arrival card system (affects complexity)

---

## Step-by-Step Implementation

### Step 1: Create Country Configuration Structure

**Time:** 30-60 minutes

Create the following directory structure:

```
app/config/destinations/<country-code>/
├── index.js                    # Main country config aggregator
├── metadata.js                 # Country metadata (ID, name, currency, etc.)
├── financialInfo.js           # ATM fees, cash recommendations, banks
├── emergencyInfo.js           # Emergency contacts, embassy info
├── accommodationTypes.js      # Accommodation type mappings (if needed)
├── travelPurposes.js         # Travel purpose mappings (if needed)
└── validationRules.js        # Country-specific validation rules
```

**Example: Vietnam (`vn`)**

```javascript
// app/config/destinations/vietnam/index.js
import metadata from './metadata';
import financialInfo from './financialInfo';
import emergencyInfo from './emergencyInfo';

const vietnamConfig = {
  ...metadata,
  financial: financialInfo,
  emergency: emergencyInfo,

  // Feature flags
  features: {
    digitalArrivalCard: false,  // Vietnam doesn't have one yet
    entryGuide: true,
    multiLanguageSupport: true,
    offlineMode: true
  }
};

export default vietnamConfig;
```

---

### Step 2: Define Country Metadata

**Time:** 15-30 minutes

Create `metadata.js` with essential country information:

```javascript
// app/config/destinations/vietnam/metadata.js
export const VIETNAM_METADATA = {
  // Identifiers
  id: 'vn',
  code: 'VNM',
  name: 'Vietnam',
  nameZh: '越南',
  nameTh: 'เวียดนาม',

  // Display
  flag: '🇻🇳',
  emoji: '🇻🇳',

  // Currency
  currency: {
    code: 'VND',
    symbol: '₫',
    name: 'Vietnamese Dong',
    nameZh: '越南盾',
    exchangeRateUSD: 24000  // Approximate, update regularly
  },

  // Time
  timezone: 'Asia/Ho_Chi_Minh',
  utcOffset: '+07:00',

  // Geography
  capital: 'Hanoi',
  majorCities: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Nha Trang'],

  // Status
  enabled: true,
  beta: false
};

export default VIETNAM_METADATA;
```

**Key Fields:**
- `id`: **2-letter lowercase code** (ISO 3166-1 alpha-2) - used everywhere
- `code`: 3-letter uppercase code (ISO 3166-1 alpha-3)
- `currency.code`: ISO 4217 currency code
- `timezone`: IANA timezone identifier
- `enabled`: Set to `false` during development

---

### Step 3: Configure Financial Information

**Time:** 30-45 minutes

Create `financialInfo.js` with practical financial guidance:

```javascript
// app/config/destinations/vietnam/financialInfo.js
export const VIETNAM_FINANCIAL_INFO = {
  // ATM Information
  atm: {
    fee: {
      amount: 50000,
      currency: 'VND',
      description: 'Most ATMs charge 50,000 VND (~$2) per withdrawal'
    },
    dailyLimit: {
      amount: 10000000,
      currency: 'VND',
      description: 'Most ATMs limit withdrawals to 10 million VND per transaction'
    },
    recommendations: [
      'Use Vietcombank or BIDV ATMs for lower fees',
      'Withdraw larger amounts to minimize ATM fees',
      'Many ATMs accept UnionPay, Visa, and Mastercard'
    ]
  },

  // Cash Recommendations
  cash: {
    recommended: {
      min: 2000000,
      max: 5000000,
      currency: 'VND',
      description: 'Carry 2-5 million VND for daily expenses'
    },
    acceptance: 'Cash is king in Vietnam. Many small shops do not accept cards.',
    tips: [
      'Break large bills at hotels or big stores',
      'Keep small denominations (10k, 20k, 50k) for taxis and street food',
      'Mobile payment (MoMo, ZaloPay) is popular in cities'
    ]
  },

  // Banking
  banking: {
    majorBanks: [
      { name: 'Vietcombank', nameZh: '越南外贸银行' },
      { name: 'BIDV', nameZh: '越南投资发展银行' },
      { name: 'Techcombank', nameZh: '越南技术商业银行' }
    ],
    creditCardAcceptance: 'Widely accepted in hotels and major restaurants',
    mobilePayment: ['MoMo', 'ZaloPay', 'ViettelPay']
  },

  // Exchange
  exchange: {
    bestPlaces: [
      'Banks offer official rates with receipts',
      'Gold shops in District 1 (HCMC) often have better rates',
      'Avoid airport exchange counters (poor rates)'
    ],
    tips: [
      'Bring USD for best exchange rates',
      'Negotiate rates at gold shops',
      'Keep exchange receipts for reconversion'
    ]
  }
};

export default VIETNAM_FINANCIAL_INFO;
```

---

### Step 4: Add Emergency Information

**Time:** 30-45 minutes

Create `emergencyInfo.js` with critical contacts:

```javascript
// app/config/destinations/vietnam/emergencyInfo.js
export const VIETNAM_EMERGENCY_INFO = {
  // Emergency Numbers
  emergency: {
    police: '113',
    ambulance: '115',
    fire: '114',
    general: '112'  // Universal emergency number in Vietnam
  },

  // Tourist Police (with Chinese-speaking support if available)
  touristPolice: [
    {
      city: 'Ho Chi Minh City',
      cityZh: '胡志明市',
      phone: '+84-28-3829-2877',
      address: '254 Nguyen Trai, District 1',
      chineseSupport: false
    },
    {
      city: 'Hanoi',
      cityZh: '河内',
      phone: '+84-24-3826-9965',
      address: '44 Ly Thuong Kiet',
      chineseSupport: false
    }
  ],

  // Chinese Embassy/Consulates
  embassies: [
    {
      type: 'embassy',
      city: 'Hanoi',
      cityZh: '河内',
      name: 'Chinese Embassy in Vietnam',
      nameZh: '中国驻越南大使馆',
      phone: '+84-24-3845-3736',
      emergency: '+84-24-3845-3738',  // 24-hour hotline
      address: '46 Hoang Dieu, Ba Dinh District',
      addressZh: '河内市巴亭区黄耀街46号'
    },
    {
      type: 'consulate',
      city: 'Ho Chi Minh City',
      cityZh: '胡志明市',
      name: 'Chinese Consulate General in HCMC',
      nameZh: '中国驻胡志明市总领事馆',
      phone: '+84-28-3829-2457',
      emergency: '+84-28-3829-2459',
      address: '39 Nguyen Thi Minh Khai, District 1',
      addressZh: '胡志明市第一郡阮氏明开街39号'
    }
  ],

  // Medical
  hospitals: [
    {
      name: 'FV Hospital',
      nameZh: 'FV医院',
      city: 'Ho Chi Minh City',
      phone: '+84-28-5411-3333',
      emergency: '+84-28-5411-3500',
      services: 'International hospital with English/Chinese-speaking staff',
      chineseSupport: true
    },
    {
      name: 'Hanoi French Hospital',
      nameZh: '河内法国医院',
      city: 'Hanoi',
      phone: '+84-24-3577-1100',
      emergency: '+84-24-3577-1100',
      services: 'International standard, English-speaking',
      chineseSupport: false
    }
  ]
};

export default VIETNAM_EMERGENCY_INFO;
```

---

### Step 5: Register Country in Central Registry

**Time:** 5-10 minutes

Add your country to `app/config/destinations/index.js`:

```javascript
// app/config/destinations/index.js
import thailand from './thailand';
import vietnam from './vietnam';  // Add import

export const DESTINATIONS = {
  th: thailand,
  vn: vietnam,  // Add entry
};

export const getDestination = (destinationId) => {
  const destination = DESTINATIONS[destinationId];
  if (!destination) {
    throw new Error(`Unknown destination: ${destinationId}`);
  }
  return destination;
};

export const getActiveDestinations = () => {
  return Object.values(DESTINATIONS).filter(dest => dest.enabled);
};
```

---

### Step 6: Create Accommodation Type Mappings (If Needed)

**Time:** 30-60 minutes

If your country has a digital arrival card with specific accommodation type codes, create `accommodationTypes.js`:

**Reference:** See `app/config/destinations/thailand/accommodationTypes.js` for full example.

```javascript
// app/config/destinations/vietnam/accommodationTypes.js
export const ACCOMMODATION_TYPES = {
  HOTEL: {
    key: 'HOTEL',
    displayEn: 'Hotel',
    displayZh: '酒店',
    display: 'Hotel (酒店)',
    aliases: ['HOTEL', '酒店', 'KHÁCH SẠN']
  },
  HOMESTAY: {
    key: 'HOMESTAY',
    displayEn: 'Homestay',
    displayZh: '民宿',
    display: 'Homestay (民宿)',
    aliases: ['HOMESTAY', '民宿', 'NHÀ DÂN']
  },
  // ... more types
};

export const normalizeAccommodationType = (input) => {
  if (!input) return 'HOTEL';
  const normalized = input.toString().toUpperCase().trim();
  // Implement alias lookup
  return ALIAS_MAP.get(normalized) || 'HOTEL';
};
```

---

### Step 7: Create Travel Purpose Mappings (If Needed)

**Time:** 30-60 minutes

Similar to accommodation types, if the country requires purpose mappings:

**Reference:** See `app/config/destinations/thailand/travelPurposes.js`

```javascript
// app/config/destinations/vietnam/travelPurposes.js
export const TRAVEL_PURPOSES = {
  TOURISM: {
    key: 'TOURISM',
    displayEn: 'Tourism',
    displayZh: '旅游',
    display: 'Tourism (旅游)',
    aliases: ['TOURISM', 'VACATION', '旅游', 'DU LỊCH']
  },
  // ... more purposes
};
```

---

### Step 8: Define Validation Rules

**Time:** 1-2 hours

Create country-specific validation rules using the validation engine:

```javascript
// app/config/destinations/vietnam/validationRules.js
import { PATTERNS } from '../../../utils/validation/ValidationRuleEngine';

export const VIETNAM_VALIDATION_RULES = {
  fullName: {
    ruleType: 'text',
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: PATTERNS.ALPHA_SPACE_DASH,
    patternMessage: 'Name should contain only letters, spaces, and hyphens',
    allowChinese: false,
    fieldLabel: 'Full name'
  },

  passportNo: {
    ruleType: 'alphanumeric',
    required: true,
    minLength: 6,
    maxLength: 12,
    pattern: PATTERNS.PASSPORT,
    fieldLabel: 'Passport number'
  },

  // Visa number - Vietnam has specific format
  visaNumber: (value, context) => {
    if (!value || !value.trim()) {
      return {
        isValid: true,
        isWarning: context.required !== false,
        errorMessage: context.required !== false ? 'Visa number is required' : ''
      };
    }

    // Vietnam visa format: 2 letters + 8 digits (e.g., DL12345678)
    if (!/^[A-Z]{2}\d{8}$/i.test(value.trim())) {
      return {
        isValid: false,
        isWarning: false,
        errorMessage: 'Vietnam visa format: 2 letters + 8 digits (e.g., DL12345678)'
      };
    }

    return { isValid: true, isWarning: false, errorMessage: '' };
  },

  // ... more rules
};

export default VIETNAM_VALIDATION_RULES;
```

**Use the validation engine:**

```javascript
// app/utils/vietnam/VietnamValidationRules.js
import ValidationRuleEngine from '../validation/ValidationRuleEngine';
import VIETNAM_VALIDATION_RULES from '../../config/destinations/vietnam/validationRules';

const vietnamValidator = new ValidationRuleEngine(VIETNAM_VALIDATION_RULES);

export const validateField = (fieldName, fieldValue, context = {}) => {
  return vietnamValidator.validate(fieldName, fieldValue, context);
};
```

---

### Step 9: Create Digital Arrival Card Integration (If Applicable)

**Time:** 6-12 hours (depends on API complexity)

If the country has a digital arrival card system:

#### 9.1: Research the API

1. Inspect network traffic using browser DevTools or Charles Proxy
2. Capture:
   - API endpoints
   - Request/response formats
   - Required headers
   - Authentication methods
   - Field IDs and mappings

#### 9.2: Create API Service

```javascript
// app/services/vietnam/VietnamEVisaAPIService.js
class VietnamEVisaAPIService {
  static API_BASE_URL = 'https://evisa.xuatnhapcanh.gov.vn/api';

  static async submitApplication(travelerContext) {
    const payload = this.buildPayload(travelerContext);

    const response = await fetch(`${this.API_BASE_URL}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TripSecretary/1.0'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  }

  static buildPayload(context) {
    return {
      fullName: context.fullName,
      passportNo: context.passportNo,
      // ... map all fields
    };
  }
}

export default VietnamEVisaAPIService;
```

#### 9.3: Create Context Builder

Map user data to API format:

```javascript
// app/services/vietnam/VietnamTravelerContextBuilder.js
import { parseFullName } from '../../utils/nameUtils';
import { extractCountryCode } from '../../utils/phoneUtils';

class VietnamTravelerContextBuilder {
  static async buildContext(userId) {
    const UserDataService = require('../UserDataService').default;
    const userData = await UserDataService.getAllData(userId);

    return {
      // Personal Info
      fullName: userData.passport.fullName,
      familyName: parseFullName(userData.passport.fullName).familyName,
      givenName: parseFullName(userData.passport.fullName).firstName,

      // Passport
      passportNo: userData.passport.passportNo,
      nationality: userData.passport.nationality,

      // ... more fields
    };
  }
}

export default VietnamTravelerContextBuilder;
```

#### 9.4: Create Submission Service

Handle submission lifecycle:

```javascript
// app/services/vietnam/VietnamEVisaSubmissionService.js
import VietnamEVisaAPIService from './VietnamEVisaAPIService';
import VietnamTravelerContextBuilder from './VietnamTravelerContextBuilder';

class VietnamEVisaSubmissionService {
  static async submitEVisa(userId, destinationId = 'vn') {
    console.log('📋 Building Vietnam e-Visa context...');
    const context = await VietnamTravelerContextBuilder.buildContext(userId);

    console.log('🚀 Submitting to Vietnam Immigration...');
    const response = await VietnamEVisaAPIService.submitApplication(context);

    console.log('💾 Saving submission record...');
    await this.saveSubmissionRecord(userId, response, destinationId);

    return response;
  }

  static async saveSubmissionRecord(userId, response, destinationId) {
    const DigitalArrivalCardService = require('../DigitalArrivalCardService').default;

    await DigitalArrivalCardService.saveDigitalArrivalCard({
      userId,
      destinationId,
      cardType: 'EVISA',
      applicationNo: response.applicationNumber,
      qrUri: response.qrCodeUrl,
      pdfUrl: response.pdfUrl,
      status: 'success'
    });
  }
}

export default VietnamEVisaSubmissionService;
```

---

### Step 10: Create UI Screens

**Time:** 4-8 hours

Create country-specific screens by following the Thailand pattern:

```
app/screens/vietnam/
├── VietnamInfo.js              # Country overview
├── VietnamEntryFlowScreen.js   # Progressive entry flow
├── VietnamEntryQuestions.js    # Entry questions form
├── VietnamTravelInfo.js        # Travel details form
└── VietnamRequirements.js      # Entry requirements
```

**Example: Entry Flow Screen**

```javascript
// app/screens/vietnam/VietnamEntryFlowScreen.js
import React from 'react';
import { getDestination } from '../../config/destinations';
import ProgressiveEntryFlowScreen from '../common/ProgressiveEntryFlowScreen';

const VietnamEntryFlowScreen = ({ navigation, route }) => {
  const destination = getDestination('vn');

  return (
    <ProgressiveEntryFlowScreen
      destination={destination}
      navigation={navigation}
      route={route}
    />
  );
};

export default VietnamEntryFlowScreen;
```

---

### Step 11: Add Navigation Routes

**Time:** 30-60 minutes

Register screens in your navigation system:

```javascript
// app/navigation/MainNavigator.js
import VietnamInfo from '../screens/vietnam/VietnamInfo';
import VietnamEntryFlowScreen from '../screens/vietnam/VietnamEntryFlowScreen';

const Stack = createStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator>
      {/* ... existing routes */}

      <Stack.Screen
        name="VietnamInfo"
        component={VietnamInfo}
        options={{ title: 'Vietnam 🇻🇳' }}
      />
      <Stack.Screen
        name="VietnamEntryFlow"
        component={VietnamEntryFlowScreen}
        options={{ title: 'Vietnam Entry Preparation' }}
      />
    </Stack.Navigator>
  );
}
```

---

### Step 12: Update Home Screen

**Time:** 15-30 minutes

Add country to destination list:

```javascript
// app/screens/HomeScreen.js
import { getActiveDestinations } from '../config/destinations';

const HomeScreen = () => {
  const destinations = getActiveDestinations();

  return (
    <FlatList
      data={destinations}
      renderItem={({ item }) => (
        <DestinationCard
          destination={item}
          onPress={() => navigation.navigate(`${item.id}Info`)}
        />
      )}
    />
  );
};
```

---

### Step 13: Testing Checklist

**Time:** 2-4 hours

Test all functionality:

- [ ] Country appears in home screen destination list
- [ ] Country info screen displays correctly
- [ ] Currency information is accurate
- [ ] Emergency contacts are correct and up-to-date
- [ ] Validation rules work for all form fields
- [ ] Digital arrival card submission works (if applicable)
- [ ] Data persistence works correctly
- [ ] Navigation flows smoothly between screens
- [ ] All translations display correctly (EN/ZH)
- [ ] Error handling works gracefully

---

## Common Patterns & Best Practices

### Pattern 1: Reuse Utilities

**✅ DO:**
```javascript
import { parseFullName } from '../../utils/nameUtils';
import { extractCountryCode } from '../../utils/phoneUtils';
import { formatLocationCode } from '../../utils/locationUtils';

const context = {
  familyName: parseFullName(fullName).familyName,
  countryCode: extractCountryCode(phoneNumber),
  province: formatLocationCode(provinceCode)
};
```

**❌ DON'T:**
```javascript
// Don't reimplement parsing logic
const familyName = fullName.split(',')[0];  // Fragile!
```

### Pattern 2: Use Validation Engine

**✅ DO:**
```javascript
import ValidationRuleEngine from '../../utils/validation/ValidationRuleEngine';
import COUNTRY_RULES from '../../config/destinations/country/validationRules';

const validator = new ValidationRuleEngine(COUNTRY_RULES);
const result = validator.validate('passportNo', value, context);
```

**❌ DON'T:**
```javascript
// Don't write switch statements
switch (fieldName) {
  case 'passportNo':
    // Complex validation logic...
}
```

### Pattern 3: Centralize Configuration

**✅ DO:**
```javascript
// app/config/destinations/country/accommodationTypes.js
export const ACCOMMODATION_TYPES = {
  HOTEL: { key: 'HOTEL', display: 'Hotel (酒店)' }
};
```

**❌ DON'T:**
```javascript
// Don't hardcode mappings
if (type === 'HOTEL' || type === '酒店' || type === 'Hotel') {
  // ...
}
```

### Pattern 4: Maintain Backward Compatibility

When refactoring, keep old methods with `@deprecated` tags:

```javascript
/**
 * @deprecated Use normalizeAccommodationType from config instead
 */
static parseAccommodationType(type) {
  return normalizeAccommodationType(type);
}
```

---

## Troubleshooting

### Issue: Country doesn't appear in home screen

**Solution:**
1. Check `enabled: true` in metadata
2. Verify country is registered in `DESTINATIONS` object
3. Check `getActiveDestinations()` filter logic

### Issue: Validation not working

**Solution:**
1. Verify validation rules are imported correctly
2. Check ValidationRuleEngine is instantiated
3. Ensure field names match exactly
4. Check context is passed correctly

### Issue: API submission fails

**Solution:**
1. Verify API endpoint URL is correct
2. Check request headers (User-Agent, Content-Type)
3. Log request/response to inspect payload
4. Check for CORS issues (use proxy if needed)
5. Verify all required fields are included

### Issue: Digital arrival card not saved

**Solution:**
1. Check `DigitalArrivalCardService.saveDigitalArrivalCard()` is called
2. Verify `entry_info` record exists first
3. Check database constraints and foreign keys
4. Ensure `destinationId` is correct

---

## Example: Complete Country Implementation

For a complete reference implementation, see:
- **Thailand**: `app/config/destinations/thailand/`
- **Services**: `app/services/thailand/`
- **Screens**: `app/screens/thailand/`

---

## Checklist: New Country Implementation

Use this checklist to track your progress:

### Configuration
- [ ] Create country directory structure
- [ ] Define metadata (ID, currency, timezone)
- [ ] Add financial information (ATM, cash, banks)
- [ ] Add emergency information (police, embassy, hospitals)
- [ ] Create accommodation type mappings (if needed)
- [ ] Create travel purpose mappings (if needed)
- [ ] Define validation rules
- [ ] Register country in central registry

### Services (If Digital Arrival Card)
- [ ] Research and document API
- [ ] Create API service class
- [ ] Create traveler context builder
- [ ] Create submission service
- [ ] Integrate with data persistence

### UI
- [ ] Create info screen
- [ ] Create entry flow screen
- [ ] Create form screens
- [ ] Add navigation routes
- [ ] Update home screen

### Testing
- [ ] Test all validation rules
- [ ] Test API submission (if applicable)
- [ ] Test data persistence
- [ ] Test navigation flows
- [ ] Test error scenarios
- [ ] Verify translations

### Documentation
- [ ] Document API integration (if applicable)
- [ ] Document any country-specific quirks
- [ ] Update README if needed

---

## Getting Help

- **Architecture Questions**: Review `docs/THAI_CODE_REVIEW.md`
- **Validation**: See `app/utils/validation/ValidationRuleEngine.js`
- **Utilities**: Check `app/utils/` directory
- **Thailand Reference**: Browse `app/config/destinations/thailand/`

---

**Last Updated:** 2025-01-30
**Version:** 1.0
