# Phase 3 - PassportSection Migration Plan

## 📊 Current Analysis

### File Structure
- **Component**: `app/components/thailand/sections/PassportSection.js` (271 lines)
- **Sections**: 1 collapsible section with 8 input fields

### Current Components Used
1. ✅ **CollapsibleSection** (Thailand-specific) → Can replace with Tamagui version
2. ⚠️ **InputWithValidation** (2 fields: passportNo, visaNumber) → Can replace with BaseInput
3. ⏸️ **PassportNameInput** (complex 3-field component) → Keep for now
4. ⏸️ **NationalitySelector** (dropdown with countries) → Keep for now
5. ⏸️ **DateTimeInput** (2 fields: dob, expiryDate) → Keep for now
6. ⏸️ **GenderSelector** (radio buttons) → Keep for now
7. ✅ **Section Intro Box** (styled View) → Replace with BaseCard

---

## 🎯 Migration Strategy

### ✅ Phase 3A: Replace Structural Components
**What**: Replace layout and container components
**Risk**: Low - No business logic changes

Components to replace:
1. CollapsibleSection (Thailand) → CollapsibleSection (Tamagui)
2. Section intro View → BaseCard
3. View containers → YStack/XStack

### ⚠️ Phase 3B: Replace Simple Inputs
**What**: Replace InputWithValidation with BaseInput (where simple)
**Risk**: Medium - Need to preserve validation logic

Fields to replace:
- Passport Number (passportNo)
- Visa Number (visaNumber) - optional field

### ⏸️ Phase 3C: Keep Complex Components (Future)
**What**: Keep specialized inputs unchanged
**Risk**: None - no changes

Fields to keep:
- PassportNameInput (3 fields with complex parsing)
- NationalitySelector (dropdown with 200+ countries)
- DateTimeInput (date picker with validation)
- GenderSelector (custom radio button group)

**Reason**: These have complex logic and will be migrated in future phases

---

## 📋 Detailed Migration Steps

### Step 1: Replace CollapsibleSection

**Before**:
```javascript
import { CollapsibleSection } from '../ThailandTravelComponents';

<CollapsibleSection
  title={t('thailand.travelInfo.sectionTitles.passport')}
  subtitle={t('thailand.travelInfo.sectionTitles.passportSubtitle')}
  isExpanded={isExpanded}
  onToggle={onToggle}
  fieldCount={fieldCount}
>
  {/* content */}
</CollapsibleSection>
```

**After**:
```javascript
import { CollapsibleSection } from '../../tamagui';

<CollapsibleSection
  title={t('thailand.travelInfo.sectionTitles.passport')}
  subtitle={t('thailand.travelInfo.sectionTitles.passportSubtitle')}
  icon="📘"
  badge={`${fieldCount.filled}/${fieldCount.total}`}
  badgeVariant={fieldCount.filled === fieldCount.total ? 'success' : 'warning'}
  expanded={isExpanded}
  onToggle={() => onToggle()}
>
  {/* content */}
</CollapsibleSection>
```

**Changes**:
- Import from shared tamagui library
- Add icon prop (📘 for passport)
- Convert fieldCount to badge string
- Use badgeVariant for visual feedback
- Change `isExpanded` → `expanded`

---

### Step 2: Replace Section Intro Box

**Before**:
```javascript
<View style={styles.sectionIntro}>
  <Text style={styles.sectionIntroIcon}>🛂</Text>
  <Text style={styles.sectionIntroText}>
    {t('thailand.travelInfo.sectionIntros.passport')}
  </Text>
</View>
```

**After**:
```javascript
<BaseCard variant="flat" padding="md" backgroundColor="#F0F7FF">
  <XStack gap="$sm" alignItems="flex-start">
    <TamaguiText fontSize={20}>🛂</TamaguiText>
    <TamaguiText fontSize="$2" color="$textSecondary" flex={1}>
      {t('thailand.travelInfo.sectionIntros.passport')}
    </TamaguiText>
  </XStack>
</BaseCard>
```

**Changes**:
- Replace View with BaseCard
- Use XStack for horizontal layout
- Design tokens for spacing and colors
- Semantic gap instead of margins

---

### Step 3: Replace InputWithValidation (Passport Number)

**Before**:
```javascript
<InputWithValidation
  label={t('thailand.travelInfo.fields.passportNo.label')}
  value={passportNo}
  onChangeText={setPassportNo}
  onBlur={() => handleFieldBlur('passportNo', passportNo)}
  helpText={t('thailand.travelInfo.fields.passportNo.help')}
  error={!!errors.passportNo}
  errorMessage={errors.passportNo}
  warning={!!warnings.passportNo}
  warningMessage={warnings.passportNo}
  required={true}
  autoCapitalize="characters"
/>
```

**After**:
```javascript
<BaseInput
  label={t('thailand.travelInfo.fields.passportNo.label')}
  value={passportNo}
  onChangeText={setPassportNo}
  onBlur={() => handleFieldBlur('passportNo', passportNo)}
  helperText={t('thailand.travelInfo.fields.passportNo.help')}
  error={errors.passportNo}
  success={warnings.passportNo && !errors.passportNo ? undefined : undefined}
  required={true}
  autoCapitalize="characters"
/>
{warnings.passportNo && !errors.passportNo && (
  <TamaguiText fontSize="$1" color="$warning" marginTop="$xs">
    ⚠️ {warnings.passportNo}
  </TamaguiText>
)}
```

**Changes**:
- Replace InputWithValidation with BaseInput
- Convert error boolean → error message string
- Move warning to separate text below (since BaseInput doesn't have warning prop)
- Use design tokens

---

### Step 4: Update Layout Containers

**Before**:
```javascript
<View style={styles.inputWithValidationContainer}>
  <View style={styles.inputLabelContainer}>
    <Text style={styles.inputLabel}>Label</Text>
    <FieldWarningIcon hasWarning={!!warnings.x} hasError={!!errors.x} />
  </View>
  <Component />
</View>
```

**After**:
```javascript
<YStack gap="$sm" marginBottom="$md">
  <Component />
</YStack>
```

**Changes**:
- Replace View with YStack
- Use gap for spacing
- Remove manual label containers (BaseInput handles labels)
- FieldWarningIcon no longer needed (BaseInput shows errors)

---

## 📈 Expected Results

### Code Reduction
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Lines | 271 | ~200 | **26% reduction** |
| StyleSheet definitions | ~80 | ~30 | **63% reduction** |
| Layout components | View, View, View | YStack, XStack | **Semantic** |
| Tamagui components | 0 | 5+ | ✅ |

### Components Replaced
- ✅ CollapsibleSection: Thailand → Tamagui
- ✅ Section intro: View → BaseCard
- ✅ InputWithValidation (2 fields) → BaseInput
- ✅ Layout: View → YStack/XStack

### Components Kept (Unchanged)
- ⏸️ PassportNameInput (complex 3-field input)
- ⏸️ NationalitySelector (country dropdown)
- ⏸️ DateTimeInput (date picker)
- ⏸️ GenderSelector (radio buttons)

---

## 🚫 Out of Scope

These will be handled in future phases:

**Phase 4-6**: Create wrapper components for complex inputs
- PassportNameInput wrapper
- NationalitySelector wrapper
- DateTimeInput wrapper
- GenderSelector wrapper

**Phase 7**: Migrate remaining sections
- PersonalInfoSection
- FundsSection
- TravelDetailsSection

---

## ✅ Success Criteria

Phase 3 is complete when:

1. ✅ CollapsibleSection uses Tamagui version with icon + badge
2. ✅ Section intro uses BaseCard
3. ✅ Passport/Visa inputs use BaseInput
4. ✅ Layout uses YStack/XStack with design tokens
5. ✅ All validation/saving logic preserved
6. ✅ Code compiles without errors
7. ✅ ~26% code reduction achieved
8. ✅ Manual testing passes
9. ✅ Committed & pushed

---

## 🚀 Implementation Plan

### Step-by-Step
1. ✅ Create backup of PassportSection.js
2. ✅ Update imports (add Tamagui components)
3. ✅ Replace CollapsibleSection
4. ✅ Replace section intro with BaseCard
5. ✅ Replace passportNo input with BaseInput
6. ✅ Replace visaNumber input with BaseInput
7. ✅ Update layout containers to YStack/XStack
8. ✅ Remove unused StyleSheet definitions
9. ✅ Test syntax compilation
10. ✅ Commit changes

---

**Ready to begin Phase 3 migration!** 🎉
