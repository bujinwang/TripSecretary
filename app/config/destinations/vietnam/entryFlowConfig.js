/**
 * Vietnam Entry Flow Configuration
 *
 * Configuration for VietnamEntryFlowScreen template.
 * Defines status tracking, completion criteria, and navigation.
 */

export const vietnamEntryFlowConfig = {
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
    current: 'VietnamEntryFlow',
    travelInfo: 'VietnamTravelInfo',
    submit: null, // Vietnam doesn't have digital arrival card submission
  },

  // Categories to track
  categories: [
    {
      id: 'passport',
      nameKey: 'progressiveEntryFlow.categories.passport',
      defaultName: 'Passport Information',
      icon: '📘',
      requiredFields: [
        'surname',
        'givenName',
        'passportNo',
        'nationality',
        'dob',
        'expiryDate',
        'sex',
      ],
    },
    {
      id: 'personal',
      nameKey: 'progressiveEntryFlow.categories.personal',
      defaultName: 'Personal Information',
      icon: '👤',
      requiredFields: [
        'occupation',
        'cityOfResidence',
        'phoneNumber',
        'email',
      ],
    },
    {
      id: 'funds',
      nameKey: 'progressiveEntryFlow.categories.funds',
      defaultName: 'Proof of Funds',
      icon: '💰',
      minRequired: 1, // At least 1 fund item
      validator: (funds) => funds && funds.length >= 1,
    },
    {
      id: 'travel',
      nameKey: 'progressiveEntryFlow.categories.travel',
      defaultName: 'Travel Information',
      icon: '✈️',
      requiredFields: [
        'travelPurpose',
        'arrivalFlightNumber',
        'arrivalDate',
        'accommodationType',
        'province',
        'hotelAddress',
      ],
    },
  ],

  // Completion criteria
  completion: {
    // Minimum percentage required to submit
    minPercent: 80,

    // Categories that must be 100% complete
    requiredCategories: ['passport'],

    // Optional: custom completion calculator
    // calculateCompletion: (userData) => { ... },
  },

  // Status messages
  status: {
    ready: {
      titleKey: 'vietnam.entryFlow.status.ready.title',
      subtitleKey: 'vietnam.entryFlow.status.ready.subtitle',
      defaultTitle: 'Ready for Entry!',
      defaultSubtitle: 'All information complete',
    },
    mostlyComplete: {
      titleKey: 'vietnam.entryFlow.status.mostlyComplete.title',
      subtitleKey: 'vietnam.entryFlow.status.mostlyComplete.subtitle',
      defaultTitle: 'Almost There',
      defaultSubtitle: 'A few more fields needed',
    },
    needsImprovement: {
      titleKey: 'vietnam.entryFlow.status.needsImprovement.title',
      subtitleKey: 'vietnam.entryFlow.status.needsImprovement.subtitle',
      defaultTitle: 'Please Complete',
      defaultSubtitle: 'More information needed',
    },
  },

  // Submission window (for digital arrival cards)
  submission: {
    hasWindow: false, // Vietnam doesn't have submission window like Thailand TDAC
    windowHours: null,
    reminderHours: null,
    earliestSubmissionHours: null,
    latestSubmissionHours: null,
  },

  // Data change detection
  dataChange: {
    enabled: false, // Don't track data changes for resubmission (no digital card)
    trackFields: [],
  },

  // Feature flags
  features: {
    progressTracking: true,
    categoryBreakdown: true,
    missingFieldsDisplay: true,
    submissionCountdown: false, // No submission window
    dataChangeAlerts: false, // No resubmission needed
    shareFeature: false, // Optional: share entry pack with friend
  },
};

export default vietnamEntryFlowConfig;
