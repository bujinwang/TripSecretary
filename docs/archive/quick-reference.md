# Database Schema v2.0 - Quick Reference

**Version**: 2.0 (Simplified - Final)
**Date**: 2025-10-22

---

## 📊 Table Count

| Category | Tables | Notes |
|----------|--------|-------|
| **Core** | 6 | users, passports, passport_countries, personal_info, travel_info, fund_items |
| **Entry** | 2 | entry_info, digital_arrival_cards |
| **Junction** | 1 | entry_info_fund_items |
| **Legacy** | 1 | generations |
| **TOTAL** | **10** | **Simplified from 11** (removed entry_packs) |

---

## 🔗 Key Relationships

```
users
├── passports (1:*)
│   ├── passport_countries (1:*)
│   └── personal_info (1:0..1) optional link
├── personal_info (1:*) multiple per user
├── travel_info (1:*)
└── fund_items (1:*)

entry_info
├── passport (1:1)
├── personal_info (1:1)
├── travel_info (1:1)
├── fund_items (*:*) via junction
└── digital_arrival_cards (1:*) ✨ DIRECT LINK
```

---

## 🎯 Simplified Design

### ❌ Removed Table:
- **entry_packs** (redundant, merged into entry_info)

### ✅ What Changed:

| Feature | Old Location | New Location |
|---------|-------------|--------------|
| Documents (QR/PDF) | entry_packs.documents | **entry_info.documents** |
| Display Status | entry_packs.display_status | **entry_info.display_status** |
| DAC Link | entry_info → entry_packs → DACs | **entry_info → DACs** (direct) |
| Latest DAC | entry_packs.latest_tdac_id | **Query from digital_arrival_cards** |

---

## 📝 Core Tables

### users (unchanged)
```sql
id (INT) PK - WeChat compatibility
wechat_openid, phone, name, avatar_url
```

### passports
```sql
id (TEXT) PK
user_id (INT) FK
passport_number, full_name, nationality, gender
date_of_birth, expiry_date, issue_date, issue_place
photo_uri
is_primary (INT) ✨ NEW - Only one per user
```

### passport_countries ✨ NEW
```sql
passport_id (TEXT) FK } PK (composite)
country_code (TEXT)   }
visa_required (INT), max_stay_days (INT)
notes (TEXT)
```

### personal_info
```sql
id (TEXT) PK
user_id (INT) FK
passport_id (TEXT) FK ✨ NULLABLE - Optional link
phone_number, email, home_address
country_region, province_city
occupation, phone_code, gender
is_default (INT) ✨ NEW - Only one per user
label (TEXT) ✨ NEW - e.g., "China", "Hong Kong"
```

### travel_info
```sql
id (TEXT) PK
user_id (INT) FK
destination, travel_purpose
arrival_flight_number, arrival_departure_date, ...
departure_flight_number, departure_departure_date, ...
hotel_name, hotel_address, accommodation_type, ...
status (draft/completed)
```

### fund_items
```sql
id (TEXT) PK
user_id (INT) FK
type, amount, currency, details
photo_uri
```

---

## 📥 Entry Management Tables

### entry_info (UPDATED)
```sql
id (TEXT) PK
user_id (INT) FK
passport_id (TEXT) FK
personal_info_id (TEXT) FK
travel_info_id (TEXT) FK
destination_id (TEXT) - Country code for fast filtering

status (TEXT) ✨ incomplete/ready/submitted/superseded/completed/expired/archived
completion_metrics (JSON)
documents (JSON) ✨ NEW - {qrCodeImage, pdfDocument, ...}
display_status (JSON) ✨ NEW - {completionPercent, ctaState, showQR, ...}

last_updated_at, created_at
```

### digital_arrival_cards
```sql
id (TEXT) PK
entry_info_id (TEXT) FK ✨ Direct link (was entry_pack_id)
user_id (INT) FK

card_type (TEXT) - 'TDAC', 'MDAC', 'SDAC', 'HKDAC'
destination_id, arr_card_no, qr_uri, pdf_url

submitted_at, submission_method, status
is_superseded (INT), superseded_at, superseded_by
version (INT)

created_at, updated_at
```

### entry_info_fund_items (junction)
```sql
entry_info_id (TEXT) FK } PK (composite)
fund_item_id (TEXT) FK  }
user_id (INT) FK
linked_at
```

---

## 🔧 Database Triggers

### 1. ensure_one_primary_passport
```sql
BEFORE UPDATE/INSERT ON passports
WHEN NEW.is_primary = 1
BEGIN
  UPDATE passports SET is_primary = 0
  WHERE user_id = NEW.user_id AND id != NEW.id;
END;
```

### 2. ensure_one_default_personal_info
```sql
BEFORE UPDATE/INSERT ON personal_info
WHEN NEW.is_default = 1
BEGIN
  UPDATE personal_info SET is_default = 0
  WHERE user_id = NEW.user_id AND id != NEW.id;
END;
```

### 3. mark_previous_dac_superseded
```sql
AFTER INSERT ON digital_arrival_cards
WHEN NEW.status = 'success' AND NEW.is_superseded = 0
BEGIN
  UPDATE digital_arrival_cards
  SET is_superseded = 1, superseded_by = NEW.id
  WHERE entry_info_id = NEW.entry_info_id
    AND card_type = NEW.card_type
    AND id != NEW.id
    AND is_superseded = 0;
END;
```

---

## 🔍 Common Queries

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

### Get All Latest DACs (One Per Type)
```sql
SELECT card_type, arr_card_no, qr_uri, submitted_at
FROM digital_arrival_cards
WHERE entry_info_id = ?
  AND is_superseded = 0
  AND status = 'success'
GROUP BY card_type
ORDER BY card_type;
```

### Get Entry with Complete Data
```sql
SELECT
  ei.*,
  p.passport_number,
  pi.home_address,
  ti.hotel_name,
  GROUP_CONCAT(fi.type) as fund_types
FROM entry_info ei
LEFT JOIN passports p ON ei.passport_id = p.id
LEFT JOIN personal_info pi ON ei.personal_info_id = pi.id
LEFT JOIN travel_info ti ON ei.travel_info_id = ti.id
LEFT JOIN entry_info_fund_items eifi ON ei.id = eifi.entry_info_id
LEFT JOIN fund_items fi ON eifi.fund_item_id = fi.id
WHERE ei.id = ?
GROUP BY ei.id;
```

### Get Primary Passport
```sql
SELECT * FROM passports
WHERE user_id = ? AND is_primary = 1;
```

### Get Default Personal Info
```sql
SELECT * FROM personal_info
WHERE user_id = ? AND is_default = 1;
```

### Get Personal Info for Passport
```sql
SELECT * FROM personal_info
WHERE passport_id = ?;
```

### Get Countries for Passport
```sql
SELECT pc.*, pc.visa_required, pc.max_stay_days
FROM passport_countries pc
WHERE pc.passport_id = ?
ORDER BY pc.country_code;
```

---

## 🎨 Status Flow

### entry_info.status
```
incomplete → ready → submitted → {superseded, completed, expired, archived}
            ↑________________________↓
              (user edits after submit)
```

- **incomplete**: Filling out form (< 100% complete)
- **ready**: All fields complete, ready to submit DAC
- **submitted**: DAC successfully submitted
- **superseded**: User edited after submission, needs resubmit
- **completed**: User passed immigration successfully
- **expired**: Trip date passed
- **archived**: Manually archived by user

---

## 📦 Files Location

```
cloudflare-backend/src/db/
├── schema-v2.sql ✅ Main schema (apply this)
└── seed-passport-countries.sql ✅ Seed data

docs/
├── FINAL-schema-v2.md ✅ Final design summary
├── database-erd-simplified.md ✅ ERD diagram
├── simplified-schema-design.md ✅ Why entry_packs removed
├── quick-reference.md ✅ This file
└── (other documentation files)
```

---

## ✨ Key Features

1. ✅ **Multiple Personal Info** - Different addresses per passport/country
2. ✅ **Primary Passport** - Auto-enforced via trigger
3. ✅ **Passport Countries** - Pre-populated visa requirements
4. ✅ **Generic DACs** - TDAC, MDAC, SDAC, HK DAC in one table
5. ✅ **Auto-Superseding** - Old DACs marked automatically
6. ✅ **Direct Link** - entry_info → digital_arrival_cards (no middle table)
7. ✅ **Smart Selection** - Auto-select appropriate personal_info

---

## 🚀 Quick Start

```bash
# 1. Apply schema
sqlite3 tripsecretary.db < cloudflare-backend/src/db/schema-v2.sql

# 2. Apply seed data
sqlite3 tripsecretary.db < cloudflare-backend/src/db/seed-passport-countries.sql

# 3. Verify
sqlite3 tripsecretary.db ".tables"
sqlite3 tripsecretary.db "SELECT COUNT(*) FROM passport_countries;"

# 4. Check triggers
sqlite3 tripsecretary.db "SELECT name FROM sqlite_master WHERE type='trigger';"
```

---

## 📊 Comparison Summary

| Aspect | Old Design | New Design |
|--------|-----------|------------|
| **Tables** | 11 | 10 ✅ |
| **Entry → DAC** | 2 joins (via entry_packs) | 1 join ✅ |
| **Documents** | entry_packs.documents | entry_info.documents ✅ |
| **Display State** | entry_packs.display_status | entry_info.display_status ✅ |
| **Latest DAC** | entry_packs.latest_tdac_id | Query (indexed) ✅ |
| **Complexity** | Higher | Lower ✅ |
| **Performance** | Slower (more joins) | Faster ✅ |

---

## 💡 Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| User ID Type | INTEGER | WeChat OpenID compatibility |
| Other IDs | TEXT | Application uses TEXT IDs |
| Personal Info | Multiple per user | Passport/country-specific addresses |
| Travel Info | One-to-one | Each entry has unique travel details |
| Data Migration | Start fresh | Clean slate, no migration needed |
| Passport Countries | Pre-populate | Better UX, immediate availability |
| **Entry Packs** | **Removed** | **Redundant, merged into entry_info** ✅ |

---

## 📚 Documentation Index

- **`FINAL-schema-v2.md`** - Complete final design
- **`database-erd-simplified.md`** - Visual ERD with examples
- **`simplified-schema-design.md`** - Analysis of simplification
- **`quick-reference.md`** - This file (quick lookup)
- **`implementation-guide.md`** - Step-by-step implementation
- **`database-schema-proposal.md`** - Original detailed proposal
- **`schema-comparison.md`** - Current vs proposed comparison
- **`personal-info-design.md`** - Personal info deep dive

---

**Ready to implement!** 🎉

Start here: Apply `schema-v2.sql` → Seed `passport-countries.sql` → Update code
