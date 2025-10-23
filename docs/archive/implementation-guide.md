# Database Schema v2.0 Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the new database schema for TripSecretary.

**Date**: 2025-10-22
**Schema Version**: 2.0
**Status**: Ready for Implementation

---

## Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **User ID Type** | INTEGER | WeChat OpenID compatibility |
| **Other Entity IDs** | TEXT | Application uses TEXT IDs like `passport_123...` |
| **Personal Info** | Multiple per user | Support passport/country-specific addresses |
| **Travel Info** | One-to-one with entry_info | Each entry has unique travel details |
| **Data Migration** | Start fresh | Clean slate for new schema |
| **Passport Countries** | Pre-populate | Better UX, show supported countries immediately |
| **DAC Submissions** | Generic table | Support TDAC, MDAC, SDAC, HK DAC |

---

## File Structure

```
cloudflare-backend/src/db/
├── schema.sql                    (OLD - current schema)
├── schema-v2.sql                 (NEW - updated schema) ✨
└── seed-passport-countries.sql   (NEW - seed data) ✨

docs/
├── database-schema-proposal.md   (Design proposal)
├── database-erd.md               (Entity relationships)
├── schema-comparison.md          (Current vs proposed)
├── personal-info-design.md       (Personal info detailed design)
└── implementation-guide.md       (This file)
```

---

## Implementation Steps

### Phase 1: Database Schema (Week 1)

#### Step 1.1: Backup Current Database
```bash
# Backup current database
sqlite3 tripsecretary.db ".backup tripsecretary_backup.db"
```

#### Step 1.2: Apply New Schema
```bash
# Option A: Start fresh (RECOMMENDED based on decision)
rm tripsecretary.db
sqlite3 tripsecretary.db < src/db/schema-v2.sql

# Option B: Migrate existing data (if needed later)
# See migration section below
```

#### Step 1.3: Verify Schema
```bash
# Check tables created
sqlite3 tripsecretary.db ".tables"

# Check triggers created
sqlite3 tripsecretary.db ".schema passports" | grep TRIGGER
sqlite3 tripsecretary.db ".schema personal_info" | grep TRIGGER
sqlite3 tripsecretary.db ".schema digital_arrival_cards" | grep TRIGGER
```

#### Step 1.4: Create Test User and Passport
```sql
-- Insert test user
INSERT INTO users (id, name, wechat_openid)
VALUES (1, 'Test User', 'test_openid_123');

-- Insert Chinese passport
INSERT INTO passports (id, user_id, passport_number, full_name, nationality, is_primary)
VALUES ('passport_test_1', 1, 'E12345678', 'ZHANG, WEI', 'CHN', 1);

-- Insert Hong Kong passport
INSERT INTO passports (id, user_id, passport_number, full_name, nationality, is_primary)
VALUES ('passport_test_2', 1, 'K98765432', 'ZHANG, WEI', 'HKG', 0);
```

#### Step 1.5: Seed Passport Countries
```bash
# Apply seed data
sqlite3 tripsecretary.db < src/db/seed-passport-countries.sql

# Verify passport-countries created
sqlite3 tripsecretary.db "SELECT * FROM passport_countries WHERE passport_id = 'passport_test_1' LIMIT 5;"
```

---

### Phase 2: Application Layer Updates (Week 2-3)

#### Step 2.1: Update SecureStorageService.js

**Changes needed:**

1. **Passport methods**: Update to handle `is_primary` field
2. **Personal Info methods**: Support multiple records per user
3. **Travel Info methods**: Ensure proper linking
4. **Entry Info methods**: Link to travel_info_id
5. **Entry Pack methods**: Support multiple DAC types
6. **DAC methods**: Use generic digital_arrival_cards table

**Example updates:**

```javascript
// SecureStorageService.js

// NEW: Get personal info for passport
async getPersonalInfoForPassport(passportId) {
  const db = await this.getDatabase();
  const result = await db.getFirstAsync(
    'SELECT * FROM personal_info WHERE passport_id = ?',
    [passportId]
  );
  return result;
}

// NEW: Get default personal info
async getDefaultPersonalInfo(userId) {
  const db = await this.getDatabase();
  const result = await db.getFirstAsync(
    'SELECT * FROM personal_info WHERE user_id = ? AND is_default = 1',
    [userId]
  );
  return result;
}

// NEW: List all personal info for user
async listPersonalInfo(userId) {
  const db = await this.getDatabase();
  const results = await db.getAllAsync(
    'SELECT * FROM personal_info WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
    [userId]
  );
  return results;
}

// NEW: Smart personal info selection
async selectPersonalInfoForEntry(userId, passportId, destinationCountry) {
  // Priority 1: Passport-specific
  let result = await this.getPersonalInfoForPassport(passportId);
  if (result) return result;

  // Priority 2: Country-specific
  const db = await this.getDatabase();
  result = await db.getFirstAsync(
    'SELECT * FROM personal_info WHERE user_id = ? AND country_region = ?',
    [userId, destinationCountry]
  );
  if (result) return result;

  // Priority 3: Default
  return await this.getDefaultPersonalInfo(userId);
}

// NEW: Get primary passport
async getPrimaryPassport(userId) {
  const db = await this.getDatabase();
  const result = await db.getFirstAsync(
    'SELECT * FROM passports WHERE user_id = ? AND is_primary = 1',
    [userId]
  );
  return result;
}

// NEW: Save digital arrival card
async saveDigitalArrivalCard(cardData) {
  const db = await this.getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO digital_arrival_cards (
      id, entry_pack_id, user_id, card_type, destination_id,
      arr_card_no, qr_uri, pdf_url, submitted_at, submission_method,
      status, version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      cardData.id,
      cardData.entryPackId,
      cardData.userId,
      cardData.cardType, // 'TDAC', 'MDAC', 'SDAC', 'HKDAC'
      cardData.destinationId,
      cardData.arrCardNo,
      cardData.qrUri,
      cardData.pdfUrl,
      cardData.submittedAt,
      cardData.submissionMethod,
      cardData.status,
      cardData.version || 1
    ]
  );
}

// NEW: Get latest DAC for entry pack
async getLatestDAC(entryPackId, cardType) {
  const db = await this.getDatabase();
  const result = await db.getFirstAsync(
    `SELECT * FROM digital_arrival_cards
     WHERE entry_pack_id = ? AND card_type = ? AND is_superseded = 0 AND status = 'success'
     ORDER BY submitted_at DESC LIMIT 1`,
    [entryPackId, cardType]
  );
  return result;
}
```

#### Step 2.2: Update Model Classes

**PersonalInfo.js** - Major updates:
```javascript
class PersonalInfo {
  constructor(data = {}) {
    this.id = data.id || PersonalInfo.generateId();
    this.userId = data.userId;
    this.passportId = data.passportId || null;  // NEW

    // Contact info
    this.phoneNumber = data.phoneNumber;
    this.email = data.email;
    this.homeAddress = data.homeAddress;

    // Context
    this.countryRegion = data.countryRegion;    // NEW
    this.provinceCity = data.provinceCity;
    this.occupation = data.occupation;
    this.phoneCode = data.phoneCode;
    this.gender = data.gender;

    // Selection
    this.isDefault = data.isDefault || false;   // NEW
    this.label = data.label || '';              // NEW

    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // NEW: Get display label
  getDisplayLabel() {
    if (this.label) return this.label;
    if (this.countryRegion) return this.countryRegion;
    return 'Personal Info';
  }

  // NEW: Check if linked to passport
  isLinkedToPassport() {
    return !!this.passportId;
  }

  // UPDATED: List all personal info for user
  static async listByUserId(userId) {
    const SecureStorageService = require('../services/security/SecureStorageService').default;
    return await SecureStorageService.listPersonalInfo(userId);
  }

  // NEW: Get personal info for passport
  static async getForPassport(passportId) {
    const SecureStorageService = require('../services/security/SecureStorageService').default;
    return await SecureStorageService.getPersonalInfoForPassport(passportId);
  }

  // NEW: Get default personal info
  static async getDefault(userId) {
    const SecureStorageService = require('../services/security/SecureStorageService').default;
    const data = await SecureStorageService.getDefaultPersonalInfo(userId);
    return data ? new PersonalInfo(data) : null;
  }

  // NEW: Smart selection
  static async selectForEntry(userId, passportId, destinationCountry) {
    const SecureStorageService = require('../services/security/SecureStorageService').default;
    const data = await SecureStorageService.selectPersonalInfoForEntry(userId, passportId, destinationCountry);
    return data ? new PersonalInfo(data) : null;
  }
}
```

**Passport.js** - Minor updates:
```javascript
class Passport {
  constructor(data = {}) {
    // ... existing fields ...
    this.isPrimary = data.isPrimary || false;  // NEW
  }

  // NEW: Get primary passport
  static async getPrimary(userId) {
    const SecureStorageService = require('../services/security/SecureStorageService').default;
    const data = await SecureStorageService.getPrimaryPassport(userId);
    return data ? new Passport(data) : null;
  }

  // NEW: Get countries this passport can enter
  async getCountries() {
    const SecureStorageService = require('../services/security/SecureStorageService').default;
    return await SecureStorageService.getPassportCountries(this.id);
  }
}
```

**EntryPack.js** - Updates for multiple DAC types:
```javascript
class EntryPack {
  constructor(data = {}) {
    // ... existing fields ...

    // Latest DAC references
    this.latestTdacId = data.latestTdacId || null;
    this.latestMdacId = data.latestMdacId || null;
    this.latestSdacId = data.latestSdacId || null;
    this.latestHkdacId = data.latestHkdacId || null;
  }

  // NEW: Submit DAC (generic)
  async submitDAC(cardType, submissionData, method = 'api') {
    const SecureStorageService = require('../services/security/SecureStorageService').default;

    const cardData = {
      id: `dac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entryPackId: this.id,
      userId: this.userId,
      cardType: cardType, // 'TDAC', 'MDAC', 'SDAC', 'HKDAC'
      destinationId: this.destinationId,
      arrCardNo: submissionData.arrCardNo,
      qrUri: submissionData.qrUri,
      pdfUrl: submissionData.pdfUrl,
      submittedAt: new Date().toISOString(),
      submissionMethod: method,
      status: 'success',
      version: 1
    };

    await SecureStorageService.saveDigitalArrivalCard(cardData);

    // Update entry pack with latest reference
    const fieldName = `latest${cardType.toLowerCase()}Id`;
    this[fieldName] = cardData.id;
    await this.save();

    return cardData;
  }

  // NEW: Get latest DAC by type
  async getLatestDAC(cardType) {
    const SecureStorageService = require('../services/security/SecureStorageService').default;
    return await SecureStorageService.getLatestDAC(this.id, cardType);
  }

  // NEW: Get all DAC submissions
  async getAllDACs() {
    const SecureStorageService = require('../services/security/SecureStorageService').default;
    return await SecureStorageService.getAllDACs(this.id);
  }
}
```

#### Step 2.3: Update UI Components

**PersonalInfoManagementScreen.js** (NEW):
- List all personal info records
- Create/edit/delete personal info
- Link to passport
- Set default
- Show labels

**PersonalInfoSelectionModal.js** (NEW):
- Used during entry creation
- Auto-select appropriate personal info
- Allow manual selection
- Show preview

**EntryPackDetailScreen.js** (UPDATE):
- Show all DAC types (TDAC, MDAC, SDAC, HK DAC)
- Display latest for each type
- Show submission history

---

### Phase 3: Testing (Week 4)

#### Step 3.1: Unit Tests

```javascript
// __tests__/PersonalInfo.multipleRecords.test.js
describe('PersonalInfo Multiple Records', () => {
  it('allows multiple personal info per user', async () => {
    const user = await createTestUser();

    const personalInfo1 = await PersonalInfo.create({
      userId: user.id,
      countryRegion: 'CHN',
      label: 'China Mainland',
      isDefault: true
    });

    const personalInfo2 = await PersonalInfo.create({
      userId: user.id,
      countryRegion: 'HKG',
      label: 'Hong Kong'
    });

    const allPersonalInfo = await PersonalInfo.listByUserId(user.id);
    expect(allPersonalInfo.length).toBe(2);
  });

  it('enforces only one default per user', async () => {
    const user = await createTestUser();

    const pi1 = await PersonalInfo.create({ userId: user.id, isDefault: true });
    const pi2 = await PersonalInfo.create({ userId: user.id, isDefault: true });

    const defaultPI = await PersonalInfo.getDefault(user.id);
    expect(defaultPI.id).toBe(pi2.id); // Latest is default

    const pi1Updated = await PersonalInfo.load(pi1.id);
    expect(pi1Updated.isDefault).toBe(false); // First is no longer default
  });
});

// __tests__/Passport.isPrimary.test.js
describe('Passport Primary Flag', () => {
  it('enforces only one primary passport per user', async () => {
    const user = await createTestUser();

    const passport1 = await Passport.create({ userId: user.id, isPrimary: true });
    const passport2 = await Passport.create({ userId: user.id, isPrimary: true });

    const primary = await Passport.getPrimary(user.id);
    expect(primary.id).toBe(passport2.id);

    const passport1Updated = await Passport.load(passport1.id);
    expect(passport1Updated.isPrimary).toBe(false);
  });
});

// __tests__/DigitalArrivalCards.multipleTypes.test.js
describe('Digital Arrival Cards', () => {
  it('supports multiple DAC types', async () => {
    const entryPack = await createTestEntryPack();

    await entryPack.submitDAC('TDAC', { arrCardNo: 'TDAC123', qrUri: 'qr1' });
    await entryPack.submitDAC('MDAC', { arrCardNo: 'MDAC456', qrUri: 'qr2' });

    const tdac = await entryPack.getLatestDAC('TDAC');
    const mdac = await entryPack.getLatestDAC('MDAC');

    expect(tdac.arrCardNo).toBe('TDAC123');
    expect(mdac.arrCardNo).toBe('MDAC456');
  });

  it('auto-supersedes previous submissions', async () => {
    const entryPack = await createTestEntryPack();

    await entryPack.submitDAC('TDAC', { arrCardNo: 'TDAC123' });
    await entryPack.submitDAC('TDAC', { arrCardNo: 'TDAC456' });

    const latest = await entryPack.getLatestDAC('TDAC');
    expect(latest.arrCardNo).toBe('TDAC456');
    expect(latest.isSuperseded).toBe(false);

    const allTDACs = await entryPack.getAllDACs();
    const oldTDAC = allTDACs.find(d => d.arrCardNo === 'TDAC123');
    expect(oldTDAC.isSuperseded).toBe(true);
  });
});
```

#### Step 3.2: Integration Tests

```javascript
// __tests__/EntryCreationFlow.integration.test.js
describe('Entry Creation with Multiple Personal Info', () => {
  it('auto-selects passport-specific personal info', async () => {
    const user = await createTestUser();
    const chinesePassport = await Passport.create({
      userId: user.id,
      nationality: 'CHN'
    });
    const hkPassport = await Passport.create({
      userId: user.id,
      nationality: 'HKG'
    });

    const chinaPI = await PersonalInfo.create({
      userId: user.id,
      passportId: chinesePassport.id,
      homeAddress: 'Beijing Address',
      label: 'China'
    });

    const hkPI = await PersonalInfo.create({
      userId: user.id,
      passportId: hkPassport.id,
      homeAddress: 'Hong Kong Address',
      label: 'HK'
    });

    // Create entry with Chinese passport
    const selectedPI = await PersonalInfo.selectForEntry(
      user.id,
      chinesePassport.id,
      'THA'
    );

    expect(selectedPI.id).toBe(chinaPI.id);
    expect(selectedPI.homeAddress).toBe('Beijing Address');
  });
});
```

---

### Phase 4: Deployment (Week 5)

#### Step 4.1: Development Environment
```bash
# Apply schema to dev database
sqlite3 dev_tripsecretary.db < src/db/schema-v2.sql
sqlite3 dev_tripsecretary.db < src/db/seed-passport-countries.sql

# Run tests
npm test

# Manual testing
npm run dev
```

#### Step 4.2: Staging Environment
```bash
# Apply schema
sqlite3 staging_tripsecretary.db < src/db/schema-v2.sql
sqlite3 staging_tripsecretary.db < src/db/seed-passport-countries.sql

# Smoke tests
npm run test:e2e
```

#### Step 4.3: Production Deployment
```bash
# IMPORTANT: Backup first
sqlite3 prod_tripsecretary.db ".backup prod_backup_$(date +%Y%m%d).db"

# Apply schema (start fresh as decided)
sqlite3 prod_tripsecretary.db < src/db/schema-v2.sql
sqlite3 prod_tripsecretary.db < src/db/seed-passport-countries.sql

# Verify
sqlite3 prod_tripsecretary.db ".tables"
sqlite3 prod_tripsecretary.db "SELECT COUNT(*) FROM passport_countries;"
```

---

## Rollback Plan

If issues arise, rollback is straightforward since we're starting fresh:

```bash
# Restore backup
cp prod_backup_YYYYMMDD.db prod_tripsecretary.db

# Revert application code
git revert <commit-hash>

# Redeploy
npm run deploy
```

---

## Monitoring and Validation

### Post-Deployment Checks

```sql
-- Check table counts
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'passports', COUNT(*) FROM passports
UNION ALL
SELECT 'personal_info', COUNT(*) FROM personal_info
UNION ALL
SELECT 'travel_info', COUNT(*) FROM travel_info
UNION ALL
SELECT 'entry_info', COUNT(*) FROM entry_info
UNION ALL
SELECT 'entry_packs', COUNT(*) FROM entry_packs
UNION ALL
SELECT 'digital_arrival_cards', COUNT(*) FROM digital_arrival_cards
UNION ALL
SELECT 'passport_countries', COUNT(*) FROM passport_countries;

-- Check triggers exist
SELECT name FROM sqlite_master
WHERE type = 'trigger'
ORDER BY name;

-- Validate passport countries seeded
SELECT nationality, COUNT(*) as country_count
FROM passports p
JOIN passport_countries pc ON p.id = pc.passport_id
GROUP BY nationality;
```

---

## Success Criteria

- ✅ All tables created successfully
- ✅ All triggers functioning (primary passport, default personal info, DAC superseding)
- ✅ Indexes created for performance
- ✅ Passport-countries seed data populated
- ✅ All unit tests passing
- ✅ All integration tests passing
- ✅ UI supports multiple personal info management
- ✅ Entry creation with smart personal info selection
- ✅ Multiple DAC types supported (TDAC, MDAC, SDAC, HK DAC)
- ✅ No performance regressions

---

## Timeline Summary

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1: Database | Week 1 | Apply schema, seed data, verify |
| Phase 2: Application | Week 2-3 | Update services, models, UI |
| Phase 3: Testing | Week 4 | Unit tests, integration tests |
| Phase 4: Deployment | Week 5 | Dev → Staging → Production |

**Total Estimated Time**: 5 weeks

---

## Support and Documentation

- **Schema Documentation**: `docs/database-schema-proposal.md`
- **ERD Diagram**: `docs/database-erd.md`
- **Comparison**: `docs/schema-comparison.md`
- **Personal Info Design**: `docs/personal-info-design.md`
- **SQL Schema**: `cloudflare-backend/src/db/schema-v2.sql`
- **Seed Data**: `cloudflare-backend/src/db/seed-passport-countries.sql`

---

## Contact

For questions or issues during implementation:
1. Review documentation in `docs/` directory
2. Check ERD diagram for relationship clarity
3. Refer to this implementation guide
4. Test in development environment first

**Good luck with the implementation!** 🚀
