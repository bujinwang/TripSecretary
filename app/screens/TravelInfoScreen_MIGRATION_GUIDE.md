# TravelInfoScreen Migration Guide

> **Note**: This is a practical, step-by-step implementation guide. For methodology, theory, and comprehensive examples, see the main refactoring guide.

## Related Documentation

- **📖 Methodology Guide**: [TRAVEL_INFO_SCREEN_REFACTORING_GUIDE.md](../../docs/TRAVEL_INFO_SCREEN_REFACTORING_GUIDE.md) - Learn the refactoring approach and best practices
- **📊 Progress Tracker**: [TRAVEL_INFO_SCREEN_REFACTORING_TRACKER.md](../../docs/TRAVEL_INFO_SCREEN_REFACTORING_TRACKER.md) - See completed examples and status
- **🔧 This Guide**: Practical step-by-step migration instructions

## Overview
This guide explains how to upgrade TravelInfoScreens to match the comprehensive structure established in Thailand, Singapore, and US. The reference implementation (Thailand) was reduced from 3,930 lines to 1,285 lines (-67%) with significant improvements in maintainability.

## Why Upgrade?
The comprehensive TravelInfoScreen provides:
- **Auto-save functionality** - Users never lose their progress
- **Smart defaults** - Common values pre-filled for better UX
- **User interaction tracking** - Distinguish system-populated vs user-modified fields
- **Advanced field counting** - Only count fields users actually care about
- **Progress visualization** - Clear completion indicators
- **Document uploads** - Photo support for tickets, reservations
- **Fund management** - Add/edit/delete fund items with validation
- **Better UX** - Collapsible sections, option selectors, validation warnings

---

## File Structure

### 1. Imports (Lines ~1-50)

```javascript
// Core React imports
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
         LayoutAnimation, Platform, UIManager, Alert, Image } from 'react-native';

// Expo libraries
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base components
import BackButton from '../../components/BackButton';
import Button from '../../components/Button';
import Input from '../../components/Input';
import InputWithUserTracking from '../../components/InputWithUserTracking';
import FundItemDetailModal from '../../components/FundItemDetailModal';
import { NationalitySelector, PassportNameInput, DateTimeInput } from '../../components';

// Services
import SecureStorageService from '../../services/security/SecureStorageService';
import UserDataService from '../../services/data/UserDataService';

// Theme & i18n
import { colors, typography, spacing } from '../../theme';
import { useLocale } from '../../i18n/LocaleContext';
import { getPhoneCode } from '../../data/phoneCodes';

// Utilities
import DebouncedSave from '../../utils/DebouncedSave';
import SoftValidation from '../../utils/SoftValidation';
import { useUserInteractionTracker } from '../../utils/UserInteractionTracker';
import FieldStateManager from '../../utils/FieldStateManager';

// Models
import Passport from '../../models/Passport';
import PersonalInfo from '../../models/PersonalInfo';
import EntryData from '../../models/EntryData';
import EntryInfo from '../../models/EntryInfo';

// Country-specific components and constants
import { FieldWarningIcon, InputWithValidation, CollapsibleSection }
  from '../../components/thailand/ThailandTravelComponents';
import { parsePassportName } from '../../utils/NameParser';
import { PREDEFINED_TRAVEL_PURPOSES, PREDEFINED_ACCOMMODATION_TYPES,
         GENDER_OPTIONS, FUND_REQUIREMENTS } from './constants';
import OptionSelector from '../../components/thailand/OptionSelector';
```

### 2. Smart Defaults Function (Lines ~60-80)

```javascript
const getSmartDefaults = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return {
    travelPurpose: 'TOURISM',
    accommodationType: 'HOTEL',
    arrivalDate: tomorrow.toISOString().split('T')[0],
    stayDuration: '7',
    boardingCountry: passport?.nationality || 'CHN',
    // Add other common defaults specific to your country
  };
};
```

**Purpose**: Pre-fill common values to reduce user input
**Customization**: Adjust defaults based on your country's common scenarios

### 3. State Management (Lines ~100-200)

```javascript
const MalaysiaTravelInfoScreen = ({ route, navigation }) => {
  const { userId, destinationId } = route.params;
  const { t, locale } = useLocale();

  // Core state
  const [passport, setPassport] = useState(null);
  const [personalInfo, setPersonalInfo] = useState(null);
  const [travelInfo, setTravelInfo] = useState(null);
  const [entryData, setEntryData] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [expandedSections, setExpandedSections] = useState({});
  const [saveStatus, setSaveStatus] = useState(null); // 'saving' | 'saved' | 'error' | null
  const [showFundModal, setShowFundModal] = useState(false);
  const [editingFundIndex, setEditingFundIndex] = useState(null);

  // Refs
  const scrollViewRef = useRef(null);
  const hasInitializedDefaults = useRef(false);
  const isMigrated = useRef(false);

  // User interaction tracking
  const userInteractionTracker = useUserInteractionTracker('malaysia_travel_info');
```

### 4. Data Loading & Migration (Lines ~200-300)

```javascript
useEffect(() => {
  loadData();
}, [userId, destinationId]);

const loadData = async () => {
  try {
    setLoading(true);
    const [passportData, personalData, travelData, entryDataObj] = await Promise.all([
      UserDataService.getPassport(userId),
      UserDataService.getPersonalInfo(userId),
      UserDataService.getTravelInfo(userId, destinationId),
      UserDataService.getEntryData(userId, destinationId),
    ]);

    setPassport(passportData || new Passport());
    setPersonalInfo(personalData || new PersonalInfo());
    setTravelInfo(travelData || new EntryInfo());
    setEntryData(entryDataObj || new EntryData());
  } catch (error) {
    console.error('Failed to load Malaysia travel info:', error);
    Alert.alert('Error', 'Failed to load travel information');
  } finally {
    setLoading(false);
  }
};

// Migration: Mark existing data as user-modified
useEffect(() => {
  if (!loading && !isMigrated.current && travelInfo) {
    migrateExistingDataToInteractionState();
    isMigrated.current = true;
  }
}, [loading, travelInfo]);

const migrateExistingDataToInteractionState = () => {
  const fieldsToMigrate = [
    { name: 'travelPurpose', value: travelInfo?.travelPurpose },
    { name: 'arrivalDate', value: travelInfo?.arrivalDate },
    { name: 'stayDuration', value: travelInfo?.stayDuration },
    // Add all relevant fields
  ];

  fieldsToMigrate.forEach(({ name, value }) => {
    if (value) {
      userInteractionTracker.markFieldAsUserModified(name, value);
    }
  });
};
```

### 5. Smart Defaults Application (Lines ~300-350)

```javascript
useEffect(() => {
  if (!loading && !hasInitializedDefaults.current && travelInfo) {
    const smartDefaults = getSmartDefaults();
    let updated = false;

    Object.entries(smartDefaults).forEach(([key, value]) => {
      if (!travelInfo[key] && value) {
        travelInfo[key] = value;
        updated = true;
      }
    });

    if (updated) {
      setTravelInfo({ ...travelInfo });
      debouncedSave();
    }

    hasInitializedDefaults.current = true;
  }
}, [loading, travelInfo]);
```

### 6. Debounced Save (Lines ~350-400)

```javascript
const debouncedSave = DebouncedSave.create(async () => {
  try {
    setSaveStatus('saving');

    await Promise.all([
      UserDataService.updatePassport(userId, {
        passportNumber: passport?.passportNumber,
        nationality: passport?.nationality,
        // ... other passport fields
      }),
      UserDataService.updatePersonalInfo(userId, {
        firstName: personalInfo?.firstName,
        lastName: personalInfo?.lastName,
        // ... other personal fields
      }),
      UserDataService.updateTravelInfo(userId, destinationId, {
        travelPurpose: travelInfo?.travelPurpose,
        arrivalDate: travelInfo?.arrivalDate,
        // ... other travel fields
      }),
    ]);

    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(null), 2000);
  } catch (error) {
    console.error('Failed to save Malaysia travel info:', error);
    setSaveStatus('error');
  }
}, 1000); // 1 second debounce
```

### 7. Field Counting with User Interaction State (Lines ~400-500)

```javascript
const getFieldCount = useCallback((sectionName) => {
  if (!travelInfo || !personalInfo || !passport) {
    return { filled: 0, total: 0 };
  }

  // Define fields for this section
  let fields = {};
  switch (sectionName) {
    case 'travelInfo':
      fields = {
        travelPurpose: travelInfo?.travelPurpose,
        arrivalDate: travelInfo?.arrivalDate,
        stayDuration: travelInfo?.stayDuration,
        // ... other fields
      };
      break;
    // ... other sections
  }

  // Build interaction state for all fields
  const allFieldNames = Object.keys(fields);
  const interactionState = {};

  allFieldNames.forEach(fieldName => {
    interactionState[fieldName] = {
      isUserModified: userInteractionTracker.isFieldUserModified(fieldName),
      lastModified: userInteractionTracker.getFieldInteractionDetails(fieldName)?.lastModified || null,
      initialValue: userInteractionTracker.getFieldInteractionDetails(fieldName)?.initialValue || null
    };
  });

  // Use FieldStateManager for advanced counting
  const fieldCount = FieldStateManager.getFieldCount(
    fields,
    interactionState,
    allFieldNames
  );

  return {
    filled: fieldCount.totalWithValues,
    total: fieldCount.totalUserModified || allFieldNames.length
  };
}, [travelInfo, personalInfo, passport, userInteractionTracker]);
```

### 8. Progress Header (Lines ~500-600)

```javascript
const getOverallProgress = useCallback(() => {
  const sections = ['personalInfo', 'passport', 'travelInfo', 'accommodation', 'funds'];
  let totalFilled = 0;
  let totalFields = 0;

  sections.forEach(section => {
    const count = getFieldCount(section);
    totalFilled += count.filled;
    totalFields += count.total;
  });

  const percentage = totalFields > 0 ? Math.round((totalFilled / totalFields) * 100) : 0;
  const color = percentage >= 80 ? colors.success
              : percentage >= 50 ? colors.warning
              : colors.error;

  return { filled: totalFilled, total: totalFields, percentage, color };
}, [getFieldCount]);

// Render progress header
const renderProgressHeader = () => {
  const progress = getOverallProgress();

  return (
    <View style={styles.progressHeader}>
      <Text style={styles.progressText}>
        {progress.percentage}% Complete ({progress.filled}/{progress.total} fields)
      </Text>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${progress.percentage}%`, backgroundColor: progress.color }
          ]}
        />
      </View>
    </View>
  );
};
```

### 9. Document Upload (Lines ~600-700)

```javascript
const handlePhotoUpload = async (photoType) => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      const photoUri = result.assets[0].uri;

      // Store securely
      await SecureStorageService.storePhoto(
        userId,
        `${destinationId}_${photoType}`,
        photoUri
      );

      // Update state
      if (photoType === 'flightTicket') {
        setTravelInfo({ ...travelInfo, flightTicketPhoto: photoUri });
      } else if (photoType === 'hotelReservation') {
        setTravelInfo({ ...travelInfo, hotelReservationPhoto: photoUri });
      }

      debouncedSave();
    }
  } catch (error) {
    console.error(`Failed to upload ${photoType}:`, error);
    Alert.alert('Error', 'Failed to upload photo');
  }
};

// Render photo upload button
<TouchableOpacity
  style={styles.photoUploadButton}
  onPress={() => handlePhotoUpload('flightTicket')}
>
  {travelInfo?.flightTicketPhoto ? (
    <Image
      source={{ uri: travelInfo.flightTicketPhoto }}
      style={styles.uploadedPhoto}
    />
  ) : (
    <Text style={styles.photoUploadText}>📷 Upload Flight Ticket</Text>
  )}
</TouchableOpacity>
```

### 10. Fund Management (Lines ~700-900)

```javascript
const [funds, setFunds] = useState([]);

const handleAddFund = () => {
  setEditingFundIndex(null);
  setShowFundModal(true);
};

const handleEditFund = (index) => {
  setEditingFundIndex(index);
  setShowFundModal(true);
};

const handleDeleteFund = (index) => {
  Alert.alert(
    'Delete Fund',
    'Are you sure you want to delete this fund item?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const newFunds = [...funds];
          newFunds.splice(index, 1);
          setFunds(newFunds);
          debouncedSave();
        },
      },
    ]
  );
};

const handleSaveFund = (fundData) => {
  const newFunds = [...funds];

  if (editingFundIndex !== null) {
    newFunds[editingFundIndex] = fundData;
  } else {
    newFunds.push(fundData);
  }

  setFunds(newFunds);
  setShowFundModal(false);
  setEditingFundIndex(null);
  debouncedSave();
};

// Render fund items
{funds.map((fund, index) => (
  <View key={index} style={styles.fundItem}>
    <View style={styles.fundItemContent}>
      <Text style={styles.fundItemType}>{fund.type}</Text>
      <Text style={styles.fundItemAmount}>
        {fund.currency} {fund.amount}
      </Text>
    </View>
    <View style={styles.fundItemActions}>
      <TouchableOpacity onPress={() => handleEditFund(index)}>
        <Text style={styles.fundEditButton}>✏️</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeleteFund(index)}>
        <Text style={styles.fundDeleteButton}>🗑️</Text>
      </TouchableOpacity>
    </View>
  </View>
))}

<FundItemDetailModal
  visible={showFundModal}
  onClose={() => {
    setShowFundModal(false);
    setEditingFundIndex(null);
  }}
  onSave={handleSaveFund}
  initialData={editingFundIndex !== null ? funds[editingFundIndex] : null}
  currency="MYR"
  requirements={FUND_REQUIREMENTS}
/>
```

### 11. Input Components (Lines ~900-1000)

```javascript
// Use InputWithUserTracking for important fields
<InputWithUserTracking
  label="Travel Purpose / Tujuan Perjalanan"
  value={travelInfo?.travelPurpose || ''}
  onChangeText={(value) => {
    setTravelInfo({ ...travelInfo, travelPurpose: value });
    debouncedSave();
  }}
  fieldName="travelPurpose"
  tracker={userInteractionTracker}
  placeholder="e.g., Tourism"
/>

// Use OptionSelector for predefined choices
<OptionSelector
  label="Travel Purpose / Tujuan Perjalanan"
  value={travelInfo?.travelPurpose || ''}
  onValueChange={(value) => {
    setTravelInfo({ ...travelInfo, travelPurpose: value });
    userInteractionTracker.markFieldAsUserModified('travelPurpose', value);
    debouncedSave();
  }}
  predefinedOptions={PREDEFINED_TRAVEL_PURPOSES}
  allowCustomInput={true}
  placeholder="Select or enter purpose"
/>
```

### 12. Collapsible Sections (Lines ~1000-1200)

```javascript
<CollapsibleSection
  title="Travel Information / Maklumat Perjalanan"
  isExpanded={expandedSections.travelInfo}
  onToggle={() => toggleSection('travelInfo')}
  fieldCount={getFieldCount('travelInfo')}
  icon="✈️"
>
  {/* Section content */}
  <OptionSelector ... />
  <InputWithUserTracking ... />
  <DateTimeInput ... />
  {/* ... */}
</CollapsibleSection>

<CollapsibleSection
  title="Accommodation / Penginapan"
  isExpanded={expandedSections.accommodation}
  onToggle={() => toggleSection('accommodation')}
  fieldCount={getFieldCount('accommodation')}
  icon="🏨"
>
  {/* Accommodation fields */}
</CollapsibleSection>
```

---

## Country-Specific Customization

### 1. Constants File (`constants.js`)

Create a constants file for your country with:

```javascript
// Travel purposes (customize for your country's requirements)
export const PREDEFINED_TRAVEL_PURPOSES = [
  { value: 'TOURISM', labelEn: 'Tourism', labelLocal: '旅游' },
  { value: 'BUSINESS', labelEn: 'Business', labelLocal: '商务' },
  { value: 'VISIT_FAMILY', labelEn: 'Visit Family/Friends', labelLocal: '探亲访友' },
  // Add country-specific purposes
];

// Accommodation types
export const PREDEFINED_ACCOMMODATION_TYPES = [
  { value: 'HOTEL', labelEn: 'Hotel', labelLocal: '酒店' },
  { value: 'GUESTHOUSE', labelEn: 'Guesthouse', labelLocal: '民宿' },
  // Add country-specific types
];

// Gender options (bilingual)
export const GENDER_OPTIONS = [
  { value: 'M', labelEn: 'Male', labelLocal: '男' },
  { value: 'F', labelEn: 'Female', labelLocal: '女' },
];

// Fund requirements
export const FUND_REQUIREMENTS = {
  minPerDay: 350, // MYR
  currency: 'MYR',
  description: 'Minimum MYR 350 per day required',
};

// Storage keys
export const STORAGE_KEYS = {
  EXPANDED_SECTIONS: 'malaysia_travel_info_expanded_sections',
  LAST_SAVED: 'malaysia_travel_info_last_saved',
};
```

### 2. Bilingual Labels

Use this pattern for bilingual support:

```javascript
// Malaysia uses English / Bahasa Malaysia
label="Travel Purpose / Tujuan Perjalanan"
placeholder="e.g., Tourism / Pelancongan"

// Taiwan uses English / Traditional Chinese
label="Travel Purpose / 旅行目的"
placeholder="e.g., Tourism / 觀光"

// Korea uses English / Korean
label="Travel Purpose / 여행 목적"
placeholder="e.g., Tourism / 관광"

// Japan uses English / Japanese
label="Travel Purpose / 旅行目的"
placeholder="e.g., Tourism / 観光"
```

### 3. Smart Defaults Customization

Adjust smart defaults based on your country's common scenarios:

```javascript
// Malaysia defaults
const getSmartDefaults = () => {
  return {
    travelPurpose: 'TOURISM',
    accommodationType: 'HOTEL',
    arrivalDate: tomorrow.toISOString().split('T')[0],
    stayDuration: '7',
    boardingCountry: passport?.nationality || 'CHN', // Most visitors from China
  };
};

// Taiwan defaults
const getSmartDefaults = () => {
  return {
    travelPurpose: 'TOURISM',
    accommodationType: 'HOTEL',
    arrivalDate: tomorrow.toISOString().split('T')[0],
    stayDuration: '5', // Shorter typical stay
    boardingCountry: passport?.nationality || 'CHN',
  };
};
```

### 4. Country-Specific Fields

Add or remove fields based on your country's DAC requirements:

```javascript
// Malaysia requires: Fund information (detailed)
// Taiwan requires: No fund section (not required)
// Korea requires: K-ETA information
// Japan requires: Pen color preference note
// US requires: ESTA information

// Example: Korea-specific K-ETA section
<CollapsibleSection
  title="K-ETA Information"
  isExpanded={expandedSections.keta}
  onToggle={() => toggleSection('keta')}
  fieldCount={getFieldCount('keta')}
  icon="🇰🇷"
>
  <InputWithUserTracking
    label="K-ETA Number"
    value={travelInfo?.ketaNumber || ''}
    onChangeText={(value) => {
      setTravelInfo({ ...travelInfo, ketaNumber: value });
      debouncedSave();
    }}
    fieldName="ketaNumber"
    tracker={userInteractionTracker}
  />
</CollapsibleSection>
```

---

## Step-by-Step Migration Guide

### Phase 1: Preparation (15 minutes)

1. **Back up existing file**
   ```bash
   cp TaiwanTravelInfoScreen.js TaiwanTravelInfoScreen.js.backup
   ```

2. **Read Malaysia reference** (lines 1-100, key sections)
   ```bash
   # Study the structure
   head -100 /path/to/MalaysiaTravelInfoScreen.js
   ```

3. **Create constants file** (if doesn't exist)
   ```bash
   touch constants.js
   # Add PREDEFINED_TRAVEL_PURPOSES, ACCOMMODATION_TYPES, etc.
   ```

### Phase 2: Update Imports (10 minutes)

1. Open your TravelInfoScreen file
2. Replace import section (lines ~1-50) with comprehensive imports from Malaysia
3. Update country-specific import:
   ```javascript
   // Change from:
   import './constants';

   // To:
   import { PREDEFINED_TRAVEL_PURPOSES, PREDEFINED_ACCOMMODATION_TYPES,
            GENDER_OPTIONS } from './constants';
   ```

### Phase 3: Add Utility Functions (20 minutes)

1. **Add Smart Defaults** (before component)
   - Copy `getSmartDefaults()` from Malaysia
   - Customize default values for your country

2. **Update Component Declaration**
   ```javascript
   const TaiwanTravelInfoScreen = ({ route, navigation }) => {
     const { userId, destinationId } = route.params;
     const { t, locale } = useLocale();
   ```

3. **Add User Interaction Tracker**
   ```javascript
   const userInteractionTracker = useUserInteractionTracker('taiwan_travel_info');
   ```

4. **Add Migration Function**
   - Copy `migrateExistingDataToInteractionState()` from Malaysia
   - Update field names for your country

### Phase 4: Update State Management (15 minutes)

1. **Add new state variables**
   ```javascript
   const [saveStatus, setSaveStatus] = useState(null);
   const [showFundModal, setShowFundModal] = useState(false);
   const [editingFundIndex, setEditingFundIndex] = useState(null);
   const hasInitializedDefaults = useRef(false);
   const isMigrated = useRef(false);
   ```

2. **Update existing state** to match Malaysia structure

### Phase 5: Implement Auto-Save (15 minutes)

1. **Copy DebouncedSave function** from Malaysia
2. **Update field references** to match your country's data structure
3. **Test**: Verify auto-save triggers on input change

### Phase 6: Update Field Counting (20 minutes)

1. **Copy `getFieldCount()` function** from Malaysia
2. **Update field definitions** for your country's sections
3. **Ensure** all sections use `fieldCount={getFieldCount('sectionName')}`

### Phase 7: Add Progress Header (10 minutes)

1. **Copy `getOverallProgress()` function**
2. **Copy `renderProgressHeader()` function**
3. **Add to render**:
   ```javascript
   return (
     <SafeAreaView style={styles.container}>
       {renderProgressHeader()}
       <ScrollView ref={scrollViewRef}>
         {/* ... */}
       </ScrollView>
     </SafeAreaView>
   );
   ```

### Phase 8: Update Input Components (30 minutes)

1. **Replace basic Input with InputWithUserTracking** for key fields:
   ```javascript
   // Before:
   <Input
     label="Travel Purpose"
     value={travelInfo?.travelPurpose || ''}
     onChangeText={(value) => {
       setTravelInfo({ ...travelInfo, travelPurpose: value });
     }}
   />

   // After:
   <InputWithUserTracking
     label="Travel Purpose / 旅行目的"
     value={travelInfo?.travelPurpose || ''}
     onChangeText={(value) => {
       setTravelInfo({ ...travelInfo, travelPurpose: value });
       debouncedSave();
     }}
     fieldName="travelPurpose"
     tracker={userInteractionTracker}
     placeholder="e.g., Tourism"
   />
   ```

2. **Add OptionSelector** for predefined choices:
   ```javascript
   <OptionSelector
     label="Travel Purpose / 旅行目的"
     value={travelInfo?.travelPurpose || ''}
     onValueChange={(value) => {
       setTravelInfo({ ...travelInfo, travelPurpose: value });
       userInteractionTracker.markFieldAsUserModified('travelPurpose', value);
       debouncedSave();
     }}
     predefinedOptions={PREDEFINED_TRAVEL_PURPOSES}
     allowCustomInput={true}
   />
   ```

### Phase 9: Add Document Uploads (20 minutes)

1. **Copy `handlePhotoUpload()` function**
2. **Add photo upload buttons** in relevant sections
3. **Test**: Upload and display photos

### Phase 10: Add Fund Management (30 minutes - skip if not required)

1. **Copy fund management functions**:
   - `handleAddFund()`
   - `handleEditFund()`
   - `handleDeleteFund()`
   - `handleSaveFund()`

2. **Add FundItemDetailModal**
3. **Render fund items** with edit/delete buttons

**Note**: Taiwan doesn't require fund information, so skip this phase for Taiwan.

### Phase 11: Update Bilingual Labels (20 minutes)

1. **Find all labels** in your file
2. **Update to bilingual format**:
   ```javascript
   // Taiwan: English / Traditional Chinese
   label="Full Name / 姓名"
   label="Passport Number / 護照號碼"
   label="Date of Birth / 出生日期"

   // Korea: English / Korean
   label="Full Name / 이름"
   label="Passport Number / 여권 번호"

   // Japan: English / Japanese
   label="Full Name / 氏名"
   label="Passport Number / パスポート番号"
   ```

### Phase 12: Update CollapsibleSections (15 minutes)

1. **Ensure all sections use** `fieldCount` prop (not `completionStatus`)
2. **Add icons** to sections:
   ```javascript
   <CollapsibleSection
     title="Personal Information / 個人資料"
     icon="👤"
     fieldCount={getFieldCount('personalInfo')}
     isExpanded={expandedSections.personalInfo}
     onToggle={() => toggleSection('personalInfo')}
   >
   ```

### Phase 13: Test & Validate (30 minutes)

1. **Manual testing**:
   - Load screen, verify smart defaults
   - Fill fields, verify auto-save
   - Check progress header updates
   - Upload photos
   - Add/edit/delete funds (if applicable)

2. **Verify field counting**:
   - Empty state shows 0%
   - Filling fields increases percentage
   - Unfilling fields decreases percentage

3. **Test edge cases**:
   - Existing data migration
   - Network errors during save
   - Photo upload failures

### Phase 14: Cleanup & Polish (15 minutes)

1. **Remove unused code**
2. **Format code** consistently
3. **Add comments** for country-specific logic
4. **Update styles** to match theme

---

## Common Pitfalls

### 1. Prop Name Mismatch
❌ **Wrong**: `completionStatus={getFieldCount('section')}`
✅ **Correct**: `fieldCount={getFieldCount('section')}`

### 2. Forgetting debouncedSave()
❌ **Wrong**:
```javascript
onChangeText={(value) => {
  setTravelInfo({ ...travelInfo, field: value });
}}
```
✅ **Correct**:
```javascript
onChangeText={(value) => {
  setTravelInfo({ ...travelInfo, field: value });
  debouncedSave();
}}
```

### 3. Not Tracking User Modifications
❌ **Wrong**: Just update state
✅ **Correct**:
```javascript
userInteractionTracker.markFieldAsUserModified('fieldName', value);
```

### 4. Incorrect Field Count Structure
The `getFieldCount()` function must return `{ filled, total }`, not just a number.

### 5. Missing Migration Function
Existing users' data won't be marked as user-modified without the migration function.

---

## Testing Checklist

- [ ] Smart defaults populate correctly on first load
- [ ] Auto-save triggers after 1 second of inactivity
- [ ] Save status indicator shows "💾 Saving..." then "✅ Saved"
- [ ] Progress header updates in real-time
- [ ] Field counts in CollapsibleSection headers are accurate
- [ ] InputWithUserTracking marks fields as modified
- [ ] OptionSelector allows selecting predefined options
- [ ] OptionSelector allows custom input when enabled
- [ ] Photo uploads work for all document types
- [ ] Fund modal can add/edit/delete items (if applicable)
- [ ] Bilingual labels display correctly
- [ ] Migration function runs for existing users
- [ ] No console errors or warnings

---

## Country-Specific Notes

### Taiwan
- **Language**: Traditional Chinese (繁體中文)
- **No fund section required**
- **Typical stay**: 5-7 days
- **Common boarding country**: China (CHN), Hong Kong (HKG)

### Korea
- **Language**: Korean (한국어)
- **Add K-ETA section** for electronic travel authorization
- **Typical stay**: 7-10 days
- **Common boarding country**: China (CHN), Japan (JPN)

### Japan
- **Language**: Japanese (日本語)
- **Note about pens**: Add info card about bringing black pen for forms
- **Typical stay**: 7-14 days
- **Common boarding country**: China (CHN), US (USA)

### US
- **Language**: English only (no bilingual labels needed)
- **Add ESTA section** for visa waiver program
- **Typical stay**: 7-21 days
- **Common boarding country**: China (CHN), Mexico (MEX), Canada (CAN)

---

## File Size Comparison

| Country | Before | After | Change |
|---------|--------|-------|--------|
| Thailand | N/A | 3,930 lines | Reference |
| Singapore | N/A | 3,153 lines | Reference |
| Hong Kong | N/A | 3,907 lines | Reference |
| **Malaysia** | **1,474** | **1,358** | **✅ Complete** |
| Taiwan | 949 | ~1,200 (est) | Pending |
| Korea | 1,159 | ~1,400 (est) | Pending |
| Japan | 1,147 | ~1,400 (est) | Pending |
| US | 900 | ~1,000 (est) | Pending |

**Note**: Sizes vary based on country-specific requirements. Countries without fund sections will be slightly smaller.

---

## Next Steps

1. **Taiwan Migration**: Start with Taiwan TravelInfoScreen
2. **Korea Migration**: Apply pattern to Korea
3. **Japan Migration**: Apply pattern to Japan
4. **US Migration**: Apply pattern to US
5. **Final Review**: Ensure consistency across all countries

---

## Support

For questions or issues:
1. Check this guide first
2. Review Malaysia TravelInfoScreen as reference
3. Compare with Thailand TravelInfoScreen for advanced patterns
4. Test thoroughly before deploying

---

## Appendix: Quick Reference

### Essential Functions to Copy
1. `getSmartDefaults()`
2. `migrateExistingDataToInteractionState()`
3. `debouncedSave`
4. `getFieldCount()`
5. `getOverallProgress()`
6. `renderProgressHeader()`
7. `handlePhotoUpload()`
8. Fund management functions (if needed)

### Essential Components
1. `InputWithUserTracking`
2. `OptionSelector`
3. `CollapsibleSection` (with `fieldCount` prop)
4. `FundItemDetailModal` (if needed)
5. `DateTimeInput`
6. `NationalitySelector`

### Essential State
1. `userInteractionTracker`
2. `saveStatus`
3. `hasInitializedDefaults` ref
4. `isMigrated` ref
5. `expandedSections`

---

**Last Updated**: 2025-10-26
**Reference Implementation**: Malaysia TravelInfoScreen
**Version**: 1.0
