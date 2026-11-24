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
      nameKey: 'hk.progressiveEntryFlow.categories.passport',
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
      nameKey: 'hk.progressiveEntryFlow.categories.personal',
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
      nameKey: 'hk.progressiveEntryFlow.categories.funds',
      icon: '💰',
      minRequired: 1,
      validator: (funds: unknown) => Array.isArray(funds) && funds.length > 0,
    },
    {
      id: 'travel',
      nameKey: 'hk.progressiveEntryFlow.categories.travel',
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
      titleKey: 'hk.entryFlow.status.ready.title',
      subtitleKey: 'hk.entryFlow.status.ready.subtitle',
      defaultTitle: '香港行程准备完成',
      defaultSubtitle: '资料齐全，可随时向入境官出示。',
    },
    mostly_complete: {
      titleKey: 'hk.entryFlow.status.mostlyComplete.title',
      subtitleKey: 'hk.entryFlow.status.mostlyComplete.subtitle',
      defaultTitle: '快完成了',
      defaultSubtitle: '补齐剩余资料即可安心出行。',
    },
    needs_improvement: {
      titleKey: 'hk.entryFlow.status.needsImprovement.title',
      subtitleKey: 'hk.entryFlow.status.needsImprovement.subtitle',
      defaultTitle: '继续完善信息',
      defaultSubtitle: '完成关键资料以避免入境受阻。',
    },
  },

  entryFlow: {
    progress: {
      headline: {
        ready: '香港行程准备就绪！🇭🇰',
        almost: '快完成了，继续加油！',
        start: '开始整理香港入境资料吧',
      },
      subtitle: {
        ready: '所有必填信息已完成，可随时应对入境问询。',
        almost: '还差 {{remaining}}%，完善后即可安心过关。',
        start: '填写护照、资金与行程信息，让入境问询更从容。',
      },
      label: '准备进度',
    },
    submissionWindow: 'hk.entryFlow.submissionWindow',
    titleKey: 'hk.entryFlow.title',
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
