/**
 * Comprehensive Malaysia Travel Info Configuration
 *
 * Malaysia implementation of EnhancedTravelInfoTemplate V2.
 * Mirrors the Vietnam setup but with MDAC-specific copy and fields.
 */

import { malaysiaLabels, malaysiaConfig } from '../../../config/labels/malaysia';
import { malaysiaStates, getDistrictsByState } from '../../../data/malaysiaLocations';

export const malaysiaComprehensiveTravelInfoConfig = {
  // ============================================
  // BASIC METADATA
  // ============================================
  destinationId: 'my' as const,
  name: 'Malaysia',
  nameZh: '马来西亚',
  flag: '🇲🇾',
  currency: 'MYR',
  currencySymbol: 'RM',

  // ============================================
  // HERO SECTION
  // ============================================
  hero: {
    type: 'rich' as const, // 'rich' uses LinearGradient, 'basic' uses simple layout
    titleKey: 'my.travelInfo.hero.title',
    defaultTitle: 'Malaysia Entry Preparation Guide',
    subtitleKey: 'my.travelInfo.hero.subtitle',
    defaultSubtitle: 'Complete MDAC in 3 minutes for a smooth arrival!',

    gradient: {
      colors: ['#1D4ED8', '#1E3A8A'], // Malaysia blue gradient
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },

    valuePropositions: [
      { 
        icon: '⏱️', 
        textKey: 'my.travelInfo.hero.valuePropositions.0',
        defaultText: 'Finish in 3 minutes',
        text: 'Finish in 3 minutes' 
      },
      { 
        icon: '🛂', 
        textKey: 'my.travelInfo.hero.valuePropositions.1',
        defaultText: 'Smart MDAC reminders',
        text: 'Smart MDAC reminders' 
      },
      { 
        icon: '🔒', 
        textKey: 'my.travelInfo.hero.valuePropositions.2',
        defaultText: 'Offline friendly, securely stored',
        text: 'Offline friendly, securely stored' 
      },
    ],

    beginnerTip: {
      icon: '💡',
      textKey: 'my.travelInfo.hero.beginnerTip',
      defaultText: 'MDAC must be submitted within 3 days before arrival. We remind you at the best time.',
      text: 'MDAC must be submitted within 3 days before arrival. We remind you at the best time.',
    },
  },

  // ============================================
  // SECTION CONFIGURATION
  // ============================================
  sections: {
    // PASSPORT SECTION
    passport: {
      enabled: true,
      icon: '📘',
      sectionKey: 'passport',
      titleKey: 'my.travelInfo.sections.passport.title',
      defaultTitle: 'Passport Information',
      subtitleKey: 'my.travelInfo.sections.passport.subtitle',
      defaultSubtitle: 'Enter the details exactly as shown on your passport',
      fields: {
        surname: {
          fieldName: 'surname',
          required: true,
          maxLength: 50,
          labelKey: 'my.travelInfo.fields.surname',
          defaultLabel: 'Surname',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        middleName: {
          fieldName: 'middleName',
          required: false,
          maxLength: 50,
          labelKey: 'my.travelInfo.fields.middleName',
          defaultLabel: 'Middle Name',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        givenName: {
          fieldName: 'givenName',
          required: true,
          maxLength: 50,
          labelKey: 'my.travelInfo.fields.givenName',
          defaultLabel: 'Given Name',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        passportNo: {
          fieldName: 'passportNo',
          required: true,
          pattern: /^[A-Z0-9]{5,20}$/,
          labelKey: 'my.travelInfo.fields.passportNo',
          defaultLabel: 'Passport Number',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        nationality: {
          fieldName: 'nationality',
          required: true,
          type: 'countrySelect',
          labelKey: 'my.travelInfo.fields.nationality',
          defaultLabel: 'Nationality',
          immediateSave: true,
        },
        dob: {
          fieldName: 'dob',
          required: true,
          type: 'date',
          labelKey: 'my.travelInfo.fields.dob',
          defaultLabel: 'Date of Birth',
          immediateSave: true,
          pastOnly: true,
        },
        expiryDate: {
          fieldName: 'expiryDate',
          required: true,
          type: 'date',
          labelKey: 'my.travelInfo.fields.expiryDate',
          defaultLabel: 'Expiry Date',
          immediateSave: true,
          futureOnly: true,
          minMonthsValid: 6,
        },
        sex: {
          fieldName: 'sex',
          required: true,
          type: 'select',
          options: [
            { label: 'Male', value: 'M' },
            { label: 'Female', value: 'F' },
          ],
          labelKey: 'my.travelInfo.fields.sex',
          defaultLabel: 'Gender',
          immediateSave: true,
        },
        visaNumber: {
          fieldName: 'visaNumber',
          required: false,
          maxLength: 20,
          labelKey: 'my.travelInfo.fields.visaNumber',
          defaultLabel: 'Visa Number',
          immediateSave: false,
        },
      },
    },

    // PERSONAL SECTION
    personal: {
      enabled: true,
      icon: '👤',
      sectionKey: 'personal',
      titleKey: 'my.travelInfo.sections.personal.title',
      defaultTitle: malaysiaLabels.personalInfo.title,
      subtitleKey: 'my.travelInfo.sections.personal.subtitle',
      defaultSubtitle: 'Contact information and occupation',
      fields: {
        occupation: {
          fieldName: 'occupation',
          required: true,
          type: 'select',
          options: [
            { label: 'Office worker', value: 'OFFICE' },
            { label: 'Freelancer', value: 'FREELANCER' },
            { label: 'Student', value: 'STUDENT' },
            { label: 'Self-employed', value: 'SELF_EMPLOYED' },
            { label: 'Homemaker', value: 'HOMEMAKER' },
            { label: 'Retired', value: 'RETIRED' },
            { label: 'Other', value: 'OTHER' },
          ],
          allowCustom: true,
          customFieldName: 'customOccupation',
          customLabel: malaysiaLabels.personalInfo.customOccupationLabel,
          customPlaceholder: malaysiaLabels.personalInfo.customOccupationPlaceholder,
          labelKey: 'my.travelInfo.fields.occupation',
          defaultLabel: 'Occupation',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        cityOfResidence: {
          fieldName: 'cityOfResidence',
          required: true,
          maxLength: 80,
          labelKey: 'my.travelInfo.fields.cityOfResidence',
          defaultLabel: 'City of residence',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        residentCountry: {
          fieldName: 'residentCountry',
          required: true,
          type: 'countrySelect',
          labelKey: 'my.travelInfo.fields.countryOfResidence',
          defaultLabel: 'Country of residence',
          immediateSave: true,
        },
        phoneCode: {
          fieldName: 'phoneCode',
          required: true,
          type: 'phoneCode',
          labelKey: 'my.travelInfo.fields.phoneCode',
          defaultLabel: 'Phone code',
          immediateSave: true,
        },
        phoneNumber: {
          fieldName: 'phoneNumber',
          required: true,
          pattern: /^[0-9]{6,15}$/,
          labelKey: 'my.travelInfo.fields.phoneNumber',
          defaultLabel: 'Phone number',
          immediateSave: true,
        },
        email: {
          fieldName: 'email',
          required: true,
          format: 'email',
          labelKey: 'my.travelInfo.fields.email',
          defaultLabel: 'Email address',
          immediateSave: false,
        },
      },
    },

    // FUNDS SECTION
    funds: {
      enabled: true,
      icon: '💰',
      sectionKey: 'funds',
      titleKey: 'my.travelInfo.sections.funds.title',
      defaultTitle: 'Proof of Funds',
      subtitleKey: 'my.travelInfo.sections.funds.subtitle',
      defaultSubtitle: 'Travel funds and payment methods',
      minRequired: 1,
      maxAllowed: 10,
      fundTypes: malaysiaConfig.funds.fundTypes,
      allowPhoto: true,
      defaultCurrency: 'MYR',
      labels: {
        addFundTitle: malaysiaLabels.funds.addFundTitle,
        emptyTitle: malaysiaLabels.funds.emptyTitle,
        emptyMessage: malaysiaLabels.funds.emptyMessage,
      },
    },

    // TRAVEL SECTION
    travel: {
      enabled: true,
      icon: '✈️',
      sectionKey: 'travel',
      titleKey: 'my.travelInfo.sections.travel.title',
      defaultTitle: malaysiaLabels.travelDetails.title,
      subtitleKey: 'my.travelInfo.sections.travel.subtitle',
      defaultSubtitle: 'Flight and accommodation details',
      fields: {
        travelPurpose: {
          fieldName: 'travelPurpose',
          required: true,
          type: 'select',
          options: [
            { label: 'Tourism', value: 'TOURISM' },
            { label: 'Business', value: 'BUSINESS' },
            { label: 'Visiting family/friends', value: 'VISITING_RELATIVES' },
            { label: 'Transit', value: 'TRANSIT' },
            { label: 'Other', value: 'OTHER' },
          ],
          allowCustom: true,
          customFieldName: 'customTravelPurpose',
          customLabel: 'Other purpose',
          customPlaceholder: 'Please specify',
          labelKey: 'my.travelInfo.fields.travelPurpose',
          defaultLabel: 'Travel purpose',
          smartDefault: 'TOURISM',
          immediateSave: false,
        },
        recentStayCountry: {
          fieldName: 'recentStayCountry',
          required: false,
          type: 'countrySelect',
          labelKey: 'my.travelInfo.fields.recentStayCountry',
          defaultLabel: 'Most recent stay country',
          immediateSave: true,
        },
        boardingCountry: {
          fieldName: 'boardingCountry',
          required: true,
          type: 'countrySelect',
          labelKey: 'my.travelInfo.fields.boardingCountry',
          defaultLabel: 'Boarding country',
          smartDefault: 'fromNationality',
          immediateSave: false,
        },
        arrivalFlightNumber: {
          fieldName: 'arrivalFlightNumber',
          required: true,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'my.travelInfo.fields.arrivalFlightNumber',
          defaultLabel: 'Arrival flight number',
          placeholder: 'e.g., MH123',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        arrivalDate: {
          fieldName: 'arrivalDate',
          required: true,
          type: 'datetime',
          labelKey: 'my.travelInfo.fields.arrivalDate',
          defaultLabel: 'Arrival date',
          futureOnly: true,
          smartDefault: 'tomorrow',
          immediateSave: true,
        },
        departureFlightNumber: {
          fieldName: 'departureFlightNumber',
          required: false,
          pattern: /^[A-Z0-9]{2,8}$/,
          labelKey: 'my.travelInfo.fields.departureFlightNumber',
          defaultLabel: 'Departure flight number',
          placeholder: 'e.g., MH456',
          immediateSave: false,
          uppercaseNormalize: true,
        },
        departureDate: {
          fieldName: 'departureDate',
          required: false,
          type: 'datetime',
          labelKey: 'my.travelInfo.fields.departureDate',
          defaultLabel: 'Departure date',
          smartDefault: 'nextWeek',
          immediateSave: true,
        },
        isTransitPassenger: {
          fieldName: 'isTransitPassenger',
          required: false,
          type: 'boolean',
          labelKey: 'my.travelInfo.fields.isTransitPassenger',
          defaultLabel: 'Are you a transit passenger?',
          default: false,
          immediateSave: true,
        },
        accommodationType: {
          fieldName: 'accommodationType',
          required: true,
          type: 'select',
          options: malaysiaConfig.travelDetails.accommodationOptions,
          allowCustom: true,
          customFieldName: 'customAccommodationType',
          customLabel: 'Other accommodation type',
          labelKey: 'my.travelInfo.fields.accommodationType',
          defaultLabel: 'Accommodation type',
          smartDefault: 'HOTEL',
          immediateSave: false,
        },
        province: {
          fieldName: 'province',
          required: true,
          type: 'location',
          level: 1,
          labelKey: 'my.travelInfo.fields.province',
          defaultLabel: 'State / Province',
          placeholder: 'Select state / province',
          immediateSave: false,
        },
        district: {
          fieldName: 'district',
          required: true,
          type: 'location',
          level: 2,
          dependsOn: 'province',
          labelKey: 'my.travelInfo.fields.district',
          defaultLabel: 'District',
          placeholder: 'Select district',
          immediateSave: false,
        },
        hotelAddress: {
          fieldName: 'hotelAddress',
          required: true,
          maxLength: 200,
          multiline: true,
          labelKey: 'my.travelInfo.fields.hotelAddress',
          defaultLabel: 'Accommodation address',
          placeholder: 'Enter full address',
          immediateSave: false,
        },
      },
      locationHierarchy: {
        levels: 2,
        provincesData: malaysiaStates,
        getDistrictsFunc: getDistrictsByState,
        labels: {
          level1: { key: 'malaysia.travelInfo.locations.state', default: 'State' },
          level2: { key: 'malaysia.travelInfo.locations.district', default: 'District' },
        },
      },
      photoUploads: {
        flightTicket: { enabled: true },
        departureTicket: { enabled: true },
        hotelReservation: { enabled: true },
      },
    },
  },

  // ============================================
  // VALIDATION RULES
  // ============================================
  validation: {
    mode: 'standard' as const,
    validateOnBlur: true,
    showWarnings: true,
    minCompletionPercent: 75,
    requiredSections: ['passport', 'travel'],
    customRules: {
      arrivalDateWithinWindow: {
        field: 'arrivalDate',
        validator: (value: string) => {
          if (!value) {
            return true;
          }
          const arrival = new Date(value);
          const now = new Date();
          // Type assertion to handle the arithmetic operation
          const diffHours = ((arrival as any) - (now as any)) / 36e5;
          return diffHours >= 0 && diffHours <= 720; // 30 days window sanity check
        },
        messageKey: 'my.travelInfo.validation.arrivalDateWithinWindow' as const,
        defaultMessage: 'Arrival date must be within the next 30 days to stay inside the MDAC submission window.',
      },
    },
  },

  // ============================================
  // FEATURES
  // ============================================
  features: {
    autoSave: {
      enabled: true,
      delay: 1500,
      immediateSaveFields: [
        'dob',
        'expiryDate',
        'sex',
        'nationality',
        'arrivalDate',
        'departureDate',
        'isTransitPassenger',
        'phoneCode',
        'phoneNumber',
      ],
    },
    saveStatusIndicator: true,
    lastEditedTimestamp: true,
    privacyNotice: true,
    scrollPositionRestore: true,
    fieldStateTracking: true,
    smartDefaults: true,
    smartButton: true,
    progressOverview: false,
  },

  // ============================================
  // NAVIGATION
  // ============================================
  navigation: {
    previous: 'MalaysiaRequirements' as const,
    next: 'MalaysiaEntryFlow' as const,
    saveBeforeNavigate: true,
    submitButton: {
      dynamic: true, // Enable smart button with dynamic labels

      // Thresholds for label changes (0-1 scale)
      thresholds: {
        incomplete: 0.6,   // Below 60% shows "incomplete" label
        almostDone: 0.8,   // 60-80% shows "almostDone" label
        ready: 0.9,        // 90%+ shows "ready" label
      },

      // Labels for each state (using i18n keys)
      labels: {
        incomplete: {
          key: 'my.travelInfo.buttonLabels.incomplete' as const,
          default: 'Complete required fields',
        },
        almostDone: {
          key: 'my.travelInfo.buttonLabels.almostDone' as const,
          default: 'Almost done',
        },
        ready: {
          key: 'my.travelInfo.buttonLabels.ready' as const,
          default: 'Continue',
        },
      },

      // Default fallback if dynamic is disabled
      default: {
        key: 'my.travelInfo.continue' as const,
        default: 'Continue',
      },

      readyAction: {
        type: 'navigate' as const,
        screen: 'MalaysiaEntryFlow' as const,
      },
    },

    // Fallback submit button label
    submitButtonLabel: {
      key: 'my.travelInfo.continue' as const,
      default: 'Continue',
    },
  },

  // ============================================
  // I18N
  // ============================================
  i18n: {
    defaultLocale: 'zh-CN',
    supportedLocales: ['zh-CN', 'en', 'ms', 'zh-TW'],
    labelSource: malaysiaLabels,
  },
} as const;

export default malaysiaComprehensiveTravelInfoConfig;
