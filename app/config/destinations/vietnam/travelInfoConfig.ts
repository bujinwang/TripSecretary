// @ts-nocheck

/**
 * Vietnam Travel Info Configuration
 *
 * Configuration for VietnamTravelInfoScreen template.
 * Defines sections, fields, validation rules, and behavior.
 */

export const vietnamTravelInfoConfig = {
  // Basic Metadata
  destinationId: 'vn',
  name: 'Vietnam',
  flag: '🇻🇳',

  // Colors (optional - uses theme defaults if not specified)
  colors: {
    background: '#F9FAFB',
    primary: '#2196F3',
  },

  // Screen navigation mapping
  screens: {
    current: 'VietnamTravelInfo',
    next: 'VietnamEntryFlow', // Navigate here after completion (if exists)
    previous: 'VietnamRequirements',
  },

  // Sections configuration
  sections: {
    passport: {
      enabled: true,
      icon: '📘',
      titleKey: 'vietnam.travelInfo.sections.passport.title',
      fields: [
        'surname',
        'givenName',
        'passportNo',
        'nationality',
        'dob',
        'expiryDate',
        'sex',
      ],
    },

    personal: {
      enabled: true,
      icon: '👤',
      titleKey: 'vietnam.travelInfo.sections.personal.title',
      fields: [
        'occupation',
        'cityOfResidence',
        'residentCountry',
        'phoneCode',
        'phoneNumber',
        'email',
      ],
    },

    funds: {
      enabled: true,
      icon: '💰',
      titleKey: 'vietnam.travelInfo.sections.funds.title',
      minRequired: 1, // At least 1 fund item required
      maxAllowed: 10, // Up to 10 fund items
    },

    travel: {
      enabled: true,
      icon: '✈️',
      titleKey: 'vietnam.travelInfo.sections.travel.title',
      fields: [
        'travelPurpose',
        'arrivalFlightNumber',
        'arrivalArrivalDate',
        'departureFlightNumber',
        'departureDepartureDate',
        'accommodationType',
        'province',
        'district',
        'hotelAddress',
        'postalCode',
      ],

      // Location hierarchy: 2 levels (province -> district)
      locationHierarchy: {
        enabled: true,
        levels: 2,
        fields: {
          province: {
            required: true,
            dataSource: 'vietnamProvinces',
          },
          district: {
            required: false,
            dataSource: 'vietnamDistricts',
            dependsOn: 'province',
          },
        },
      },
    },
  },

  // Validation rules (field-level)
  validation: {
    passport: {
      passportNo: {
        required: true,
        pattern: /^[A-Z0-9]{5,20}$/,
        messageKey: 'validation.passportNo.invalid',
      },
      expiryDate: {
        required: true,
        minMonthsValid: 6, // Must be valid for at least 6 months
        messageKey: 'validation.expiryDate.tooSoon',
      },
      nationality: {
        required: true,
      },
    },

    personal: {
      email: {
        required: false,
        format: 'email',
        messageKey: 'validation.email.invalid',
      },
      phoneNumber: {
        required: true,
        pattern: /^[0-9]{6,15}$/,
        messageKey: 'validation.phoneNumber.invalid',
      },
    },

    travel: {
      arrivalArrivalDate: {
        required: true,
        futureOnly: true,
        messageKey: 'validation.arrivalDate.mustBeFuture',
      },
      province: {
        required: true,
        messageKey: 'validation.province.required',
      },
      accommodationType: {
        required: true,
        messageKey: 'validation.accommodationType.required',
      },
    },
  },

  // Completion criteria
  completion: {
    minPercent: 80, // Must complete 80% of fields to continue
    requiredSections: ['passport', 'travel'], // These sections must be complete
  },

  // Feature flags
  features: {
    photoUpload: true,
    autoSave: true,
    saveDebounceDuration: 2000, // 2 seconds
    locationAutoComplete: false,
    multiLanguage: true,
    offlineMode: true,

    // DESIGN DECISION: Do not show completion progress overview at screen top
    // Each section header already shows its own progress (e.g., "7/7")
    // See: docs/architecture/Architecture-Decision-Records.md - ADR 9
    showProgressOverview: false,
  },

  // Submission window (for digital arrival cards)
  submission: {
    hasWindow: false, // Vietnam doesn't have submission window like Thailand TDAC
    windowHours: null,
    reminderHours: null,
  },

  // i18n translations
  i18n: {
    labelSource: {
      passport: {
        title: '护照信息',
        subtitle: '护照详细信息',
        introText: '请确保与护照完全一致，入境时会核对。',
      },
      personal: {
        title: '个人资料',
        subtitle: '联系与职业详情',
        introText: '保持联系方式畅通，方便越南官方联系。',
      },
      funds: {
        title: '资金证明',
        subtitle: '旅行资金证明',
        introText: '建议准备足够资金证明以备查验。',
      },
      travel: {
        title: '旅行信息',
        subtitle: '航班与住宿信息',
        introText: '提前确认航班与住宿，有助于快速通关。',
      },
    },
  },
};

export default vietnamTravelInfoConfig;
