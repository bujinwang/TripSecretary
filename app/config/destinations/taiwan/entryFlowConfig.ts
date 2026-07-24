import { EntryFlowConfig } from '../types';

export const taiwanEntryFlowConfig: EntryFlowConfig = {
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
        ready: '台湾行程准备就绪！🇹🇼',
        almost: '快完成了，继续加油！',
        start: '开始整理台湾入境资料吧',
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
