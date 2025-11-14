// @ts-nocheck

export const taiwanEntryFlowConfig = {
  destinationId: 'tw',
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
      nameKey: 'tw.entryFlow.categories.passport',
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
      nameKey: 'tw.entryFlow.categories.personal',
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
      nameKey: 'tw.entryFlow.categories.travel',
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
      titleKey: 'tw.entryFlow.status.ready.title',
      subtitleKey: 'tw.entryFlow.status.ready.subtitle',
    },
    mostly_complete: {
      titleKey: 'tw.entryFlow.status.mostlyComplete.title',
      subtitleKey: 'tw.entryFlow.status.mostlyComplete.subtitle',
    },
    needs_improvement: {
      titleKey: 'tw.entryFlow.status.needsImprovement.title',
      subtitleKey: 'tw.entryFlow.status.needsImprovement.subtitle',
    },
  },

  entryFlow: {
    titleKey: 'tw.entryFlow.title',
    progress: {
      headline: {
        ready: 'tw.entryFlow.progress.headline.ready',
        almost: 'tw.entryFlow.progress.headline.almost',
        start: 'tw.entryFlow.progress.headline.start',
      },
      subtitle: {
        ready: 'tw.entryFlow.progress.subtitle.ready',
        almost: 'tw.entryFlow.progress.subtitle.almost',
        start: 'tw.entryFlow.progress.subtitle.start',
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
    labelKey: 'tw.entryFlow.submissionWindow',
  },
};

export default taiwanEntryFlowConfig;
