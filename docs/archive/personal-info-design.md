# Personal Info Design: Multiple Records per User

## Design Decision

**Question:** Should each user have ONE personal info record, or MULTIPLE?

**Answer:** **MULTIPLE** - Each user can have multiple personal_info records, optionally linked to specific passports or countries.

---

## Rationale

### Real-World Scenarios

1. **User with Multiple Passports**
   - Chinese passport holder living in mainland China
     - China address (北京市朝阳区...)
     - +86 phone number
     - Mainland occupation title
   - Same user with Hong Kong passport
     - Hong Kong address (香港九龍...)
     - +852 phone number
     - HK occupation title or company

2. **User Living in Different Countries**
   - Primary residence: China
   - Secondary residence: United States
   - Each country requires different contact information for immigration

3. **Business vs Personal Travel**
   - Business trips: Office address, work email, business occupation
   - Personal trips: Home address, personal email, leisure occupation

4. **Immigration Requirements**
   - Some countries require "current residence" address
   - Other countries require "permanent address"
   - User may need both depending on destination

---

## Database Schema

```sql
CREATE TABLE personal_info (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,                  -- Allows multiple per user
  passport_id TEXT,                       -- Optional link to passport

  -- Contact Information
  phone_number TEXT,
  email TEXT,
  home_address TEXT,

  -- Location Context
  country_region TEXT,                    -- Which country this info is for
  province_city TEXT,

  -- Personal Details
  occupation TEXT,
  phone_code TEXT,
  gender TEXT,

  -- Selection Mechanism
  is_default INTEGER DEFAULT 0,          -- Only one can be default
  label TEXT,                            -- User-friendly name

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (passport_id) REFERENCES passports(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_personal_info_user ON personal_info(user_id);
CREATE INDEX idx_personal_info_passport ON personal_info(passport_id);
CREATE INDEX idx_personal_info_default ON personal_info(user_id, is_default);
CREATE INDEX idx_personal_info_country ON personal_info(user_id, country_region);

-- Trigger: Ensure only one default per user
CREATE TRIGGER ensure_one_default_personal_info
BEFORE UPDATE OF is_default ON personal_info
WHEN NEW.is_default = 1
BEGIN
  UPDATE personal_info
  SET is_default = 0
  WHERE user_id = NEW.user_id AND id != NEW.id;
END;

CREATE TRIGGER ensure_one_default_personal_info_insert
BEFORE INSERT ON personal_info
WHEN NEW.is_default = 1
BEGIN
  UPDATE personal_info
  SET is_default = 0
  WHERE user_id = NEW.user_id;
END;
```

---

## Application Logic

### Smart Personal Info Selection

When creating an entry_info, the system intelligently selects personal_info:

```javascript
async function selectPersonalInfoForEntry(userId, passportId, destinationCountry) {
  // Priority 1: Personal info linked to this specific passport
  let personalInfo = await db.query(
    'SELECT * FROM personal_info WHERE passport_id = ?',
    [passportId]
  );

  if (personalInfo) {
    console.log('Using passport-specific personal info');
    return personalInfo;
  }

  // Priority 2: Personal info for destination country
  personalInfo = await db.query(
    'SELECT * FROM personal_info WHERE user_id = ? AND country_region = ?',
    [userId, destinationCountry]
  );

  if (personalInfo) {
    console.log('Using country-specific personal info');
    return personalInfo;
  }

  // Priority 3: Default personal info
  personalInfo = await db.query(
    'SELECT * FROM personal_info WHERE user_id = ? AND is_default = 1',
    [userId]
  );

  if (personalInfo) {
    console.log('Using default personal info');
    return personalInfo;
  }

  // Priority 4: Any personal info for this user
  personalInfo = await db.query(
    'SELECT * FROM personal_info WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    [userId]
  );

  if (personalInfo) {
    console.log('Using most recent personal info');
    return personalInfo;
  }

  // No personal info found - prompt user to create one
  return null;
}
```

### Example Queries

```sql
-- Get all personal info for a user
SELECT * FROM personal_info
WHERE user_id = 'user_1'
ORDER BY is_default DESC, created_at DESC;

-- Get personal info for specific passport
SELECT * FROM personal_info
WHERE passport_id = 'passport_abc123';

-- Get personal info for China
SELECT * FROM personal_info
WHERE user_id = 'user_1' AND country_region = 'CHN';

-- Get default personal info
SELECT * FROM personal_info
WHERE user_id = 'user_1' AND is_default = 1;

-- Smart selection: passport-specific OR default
SELECT * FROM personal_info
WHERE (passport_id = 'passport_abc123' OR (user_id = 'user_1' AND is_default = 1))
ORDER BY passport_id DESC NULLS LAST
LIMIT 1;
```

---

## User Interface Flow

### 1. Personal Info Management Screen

```
┌─────────────────────────────────────┐
│  Personal Information               │
├─────────────────────────────────────┤
│                                     │
│  📋 China Mainland (Default)        │
│  ├─ Linked to: Chinese Passport    │
│  ├─ Address: 北京市朝阳区...        │
│  └─ Phone: +86 138 0000 0000       │
│     [Edit] [Delete]                 │
│                                     │
│  📋 Hong Kong                        │
│  ├─ Linked to: HK Passport         │
│  ├─ Address: 香港九龍...            │
│  └─ Phone: +852 9000 0000          │
│     [Edit] [Delete] [Set Default]  │
│                                     │
│  📋 Business Contact                 │
│  ├─ Not linked to passport         │
│  ├─ Address: 上海市浦东新区...      │
│  └─ Email: work@company.com        │
│     [Edit] [Delete]                 │
│                                     │
│  [+ Add New Personal Info]          │
│                                     │
└─────────────────────────────────────┘
```

### 2. Create/Edit Personal Info

```
┌─────────────────────────────────────┐
│  New Personal Information           │
├─────────────────────────────────────┤
│                                     │
│  Label (Optional):                  │
│  [Hong Kong Residence____________]  │
│                                     │
│  Link to Passport (Optional):       │
│  [Select Passport ▼]                │
│  ○ No link                          │
│  ● Hong Kong Passport (HK12345678)  │
│  ○ Chinese Passport (E12345678)     │
│                                     │
│  Country/Region:                    │
│  [Hong Kong___________________]     │
│                                     │
│  Province/City:                     │
│  [Kowloon_____________________]     │
│                                     │
│  Home Address:                      │
│  [Flat 8A, Tower 1, ABC Estate_]    │
│  [123 Main Road, Kowloon_______]    │
│                                     │
│  Phone:                             │
│  [+852] [9000 0000______________]   │
│                                     │
│  Email:                             │
│  [user@email.com_______________]    │
│                                     │
│  Occupation:                        │
│  [Software Engineer____________]    │
│                                     │
│  ☑ Set as default                   │
│                                     │
│  [Cancel]              [Save]       │
│                                     │
└─────────────────────────────────────┘
```

### 3. Entry Creation - Personal Info Selection

```
┌─────────────────────────────────────┐
│  Create Entry - Thailand            │
├─────────────────────────────────────┤
│                                     │
│  Step 1: Select Passport            │
│  ● Chinese Passport (E12345678)     │
│                                     │
│  Step 2: Personal Information       │
│  Auto-selected: China Mainland      │
│  (Linked to selected passport)      │
│                                     │
│  [Change Personal Info ▼]           │
│  ● China Mainland (Default)         │
│  ○ Hong Kong                        │
│  ○ Business Contact                 │
│  ○ Create New...                    │
│                                     │
│  Preview:                           │
│  ┌─────────────────────────────┐   │
│  │ Address: 北京市朝阳区...    │   │
│  │ Phone: +86 138 0000 0000    │   │
│  │ Email: user@email.com       │   │
│  │ Occupation: Engineer        │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Back]                [Next]       │
│                                     │
└─────────────────────────────────────┘
```

---

## Data Examples

### User with Two Passports

```sql
-- User
INSERT INTO users (id, name) VALUES ('user_1', 'Zhang Wei');

-- Passports
INSERT INTO passports (id, user_id, passport_number, nationality, is_primary)
VALUES
  ('passport_1', 'user_1', 'E12345678', 'CHN', 1),
  ('passport_2', 'user_1', 'K98765432', 'HKG', 0);

-- Personal Info Records
INSERT INTO personal_info (
  id, user_id, passport_id, label, country_region,
  home_address, phone_number, is_default
) VALUES
  -- China mainland info (linked to Chinese passport)
  (
    'personal_1', 'user_1', 'passport_1', 'China Mainland', 'CHN',
    '北京市朝阳区建国路88号', '+86 138 0000 0000', 1
  ),
  -- Hong Kong info (linked to HK passport)
  (
    'personal_2', 'user_1', 'passport_2', 'Hong Kong', 'HKG',
    'Flat 8A, Tower 1, ABC Estate, Kowloon', '+852 9000 0000', 0
  ),
  -- Business contact (not linked to any passport)
  (
    'personal_3', 'user_1', NULL, 'Business', 'CHN',
    '上海市浦东新区陆家嘴环路1000号', '+86 189 0000 0000', 0
  );

-- When creating entry with Chinese passport → Uses personal_1
-- When creating entry with HK passport → Uses personal_2
-- User can manually select personal_3 for business trips
```

---

## Benefits

✅ **Flexible**: Support different addresses for different contexts
✅ **Intelligent**: Auto-select appropriate personal info based on passport
✅ **User-Friendly**: Clear labels and default selection
✅ **Immigration-Compliant**: Provide correct address based on passport/destination
✅ **Privacy**: Separate work and personal contact information
✅ **Scalable**: Easy to add more personal info records as needed

---

## Migration Strategy

### For Existing Users with Single Personal Info

```sql
-- Set existing personal_info as default
UPDATE personal_info SET is_default = 1;

-- No passport_id initially (will be NULL)
-- Users can optionally link to passport later
```

### For New Users

```sql
-- Create default personal info when user registers
INSERT INTO personal_info (
  id, user_id, is_default, label
) VALUES (
  'personal_new', 'user_new', 1, 'Default'
);

-- User can add more personal info records later
-- Can link to passport when adding passport
```

---

## UI/UX Considerations

1. **First-time Users**: Create one default personal info during onboarding
2. **Passport Addition**: Prompt to create passport-specific personal info
3. **Entry Creation**: Smart auto-selection with option to change
4. **Management**: Easy-to-use list view with edit/delete/set-default actions
5. **Labels**: User-friendly labels (e.g., "China", "Hong Kong", "Business") for quick identification
6. **Visual Indicators**: Show which personal info is linked to which passport
7. **Default Marking**: Clear visual indicator for default personal info

---

## Conclusion

Supporting multiple personal_info records per user provides the flexibility needed for real-world travel scenarios, especially for users with multiple passports or living in different countries. The design includes intelligent auto-selection while maintaining user control and privacy.
