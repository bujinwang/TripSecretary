import { EntryFlowConfig } from '../types';

/**
 * Singapore Entry Flow Configuration (SG Arrival Card focus)
 */

export const singaporeEntryFlowConfig: EntryFlowConfig = {
  destinationId: 'sg',
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
        ready: '新加坡行程准备就绪！🇸🇬',
        almost: '快完成了，继续加油！',
        start: '开始整理新加坡入境资料吧',
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
    labelKey: 'singapore.entryFlow.submissionWindow',
  },

  dataChange: {
    enabled: true,
    trackFields: ['passport', 'travel', 'funds'],
  },
};

export default singaporeEntryFlowConfig;
