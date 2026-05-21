import { EntryFlowConfig } from '../types';

/**
 * Japan Entry Flow Configuration
 *
 * Matches the shared EntryFlowScreenTemplate structure (same pattern as Malaysia).
 */

export const japanEntryFlowConfig: EntryFlowConfig = {
  destinationId: 'jp',
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
        ready: '日本行程准备就绪！🇯🇵',
        almost: '快完成了，继续加油！',
        start: '开始整理日本入境资料吧',
      },
      subtitle: {
        ready: '所有必填信息已完成，可随时应对入境问询。',
        almost: '还差 {{remaining}}%，完善后即可安心过关。',
        start: '填写护照、资金与行程信息，让入境问询更从容。',
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
