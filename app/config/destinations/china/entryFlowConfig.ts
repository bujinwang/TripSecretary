export const chinaEntryFlowConfig = {
  destinationId: 'cn',
  name: 'China',
  nameZh: '中国',
  flag: '🇨🇳',

  colors: {
    background: '#F9FAFB',
    primary: '#DC2626',
  },

  screens: {
    current: 'ChinaEntryFlow',
    travelInfo: 'ChinaTravelInfo',
    submit: null,
    entryGuide: null,
    entryPackPreview: 'ChinaEntryPackPreview',
  },

  categories: [
    { id: 'passport', nameKey: 'progressiveEntryFlow.categories.passport', icon: '📘' },
    { id: 'personal', nameKey: 'progressiveEntryFlow.categories.personal', icon: '👤' },
    { id: 'funds', nameKey: 'progressiveEntryFlow.categories.funds', icon: '💰' },
    { id: 'travel', nameKey: 'progressiveEntryFlow.categories.travel', icon: '✈️' },
  ],

  completion: {
    minPercent: 75,
    requiredCategories: ['passport', 'travel'],
  },

  status: {
    ready: {
      defaultTitle: '行程准备完成',
      defaultSubtitle: '资料齐全，可随时应对入境问询。',
    },
    mostly_complete: {
      defaultTitle: '快完成了',
      defaultSubtitle: '补齐剩余资料以确保顺利入境。',
    },
    needs_improvement: {
      defaultTitle: '继续完善信息',
      defaultSubtitle: '完成关键资料避免入境受阻。',
    },
  },

  entryFlow: {
    titleKey: 'china.entryFlow.title',
    progress: {
      headline: {
        ready: 'china.entryFlow.progress.headline.ready',
        almost: 'china.entryFlow.progress.headline.almost',
        start: 'china.entryFlow.progress.headline.start',
      },
      subtitle: {
        ready: 'china.entryFlow.progress.subtitle.ready',
        almost: 'china.entryFlow.progress.subtitle.almost',
        start: 'china.entryFlow.progress.subtitle.start',
      },
      label: 'china.entryFlow.progress.label',
    },
  },

  features: {
    entryGuideQuickAction: false,
    submissionCountdown: false,
    dataChangeAlerts: true,
    disablePreviewQuickAction: false,
    disableEditQuickAction: false,
  },
};

export default chinaEntryFlowConfig;