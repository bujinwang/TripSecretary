// @ts-nocheck

/**
 * Hong Kong Entry Flow Configuration
 *
 * Drives the shared EntryFlowScreenTemplate.
 */

export const hongkongEntryFlowConfig = {
  destinationId: 'hk',
  name: 'Hong Kong',
  nameZh: '香港',
  flag: '🇭🇰',

  colors: {
    background: '#F9FAFB',
    primary: '#C62828',
  },

  screens: {
    current: 'HongKongEntryFlow',
    travelInfo: 'HongKongTravelInfo',
    submit: null,
    entryGuide: 'HongKongEntryGuide',
    entryPackPreview: 'HongKongEntryPackPreview',
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
        'district',
        'hotelAddress',
      ],
    },
  ],

  completion: {
    minPercent: 75,
    requiredCategories: ['passport', 'travel'],
  },

  status: {
    ready: {
      titleKey: 'hongkong.entryFlow.status.ready.title',
      subtitleKey: 'hongkong.entryFlow.status.ready.subtitle',
      defaultTitle: '香港行程准备完成',
      defaultSubtitle: '资料齐全，可随时向入境官出示。',
    },
    mostly_complete: {
      titleKey: 'hongkong.entryFlow.status.mostlyComplete.title',
      subtitleKey: 'hongkong.entryFlow.status.mostlyComplete.subtitle',
      defaultTitle: '快完成了',
      defaultSubtitle: '补齐剩余资料即可安心出行。',
    },
    needs_improvement: {
      titleKey: 'hongkong.entryFlow.status.needsImprovement.title',
      subtitleKey: 'hongkong.entryFlow.status.needsImprovement.subtitle',
      defaultTitle: '继续完善信息',
      defaultSubtitle: '完成关键资料以避免入境受阻。',
    },
  },

  entryFlow: {
    progress: {
      headline: {
        ready: 'hongkong.entryFlow.progress.headline.ready',
        almost: 'hongkong.entryFlow.progress.headline.almost',
        start: 'hongkong.entryFlow.progress.headline.start',
      },
      subtitle: {
        ready: 'hongkong.entryFlow.progress.subtitle.ready',
        almost: 'hongkong.entryFlow.progress.subtitle.almost',
        start: 'hongkong.entryFlow.progress.subtitle.start',
      },
      label: 'hongkong.entryFlow.progress.label',
    },
    submissionWindow: 'hongkong.entryFlow.submissionWindow',
    titleKey: 'hongkong.entryFlow.title',
  },

  features: {
    entryGuideQuickAction: true,
    submissionCountdown: false,
    dataChangeAlerts: true,
    disablePreviewQuickAction: false,
    disableEditQuickAction: false,
  },

  submission: {
    hasWindow: false,
  },

  dataChange: {
    enabled: true,
    trackFields: ['passport', 'travel', 'funds'],
  },
};

export default hongkongEntryFlowConfig;
