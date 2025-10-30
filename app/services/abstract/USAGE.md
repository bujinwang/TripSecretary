# Digital Card Service Base Class - Usage Guide

This guide shows how to use `DigitalCardServiceBase` to create digital card submission services for new countries.

---

## Overview

`DigitalCardServiceBase` is an abstract base class that provides:
- ✅ Standard submission workflow
- ✅ Error handling and retry logic
- ✅ Database persistence
- ✅ Lifecycle hooks for customization
- ✅ Reduces boilerplate by ~70%

---

## Quick Start

### Step 1: Extend the Base Class

```javascript
// app/services/vietnam/VietnamEVisaService.js
import DigitalCardServiceBase from '../abstract/DigitalCardServiceBase';
import VietnamTravelerContextBuilder from './VietnamTravelerContextBuilder';

class VietnamEVisaService extends DigitalCardServiceBase {
  constructor() {
    super({
      destinationId: 'vn',
      cardType: 'EVISA',
      serviceName: 'Vietnam e-Visa Service'
    });

    this.API_BASE_URL = 'https://evisa.xuatnhapcanh.gov.vn/api';
  }

  // REQUIRED: Implement buildContext
  async buildContext(userId, options) {
    return await VietnamTravelerContextBuilder.buildContext(userId);
  }

  // REQUIRED: Implement callAPI
  async callAPI(context, options) {
    const response = await fetch(`${this.API_BASE_URL}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(context),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  }
}

export default new VietnamEVisaService();
```

### Step 2: Use the Service

```javascript
// In your screen or component
import VietnamEVisaService from '../services/vietnam/VietnamEVisaService';

const handleSubmit = async () => {
  try {
    const result = await VietnamEVisaService.submit(userId);

    if (result.success) {
      console.log('✅ e-Visa submitted successfully!');
      console.log('Application No:', result.applicationNo);
    }
  } catch (error) {
    console.error('❌ Submission failed:', error);
  }
};
```

---

## Required Methods

These two methods **MUST** be implemented by subclasses:

### 1. `buildContext(userId, options)`

Transform user data into API-ready format.

**Example:**
```javascript
async buildContext(userId, options) {
  const UserDataService = require('../UserDataService').default;
  const userData = await UserDataService.getAllData(userId);

  return {
    // Map user data to API format
    fullName: userData.passport.fullName,
    passportNo: userData.passport.passportNo,
    nationality: userData.passport.nationality,
    dateOfBirth: userData.passport.dateOfBirth,
    // ... more fields
  };
}
```

### 2. `callAPI(context, options)`

Submit data to external API.

**Example:**
```javascript
async callAPI(context, options) {
  const response = await fetch('https://api.example.com/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.API_KEY}`,
    },
    body: JSON.stringify(context),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return await response.json();
}
```

---

## Optional Lifecycle Hooks

Override these methods to customize behavior:

### Before Submission

#### `validatePrerequisites(userId, options)`
Check conditions before starting submission.

**Example:**
```javascript
async validatePrerequisites(userId, options) {
  await super.validatePrerequisites(userId, options);

  // Check if user has valid passport
  const UserDataService = require('../UserDataService').default;
  const passport = await UserDataService.getPassport(userId);

  if (!passport || !passport.passportNo) {
    throw new Error('Passport information is required');
  }

  // Check passport expiry
  const expiryDate = new Date(passport.expiryDate);
  const today = new Date();

  if (expiryDate <= today) {
    throw new Error('Passport has expired');
  }
}
```

---

### During Submission

#### `validateContext(context, options)`
Validate built context before API call.

**Example:**
```javascript
async validateContext(context, options) {
  await super.validateContext(context, options);

  // Check required fields
  const requiredFields = ['fullName', 'passportNo', 'nationality'];

  for (const field of requiredFields) {
    if (!context[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate formats
  if (!/^[A-Z0-9]{6,12}$/i.test(context.passportNo)) {
    throw new Error('Invalid passport number format');
  }
}
```

#### `transformContext(context, options)`
Modify context before API call.

**Example:**
```javascript
async transformContext(context, options) {
  // Convert dates to API format
  return {
    ...context,
    dateOfBirth: this.formatDateForAPI(context.dateOfBirth),
    arrivalDate: this.formatDateForAPI(context.arrivalDate),
  };
}

formatDateForAPI(dateString) {
  // Convert YYYY-MM-DD to DD/MM/YYYY
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}
```

---

### After API Call

#### `validateResponse(response, options)`
Validate API response.

**Example:**
```javascript
async validateResponse(response, options) {
  await super.validateResponse(response, options);

  // Check for API errors
  if (response.error) {
    throw new Error(`API Error: ${response.error.message}`);
  }

  // Ensure we got required fields
  if (!response.applicationNo) {
    throw new Error('API did not return application number');
  }
}
```

#### `processResponse(response, options)`
Extract and format response data.

**Example:**
```javascript
async processResponse(response, options) {
  // Extract relevant fields
  return {
    applicationNo: response.data.appNo,
    referenceNo: response.data.refNo,
    qrCodeUrl: response.data.qr_code_url,
    pdfUrl: response.data.pdf_url,
    status: response.data.status,
    expiryDate: response.data.visa_expiry,
  };
}
```

---

### After Submission

#### `afterSubmission(userId, response, options)`
Post-submission actions.

**Example:**
```javascript
async afterSubmission(userId, response, options) {
  // Send notification
  await this.sendNotification(userId, {
    title: 'e-Visa Submitted',
    message: `Your application number is ${response.applicationNo}`,
  });

  // Log analytics
  console.log('Analytics: e-Visa submission successful', {
    destinationId: this.destinationId,
    applicationNo: response.applicationNo,
  });
}
```

---

### Error Handling

#### `handleError(error, userId, options)`
Custom error handling.

**Example:**
```javascript
async handleError(error, userId, options) {
  await super.handleError(error, userId, options);

  // Save failed attempt to database
  await this.saveFailedAttempt(userId, error);

  // Send error notification
  await this.sendNotification(userId, {
    title: 'Submission Failed',
    message: `Error: ${error.message}. Please try again.`,
  });
}

async saveFailedAttempt(userId, error) {
  const DigitalArrivalCardService = require('../DigitalArrivalCardService').default;

  await DigitalArrivalCardService.saveDigitalArrivalCard({
    userId,
    destinationId: this.destinationId,
    cardType: this.cardType,
    status: 'failed',
    errorDetails: error.message,
    submittedAt: new Date().toISOString(),
  });
}
```

---

## Advanced Features

### Retry with Backoff

Use the built-in retry utility for resilient API calls:

```javascript
async callAPI(context, options) {
  // Retry up to 3 times with exponential backoff
  return await this.retryWithBackoff(
    async () => {
      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        body: JSON.stringify(context),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    },
    {
      maxRetries: 3,
      initialDelay: 1000,   // 1 second
      backoffFactor: 2,     // Double delay each time
      maxDelay: 10000,      // Max 10 seconds
    }
  );
}
```

### Custom Database Saving

Override `saveSubmissionRecord` for custom save logic:

```javascript
async saveSubmissionRecord(userId, response, context, options) {
  // Custom logic before save
  console.log('Saving with custom logic...');

  // Call parent implementation
  await super.saveSubmissionRecord(userId, response, context, options);

  // Additional saves (e.g., to custom tables)
  await this.saveToCustomTable(userId, response);
}
```

---

## Complete Example: Malaysia

```javascript
// app/services/malaysia/MalaysiaEPassService.js
import DigitalCardServiceBase from '../abstract/DigitalCardServiceBase';
import MalaysiaTravelerContextBuilder from './MalaysiaTravelerContextBuilder';

class MalaysiaEPassService extends DigitalCardServiceBase {
  constructor() {
    super({
      destinationId: 'my',
      cardType: 'EPASS',
      serviceName: 'Malaysia E-Pass Service',
    });

    this.API_BASE_URL = 'https://epass.imi.gov.my/api';
  }

  // REQUIRED: Build context
  async buildContext(userId, options) {
    const context = await MalaysiaTravelerContextBuilder.buildContext(userId);

    // Malaysia-specific: Add request ID
    context.requestId = this.generateRequestId();

    return context;
  }

  // REQUIRED: Call API
  async callAPI(context, options) {
    // Malaysia API requires retry logic
    return await this.retryWithBackoff(
      async () => {
        const response = await fetch(`${this.API_BASE_URL}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.MALAYSIA_API_KEY,
          },
          body: JSON.stringify(context),
        });

        const data = await response.json();

        // Malaysia API returns errors as 200 with error field
        if (data.error) {
          throw new Error(data.error.message);
        }

        return data;
      },
      { maxRetries: 3, initialDelay: 2000 }
    );
  }

  // OPTIONAL: Validate prerequisites
  async validatePrerequisites(userId, options) {
    await super.validatePrerequisites(userId, options);

    // Malaysia requires Yellow Fever vaccination certificate for certain countries
    const UserDataService = require('../UserDataService').default;
    const passport = await UserDataService.getPassport(userId);

    if (this.requiresYellowFeverCert(passport.nationality)) {
      // Check if user has vaccination record
      const hasVaccination = await this.checkVaccinationRecord(userId);
      if (!hasVaccination) {
        throw new Error('Yellow Fever vaccination certificate is required for your nationality');
      }
    }
  }

  // OPTIONAL: Process response
  async processResponse(response, options) {
    // Malaysia E-Pass has nested response structure
    return {
      applicationNo: response.result.application_number,
      referenceNo: response.result.reference_code,
      qrCodeUrl: response.result.documents.qr_code,
      pdfUrl: response.result.documents.pdf,
      approvalDate: response.result.approval_date,
      expiryDate: response.result.visa_expiry,
    };
  }

  // OPTIONAL: After submission
  async afterSubmission(userId, response, options) {
    // Send SMS notification (Malaysia prefers SMS)
    await this.sendSMSNotification(userId, response.applicationNo);

    // Update user profile with E-Pass number
    await this.updateUserProfile(userId, {
      malaysiaEPassNo: response.applicationNo,
      malaysiaEPassExpiry: response.expiryDate,
    });
  }

  // Helper methods
  generateRequestId() {
    return `MY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  requiresYellowFeverCert(nationality) {
    const requiredCountries = ['NGA', 'GHA', 'COD', /* ... */];
    return requiredCountries.includes(nationality);
  }

  async checkVaccinationRecord(userId) {
    // Check if user has uploaded Yellow Fever certificate
    // Implementation...
    return true;
  }

  async sendSMSNotification(userId, applicationNo) {
    // Send SMS via provider
    // Implementation...
  }

  async updateUserProfile(userId, updates) {
    // Update user profile
    // Implementation...
  }
}

export default new MalaysiaEPassService();
```

---

## Testing

Example test for a service extending the base class:

```javascript
import VietnamEVisaService from '../VietnamEVisaService';

describe('VietnamEVisaService', () => {
  it('should submit e-Visa successfully', async () => {
    const result = await VietnamEVisaService.submit('test_user_123');

    expect(result.success).toBe(true);
    expect(result.applicationNo).toBeDefined();
  });

  it('should handle API errors', async () => {
    // Mock API to return error
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(
      VietnamEVisaService.submit('test_user_123')
    ).rejects.toThrow('API Error: 500');
  });

  it('should retry on network failure', async () => {
    let attempts = 0;

    jest.spyOn(global, 'fetch').mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Network error');
      }
      return Promise.resolve({ ok: true, json: () => ({ success: true }) });
    });

    const result = await VietnamEVisaService.submit('test_user_123');

    expect(attempts).toBe(3);
    expect(result.success).toBe(true);
  });
});
```

---

## Benefits

Using `DigitalCardServiceBase`:

✅ **70% less boilerplate code**
- No need to write submission workflow
- No need to write database persistence
- No need to write error handling

✅ **Consistent patterns**
- All services work the same way
- Easier to maintain
- Easier to onboard new developers

✅ **Built-in features**
- Retry logic with exponential backoff
- Database persistence
- Error handling
- Lifecycle hooks

✅ **Flexible customization**
- Override only what you need
- Keep standard behavior for everything else

---

## Migration Guide

### Before (Manual Implementation)

```javascript
class TDACSubmissionService {
  static async submitTDAC(userId) {
    try {
      // Validate user
      if (!userId) throw new Error('User ID required');

      // Build context
      const context = await TDACContextBuilder.build(userId);

      // Call API
      const response = await TDACAPIService.submit(context);

      // Save to DB
      const entryInfo = await EntryInfoService.find(userId, 'th');
      if (!entryInfo) {
        await EntryInfoService.create(userId, 'th');
      }
      await DigitalCardService.save({
        userId,
        entryInfoId: entryInfo.id,
        ...response
      });

      return response;
    } catch (error) {
      console.error('Submission failed:', error);
      throw error;
    }
  }
}
```

### After (Using Base Class)

```javascript
class TDACSubmissionService extends DigitalCardServiceBase {
  constructor() {
    super({ destinationId: 'th', cardType: 'TDAC', serviceName: 'TDAC Service' });
  }

  async buildContext(userId) {
    return await TDACContextBuilder.build(userId);
  }

  async callAPI(context) {
    return await TDACAPIService.submit(context);
  }
}
```

**Result:** 60+ lines reduced to 12 lines!

---

**Last Updated:** 2025-01-30
**Version:** 1.0
