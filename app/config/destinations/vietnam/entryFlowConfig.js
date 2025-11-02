/**
 * Vietnam Entry Flow Configuration
 *
 * Configuration for VietnamEntryFlowScreen template.
 * Defines status tracking, completion criteria, and navigation.
 */

export const vietnamEntryFlowConfig = {
  // Basic Metadata
  destinationId: 'vn',
  name: 'Vietnam',
  flag: '🇻🇳',

  // Colors (optional - uses theme defaults if not specified)
  colors: {
    background: '#F9FAFB',
    primary: '#2196F3',
  },

  // Screen navigation mapping
  screens: {
    current: 'VietnamEntryFlow',
    travelInfo: 'VietnamTravelInfo',
    submit: null, // Vietnam doesn't have digital arrival card submission
    entryGuide: 'VietnamEntryGuide',
  },

  // Categories to track
  categories: [
    {
      id: 'passport',
      nameKey: 'progressiveEntryFlow.categories.passport',
      defaultName: 'Passport Information',
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
      defaultName: 'Personal Information',
      icon: '👤',
      requiredFields: [
        'occupation',
        'cityOfResidence',
        'phoneNumber',
        'email',
      ],
    },
    {
      id: 'funds',
      nameKey: 'progressiveEntryFlow.categories.funds',
      defaultName: 'Proof of Funds',
      icon: '💰',
      minRequired: 1, // At least 1 fund item
      validator: (funds) => funds && funds.length >= 1,
    },
    {
      id: 'travel',
      nameKey: 'progressiveEntryFlow.categories.travel',
      defaultName: 'Travel Information',
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

  // Completion criteria
  completion: {
    // Minimum percentage required to submit
    minPercent: 80,

    // Categories that must be 100% complete
    requiredCategories: ['passport'],

    // Optional: custom completion calculator
    // calculateCompletion: (userData) => { ... },
  },

  // UI configuration for template states
  ui: {
    successCelebration: {
      enabled: true,
      completionPercent: 100,
      hero: {
        icon: '🎉',
        defaultTitle: '100% 越南准备就绪！🌴',
        defaultSubtitle: '入境资料已准备完成，可以随时查看与分享。',
      },
      primaryAction: {
        type: 'navigate',
        screenKey: 'requirements',
        icon: '🛂',
        defaultTitle: '开始入境流程',
        defaultSubtitle: '查看完整的入境指引和注意事项',
        gradientColors: ['#0BD67B', '#16A34A'],
      },
      secondaryCards: [
        {
          id: 'view_info',
          icon: '📂',
          defaultTitle: '查看我的入境资料',
          defaultSubtitle: '重新查看所有已经填写的信息',
          type: 'navigate',
          screenKey: 'travelInfo',
          borderColor: 'rgba(11, 214, 123, 0.3)',
        },
        {
          id: 'edit_info',
          icon: '✏️',
          defaultTitle: '编辑旅行信息',
          defaultSubtitle: '如需修改，可以随时返回编辑',
          type: 'navigate',
          screenKey: 'travelInfo',
          borderColor: 'rgba(255, 152, 0, 0.3)',
        },
      ],
    },
    noDataState: {
      enabled: true,
      defaultTitle: '准备开始越南之旅吧！',
      defaultSubtitle: '我们会一步步帮你完成所有必需的入境资料。',
      hints: [
        { icon: '📘', defaultText: '护照信息 - 让越南认识你' },
        { icon: '📞', defaultText: '联系方式 - 越南怎么找到你' },
        { icon: '💰', defaultText: '资金证明 - 证明你能好好玩' },
        { icon: '✈️', defaultText: '航班与住宿 - 你的旅行计划' },
      ],
      primaryAction: {
        type: 'navigate',
        screenKey: 'travelInfo',
        defaultTitle: '开始填写越南入境信息',
      },
    },
    progressEncouragement: {
      enabled: true,
      primaryAction: {
        type: 'navigate',
        screenKey: 'travelInfo',
        icon: '✏️',
        defaultTitle: '修改旅行信息',
        defaultSubtitle: '如需修改，返回编辑',
        gradientColors: ['#FF9D3A', '#FF6F3C'],
      },
      gradientColors: ['#FFB347', '#FF7E5F'],
      progressBarColor: 'rgba(255,255,255,0.9)',
      progressLabelKey: 'entryFlow.progress.percentLabel',
      quickActionsLayout: 'stack',
      statusMessages: {
        ready: {
          headline: { default: '准备完成！🎉' },
          subtitle: { default: '{{destination}}行程准备完成，可以提交啦！' },
        },
        almost: {
          headline: { default: '进展不错！💪' },
          subtitle: { default: '继续加油！还差 {{remainingPercent}}% 就能完成{{destination}}行程准备！' },
        },
        progress: {
          headline: { default: '继续加油！' },
          subtitle: { default: '还差 {{remainingPercent}}% 就能完成！' },
        },
        start: {
          headline: { default: '让我们开始吧！' },
          subtitle: { default: '点击下方按钮，我们会引导你完成Vietnam入境准备。' },
        },
      },
      countdown: {
        enabled: true,
        accentColor: '#FF7043',
        backgroundColor: '#FFF5E6',
        borderColor: 'rgba(255,159,64,0.4)',
        icon: '⏰',
        messages: {
          defaultTitle: '距离提交入境卡还有',
          defaultMessage: '提交窗口已开启，请在倒计时结束前完成提交',
          defaultArrivalDate: '抵达日期 {{arrivalDate}}',
        },
      },
      quickActions: [
        {
          id: 'view_info',
          icon: '📂',
          defaultTitle: '查看我的入境资料',
          defaultSubtitle: '快速查看已填写的所有信息',
          type: 'navigate',
          targetScreen: 'EntryPackPreview',
          includeUserData: true,
          includeCompletionSummary: true,
          params: { mode: 'preview' },
          borderColor: 'rgba(11, 214, 123, 0.3)',
          iconBackgroundColor: 'rgba(11, 214, 123, 0.12)',
        },
      ],
      helpAction: {
        type: 'alert',
        defaultTitle: '寻找帮助',
        defaultMessage: '📸 请截图分享给亲友或联系客服获取帮助。',
        variant: 'outline',
      },
    },
  },

  // Status messages
  status: {
    ready: {
      titleKey: 'vietnam.entryFlow.status.ready.title',
      subtitleKey: 'vietnam.entryFlow.status.ready.subtitle',
      defaultTitle: 'Ready for Entry!',
      defaultSubtitle: 'All information complete',
    },
    mostlyComplete: {
      titleKey: 'vietnam.entryFlow.status.mostlyComplete.title',
      subtitleKey: 'vietnam.entryFlow.status.mostlyComplete.subtitle',
      defaultTitle: 'Almost There',
      defaultSubtitle: 'A few more fields needed',
    },
    needsImprovement: {
      titleKey: 'vietnam.entryFlow.status.needsImprovement.title',
      subtitleKey: 'vietnam.entryFlow.status.needsImprovement.subtitle',
      defaultTitle: 'Please Complete',
      defaultSubtitle: 'More information needed',
    },
  },

  // Submission window (for digital arrival cards)
  submission: {
    hasWindow: false, // Vietnam doesn't have submission window like Thailand TDAC
    windowHours: null,
    reminderHours: null,
    earliestSubmissionHours: null,
    latestSubmissionHours: null,
  },

  // Data change detection
  dataChange: {
    enabled: false, // Don't track data changes for resubmission (no digital card)
    trackFields: [],
  },

  // Feature flags
  features: {
    progressTracking: true,
    categoryBreakdown: true,
    missingFieldsDisplay: true,
    submissionCountdown: false, // No submission window
    dataChangeAlerts: false, // No resubmission needed
    shareFeature: false, // Optional: share entry pack with friend
    disableEditQuickAction: true,
    entryGuideQuickAction: true,
  },
};

export default vietnamEntryFlowConfig;
