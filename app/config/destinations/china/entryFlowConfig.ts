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
    { id: 'passport', nameKey: 'cn.progressiveEntryFlow.categories.passport', icon: '📘' },
    { id: 'personal', nameKey: 'cn.progressiveEntryFlow.categories.personal', icon: '👤' },
    { id: 'funds', nameKey: 'cn.progressiveEntryFlow.categories.funds', icon: '💰' },
    { id: 'travel', nameKey: 'cn.progressiveEntryFlow.categories.travel', icon: '✈️' },
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
    titleKey: 'cn.entryFlow.title',
    progress: {
      headline: {
        ready: '中国行程准备就绪！🇨🇳',
        almost: '快完成了，继续加油！',
        start: '开始整理中国入境资料吧',
      },
      subtitle: {
        ready: '所有必填信息已完成，可随时应对入境问询。',
        almost: '还差 {{remaining}}%，完善后即可安心过关。',
        start: '填写护照、资金与行程信息，让入境问询更从容。',
      },
      label: '准备进度',
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