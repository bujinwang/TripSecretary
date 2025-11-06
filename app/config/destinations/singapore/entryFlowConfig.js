/**
 * Singapore Entry Flow Configuration (SG Arrival Card focus)
 */

export const singaporeEntryFlowConfig = {
  destinationId: 'singapore',
  name: 'Singapore',
  nameZh: '新加坡',
  flag: '🇸🇬',

  colors: {
    background: '#F5F7FB',
    primary: '#F97316',
  },

  screens: {
    current: 'SingaporeEntryFlow',
    travelInfo: 'SingaporeTravelInfo',
    submit: 'SGACSelection',
    entryGuide: 'SingaporeEntryGuide',
    entryPackPreview: 'SingaporeEntryPackPreview',
  },

  categories: [
    {
      id: 'passport',
      nameKey: 'progressiveEntryFlow.categories.passport',
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
      nameKey: 'progressiveEntryFlow.categories.funds',
      icon: '💰',
      minRequired: 1,
      validator: (funds) => Array.isArray(funds) && funds.length > 0,
    },
    {
      id: 'travel',
      nameKey: 'progressiveEntryFlow.categories.travel',
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
    minPercent: 85,
    requiredCategories: ['passport', 'travel'],
  },

  status: {
    ready: {
      titleKey: 'singapore.entryFlow.status.ready.title',
      subtitleKey: 'singapore.entryFlow.status.ready.subtitle',
      defaultTitle: 'Ready to Submit SGAC',
      defaultSubtitle: 'All sections complete—submit within the 3-day window.',
    },
    mostly_complete: {
      titleKey: 'singapore.entryFlow.status.mostlyComplete.title',
      subtitleKey: 'singapore.entryFlow.status.mostlyComplete.subtitle',
      defaultTitle: 'Almost ready',
      defaultSubtitle: 'Finish the highlighted fields to proceed with SGAC.',
    },
    needs_improvement: {
      titleKey: 'singapore.entryFlow.status.needsImprovement.title',
      subtitleKey: 'singapore.entryFlow.status.needsImprovement.subtitle',
      defaultTitle: 'Keep going',
      defaultSubtitle: 'Complete the required sections for SG Arrival Card submission.',
    },
  },

  entryFlow: {
    progress: {
      headline: {
        ready: 'singapore.entryFlow.progress.headline.ready',
        almost: 'singapore.entryFlow.progress.headline.almost',
        start: 'singapore.entryFlow.progress.headline.start',
      },
      subtitle: {
        ready: 'singapore.entryFlow.progress.subtitle.ready',
        almost: 'singapore.entryFlow.progress.subtitle.almost',
        start: 'singapore.entryFlow.progress.subtitle.start',
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
    labelKey: 'singapore.entryFlow.submissionWindow',
  },

  dataChange: {
    enabled: true,
    trackFields: ['passport', 'travel', 'funds'],
  },
};

export default singaporeEntryFlowConfig;
