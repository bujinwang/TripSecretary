# Database Entity Relationship Diagram (ERD) - Simplified Design

**Version**: 2.0 (Simplified - No entry_packs)
**Date**: 2025-10-22

---

## Core Entities and Relationships

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (INT) PK     │
│ wechat_openid   │
│ phone           │
│ name            │
│ avatar_url      │
│ created_at      │
│ updated_at      │
└─────────────────┘
        │
        │ 1
        │
        ├─────────────────────────────────────────────────┐
        │                             │                   │
        │ *                           │ *                 │ *
        │                             │                   │
┌───────▼─────────┐          ┌────────▼────────┐  ┌──────▼──────┐
│   passports     │          │  personal_info  │  │travel_info  │
│─────────────────│          │─────────────────│  │─────────────│
│ id (TEXT) PK    │          │ id (TEXT) PK    │  │ id (TEXT) PK│
│ user_id FK      │          │ user_id FK      │  │ user_id FK  │
│ passport_number │          │ passport_id FK  │◄─┤ destination │
│ full_name       │          │ phone_number    │  │ travel_...  │
│ date_of_birth   │          │ email           │  │ arrival_... │
│ nationality     │          │ home_address    │  │ departure...│
│ gender          │          │ occupation      │  │ hotel_...   │
│ expiry_date     │          │ province_city   │  │ status      │
│ issue_date      │          │ country_region  │  │ created_at  │
│ issue_place     │          │ phone_code      │  │ updated_at  │
│ photo_uri       │          │ gender          │  └─────────────┘
│ is_primary      │          │ is_default      │
│ created_at      │          │ label           │
│ updated_at      │          │ created_at      │
└─────────────────┘          │ updated_at      │
        │                    └─────────────────┘
        │ 1                           │
        │                             │ 0..1
        │ *                           └──────────────┐
        │                                            │
┌───────▼──────────────┐                            │
│ passport_countries   │                            │
│──────────────────────│                            │
│ passport_id FK  ├────┤                            │
│ country_code    ├────┤ PK (composite)            │
│ visa_required        │                            │
│ max_stay_days        │                            │
│ notes                │                            │
│ created_at           │                            │
└──────────────────────┘                            │
                                                    │
┌─────────────────┐                                 │
│     users       │                                 │
└────────┬────────┘                                 │
         │ 1                                        │
         │                                          │
         │ *                                        │
         │                                          │
┌────────▼────────┐                                 │
│  fund_items     │                                 │
│─────────────────│                                 │
│ id (TEXT) PK    │                                 │
│ user_id FK      │                                 │
│ type            │                                 │
│ amount          │                                 │
│ currency        │                                 │
│ details         │                                 │
│ photo_uri       │                                 │
│ created_at      │                                 │
│ updated_at      │                                 │
└─────────────────┘                                 │
         │                                          │
         │ *                                        │
         │                                          │
         │           ┌──────────────┐               │
         │           │  entry_info  │               │
         │           │──────────────│               │
         │           │ id (TEXT) PK │               │
         │           │ user_id FK   │               │
         │           │ passport_id  │◄──────────────┤
         │           │ personal_... │◄──────────────┘
         │           │ travel_inf..│◄───────────────┐
         │           │ destination  │                │
         │           │ status       │                │
         │           │ completion..│                 │
         │           │ documents    │ ◄── NEW! Stores QR/PDF
         │           │ display_st..│ ◄── NEW! UI state
         │           │ last_updated │                │
         │           │ created_at   │                │
         │           └──────────────┘                │
         │                  │                        │
         │                  │ 1                      │
         │                  │                        │
         │                  │ *                      │
         │                  │                        │
         │           ┌──────▼──────────────┐         │
         │           │ digital_arrival_... │         │
         │           │─────────────────────│         │
         │           │ id (TEXT) PK        │         │
         │           │ entry_info_id FK ◄──┘ Direct link!
         │           │ user_id FK          │
         │           │ card_type           │ TDAC/MDAC/SDAC/HKDAC
         │           │ destination_id      │
         │           │ arr_card_no         │
         │           │ qr_uri              │
         │           │ pdf_url             │
         │           │ submitted_at        │
         │           │ submission_method   │
         │           │ status              │
         │           │ is_superseded       │
         │           │ superseded_at       │
         │           │ superseded_by       │
         │           │ version             │
         │           │ created_at          │
         │           │ updated_at          │
         │           └─────────────────────┘
         │
         │
         └───────────────┐
                         │
                         │ *
                         │
                  ┌──────▼──────────────┐
                  │ entry_info_fund_... │
                  │─────────────────────│
                  │ entry_info_id FK ├──┤
                  │ fund_item_id FK  ├──┤ PK
                  │ user_id FK          │
                  │ linked_at           │
                  └─────────────────────┘


┌─────────────────────────────────────────────────┐
│              LEGEND                             │
│                                                 │
│  PK  = Primary Key                              │
│  FK  = Foreign Key                              │
│  1   = One (relationship cardinality)           │
│  *   = Many (relationship cardinality)          │
│  ◄── = Reference direction                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Simplified Relationship: entry_info → digital_arrival_cards

### ❌ Old Design (With entry_packs):
```
entry_info (1) → entry_packs (*) → digital_arrival_cards (*)
               └─ documents        └─ TDAC submissions
               └─ display_status

3 tables, 2 joins to get DAC data
```

### ✅ New Design (Simplified):
```
entry_info (1) → digital_arrival_cards (*)
├─ documents (QR/PDF)
├─ display_status (UI)
└─ Direct link to DACs

2 tables, 1 join to get DAC data ✅
```

---

## Relationship Summary

### Users (1) → Passports (*)
- One user can have multiple passports
- Each passport belongs to one user
- One passport is marked as primary (`is_primary = 1`)
- **Trigger**: `ensure_one_primary_passport`

### Users (1) → Personal Info (*)
- One user can have MULTIPLE personal info records
- Each personal info record can optionally link to a specific passport
- Use cases: different addresses for different passports/countries
- One personal info is marked as default (`is_default = 1`)
- **Trigger**: `ensure_one_default_personal_info`

### Passports (1) → Personal Info (0..1)
- Each passport can optionally have a linked personal info record
- Personal info can exist without passport link (general use)
- When `passport_id` is set, this personal info is passport-specific
- **Foreign key**: ON DELETE SET NULL (preserve personal_info if passport deleted)

### Passports (1) → Passport Countries (*)
- One passport can be used to enter multiple countries
- Each entry tracks visa requirements and max stay duration

### Users (1) → Travel Info (*)
- One user can have multiple travel info records (different trips/destinations)
- Each travel info belongs to one user

### Users (1) → Fund Items (*)
- One user can have multiple fund items
- Each fund item belongs to one user

### Entry Info References:
- **Entry Info (1) → Passport (1)**: Each entry uses one passport
- **Entry Info (1) → Personal Info (1)**: Each entry references one personal info
- **Entry Info (1) → Travel Info (1)**: Each entry references one travel info

### Entry Info (*) ↔ Fund Items (*)
- Many-to-many relationship through `entry_info_fund_items` junction table
- One entry can reference multiple fund items
- One fund item can be used in multiple entries

### Entry Info (1) → Digital Arrival Cards (*) ✨ SIMPLIFIED
- **Direct relationship** (no entry_packs in between)
- One entry_info can have multiple DAC submissions
- Different card types: TDAC, MDAC, SDAC, HKDAC
- Latest successful submission for each type is NOT superseded
- Previous submissions are marked as `is_superseded = 1`
- **Trigger**: `mark_previous_dac_superseded`

---

## Data Flow Example

```
User creates entry for Thailand trip:

  1. User selects Passport (e.g., Chinese passport)
     └─ passport_id = 'passport_chn_123'

  2. System finds Personal Info:
     ├─ Option 1: Personal info linked to this passport (passport_id match)
     ├─ Option 2: Personal info for China (country_region = 'CHN')
     └─ Option 3: Default personal info (is_default = 1)
     └─ personal_info_id = 'personal_china_456'

  3. User creates Travel Info (flights, hotel)
     └─ travel_info_id = 'travel_th_789'

  4. User adds Fund Items (credit card, cash)
     └─ fund_item_ids = ['fund_1', 'fund_2']

  5. Entry Info is created linking all above
     ┌─────────────────────────────────┐
     │ entry_info                      │
     ├─────────────────────────────────┤
     │ id: 'entry_th_001'              │
     │ passport_id: 'passport_chn_123' │
     │ personal_info_id: 'personal_...'│
     │ travel_info_id: 'travel_th_789' │
     │ status: 'incomplete'            │
     │ completion_metrics: { ... }     │
     │ documents: null                 │ ◄── Empty until DAC submitted
     │ display_status: { ... }         │
     └─────────────────────────────────┘
     Status: 'incomplete' → 'ready'

  6. User submits TDAC (Digital Arrival Card)
     ┌─────────────────────────────────┐
     │ digital_arrival_cards           │
     ├─────────────────────────────────┤
     │ id: 'dac_tdac_001'              │
     │ entry_info_id: 'entry_th_001' ◄─┼── Direct link!
     │ card_type: 'TDAC'               │
     │ arr_card_no: 'TH123456789'      │
     │ qr_uri: 'qr_data_base64...'     │
     │ pdf_url: '/storage/tdac_001.pdf'│
     │ status: 'success'               │
     │ is_superseded: 0                │
     └─────────────────────────────────┘

     Entry Info Updated:
     ┌─────────────────────────────────┐
     │ entry_info                      │
     ├─────────────────────────────────┤
     │ status: 'submitted' ◄────────────── Updated!
     │ documents: {                    │ ◄── Updated!
     │   qrCodeImage: '/img/qr.png',   │
     │   pdfDocument: '/tdac_001.pdf'  │
     │ }                               │
     │ display_status: {               │
     │   showQR: true,              ◄──┼── Updated!
     │   ctaState: 'enabled'           │
     │ }                               │
     └─────────────────────────────────┘

  7. User edits info → Resubmits TDAC
     ┌─────────────────────────────────┐
     │ digital_arrival_cards (OLD)     │
     ├─────────────────────────────────┤
     │ id: 'dac_tdac_001'              │
     │ is_superseded: 1 ◄───────────────── Marked superseded!
     │ superseded_by: 'dac_tdac_002'   │
     └─────────────────────────────────┘

     ┌─────────────────────────────────┐
     │ digital_arrival_cards (NEW)     │
     ├─────────────────────────────────┤
     │ id: 'dac_tdac_002'              │
     │ entry_info_id: 'entry_th_001'   │
     │ arr_card_no: 'TH987654321' ◄─────── New number!
     │ is_superseded: 0                │
     └─────────────────────────────────┘

  8. User also travels to Malaysia → Submits MDAC
     ┌─────────────────────────────────┐
     │ digital_arrival_cards           │
     ├─────────────────────────────────┤
     │ id: 'dac_mdac_001'              │
     │ entry_info_id: 'entry_th_001' ◄─┼── Same entry_info!
     │ card_type: 'MDAC'               │
     │ arr_card_no: 'MY123456789'      │
     │ is_superseded: 0                │
     └─────────────────────────────────┘

     Now entry_info has 2 active DACs:
     - TDAC (Thailand): 'dac_tdac_002'
     - MDAC (Malaysia): 'dac_mdac_001'


Example: User with two passports and multiple personal info

  User (user_1)
  ├─ Chinese Passport (passport_chn)
  │  └─ Personal Info A (China address, +86 phone) [passport_id = passport_chn]
  │
  ├─ Hong Kong Passport (passport_hkg)
  │  └─ Personal Info B (HK address, +852 phone) [passport_id = passport_hkg]
  │
  └─ General Personal Info C [passport_id = NULL, is_default = 1]

  Entry Info 1 (Thailand trip with Chinese passport)
  ├─ passport_id: passport_chn
  ├─ personal_info_id: personal_info_A  ◄── Auto-selected (linked to passport)
  └─ digital_arrival_cards:
     └─ TDAC: arr_card_no = 'TH123'

  Entry Info 2 (Japan trip with HK passport)
  ├─ passport_id: passport_hkg
  ├─ personal_info_id: personal_info_B  ◄── Auto-selected (linked to passport)
  └─ digital_arrival_cards:
     └─ (Japan doesn't require DAC, so no submissions)
```

---

## Cascade Deletion Rules

- **Delete User** → Deletes all passports, personal_info, travel_info, fund_items, entry_info, digital_arrival_cards
- **Delete Passport** → Deletes passport_countries entries; Sets personal_info.passport_id to NULL
- **Delete Entry Info** → Deletes digital_arrival_cards (direct CASCADE)
- **Delete Fund Item** → Removes links in entry_info_fund_items junction table
- **Delete Personal Info** → Updates entry_info references to NULL (or RESTRICT)

---

## Query Examples

### Get Entry Info with All Latest DACs

```sql
-- Get entry info
SELECT * FROM entry_info WHERE id = 'entry_th_001';

-- Get all latest DACs (one per card type)
SELECT *
FROM digital_arrival_cards
WHERE entry_info_id = 'entry_th_001'
  AND is_superseded = 0
  AND status = 'success'
ORDER BY card_type;

-- Result:
-- card_type | arr_card_no   | qr_uri | submitted_at
-- TDAC      | TH987654321   | qr...  | 2025-10-22 10:30:00
-- MDAC      | MY123456789   | qr...  | 2025-10-22 11:00:00
```

### Get Complete Entry with Join

```sql
SELECT
  ei.*,
  p.passport_number,
  p.nationality,
  pi.home_address,
  pi.phone_number,
  ti.arrival_flight_number,
  ti.hotel_name,
  -- Latest TDAC
  tdac.arr_card_no as tdac_number,
  tdac.qr_uri as tdac_qr,
  -- Latest MDAC
  mdac.arr_card_no as mdac_number,
  mdac.qr_uri as mdac_qr
FROM entry_info ei
LEFT JOIN passports p ON ei.passport_id = p.id
LEFT JOIN personal_info pi ON ei.personal_info_id = pi.id
LEFT JOIN travel_info ti ON ei.travel_info_id = ti.id
LEFT JOIN digital_arrival_cards tdac ON (
  ei.id = tdac.entry_info_id
  AND tdac.card_type = 'TDAC'
  AND tdac.is_superseded = 0
  AND tdac.status = 'success'
)
LEFT JOIN digital_arrival_cards mdac ON (
  ei.id = mdac.entry_info_id
  AND mdac.card_type = 'MDAC'
  AND mdac.is_superseded = 0
  AND mdac.status = 'success'
)
WHERE ei.id = 'entry_th_001';
```

---

## Indexes for Performance

Key indexes are created on:

**Foreign keys** for join performance:
- `passports(user_id)`
- `personal_info(user_id, passport_id)`
- `travel_info(user_id)`
- `fund_items(user_id)`
- `entry_info(user_id, passport_id, personal_info_id, travel_info_id)`
- `digital_arrival_cards(entry_info_id)` ← **Direct link!**

**Composite indexes** for common query patterns:
- `personal_info(user_id, is_default)` - Find default personal info
- `personal_info(user_id, country_region)` - Find by country
- `personal_info(passport_id)` - Find passport-specific info
- `passports(user_id, is_primary)` - Find primary passport
- `entry_info(user_id, status)` - Filter entries by status
- `entry_info(user_id, destination_id)` - Find by destination
- `digital_arrival_cards(entry_info_id, card_type, is_superseded, status)` - Get latest DAC ← **Optimized!**

**Unique lookups**:
- `digital_arrival_cards(arr_card_no)` - QR code lookup
- `passport_countries(passport_id, country_code)` - Check visa requirements

---

## Comparison: Old vs New ERD

### Old Design (With entry_packs):
```
entry_info → entry_packs → digital_arrival_cards
           └─ (redundant)

To get TDAC:
1. Find entry_info
2. Find entry_pack
3. Get latest_tdac_id from entry_pack
4. Look up digital_arrival_card

= 3 table lookups
```

### New Design (Simplified):
```
entry_info → digital_arrival_cards
           └─ documents (in entry_info)

To get TDAC:
1. Find entry_info
2. Query digital_arrival_cards WHERE entry_info_id AND card_type='TDAC'

= 1 table + 1 query (indexed)
```

**Performance Improvement**: ~50% fewer table lookups ✅

---

## Summary

The simplified ERD shows:
- ✅ **Direct relationship** between entry_info and digital_arrival_cards
- ✅ **No intermediate table** (entry_packs removed)
- ✅ **Documents stored in entry_info** (QR codes, PDFs)
- ✅ **Clearer data flow** from user → entry_info → DACs
- ✅ **Simpler queries** with fewer joins
- ✅ **Better performance** with optimized indexes

**Total Tables**: 10 (down from 11)
- **Removed**: entry_packs
- **Simplified**: entry_info ↔ digital_arrival_cards

This design is **cleaner, faster, and easier to understand**! 🚀
