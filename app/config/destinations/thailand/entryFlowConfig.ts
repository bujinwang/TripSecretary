import { EntryFlowConfig } from '../types';

/**
 * Thailand Entry Flow Configuration
 *
 * Used by EntryFlowScreenTemplate to render the entry preparation status screen.
 * Categories match the sections from thailandComprehensiveTravelInfoConfig.
 */

export const thailandEntryFlowConfig: EntryFlowConfig = {
  destinationId: 'th',
  name: 'Thailand',
  nameZh: '泰国',
  flag: '🇹🇭',

  colors: {
    background: '#F9FAFB',
    primary: '#1E40AF',
  },

  screens: {
    current: 'ThailandEntryFlow',
    travelInfo: 'ThailandTravelInfo',
    submit: null,
    entryGuide: 'ThailandInteractiveGuide',
    entryPackPreview: 'ThailandEntryPackPreview',
  },

  categories: [
    {
      id: 'passport',
      nameKey: 'th.progressiveEntryFlow.categories.passport',
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
      nameKey: 'th.progressiveEntryFlow.categories.personal',
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
      nameKey: 'th.progressiveEntryFlow.categories.funds',
      icon: '💰',
      minRequired: 1,
      validator: (funds: any) => Array.isArray(funds) && funds.length > 0,
    },
    {
      id: 'travel',
      nameKey: 'th.progressiveEntryFlow.categories.travel',
      icon: '✈️',
      requiredFields: [
        'travelPurpose',
        'arrivalFlightNumber',
        'arrivalDate',
        'departureFlightNumber',
        'departureDate',
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
      titleKey: 'th.entryFlow.status.ready.title',
      subtitleKey: 'th.entryFlow.status.ready.subtitle',
      defaultTitle: '泰国行程准备完成',
      defaultSubtitle: '资料齐全，可随时应付入境问询。',
    },
    mostly_complete: {
      titleKey: 'th.entryFlow.status.mostlyComplete.title',
      subtitleKey: 'th.entryFlow.status.mostlyComplete.subtitle',
      defaultTitle: '快完成了',
      defaultSubtitle: '补齐剩余资料以确保顺利入境。',
    },
    needs_improvement: {
      titleKey: 'th.entryFlow.status.needsImprovement.title',
      subtitleKey: 'th.entryFlow.status.needsImprovement.subtitle',
      defaultTitle: '继续完善信息',
      defaultSubtitle: '完成关键资料避免入境受阻。',
    },
  },

  entryFlow: {
    welcomeTitleKey: 'th.entryFlow.welcome.title',
    welcomeSubtitleKey: 'th.entryFlow.welcome.subtitle',
    defaultWelcomeTitle: '欢迎使用泰国入境助手',
    defaultWelcomeSubtitle: '准备以下所需信息以确保顺利入境',

    // Progress section — secondary fallback when i18n keys are missing
    progress: {
      headline: {
        ready: '泰国行程准备完成！🇹🇭',
        almost: '快完成了，继续加油！',
        start: '让我们开始准备泰国之旅！🌺',
      },
      subtitle: {
        ready: '太棒了！你的泰国之旅已经准备好了！',
        almost: '再加把劲！只需完成剩余 {remaining}% 的信息',
        start: '继续填写信息，让入境更顺畅。',
      },
      label: '准备进度',
    },
  },

  features: {
    arrivalCard: true,
    tdac: true,
    submissionCountdown: true,
    refreshControl: true,
  },

  submission: {
    tdac: {
      required: false,
      submissionWindowHours: 72,
    },
  },
};

export default thailandEntryFlowConfig;
