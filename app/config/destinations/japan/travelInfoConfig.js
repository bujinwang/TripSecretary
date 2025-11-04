/**
 * Japan Travel Info Configuration
 *
 * Configuration for JapanTravelInfoScreen template.
 * Defines sections, fields, validation rules, and behavior.
 */

export const japanTravelInfoConfig = {
  // Basic Metadata
  destinationId: 'jp',
  name: 'Japan',
  flag: '🇯🇵',

  // Colors (optional - uses theme defaults if not specified)
  colors: {
    background: '#F9FAFB',
    primary: '#DC2626', // Japan's red theme
  },

  // Screen navigation mapping
  screens: {
    current: 'JapanTravelInfo',
    next: 'JapanEntryFlow', // Navigate here after completion (if exists)
    previous: 'JapanRequirements',
  },

  // Sections configuration
  sections: {
    passport: {
      enabled: true,
      icon: '📘',
      titleKey: 'japan.travelInfo.sections.passport.title',
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
      titleKey: 'japan.travelInfo.sections.personal.title',
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
      titleKey: 'japan.travelInfo.sections.funds.title',
      minRequired: 1, // At least 1 fund item required
      maxAllowed: 10, // Up to 10 fund items
    },

    travel: {
      enabled: true,
      icon: '✈️',
      titleKey: 'japan.travelInfo.sections.travel.title',
      fields: [
        'travelPurpose',
        'arrivalFlightNumber',
        'arrivalArrivalDate',
        'departureFlightNumber',
        'departureDepartureDate',
        'accommodationType',
        'prefecture',
        'city',
        'hotelAddress',
        'postalCode',
      ],

      // Location hierarchy: 2 levels (prefecture -> city)
      locationHierarchy: {
        enabled: true,
        levels: 2,
        fields: {
          prefecture: {
            required: true,
            dataSource: 'japanPrefectures',
          },
          city: {
            required: false,
            dataSource: 'japanCities',
            dependsOn: 'prefecture',
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
      prefecture: {
        required: true,
        messageKey: 'validation.prefecture.required',
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

    // Japan doesn't have digital arrival card, so similar to Vietnam
    showProgressOverview: false,
  },

  // Submission window (no digital arrival card)
  submission: {
    hasWindow: false, // Japan doesn't have submission window like Thailand TDAC
    windowHours: null,
    reminderHours: null,
  },

  // i18n configuration
  i18n: {
    namespace: 'japan.travelInfo',
    fallbackLanguage: 'en',
  },
};

export default japanTravelInfoConfig;