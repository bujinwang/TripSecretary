// @ts-nocheck

/**
 * Japan Entry Flow Configuration
 *
 * Matches the shared EntryFlowScreenTemplate structure (same pattern as Malaysia).
 */

export const japanEntryFlowConfig = {
  destinationId: 'japan',
  name: 'Japan',
  nameZh: '日本',
  flag: '🇯🇵',

  colors: {
    background: '#F5F7FA',
    primary: '#DC2626',
  },

  screens: {
    current: 'JapanEntryFlow',
    travelInfo: 'JapanTravelInfo',
    submit: null,
    entryGuide: 'JapanEntryGuide',
    entryPackPreview: 'JapanEntryPackPreview',
  },

  categories: [
    {
      id: 'passport',
      nameKey: 'japan.progressiveEntryFlow.categories.passport',
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
      nameKey: 'japan.progressiveEntryFlow.categories.personal',
      icon: '👤',
      requiredFields: [
        'occupation',
        'cityOfResidence',
        'countryOfResidence',
        'phoneCode',
        'phoneNumber',
        'email',
      ],
    },
    {
      id: 'funds',
      nameKey: 'japan.progressiveEntryFlow.categories.funds',
      icon: '💰',
      minRequired: 1,
      validator: (funds) => Array.isArray(funds) && funds.length > 0,
    },
    {
      id: 'travel',
      nameKey: 'japan.progressiveEntryFlow.categories.travel',
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

  completion: {
    minPercent: 80,
    requiredCategories: ['passport', 'travel'],
  },

  status: {
    ready: {
      titleKey: null,
      subtitleKey: null,
    },
    mostly_complete: {
      titleKey: null,
      subtitleKey: null,
    },
    needs_improvement: {
      titleKey: null,
      subtitleKey: null,
    },
  },

  entryFlow: {
    progress: {
      headline: {
        ready: null,
        almost: null,
        start: null,
      },
      subtitle: {
        ready: null,
        almost: null,
        start: null,
      },
    },
  },

  features: {
    entryGuideQuickAction: true,
    submissionCountdown: false,
    disableEditQuickAction: false,
    disablePreviewQuickAction: false,
  },

  submission: {
    hasWindow: false,
    windowHours: null,
    reminderHours: null,
  },
};

export default japanEntryFlowConfig;
