# Phase 2 - Thailand Travel Info Screen Migration Plan

## 📊 Current Analysis

### File Structure
- **Main Screen**: `app/screens/thailand/ThailandTravelInfoScreen.js` (560 lines)
- **Styles**: `app/screens/thailand/ThailandTravelInfoScreen.styles.js`
- **Section Components**: Already modularized!
  - `HeroSection`
  - `PassportSection`
  - `PersonalInfoSection`
  - `FundsSection`
  - `TravelDetailsSection`
- **Progress Card**: `app/components/thailand/ProgressOverviewCard.js`

### Current State
✅ **Already Well-Structured**: Screen uses custom hooks and section components
✅ **Separation of Concerns**: State management, persistence, validation in separate hooks
❌ **StyleSheet-based**: Uses manual styling instead of design tokens
❌ **Custom Components**: Uses Thailand-specific components instead of shared library

---

## 🎯 Migration Strategy

### Option A: Full Migration (High Risk)
- Replace ALL sections with Tamagui components at once
- **Risk**: High - everything breaks if one thing fails
- **Time**: 3-4 days
- **Benefits**: Clean slate

### Option B: Gradual Migration (Recommended)
- Keep existing structure
- Replace components incrementally
- **Risk**: Low - one component at a time
- **Time**: 1-2 days for Phase 2
- **Benefits**: Working app at each step

### 🏆 **Chosen**: Option B - Gradual Migration

---

## 📋 Migration Steps (Phase 2)

### Step 1: Replace ProgressOverviewCard ✅
**Goal**: Use our new Tamagui `ProgressOverviewCard`

**Before**:
```javascript
// Thailand-specific component
import ProgressOverviewCard from '../../components/thailand/ProgressOverviewCard';

<ProgressOverviewCard
  totalCompletionPercent={formState.totalCompletionPercent}
  styles={styles}
/>
```

**After**:
```javascript
// Shared Tamagui component
import { ProgressOverviewCard } from '../../components/tamagui';

<ProgressOverviewCard
  completedFields={calculateCompleted()}
  totalFields={calculateTotal()}
  sections={[
    { name: 'Passport', icon: '📘', completed: passportComplete },
    { name: 'Personal', icon: '👤', completed: personalComplete },
    { name: 'Funds', icon: '💰', completed: fundsComplete },
    { name: 'Travel', icon: '✈️', completed: travelComplete },
  ]}
/>
```

**Changes**:
- Remove Thailand-specific ProgressOverviewCard
- Use Tamagui version with section breakdown
- Calculate completed/total fields dynamically

---

### Step 2: Update Main Screen Layout
**Goal**: Use Tamagui primitives for layout

**Before**:
```javascript
<SafeAreaView style={styles.container}>
  <View style={styles.header}>
    {/* header content */}
  </View>
  <ScrollView style={styles.scrollContainer}>
    {/* sections */}
  </ScrollView>
</SafeAreaView>
```

**After**:
```javascript
import { YStack, XStack, ScrollView } from '../../components/tamagui';

<SafeAreaView style={styles.container}>
  <XStack padding="$md" justifyContent="space-between" alignItems="center">
    {/* header content */}
  </XStack>
  <ScrollView backgroundColor="$background">
    <YStack padding="$md" gap="$lg">
      {/* sections */}
    </YStack>
  </ScrollView>
</SafeAreaView>
```

**Changes**:
- Replace View with YStack/XStack
- Use design tokens ($md, $lg) instead of styles
- Cleaner gap-based spacing

---

### Step 3: Update Privacy Box
**Goal**: Use BaseCard for consistency

**Before**:
```javascript
<View style={styles.privacyBox}>
  <Text style={styles.privacyIcon}>💾</Text>
  <Text style={styles.privacyText}>
    所有信息仅保存在您的手机本地
  </Text>
</View>
```

**After**:
```javascript
<BaseCard variant="flat" padding="md">
  <XStack gap="$sm" alignItems="center">
    <Text fontSize={20}>💾</Text>
    <Text fontSize="$2" color="$textSecondary">
      所有信息仅保存在您的手机本地
    </Text>
  </XStack>
</BaseCard>
```

---

### Step 4: Update Button Container
**Goal**: Use BaseButton for consistency

**Before**:
```javascript
<Button
  title="Continue"
  onPress={handleContinue}
  style={styles.button}
/>
```

**After**:
```javascript
<BaseButton
  variant="primary"
  size="lg"
  fullWidth
  onPress={handleContinue}
>
  Continue
</BaseButton>
```

---

## 📈 Expected Improvements

### Code Reduction
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Main Screen Lines | 560 | ~400 | **29% reduction** |
| Style Definitions | ~200 | ~100 | **50% reduction** |
| Layout Components | View, View, View | YStack, XStack | **Semantic** |
| Design Tokens | Manual values | Auto ($md, $lg) | **Consistent** |

### Quality Improvements
- ✅ **Consistency**: Uses shared design system
- ✅ **Maintainability**: Less custom styling
- ✅ **Reusability**: Components work for other countries
- ✅ **Performance**: Tamagui compiler optimization
- ✅ **Type Safety**: TypeScript props

---

## 🚫 Out of Scope for Phase 2

These will be handled in future phases:

- **Section Components**: PassportSection, PersonalInfoSection, etc.
  - Reason: Each section is complex (100+ lines)
  - Strategy: Migrate in Phase 3-7 (one section per phase)

- **Input Fields**: InputWithValidation, InputWithUserTracking
  - Reason: Need to preserve tracking logic
  - Strategy: Create wrapper components in Phase 1B

- **Custom Hooks**: useThailandFormState, useThailandDataPersistence
  - Reason: Already well-architected
  - Strategy: No changes needed

---

## 🎯 Success Criteria

Phase 2 is complete when:

1. ✅ ProgressOverviewCard uses Tamagui version
2. ✅ Main layout uses YStack/XStack/ScrollView
3. ✅ Design tokens replace hardcoded values
4. ✅ All functionality still works (validation, saving, navigation)
5. ✅ Tests pass
6. ✅ Code is ~30% smaller
7. ✅ Commit & push to branch

---

## 🚀 Next Steps

1. **Run**: Test existing screen to establish baseline
2. **Backup**: Create backup of current files
3. **Migrate**: Implement changes incrementally
4. **Test**: Verify after each change
5. **Measure**: Document improvements
6. **Commit**: Push Phase 2 completion

---

**Ready to begin migration!** 🎉
