# Thailand i18n Implementation Plan

## Summary

This document outlines the comprehensive i18n implementation for Thailand screens and components. The implementation involves:

1. Adding missing translation keys to `app/i18n/locales.js`
2. Updating all Thailand screens to use the `t()` function
3. Internationalizing constants and options
4. Testing across all supported languages

## Current State

### Already Has i18n (Partial)
- `ThailandTravelInfoScreen` - Uses some i18n but has many hardcoded strings
- `app/i18n/locales.js` - Has basic Thailand translations but missing many keys

### Needs Full i18n Implementation
- `TDACSelectionScreen` - 100% hardcoded Chinese
- `ThailandEntryQuestionsScreen` - 100% hardcoded Chinese
- `PassportSection` - 100% hardcoded Chinese
- `PersonalInfoSection` - 100% hardcoded Chinese
- `FundsSection` - Partial i18n
- `TravelDetailsSection` - Partial i18n
- `constants.js` - Occupation and accommodation options need i18n

## Translation Keys to Add

### Location in locales.js
Insert before line 1434 (end of `thailand` section in English translations)

### New Keys Needed

```javascript
// In en.thailand (after existing travelInfo section)
{
  selection: { ... },              // TDACSelectionScreen
  entryQuestions: { ... },         // ThailandEntryQuestionsScreen
  travelInfo: {
    sectionIntros: { ... },        // Section introduction texts
    saveStatus: { ... },           // Save status indicators
    progress: { ... },             // Progress and encouragement
    sectionTitles: { ... },        // Enhanced section titles
    funds: { ... },                // Funds section
    buttons: { ... }               // Action buttons
  },
  occupations: { ... },            // Occupation translations
  travelPurposes: { ... },         // Travel purpose translations
  accommodationTypes: { ... },     // Accommodation type translations
  hybrid: { ... },                 // TDACHybridScreen
  validation: { ... }              // Common validation messages
}
```

## Implementation Steps

### Step 1: Add Translations to locales.js ✅ DESIGNED
- Created `thailand-i18n-additions.js` with all translations
- Includes English (en) and Chinese Simplified (zh-CN) translations
- Traditional Chinese (zh-TW) can be auto-generated using chineseConverter

### Step 2: Update TDACSelectionScreen
**File**: `app/screens/thailand/TDACSelectionScreen.js`

**Changes needed**:
```javascript
// Import useLocale
import { useLocale } from '../../i18n/LocaleContext';

// In component
const { t } = useLocale();

// Replace hardcoded strings:
'选择提交方式' → t('thailand.selection.heroTitle')
'快速完成泰国入境卡' → t('thailand.selection.heroSubtitle')
'返回' → t('thailand.selection.backButton')
'推荐选择' → t('thailand.selection.lightning.badge')
... etc
```

**Estimated changes**: ~50 string replacements

### Step 3: Update ThailandEntryQuestionsScreen
**File**: `app/screens/thailand/ThailandEntryQuestionsScreen.js`

**Note**: Already imports `useTranslation` but doesn't use it!

**Changes needed**:
```javascript
// Component already has: const { t } = useTranslation();
// Just need to replace hardcoded strings:

'入境问题' → t('thailand.entryQuestions.topBarTitle')
'语言 / Language:' → t('thailand.entryQuestions.languageSelector.label')
'中文' → t('thailand.entryQuestions.languageSelector.zh')
... etc
```

**Estimated changes**: ~40 string replacements

### Step 4: Update PassportSection
**File**: `app/components/thailand/sections/PassportSection.js`

**Changes needed**:
```javascript
// Component already receives `t` as prop
// Replace hardcoded strings:

'👤 护照信息' → t('thailand.travelInfo.sectionTitles.passport')
'泰国海关需要核实你的身份' → t('thailand.travelInfo.sectionTitles.passportSubtitle')
'护照上的姓名' → t('thailand.travelInfo.fields.passportName.label')
'填写护照上显示的英文姓名...' → t('thailand.travelInfo.fields.passportName.help')
... etc
```

**Estimated changes**: ~30 string replacements

### Step 5: Update PersonalInfoSection
**File**: `app/components/thailand/sections/PersonalInfoSection.js`

**Estimated changes**: ~25 string replacements

### Step 6: Update TravelDetailsSection
**File**: `app/components/thailand/sections/TravelDetailsSection.js`

**Estimated changes**: ~35 string replacements

### Step 7: Internationalize Constants
**File**: `app/screens/thailand/constants.js`

**Current Issue**:
```javascript
export const OCCUPATION_OPTIONS = [
  { value: 'SOFTWARE ENGINEER', label: '软件工程师', icon: '💻' },
  ...
];
```

**Solution**: Create a function that returns translated options:
```javascript
export const getOccupationOptions = (t) => [
  {
    value: 'SOFTWARE ENGINEER',
    label: t('thailand.occupations.SOFTWARE_ENGINEER'),
    icon: '💻'
  },
  ...
];
```

**Files to update that use these constants**:
- `PersonalInfoSection.js`
- `TravelDetailsSection.js`
- `ThailandTravelInfoScreen.js`

### Step 8: Update ThailandTravelInfoScreen
**File**: `app/screens/thailand/ThailandTravelInfoScreen.js`

**Current State**: Already uses some i18n, but has many hardcoded strings

**Changes needed**:
- Lines 246, 260, 266: Save status messages
- Lines 299-315: Progress indicators and encouragement hints
- Lines 542-564: Completion hints
- And various other hardcoded strings

**Estimated changes**: ~40 string replacements

## File Modification Strategy

### For locales.js
Due to its large size (67k tokens), I recommend:

1. **Option A - Manual merge** (Safest):
   - Use the `thailand-i18n-additions.js` file as reference
   - Manually add keys to the appropriate sections in locales.js
   - For English: Add to `en.thailand` section (before line 1434)
   - For Chinese: Add to `zh-CN.thailand` section (around line 3317)

2. **Option B - Script merge** (Faster):
   - Create a Node.js script to merge the additions
   - Validate structure after merge
   - Test thoroughly

### For Screen Files
Can be done incrementally:
1. Start with TDACSelectionScreen (most hardcoded)
2. Then ThailandEntryQuestionsScreen
3. Then component files (PassportSection, etc.)
4. Finally update constants and consuming files

## Testing Strategy

### After Each Screen Update
1. Run the app and navigate to the modified screen
2. Test with English language setting
3. Test with Chinese (Simplified) setting
4. Test with Chinese (Traditional) setting
5. Verify all text displays correctly
6. Check for missing keys (will show as key path if not found)

### Complete Testing
1. Full flow test: Home → Thailand → Travel Info → Selection → Questions
2. Language switching test while on each screen
3. Check all dynamic text (dates, names, etc.) with interpolation
4. Verify fallback behavior for missing keys

## Priority Order

### High Priority (User-facing screens)
1. TDACSelectionScreen - User makes critical decision here
2. ThailandEntryQuestionsScreen - User shows to immigration
3. ThailandTravelInfoScreen - Main data entry screen

### Medium Priority (Components)
4. PassportSection - Part of main flow
5. TravelDetailsSection - Part of main flow
6. PersonalInfoSection - Part of main flow

### Lower Priority (Internal)
7. Constants file - Used by above components
8. Other minor components

## Risk Assessment

### Low Risk
- Adding new translation keys to locales.js (won't break existing code)
- Updating screens that already import `t` function

### Medium Risk
- Updating constants to be functions (need to update all consumers)
- Large screens with many replacements (easy to miss some)

### Mitigation
- Do one screen at a time
- Test after each change
- Keep old code commented out initially
- Have rollback plan (git)

## Next Steps

1. ✅ Review this plan
2. ⏳ Merge translations into locales.js
3. ⏳ Update TDACSelectionScreen
4. ⏳ Update ThailandEntryQuestionsScreen
5. ⏳ Update section components
6. ⏳ Update constants
7. ⏳ Full testing across languages

## Files Reference

- Translation additions: `/Users/bujin/Documents/Projects/TripSecretary/thailand-i18n-additions.js`
- Main locales file: `/Users/bujin/Documents/Projects/TripSecretary/app/i18n/locales.js`
- Thailand screens: `/Users/bujin/Documents/Projects/TripSecretary/app/screens/thailand/`
- Thailand components: `/Users/bujin/Documents/Projects/TripSecretary/app/components/thailand/`
