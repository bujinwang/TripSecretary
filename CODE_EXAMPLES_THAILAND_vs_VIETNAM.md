# Code Implementation Examples: Thailand vs Vietnam

## 1. INFO SCREEN COMPARISON

### VietnamInfoScreen (Current - Simplified)
```javascript
// /app/screens/vietnam/VietnamInfoScreen.js (250 lines)

const VietnamInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const { t } = useLocale();

  const handleContinue = () => {
    // TODO: Create VietnamRequirementsScreen
    // For now, navigate directly to VietnamTravelInfo
    navigation.navigate('VietnamTravelInfo', { passport, destination });
  };

  // Uses simple infoSections array with default values
  const infoSections = useMemo(() => [
    {
      key: 'visa',
      title: t('vietnam.info.sections.visa.title', { defaultValue: 'Visa Requirements' }),
      items: normalizeItems(t('vietnam.info.sections.visa.items', {
        defaultValue: [
          'Chinese citizens can apply for e-Visa online',
          'E-Visa valid for 90 days, single or multiple entry',
          'Processing time: 3 business days',
          'E-Visa fee: $25 USD',
        ],
      })),
    },
    // ... more sections
  ], [t]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Simple scrollable layout with hardcoded defaults */}
    </SafeAreaView>
  );
};
```

**Key Differences:**
- ✅ Navigates directly to VietnamTravelInfo (no requirements screen)
- ✅ Simple structure with default translation fallbacks
- ✅ No complex state management
- ❌ Missing TODO for VietnamRequirementsScreen

---

### ThailandInfoScreen (Current - More Detailed)
```javascript
// /app/screens/thailand/ThailandInfoScreen.js (223 lines)

const ThailandInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const { t } = useLocale();

  const handleContinue = () => {
    // Properly navigates to Requirements screen
    navigation.navigate('ThailandRequirements', { passport, destination });
  };

  const infoSections = useMemo(
    () => [
      {
        key: 'visa',
        title: t('thailand.info.sections.visa.title'),
        items: normalizeItems(t('thailand.info.sections.visa.items', { defaultValue: [] })),
        cardStyle: styles.infoCard,
        textStyle: styles.infoText,
      },
      // ... more sections with explicit styling
    ],
    [t]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigates to Requirements screen as middle step */}
    </SafeAreaView>
  );
};
```

**Key Differences:**
- ✅ Proper navigation flow: InfoScreen → RequirementsScreen → TravelInfoScreen
- ✅ Uses i18n keys without default values (expected to exist)
- ✅ More structured styling for card types
- ✅ Proper requirements screen in flow

---

## 2. REQUIREMENTS SCREEN (MISSING FOR VIETNAM)

### ThailandRequirementsScreen (Template for Vietnam)
```javascript
// /app/screens/thailand/ThailandRequirementsScreen.js (150 lines)

const ThailandRequirementsScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const passport = UserDataService.toSerializablePassport(rawPassport);
  const { t } = useLocale();

  const handleContinue = () => {
    navigation.navigate('ThailandTravelInfo', { passport, destination });
  };

  const requirementItems = useMemo(
    () => [
      {
        key: 'validPassport',
        title: t('thailand.requirements.items.validPassport.title'),
        description: t('thailand.requirements.items.validPassport.description'),
        details: t('thailand.requirements.items.validPassport.details'),
      },
      {
        key: 'onwardTicket',
        title: t('thailand.requirements.items.onwardTicket.title'),
        description: t('thailand.requirements.items.onwardTicket.description'),
        details: t('thailand.requirements.items.onwardTicket.details'),
      },
      {
        key: 'accommodation',
        title: t('thailand.requirements.items.accommodation.title'),
        description: t('thailand.requirements.items.accommodation.description'),
        details: t('thailand.requirements.items.accommodation.details'),
      },
      {
        key: 'funds',
        title: t('thailand.requirements.items.funds.title'),
        description: t('thailand.requirements.items.funds.description'),
        details: t('thailand.requirements.items.funds.details'),
      },
      {
        key: 'healthCheck',
        title: t('thailand.requirements.items.healthCheck.title'),
        description: t('thailand.requirements.items.healthCheck.description'),
        details: t('thailand.requirements.items.healthCheck.details'),
      },
    ],
    [t]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={() => navigation.goBack()}
          label={t('common.back')}
        />
        <Text style={styles.headerTitle}>{t('thailand.requirements.headerTitle')}</Text>
      </View>

      <ScrollView>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{t('thailand.requirements.introTitle')}</Text>
          <Text style={styles.subtitle}>{t('thailand.requirements.introSubtitle')}</Text>
        </View>

        <View style={styles.requirementsList}>
          {requirementItems.map((item) => (
            <View key={item.key} style={styles.requirementCard}>
              <View style={styles.requirementHeader}>
                <View style={styles.bulletContainer}>
                  <View style={styles.bullet} />
                </View>
                <View style={styles.requirementContent}>
                  <Text style={styles.requirementTitle}>{item.title}</Text>
                  <Text style={styles.requirementDescription}>{item.description}</Text>
                </View>
              </View>
              <Text style={styles.requirementDetails}>{item.details}</Text>
            </View>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>
              {t('thailand.requirements.continueButton')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ThailandRequirementsScreen;
```

**For Vietnam, would need:**
```javascript
// /app/screens/vietnam/VietnamRequirementsScreen.js (adaptation)

// Same structure, but with Vietnam-specific requirements:
// - E-visa requirements
// - Health declaration
// - Funding requirements
// - Customs information
// - No TDAC concept
```

---

## 3. TRAVEL INFO SCREEN COMPARISON

### Vietnam (Using Shared Components - Simple)
```javascript
// /app/screens/vietnam/VietnamTravelInfoScreen.js (600+ lines)

const VietnamTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const { t } = useLocale();

  // Simple state management - 50+ useState hooks
  const [surname, setSurname] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [givenName, setGivenName] = useState('');
  const [nationality, setNationality] = useState('');
  const [passportNo, setPassportNo] = useState('');
  const [visaNumber, setVisaNumber] = useState('');
  const [dob, setDob] = useState('');
  // ... 40+ more useState calls

  // Uses shared section components directly
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView>
        {/* Shared Sections - Country Agnostic */}
        <PassportSection
          surname={surname}
          setSurname={setSurname}
          middleName={middleName}
          setMiddleName={setMiddleName}
          givenName={givenName}
          setGivenName={setGivenName}
          nationality={nationality}
          setNationality={setNationality}
          // ... many props
          labels={vietnamLabels.passport}
        />

        <PersonalInfoSection
          occupation={occupation}
          setOccupation={setOccupation}
          // ... more props
          labels={vietnamLabels.personalInfo}
        />

        <FundsSection
          funds={funds}
          setFunds={setFunds}
          // ... more props
          labels={vietnamLabels.funds}
        />

        <TravelDetailsSection
          travelPurpose={travelPurpose}
          setTravelPurpose={setTravelPurpose}
          province={province}
          setProvince={setProvince}
          // ... many more props
          labels={vietnamLabels.travelDetails}
          locations={vietnamProvinces}
          getDistricts={getDistrictsByProvince}
        />
      </ScrollView>
    </SafeAreaView>
  );
};
```

**Characteristics:**
- ✅ Simple, readable component
- ✅ Uses shared, reusable sections
- ✅ Easy to configure with labels
- ❌ Lots of prop passing
- ❌ No custom hooks or state management
- ❌ No validation services
- ❌ No auto-save

---

### Thailand (Custom Components - Complex)
```javascript
// /app/screens/thailand/ThailandTravelInfoScreen.js (1200+ lines)

const ThailandTravelInfoScreen = ({ navigation, route }) => {
  const { passport: rawPassport, destination } = route.params || {};
  const { t } = useLocale();

  const passport = useMemo(() => {
    return UserDataService.toSerializablePassport(rawPassport);
  }, [rawPassport?.id, rawPassport?.passportNo]);

  // Consolidated state management via custom hook
  const formState = useThailandFormState(passport);

  // User interaction tracking
  const userInteractionTracker = useUserInteractionTracker('thailand_travel_info');

  // Data persistence with auto-save
  const persistence = useThailandDataPersistence({
    passport,
    destination,
    userId,
    formState,
    userInteractionTracker,
    navigation
  });

  // Field-level validation
  const validation = useThailandValidation({
    formState,
    userInteractionTracker,
    saveDataToSecureStorageWithOverride: persistence.saveDataToSecureStorage,
    debouncedSaveData: persistence.debouncedSaveData
  });

  // Location cascade handling
  const {
    handleProvinceSelect,
    handleDistrictSelect,
    handleSubDistrictSelect
  } = useThailandLocationCascade({
    formState,
  });

  // Fund management
  const {
    fundItems,
    handleAddFund,
    handleDeleteFund,
  } = useThailandFundManagement({
    userId,
    formState,
  });

  // Custom section components (not shared)
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView ref={scrollViewRef}>
        <HeroSection />

        <PassportSection
          formState={formState}
          validation={validation}
          userInteractionTracker={userInteractionTracker}
          // Calls Thailand-specific validators
        />

        <PersonalInfoSection
          formState={formState}
          validation={validation}
          // Thailand-specific validation
        />

        <FundsSection
          fundItems={fundItems}
          handleAddFund={handleAddFund}
          handleDeleteFund={handleDeleteFund}
          // Fund-specific management
        />

        <TravelDetailsSection
          formState={formState}
          validation={validation}
          handleProvinceSelect={handleProvinceSelect}
          handleDistrictSelect={handleDistrictSelect}
          handleSubDistrictSelect={handleSubDistrictSelect}
          // 3-level location hierarchy
        />
      </ScrollView>
    </SafeAreaView>
  );
};
```

**Characteristics:**
- ✅ Sophisticated state management (custom hooks)
- ✅ Auto-save with debouncing
- ✅ Field-level validation with Thailand rules
- ✅ User interaction tracking
- ✅ Custom sections with Thailand-specific logic
- ✅ 3-level location hierarchy (provinces → districts → sub-districts)
- ❌ More complex, harder to maintain
- ❌ Thailand-specific features not reusable

---

## 4. SERVICES COMPARISON

### VietnamEntryGuideService (Complete)
```javascript
// /app/services/entryGuide/VietnamEntryGuideService.js

class VietnamEntryGuideService {
  constructor() {
    this.guide = vietnamEntryGuide; // From config
    this.currentStep = null;
    this.completedSteps = new Set();
  }

  // Get visa application timing
  checkVisaApplicationTime(arrivalDateTime) {
    const now = new Date();
    const arrival = new Date(arrivalDateTime);
    const hoursUntilArrival = (arrival - now) / (1000 * 60 * 60);
    const daysUntilArrival = hoursUntilArrival / 24;

    // E-visa needs 3 business days
    const canApply = daysUntilArrival >= 3 && daysUntilArrival > 0;

    return {
      canApply,
      daysUntilArrival: Math.round(daysUntilArrival),
      windowStatus: daysUntilArrival >= 3 ? 'within_window' : 'too_late',
      message: this._getApplicationTimeMessage(daysUntilArrival)
    };
  }

  // Check visa approval status
  checkVisaStatus(applicationDate, approvalDate) {
    const now = new Date();
    const applied = new Date(applicationDate);

    if (approvalDate) {
      return {
        status: 'approved',
        message: '签证已批准，可以入境',
        approvedDate: new Date(approvalDate).toISOString()
      };
    } else if ((now - applied) / (1000 * 60 * 60) < 72) {
      return {
        status: 'processing',
        message: '签证正在处理中，通常3个工作日内完成'
      };
    } else {
      return {
        status: 'delayed',
        message: '签证处理时间超出预期，请联系越南移民局'
      };
    }
  }

  // Check funding requirements
  checkFundingAdequacy(fundingAmount, groupSize = 1) {
    const minimumAmount = groupSize > 1 
      ? this.guide.fundingRequirements.minimumAmount.family
      : this.guide.fundingRequirements.minimumAmount.perPerson;

    return {
      isAdequate: fundingAmount >= minimumAmount,
      requiredAmount: minimumAmount,
      providedAmount: fundingAmount,
      shortfall: Math.max(0, minimumAmount - fundingAmount)
    };
  }

  // Yellow fever requirement check
  checkYellowFeverRequirement(travelHistory) {
    const yellowFeverRegions = this.guide.health.yellowFever.regions;
    const hasVisitedRiskArea = travelHistory.some(region =>
      yellowFeverRegions.some(riskRegion =>
        region.toLowerCase().includes(riskRegion.toLowerCase())
      )
    );

    return {
      required: hasVisitedRiskArea,
      regions: yellowFeverRegions,
      validity: this.guide.health.yellowFever.validity
    };
  }
}
```

**Vietnam Service Characteristics:**
- ✅ Business logic for visa timing, funding, health requirements
- ✅ No data validation (uses generic validation)
- ✅ No context builder or traveler payload generation
- ✅ Focused on educational/informational helper methods

---

### ThailandDataValidator (Specialized)
```javascript
// /app/services/thailand/ThailandDataValidator.js

class ThailandDataValidator {
  static validatePassportData(passport) {
    const errors = [];
    const requiredFields = ['passportNumber', 'fullName', 'nationality', 
                            'dateOfBirth', 'expiryDate'];
    const fieldStatus = {};

    // Check required fields
    requiredFields.forEach(field => {
      const hasValue = passport && passport[field] && 
                       passport[field].toString().trim().length > 0;
      fieldStatus[field] = hasValue;

      if (!hasValue) {
        errors.push(`护照${this.getFieldDisplayName(field)}为必填项`);
      }
    });

    // Format validation
    if (passport?.passportNumber && !this.isValidPassportNumber(passport.passportNumber)) {
      errors.push('护照号码格式无效');
      fieldStatus.passportNumber = false;
    }

    // Date validation
    if (passport?.expiryDate && !this.isValidDate(passport.expiryDate)) {
      errors.push('护照有效期格式无效');
    }

    // Expiry check
    if (passport?.expiryDate && this.isValidDate(passport.expiryDate)) {
      const expiryDate = new Date(passport.expiryDate);
      const now = new Date();
      if (expiryDate <= now) {
        errors.push('护照已过期');
      }
      
      // 6-month validity requirement (Thailand specific)
      const sixMonthsFromNow = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);
      if (expiryDate <= sixMonthsFromNow && expiryDate > now) {
        errors.push('护照将在6个月内过期，建议更新护照');
      }
    }

    return {
      isValid: errors.length === 0,
      isComplete: filledCount === totalCount,
      errors,
      fieldStatus
    };
  }

  static validateTravelData(travelData) {
    // Thailand-specific validation:
    // - Accommodation type validation
    // - Province/district validation
    // - Flight date validation
    // - Purpose of visit validation
  }
}
```

**Thailand Service Characteristics:**
- ✅ Comprehensive data validation
- ✅ Thailand-specific rules (6-month passport validity)
- ✅ Field-by-field validation
- ✅ Detailed error reporting

---

### ThailandTravelerContextBuilder (Specialized)
```javascript
// /app/services/thailand/ThailandTravelerContextBuilder.js

class ThailandTravelerContextBuilder {
  static async buildContext(userId) {
    // Retrieve all user data
    const userData = await UserDataService.getAllUserData(userId);
    const [travelInfo, fundItems] = await Promise.all([
      ThailandTravelerContextBuilder.getTravelInfoWithFallback(userId),
      UserDataService.getFundItems(userId)
    ]);

    // Transform to TDAC payload format
    const tdacPayload = {
      passport: this._transformPassport(userData.passport),
      personalInfo: this._transformPersonalInfo(userData.personalInfo),
      travelInfo: this._transformTravelInfo(travelInfo),
      fundInfo: this._transformFunds(fundItems),
    };

    // Normalize location codes for TDAC
    const accommodationType = normalizeAccommodationType(travelInfo.accommodationType);
    const travelPurpose = normalizeTravelPurpose(travelInfo.travelPurpose);

    // Return formatted for TDAC API
    return {
      payload: tdacPayload,
      accommodationType,
      travelPurpose,
      validation: this.validateUserData(userData)
    };
  }

  static _transformPassport(passport) {
    const [surname, givenName] = parseFullName(passport.fullName);
    return {
      passportNumber: passport.passportNumber,
      surname: surname,
      givenName: givenName,
      dateOfBirth: formatLocalDate(passport.dateOfBirth),
      expiryDate: formatLocalDate(passport.expiryDate),
      nationality: extractCountryCode(passport.nationality),
      sex: passport.sex[0].toUpperCase() // M/F/U
    };
  }

  static _transformTravelInfo(travelInfo) {
    return {
      arrivalDate: formatLocalDate(travelInfo.arrivalArrivalDate),
      arrivalFlightNumber: travelInfo.arrivalFlightNumber,
      departureDate: formatLocalDate(travelInfo.departureDepartureDate),
      departureFlightNumber: travelInfo.departureFlightNumber,
      purpose: normalizeTravelPurpose(travelInfo.travelPurpose),
      accommodationType: normalizeAccommodationType(travelInfo.accommodationType),
      accommodationAddress: travelInfo.hotelAddress,
      province: formatLocationCode(travelInfo.province),
      district: formatLocationCode(travelInfo.district),
      // ... more TDAC fields
    };
  }
}
```

**Thailand Context Builder:**
- ✅ Transforms user data to TDAC API format
- ✅ Handles name parsing and date formatting
- ✅ Location code normalization
- ✅ Field mapping specific to TDAC requirements
- ❌ Very Thailand-specific, not reusable

---

## 5. CONFIGURATION COMPARISON

### Thailand Destination Config
```javascript
// /app/config/destinations/thailand/index.js

const thailandConfig = {
  // Core metadata
  ...metadata, // ID, codes, names, currency, etc.

  // Financial info
  financial: financialInfo,

  // Emergency contacts
  emergency: emergencyInfo,

  // Entry guide
  entryGuide: entryGuideConfig,

  // Accommodation types
  accommodationTypes: [
    { id: 'hotel', label: 'Hotel', hasAddressField: true },
    { id: 'guesthouse', label: 'Guesthouse', hasAddressField: true },
    { id: 'resort', label: 'Resort', hasAddressField: true },
    { id: 'apartment', label: 'Apartment', hasAddressField: true },
    // ...
  ],

  // Travel purposes
  travelPurposes: [
    { id: 'tourism', label: 'Tourism', tdacCode: '1' },
    { id: 'business', label: 'Business', tdacCode: '2' },
    { id: 'education', label: 'Education', tdacCode: '3' },
    // ...
  ],

  // Validation rules
  validation: validationRules,

  // Service mappings
  services: {
    digitalCard: {
      serviceClass: 'TDACAPIService',
      submissionService: 'TDACSubmissionService',
      validationService: 'TDACValidationService',
      contextBuilder: 'ThailandTravelerContextBuilder',
    },
  },

  // Screen mappings
  screens: {
    info: 'ThailandInfo',
    entryFlow: 'ThailandEntryFlow',
    travelInfo: 'ThailandTravelInfo',
    requirements: 'ThailandRequirements',
    guide: 'ThailandInteractiveGuide',
    tdacWebView: 'TDACWebView',
    tdacHybrid: 'TDACHybrid',
  },

  // Feature flags
  features: {
    digitalArrivalCard: true,
    entryGuide: true,
    multiLanguageSupport: true,
    offlineMode: false,
  },
};
```

### Vietnam Config (Missing Destination Config)
```javascript
// Vietnam ONLY has:

// /app/config/entryGuide/vietnam.js
export const vietnamEntryGuide = {
  country: 'vietnam',
  countryName: '越南',
  airports: ['HAN', 'SGN', 'DAD'],
  currency: 'VND',
  // ... entry guide steps
  // ... visa info
  // ... health requirements
  // ... funding requirements
};

// /app/config/labels/vietnam.js
export const vietnamLabels = {
  screenTitle: '越南入境信息表',
  passport: { /* labels */ },
  personalInfo: { /* labels */ },
  funds: { /* labels */ },
  travelDetails: { /* labels */ },
};

// MISSING:
// - metadata.js (destination IDs, codes, names)
// - financialInfo.js (ATM fees, etc.)
// - accommodationTypes.js
// - travelPurposes.js
// - validationRules.js
// - consolidated index.js
```

---

## 6. i18n TRANSLATION KEYS COMPARISON

### Thailand Translations Exist
```json
{
  "thailand": {
    "entryFlow": {
      "title": "Thailand Entry Preparation Status",
      "preparationTitle": "Thailand Entry Preparation Status",
      "preparationSubtitle": "Check your entry information completion status",
      "loading": "Loading preparation status...",
      "completionStatus": "Completion Status",
      "categories": {
        "passport": "Passport Information",
        "personal": "Personal Information",
        "funds": "Fund Proof",
        "travel": "Travel Information"
      },
      "submissionWindow": "Submission Window",
      "actions": "Actions",
      // ... 50+ more keys
    },
    "travelInfo": {
      "scan": {
        "ticketTitle": "Scan Ticket",
        "ticketMessage": "Please select ticket image source",
        // ... scanning UI keys
      }
    }
  }
}
```

### Vietnam Translations Missing
```javascript
// In countries.en.json:
// vietnam is null or completely missing

// Only available in config labels:
vietnamLabels.passport.title // "护照信息 - Thông tin hộ chiếu"
vietnamLabels.personalInfo.title // "个人信息 - Thông tin cá nhân"
// ... etc

// MISSING:
// - info screen translations
// - requirements screen translations
// - entry flow translations
// - notification templates
```

---

## SUMMARY

| Aspect | Thailand | Vietnam |
|--------|----------|---------|
| **Screens** | 15 (with TDAC) | 2 (minimal) |
| **Config Files** | 7 files | 2 files |
| **Services** | 4+ specialized | 1 basic |
| **State Management** | Custom hooks | useState |
| **Validation** | Field-level | Generic |
| **i18n Keys** | 70+ screen-specific | 0 (only labels) |
| **Location Hierarchy** | 3 levels | 2 levels |
| **Component Strategy** | Custom sections | Shared sections |
| **Complexity** | Very high | Very low |
| **TDAC-Specific** | Yes (10 screens) | N/A |

