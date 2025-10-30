# Country Configuration Template

**Quick-start template for adding new countries to TripSecretary**

This template provides a ready-to-use scaffold for implementing a new country destination. Simply copy these files, replace the placeholders, and fill in the TODOs.

---

## Quick Start (5 Minutes)

### Step 1: Copy the Template

```bash
# From project root
cp -r docs/templates/country-template app/config/destinations/<your-country-code>

# Example for Vietnam:
cp -r docs/templates/country-template app/config/destinations/vn
```

### Step 2: Run the Setup Script

We've created a simple find-and-replace script to speed up placeholder replacement:

```bash
# Run from project root
./scripts/setup-country.sh <country-code> "<Country Name>"

# Example:
./scripts/setup-country.sh vn "Vietnam"
```

Or manually replace placeholders:

| Placeholder | Replace With | Example |
|-------------|--------------|---------|
| `[COUNTRY_CODE_LOWER]` | 2-letter lowercase code | `vn` |
| `[COUNTRY_CODE_UPPER]` | 2-letter uppercase code | `VN` |
| `[COUNTRY_CODE_3LETTER]` | 3-letter uppercase code | `VNM` |
| `[COUNTRY_NAME]` | Country name in English | `Vietnam` |
| `[国家名称]` | Country name in Chinese | `越南` |
| `[CURRENCY_CODE]` | ISO currency code | `VND` |
| `[SYMBOL]` | Currency symbol | `₫` |

### Step 3: Fill in the TODOs

Each template file contains `TODO` comments marking sections that need your input:

```javascript
// TODO: Replace with actual value
currency: {
  code: 'VND',              // ← Replace placeholder
  symbol: '₫',              // ← Replace placeholder
  exchangeRateUSD: 24000    // ← Update with current rate
}
```

---

## Template Files Included

### `metadata.js` (Core Information)
- Country identifiers (ID, code, name)
- Currency configuration
- Timezone and geography
- Language settings
- Digital arrival card info (if applicable)
- Status and availability flags

**Time to complete:** 15-30 minutes

---

### `financialInfo.js` (Financial Guidance)
- ATM fees and limits
- Cash recommendations
- Banking information
- Currency exchange tips
- Typical costs and budgets
- Tipping culture

**Time to complete:** 30-45 minutes

---

### `emergencyInfo.js` (Emergency Contacts)
- Emergency numbers (police, ambulance, fire)
- Tourist police contacts
- Chinese embassy/consulate information
- Hospitals with English/Chinese support
- 24-hour pharmacies
- Safety tips and common scams

**Time to complete:** 30-45 minutes

⚠️ **CRITICAL**: Emergency information must be accurate and current!

---

### `index.js` (Main Configuration)
- Aggregates all config modules
- Service mappings
- Screen mappings
- Feature flags
- Entry requirements
- Metadata

**Time to complete:** 15-30 minutes

---

## Optional Files (For Digital Arrival Card)

If the country has a digital arrival card system, you'll also need:

### `accommodationTypes.js`
Template location: `docs/templates/advanced/accommodationTypes.js`

Maps accommodation types to digital arrival card codes:
```javascript
export const ACCOMMODATION_TYPES = {
  HOTEL: {
    key: 'HOTEL',
    displayEn: 'Hotel',
    displayZh: '酒店',
    aliases: ['HOTEL', '酒店', 'KHÁCH SẠN']
  },
  // ... more types
};
```

**Reference:** See `app/config/destinations/thailand/accommodationTypes.js`

---

### `travelPurposes.js`
Template location: `docs/templates/advanced/travelPurposes.js`

Maps travel purposes to digital arrival card codes:
```javascript
export const TRAVEL_PURPOSES = {
  TOURISM: {
    key: 'TOURISM',
    displayEn: 'Tourism',
    displayZh: '旅游',
    aliases: ['TOURISM', '旅游', 'DU LỊCH']
  },
  // ... more purposes
};
```

**Reference:** See `app/config/destinations/thailand/travelPurposes.js`

---

### `validationRules.js`
Template location: `docs/templates/advanced/validationRules.js`

Defines field validation rules using the validation engine:
```javascript
export const VALIDATION_RULES = {
  passportNo: {
    ruleType: 'alphanumeric',
    required: true,
    minLength: 6,
    maxLength: 12
  },
  // ... more rules
};
```

**Reference:** See `app/config/destinations/thailand/validationRules.js`

---

## After Completing the Configuration

### 1. Register the Country

Add your country to the central registry:

```javascript
// app/config/destinations/index.js
import vietnam from './vietnam';  // Add import

export const DESTINATIONS = {
  th: thailand,
  vn: vietnam,  // Add entry
};
```

### 2. Create UI Screens (if needed)

See `docs/ADDING_NEW_COUNTRY.md` Section 10 for details on creating screens.

### 3. Test Everything

Use the testing checklist in `docs/ADDING_NEW_COUNTRY.md` Section 13.

### 4. Update Status Flags

When ready for production:

```javascript
// metadata.js
enabled: true,  // Make visible to users
beta: false,    // Remove beta tag
```

---

## Placeholder Reference

### Country Codes
- `[COUNTRY_CODE_LOWER]`: 2-letter lowercase (e.g., `vn`, `my`, `sg`)
- `[COUNTRY_CODE_UPPER]`: 2-letter uppercase (e.g., `VN`, `MY`, `SG`)
- `[COUNTRY_CODE_3LETTER]`: 3-letter uppercase (e.g., `VNM`, `MYS`, `SGP`)

Find codes at: https://en.wikipedia.org/wiki/ISO_3166-1

### Names
- `[COUNTRY_NAME]`: English name (e.g., `Vietnam`)
- `[国家名称]`: Chinese name (e.g., `越南`)
- `[ประเทศ]`: Thai name (optional)

### Currency
- `[CURRENCY_CODE]`: ISO 4217 code (e.g., `VND`, `MYR`, `SGD`)
- `[SYMBOL]`: Currency symbol (e.g., `₫`, `RM`, `$`)

Find codes at: https://en.wikipedia.org/wiki/ISO_4217

### Geography
- `[Capital City]`: Capital city name
- `[Major City]`: Major tourist destination names

### Contact Info
- `[COUNTRY_CODE]`: Phone country code (e.g., `84` for Vietnam)
- `[AREA]`: Area/city code
- `[NUMBER]`: Phone number

---

## Tips for Faster Completion

### 1. Research Efficiently

**Best Sources:**
- Official government tourism websites
- Chinese embassy website for the country
- Wikitravel / Wikivoyage
- Expat forums and blogs
- Travel guidebooks (Lonely Planet, etc.)

### 2. Prioritize Accuracy

**Critical information** (verify multiple sources):
- Emergency numbers
- Embassy contacts
- Hospital information
- Visa requirements

**Lower priority** (can be approximate):
- Typical costs
- Exchange rates
- ATM fees

### 3. Use Thailand as Reference

When unsure about formatting or structure, reference Thailand:
- `app/config/destinations/thailand/`

### 4. Leave TODOs for Later

It's okay to leave some TODOs incomplete initially:
- Set `enabled: false` in metadata
- Fill in critical information first
- Complete nice-to-have details later
- Update regularly as you learn more

---

## Common Mistakes to Avoid

### ❌ Don't:
- Leave placeholder text in production (e.g., `[COUNTRY_NAME]`)
- Set `enabled: true` before thorough testing
- Copy-paste phone numbers without verification
- Use outdated visa information
- Forget to update `lastUpdated` date

### ✅ Do:
- Verify all phone numbers with multiple sources
- Test validation rules with real data
- Keep emergency info current
- Document your information sources
- Use proper ISO codes (country, currency, language)

---

## Need Help?

1. **Full implementation guide**: See `docs/ADDING_NEW_COUNTRY.md`
2. **Thailand reference**: Browse `app/config/destinations/thailand/`
3. **Validation engine**: See `app/utils/validation/ValidationRuleEngine.js`
4. **Architecture overview**: See `docs/THAI_CODE_REVIEW.md`

---

## Checklist: Template Completion

Use this checklist to track your progress:

### Configuration Files
- [ ] Copy template to `app/config/destinations/<code>/`
- [ ] Replace all `[PLACEHOLDERS]`
- [ ] Complete `metadata.js` TODOs
- [ ] Complete `financialInfo.js` TODOs
- [ ] Complete `emergencyInfo.js` TODOs
- [ ] Complete `index.js` TODOs
- [ ] Set `enabled: false` during development

### Optional Files (if digital arrival card)
- [ ] Create `accommodationTypes.js`
- [ ] Create `travelPurposes.js`
- [ ] Create `validationRules.js`

### Integration
- [ ] Register country in `app/config/destinations/index.js`
- [ ] Create UI screens (if needed)
- [ ] Add navigation routes
- [ ] Update home screen

### Verification
- [ ] Verify all emergency contacts
- [ ] Verify embassy information
- [ ] Test all phone numbers
- [ ] Check visa requirements
- [ ] Validate all links/URLs
- [ ] Test validation rules

### Documentation
- [ ] Document data sources
- [ ] Add maintainer information
- [ ] Update `lastUpdated` date
- [ ] Note any country-specific quirks

### Final Steps
- [ ] Complete all TODO items
- [ ] Remove template README from country folder
- [ ] Set `enabled: true` when ready
- [ ] Set `beta: false` when stable

---

**Last Updated:** 2025-01-30
**Template Version:** 1.0
