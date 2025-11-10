// @ts-nocheck

// 台湾电子入境卡引导配置文件 - 台湾入境完整流程
// 基于实际机场体验和台湾在线入境卡系统

export const taiwanEntryGuide = {
  country: 'taiwan',
  countryName: '台湾',
  countryNameZh: '臺灣',
  airports: ['TPE', 'KHH', 'TSA'], // 桃园、高雄、松山机场
  currency: 'TWD',
  language: ['zh', 'en'], // 中文、英语

  // 重要提醒
  importantNotes: [
    '中国内地居民需持有效入台证（入台证）',
    '在线入境卡必须在抵达前3天内完成',
    '需要邮箱验证码（OTP）才能填写表单',
    '准备好护照、航班信息、住宿地址',
    '保存入境卡确认邮件或截图'
  ],

  // 步骤完整流程
  steps: [
    {
      id: 'request_verification_email',
      title: 'Request verification email',
      titleZh: '请求验证邮箱',
      description: 'Confirm your email inbox is ready',
      descriptionZh: '确认您的邮箱收件箱已准备好',
      category: 'pre-arrival',
      priority: 1,
      estimatedTime: '5分钟',
      icon: '✉️',
      required: true,
      tips: [
        { key: 'tw.guide.entryGuide.steps.request_verification_email.tips.0', defaultValue: 'Enter your email and tap "Send Code" on the official site.' },
        { key: 'tw.guide.entryGuide.steps.request_verification_email.tips.1', defaultValue: 'Check your inbox (and spam) for a 6-digit OTP from the Taiwan immigration site.' },
        { key: 'tw.guide.entryGuide.steps.request_verification_email.tips.2', defaultValue: 'Paste the code within the time limit to unlock the form.' }
      ]
    },
    {
      id: 'fill_traveler_details',
      title: 'Fill traveler & arrival details',
      titleZh: '填写旅客和抵达信息',
      description: 'Autofill from your entry pack for speed',
      descriptionZh: '从您的入境包自动填充以加快速度',
      category: 'pre-arrival',
      priority: 2,
      estimatedTime: '10分钟',
      icon: '📝',
      required: true,
      tips: [
        { key: 'tw.guide.entryGuide.steps.fill_traveler_details.tips.0', defaultValue: 'Verify your passport number, nationality, and date of birth.' },
        { key: 'tw.guide.entryGuide.steps.fill_traveler_details.tips.1', defaultValue: 'Enter arrival flight number, date/time, and port of entry.' },
        { key: 'tw.guide.entryGuide.steps.fill_traveler_details.tips.2', defaultValue: 'Provide accommodation address/phone or host details in Taiwan.' }
      ]
    },
    {
      id: 'travel_history_confirmation',
      title: 'Travel history & confirmation',
      titleZh: '旅行历史和确认',
      description: 'Answer the 14-day travel history questions accurately',
      descriptionZh: '准确回答14天旅行历史问题',
      category: 'pre-arrival',
      priority: 3,
      estimatedTime: '5分钟',
      icon: '✅',
      required: true,
      tips: [
        { key: 'tw.guide.entryGuide.steps.travel_history_confirmation.tips.0', defaultValue: 'Declare countries visited in the last 14 days and health status truthfully.' },
        { key: 'tw.guide.entryGuide.steps.travel_history_confirmation.tips.1', defaultValue: 'Review the summary page carefully before submitting.' },
        { key: 'tw.guide.entryGuide.steps.travel_history_confirmation.tips.2', defaultValue: 'Wait for the confirmation page/email and save a screenshot for arrival.' }
      ]
    }
  ],

  // 快速工具
  quickActions: {
    title: 'Quick tools',
    titleZh: '快速工具',
    items: [
      {
        icon: '✉️',
        title: 'OTP checker',
        titleZh: '验证码检查器',
        description: 'Tick off once the verification email arrives so you don\'t miss it.',
        descriptionZh: '验证邮件到达后勾选，这样您就不会错过。'
      },
      {
        icon: '📄',
        title: 'Auto-fill clipboard',
        titleZh: '自动填充剪贴板',
        description: 'Copy passport/flight info with one tap while filling the form.',
        descriptionZh: '填写表单时一键复制护照/航班信息。'
      },
      {
        icon: '🔁',
        title: 'Resubmit helper',
        titleZh: '重新提交助手',
        description: 'If plans change, reuse saved info to create a new arrival card quickly.',
        descriptionZh: '如果计划改变，快速重用保存的信息创建新的入境卡。'
      }
    ]
  },

  // 主题配置
  theme: {
    progressColor: '#EF4444', // Taiwan red
    primaryColor: '#EF4444',
    backgroundColor: '#F5F7FB'
  },

  // 初始步骤索引
  initialStepIndex: 0,

  // 已完成的步骤ID（可选）
  completedStepIds: []
};

export default taiwanEntryGuide;

