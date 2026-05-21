import { EntryFlowConfig } from '../types';

/**
 * South Korea Entry Flow Configuration
 *
 * Used by EntryFlowScreenTemplate to render the entry preparation status screen.
 * Categories match the sections from koreaComprehensiveTravelInfoConfig.
 */

export const koreaEntryFlowConfig: EntryFlowConfig = {
  destinationId: 'kr',
  name: 'South Korea',
  nameZh: '韩国',
  flag: '🇰🇷',

  colors: {
    background: '#F9FAFB',
    primary: '#2563EB',
  },

  screens: {
    current: 'KoreaEntryFlow',
    travelInfo: 'KoreaTravelInfo',
    submit: null,
    entryGuide: 'KoreaEntryGuide',
    entryPackPreview: 'KoreaEntryPackPreview',
  },

  categories: [
    {
      id: 'passport',
      nameKey: 'kr.progressiveEntryFlow.categories.passport',
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
      nameKey: 'kr.progressiveEntryFlow.categories.personal',
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
      nameKey: 'kr.progressiveEntryFlow.categories.funds',
      icon: '💰',
      minRequired: 1,
      validator: (funds: any) => Array.isArray(funds) && funds.length > 0,
    },
    {
      id: 'travel',
      nameKey: 'kr.progressiveEntryFlow.categories.travel',
      icon: '✈️',
      requiredFields: [
        'travelPurpose',
        'arrivalFlightNumber',
        'arrivalDate',
        'departureFlightNumber',
        'departureDate',
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
      titleKey: 'kr.entryFlow.status.ready.title',
      subtitleKey: 'kr.entryFlow.status.ready.subtitle',
      defaultTitle: '韩国行程准备完成',
      defaultSubtitle: '资料齐全，可随时应付入境问询。',
    },
    mostly_complete: {
      titleKey: 'kr.entryFlow.status.mostlyComplete.title',
      subtitleKey: 'kr.entryFlow.status.mostlyComplete.subtitle',
      defaultTitle: '快完成了',
      defaultSubtitle: '补齐剩余资料以确保顺利入境。',
    },
    needs_improvement: {
      titleKey: 'kr.entryFlow.status.needsImprovement.title',
      subtitleKey: 'kr.entryFlow.status.needsImprovement.subtitle',
      defaultTitle: '继续完善信息',
      defaultSubtitle: '完成关键资料避免入境受阻。',
    },
  },

  entryFlow: {
    welcomeTitleKey: 'kr.entryFlow.welcome.title',
    welcomeSubtitleKey: 'kr.entryFlow.welcome.subtitle',
    defaultWelcomeTitle: '欢迎使用韩国入境助手',
    defaultWelcomeSubtitle: '准备以下所需信息以确保顺利入境',

    // Progress section — secondary fallback when i18n keys are missing
    // (primary i18n keys are `${destinationId}.entryFlow.progress.*`)
    progress: {
      headline: {
        ready: '韩国行程准备完成！🇰🇷',
        almost: '快完成了，继续加油！',
        start: '让我们开始准备韩国之旅！🌺',
      },
      subtitle: {
        ready: '太棒了！你的韩国之旅已经准备好了！',
        almost: '再加把劲！只需完成剩余 {remaining}% 的信息',
        start: '继续填写信息，让入境更顺畅。',
      },
      label: '准备进度',
    },
  },

  features: {
    arrivalCard: true,
    keta: true,
    submissionCountdown: true,
    refreshControl: true,
  },

  submission: {
    keta: {
      required: true,
      submissionWindowHours: 72,
    },
  },
};

export default koreaEntryFlowConfig;
