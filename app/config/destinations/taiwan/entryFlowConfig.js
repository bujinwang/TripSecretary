export const taiwanEntryFlowConfig = {
  destinationId: 'taiwan',
  name: 'Taiwan',
  nameZh: '台湾',
  flag: '🇹🇼',

  colors: {
    background: '#F5F7FB',
    primary: '#EF4444',
  },

  screens: {
    current: 'TaiwanEntryFlow',
    travelInfo: 'TaiwanTravelInfo',
    submit: 'TWArrivalSelection',
    entryGuide: 'TWArrivalGuide',
    entryPackPreview: 'TaiwanEntryPackPreview',
  },

  categories: [
    {
      id: 'passport',
      nameKey: 'taiwan.entryFlow.categories.passport',
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
      nameKey: 'taiwan.entryFlow.categories.personal',
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
      id: 'travel',
      nameKey: 'taiwan.entryFlow.categories.travel',
      icon: '✈️',
      requiredFields: [
        'travelPurpose',
        'arrivalFlightNumber',
        'arrivalDate',
        'stayDuration',
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
      titleKey: 'taiwan.entryFlow.status.ready.title',
      subtitleKey: 'taiwan.entryFlow.status.ready.subtitle',
    },
    mostly_complete: {
      titleKey: 'taiwan.entryFlow.status.mostlyComplete.title',
      subtitleKey: 'taiwan.entryFlow.status.mostlyComplete.subtitle',
    },
    needs_improvement: {
      titleKey: 'taiwan.entryFlow.status.needsImprovement.title',
      subtitleKey: 'taiwan.entryFlow.status.needsImprovement.subtitle',
    },
  },

  entryFlow: {
    titleKey: 'taiwan.entryFlow.title',
    progress: {
      headline: {
        ready: 'taiwan.entryFlow.progress.headline.ready',
        almost: 'taiwan.entryFlow.progress.headline.almost',
        start: 'taiwan.entryFlow.progress.headline.start',
      },
      subtitle: {
        ready: 'taiwan.entryFlow.progress.subtitle.ready',
        almost: 'taiwan.entryFlow.progress.subtitle.almost',
        start: 'taiwan.entryFlow.progress.subtitle.start',
      },
    },
  },

  features: {
    entryGuideQuickAction: true,
    submissionCountdown: true,
    dataChangeAlerts: true,
    disablePreviewQuickAction: false,
    disableEditQuickAction: false,
  },

  submission: {
    hasWindow: true,
    windowHours: 72,
    reminderHours: 24,
    labelKey: 'taiwan.entryFlow.submissionWindow',
  },
};

export default taiwanEntryFlowConfig;
