# Simplified Schema Design: Remove Entry Packs

## Analysis

After review, **`entry_packs` is redundant** and can be merged into `entry_info`.

---

## What Entry Pack Provided (and why it's not needed)

| Feature | Entry Pack Approach | Simplified Approach |
|---------|-------------------|---------------------|
| **Latest DAC references** | `latest_tdac_id` field | Query: `SELECT * FROM digital_arrival_cards WHERE entry_info_id = ? AND card_type = 'TDAC' AND is_superseded = 0 LIMIT 1` |
| **Documents (QR, PDF)** | `documents` JSON field | Move to `entry_info.documents` |
| **Display status** | `display_status` JSON | Move to `entry_info.display_status` |
| **Status tracking** | `entry_pack.status` | Already exists: `entry_info.status` |
| **Multiple submissions** | Multiple entry_packs | Multiple `digital_arrival_cards` linked to same `entry_info` |

---

## Simplified Relationships

### Before (With Entry Packs):
```
entry_info (1) → entry_packs (*) → digital_arrival_cards (*)
```

### After (Simplified):
```
entry_info (1) → digital_arrival_cards (*)
```

---

## Updated entry_info Schema

```sql
CREATE TABLE entry_info (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,

  -- References
  passport_id TEXT NOT NULL,
  personal_info_id TEXT,
  travel_info_id TEXT,

  -- Trip context
  destination_id TEXT,           -- Country code for fast filtering (e.g., 'THA', 'JPN')

  -- Status
  status TEXT DEFAULT 'incomplete',
  -- Status flow:
  -- 'incomplete' → filling out forms
  -- 'ready' → all fields complete, ready to submit
  -- 'submitted' → TDAC/DAC submitted successfully
  -- 'superseded' → user edited after submission, needs resubmit
  -- 'completed' → user passed immigration successfully
  -- 'expired' → trip date passed
  -- 'archived' → manually archived by user

  -- Completion tracking
  completion_metrics TEXT,  -- JSON: {passport: {complete: 5, total: 5}, ...}

  -- Documents (after submission)
  documents TEXT,           -- JSON: {qrCodeImage: 'path', pdfPath: 'path', ...}

  -- Display state (for UI)
  display_status TEXT,      -- JSON: {completionPercent: 80, categoryStates: {...}, ...}

  -- Timestamps
  last_updated_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (passport_id) REFERENCES passports(id),
  FOREIGN KEY (personal_info_id) REFERENCES personal_info(id),
  FOREIGN KEY (travel_info_id) REFERENCES travel_info(id)
);
```

---

## Updated digital_arrival_cards Schema

```sql
CREATE TABLE digital_arrival_cards (
  id TEXT PRIMARY KEY,
  entry_info_id TEXT NOT NULL,  -- Changed from entry_pack_id
  user_id INTEGER NOT NULL,

  -- Card type
  card_type TEXT NOT NULL,      -- 'TDAC', 'MDAC', 'SDAC', 'HKDAC'
  destination_id TEXT,

  -- Submission data
  arr_card_no TEXT,
  qr_uri TEXT,
  pdf_url TEXT,

  -- Submission metadata
  submitted_at DATETIME NOT NULL,
  submission_method TEXT DEFAULT 'api',  -- 'api', 'webview', 'hybrid'
  status TEXT DEFAULT 'success',         -- 'success', 'failed', 'pending'

  -- Response data
  api_response TEXT,
  processing_time INTEGER,

  -- Retry tracking
  retry_count INTEGER DEFAULT 0,
  error_details TEXT,

  -- Superseded tracking
  is_superseded INTEGER DEFAULT 0,
  superseded_at DATETIME,
  superseded_by TEXT,
  superseded_reason TEXT,

  -- Version tracking
  version INTEGER DEFAULT 1,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (entry_info_id) REFERENCES entry_info(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Trigger: Mark previous DAC submissions as superseded
CREATE TRIGGER IF NOT EXISTS mark_previous_dac_superseded
AFTER INSERT ON digital_arrival_cards
WHEN NEW.status = 'success' AND NEW.is_superseded = 0
BEGIN
  UPDATE digital_arrival_cards
  SET
    is_superseded = 1,
    superseded_at = CURRENT_TIMESTAMP,
    superseded_by = NEW.id,
    superseded_reason = 'Replaced by newer successful submission'
  WHERE
    entry_info_id = NEW.entry_info_id  -- Changed from entry_pack_id
    AND card_type = NEW.card_type
    AND id != NEW.id
    AND is_superseded = 0;
END;
```

---

## Querying Latest DACs

### Get Latest TDAC for Entry
```sql
SELECT * FROM digital_arrival_cards
WHERE entry_info_id = ?
  AND card_type = 'TDAC'
  AND is_superseded = 0
  AND status = 'success'
ORDER BY submitted_at DESC
LIMIT 1;
```

### Get All Latest DACs for Entry (All Types)
```sql
SELECT
  dac.*
FROM digital_arrival_cards dac
WHERE dac.entry_info_id = ?
  AND dac.is_superseded = 0
  AND dac.status = 'success'
ORDER BY dac.card_type, dac.submitted_at DESC;
```

### Get Submission History for Entry
```sql
SELECT * FROM digital_arrival_cards
WHERE entry_info_id = ?
ORDER BY card_type, submitted_at DESC;
```

---

## Application Code Changes

### EntryInfo Model (Updated)

```javascript
class EntryInfo {
  constructor(data = {}) {
    this.id = data.id || EntryInfo.generateId();
    this.userId = data.userId;

    // References
    this.passportId = data.passportId;
    this.personalInfoId = data.personalInfoId;
    this.travelInfoId = data.travelInfoId;

    // Trip context
    this.destinationId = data.destinationId;
    this.tripId = data.tripId;

    // Status
    this.status = data.status || 'incomplete';

    // Tracking
    this.completionMetrics = data.completionMetrics || {
      passport: { complete: 0, total: 5, state: 'missing' },
      personalInfo: { complete: 0, total: 6, state: 'missing' },
      funds: { complete: 0, total: 1, state: 'missing' },
      travel: { complete: 0, total: 6, state: 'missing' }
    };

    // Documents (after submission)
    this.documents = data.documents || {
      qrCodeImage: null,
      pdfDocument: null,
      entryCardImage: null
    };

    // Display state
    this.displayStatus = data.displayStatus || {
      completionPercent: 0,
      categoryStates: {
        passport: 'missing',
        personalInfo: 'missing',
        funds: 'missing',
        travel: 'missing'
      },
      countdownMessage: null,
      ctaState: 'disabled',
      showQR: false,
      showGuide: false
    };

    // Timestamps
    this.lastUpdatedAt = data.lastUpdatedAt || new Date().toISOString();
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  /**
   * Submit Digital Arrival Card
   */
  async submitDAC(cardType, submissionData, method = 'api') {
    const SecureStorageService = require('../services/security/SecureStorageService').default;

    const cardData = {
      id: `dac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entryInfoId: this.id,  // Direct link to entry_info
      userId: this.userId,
      cardType: cardType,
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

    // Update entry_info status
    this.status = 'submitted';

    // Update documents
    this.documents = {
      qrCodeImage: submissionData.qrCodeImage,
      pdfDocument: submissionData.pdfUrl,
      entryCardImage: submissionData.entryCardImage
    };

    // Update display status
    this.displayStatus.showQR = true;
    this.displayStatus.ctaState = 'enabled';

    await this.save();

    return cardData;
  }

  /**
   * Get latest DAC by type
   */
  async getLatestDAC(cardType) {
    const SecureStorageService = require('../services/security/SecureStorageService').default;
    return await SecureStorageService.getLatestDAC(this.id, cardType);
  }

  /**
   * Get all DAC submissions for this entry
   */
  async getAllDACs() {
    const SecureStorageService = require('../services/security/SecureStorageService').default;
    return await SecureStorageService.getAllDACs(this.id);
  }

  /**
   * Get all latest DACs (one per type)
   */
  async getLatestDACs() {
    const SecureStorageService = require('../services/security/SecureStorageService').default;
    return await SecureStorageService.getLatestDACsByType(this.id);
  }

  /**
   * Mark as superseded (when user edits after submission)
   */
  markAsSuperseded() {
    if (this.status === 'submitted') {
      this.status = 'superseded';
      this.displayStatus.ctaState = 'resubmit';
      this.displayStatus.showQR = false;
    }
  }

  /**
   * Check if has valid DAC submission
   */
  async hasValidDAC(cardType = 'TDAC') {
    const dac = await this.getLatestDAC(cardType);
    return dac && dac.status === 'success' && !dac.isSuperseded;
  }
}
```

---

## Benefits of Simplified Design

✅ **Simpler schema** - One less table to manage
✅ **Clearer relationships** - Direct link between entry_info and DACs
✅ **Less redundancy** - No duplicate status/document fields
✅ **Easier queries** - No need to join through entry_packs
✅ **Better performance** - Fewer table joins
✅ **Easier to understand** - More straightforward data model

---

## Migration from Old Design

If `entry_packs` already exists:

```sql
-- Move latest DAC references to entry_info
ALTER TABLE entry_info ADD COLUMN documents TEXT;
ALTER TABLE entry_info ADD COLUMN display_status TEXT;

-- Update entry_info with entry_pack data
UPDATE entry_info
SET
  documents = (SELECT documents FROM entry_packs WHERE entry_packs.entry_info_id = entry_info.id LIMIT 1),
  display_status = (SELECT display_status FROM entry_packs WHERE entry_packs.entry_info_id = entry_info.id LIMIT 1);

-- Update digital_arrival_cards foreign key
ALTER TABLE digital_arrival_cards RENAME COLUMN entry_pack_id TO entry_info_id;

-- Drop entry_packs table
DROP TABLE entry_packs;
```

---

## Summary

**Old Design:**
```
entry_info → entry_packs → digital_arrival_cards
(3 tables, complex joins)
```

**New Design:**
```
entry_info → digital_arrival_cards
(2 tables, simple and clear)
```

**Reasoning:**
- Entry packs added no unique data
- Latest DACs can be queried
- Documents/display_status moved to entry_info
- Simpler is better

This aligns with your observation: **if entry_packs has nothing unique, merge it into entry_info**. ✅
