import { EntryFlowConfig } from '../types';

/**
 * United States Entry Flow Configuration
 */

export const usaEntryFlowConfig: EntryFlowConfig = {
  destinationId: 'us',
  name: 'United States',
  nameZh: '美国',
  flag: '🇺🇸',

  colors: {
    background: '#F9FAFB',
    primary: '#1D4ED8',
  },

  screens: {
    current: 'USAEntryFlow',
    travelInfo: 'USTravelInfo',
    submit: null,
    entryGuide: 'USAEntryGuide',
    entryPackPreview: 'USAEntryPackPreview',
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
        'lengthOfStay',
        'accommodationType',
        'province',
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
      titleKey: 'usa.entryFlow.status.ready.title',
      subtitleKey: 'usa.entryFlow.status.ready.subtitle',
      defaultTitle: '美国行程准备完成',
      defaultSubtitle: '资料齐全，可随时应对入境问询。',
    },
    mostly_complete: {
      titleKey: 'usa.entryFlow.status.mostlyComplete.title',
      subtitleKey: 'usa.entryFlow.status.mostlyComplete.subtitle',
      defaultTitle: '快完成了',
      defaultSubtitle: '补齐剩余资料以确保顺利入境。',
    },
    needs_improvement: {
      titleKey: 'usa.entryFlow.status.needsImprovement.title',
      subtitleKey: 'usa.entryFlow.status.needsImprovement.subtitle',
      defaultTitle: '继续完善信息',
      defaultSubtitle: '完成关键资料避免入境受阻。',
    },
  },

  entryFlow: {
    progress: {
      headline: {
        ready: '美国行程准备就绪！🇺🇸',
        almost: '快完成了，继续加油！',
        start: '开始整理美国入境资料吧',
      },
      subtitle: {
        ready: '所有必填信息已完成，可随时应对入境问询。',
        almost: '还差 {{remaining}}%，完善后即可安心过关。',
        start: '填写护照、资金与行程信息，让入境问询更从容。',
      },
    },
    submissionWindow: 'usa.entryFlow.submissionWindow',
    titleKey: 'usa.entryFlow.title',
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

export default usaEntryFlowConfig;
