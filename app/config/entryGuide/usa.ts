// @ts-nocheck

// 美国入境指引配置文件 - 主要机场JFK/LAX/ORD/SFO完整流程
// 基于实际机场体验和ESTA电子旅行许可系统

export const usaEntryGuide = {
  country: 'usa',
  countryName: 'USA',
  countryNameZh: '美国',
  airports: ['JFK', 'LAX', 'ORD', 'SFO', 'MIA', 'SEA'], // 主要国际机场
  currency: 'USD',
  language: ['en', 'es'], // 英语、西班牙语

  // Screen navigation configuration
  screens: {
    entryPackPreview: 'USAEntryPackPreview',
  },

  // Important notes
  importantNotes: [
    'Confirm whether you qualify under the Visa Waiver Program (VWP). VWP nationals need ESTA; non‑VWP nationals need a B1/B2 visa.',
    'CBP customs declaration: declare all food, plants, animal products.',
    'Be aware of strict security and customs inspections in the US.'
  ],

  // 5步骤完整流程 (包含紧急联系方式准备)
  steps: [
    {
      id: 'emergency_contacts',
      title: 'Emergency Contacts',
      titleZh: '紧急联系方式',
      description: 'Save important US emergency phone numbers for quick access.',
      descriptionZh: '保存美国紧急联系电话，以备不时之需',
      category: 'pre-arrival',
      categoryZh: '实用信息',
      priority: 1,
      estimatedTime: '2 min',
      icon: '🆘',
      required: false,
      tips: [
        'Police/Fire/Ambulance: 911',
        'Suicide & Crisis Lifeline: 988',
        'Poison Control: 1‑800‑222‑1222',
        'CBP Traveler Information: 1‑877‑227‑5511',
        'TSA Contact Center: 1‑866‑289‑9673',
        'Save these numbers to your phone contacts',
        'In emergencies, dial 911 immediately'
      ]
    },
    {
      id: 'landing_setup',
      title: 'Post‑Landing Preparation',
      titleZh: '落地前准备',
      description: 'Prepare your phone, follow airport signs, and get ready for inspection.',
      descriptionZh: '关闭蜂窝网络，准备美元兑换',
      category: 'post-landing',
      priority: 2,
      estimatedTime: '2 min',
      icon: '📱',
      required: true,
      warnings: [
        'Do not use your phone during taxiing',
        'Disable Wi‑Fi if instructed by crew'
      ],
      tips: [
        'Follow the "Arrivals" signs',
        'Prepare phone airplane/offline mode',
        'US customs inspections are strict—have documents ready'
      ]
    },
    {
      id: 'immigration_biometric',
      title: 'Biometric & Immigration Check',
      titleZh: '移民局生物识别检查',
      description: 'Fingerprint and facial recognition; present your documents to CBP.',
      descriptionZh: '进行指纹和面部识别，提交入境卡',
      category: 'immigration',
      priority: 3,
      estimatedTime: '15 min',
      icon: '🛂',
      required: true,
      showEntryPack: true,
      entryPackHint: 'Have passport, visa/ESTA, travel details, and funds ready to show the officer.',
      entryPackHintZh: '整理好的通关资料（护照、签证/ESTA、旅行信息、资金证明）可直接展示给移民官。',
      tips: [
        'Queue for the appropriate lane',
        'Prepare passport and visa/ESTA approval (VWP requires ESTA; non‑VWP requires B1/B2 visa)',
        'For biometrics: clean/dry fingers; remove glasses and hats',
        'Keep a natural expression; ensure hair does not cover your face',
        'Answer questions about your visit purpose'
      ]
    },
    {
      id: 'baggage_customs',
      title: 'Baggage Claim & Customs',
      titleZh: '行李领取和海关检查',
      description: 'Collect your baggage and proceed to customs declaration.',
      descriptionZh: '认领行李并通过海关申报',
      category: 'baggage',
      priority: 4,
      estimatedTime: '20 min',
      icon: '🧳',
      required: true,
      tips: [
        'Check screens for the carousel number',
        'Declare all items truthfully',
        'Have your customs declaration ready'
      ]
    },
    {
      id: 'customs_inspection',
      title: 'Customs Item Inspection',
      titleZh: '海关物品检查',
      description: 'Final customs inspection and item verification.',
      descriptionZh: '最终海关检查和物品验证',
      category: 'customs',
      priority: 5,
      estimatedTime: '10 min',
      icon: '🔍',
      required: true,
      tips: [
        'Cooperate with customs officers',
        'Show all declared items',
        'Answer questions about item origins'
      ]
    }
  ],

  // 海关信息
  customs: {
    declarationRequired: true,
    prohibitedItems: [
      '新鲜水果和蔬菜',
      '肉类及其制品',
      '种子和土壤',
      '超过免税额度的烟酒'
    ],
    restrictedItems: [
      '中药材',
      '烟草制品',
      '酒类饮料',
      '现金超过1万美元'
    ],
    dutyFree: {
      alcohol: '1升',
      tobacco: '200支香烟',
      perfume: '3盎司',
      gifts: '相当于800美元'
    }
  },

  // ESTA信息
  esta: {
    systemName: 'Electronic System for Travel Authorization',
    applicationWindow: '72小时',
    requiredDocuments: [
      '有效护照',
      '近期照片',
      '旅行信息',
      '美国地址',
      '返程机票'
    ],
    processingTime: '通常几秒到72小时',
    validity: '2年或护照到期前',
    cost: '21美元',
    languages: ['en', 'es', 'fr', 'pt', 'ko', 'ja', 'zh']
  },

  // VWP免签证计划国家列表
  vwpCountries: [
    '澳大利亚', '奥地利', '比利时', '文莱', '智利', '克罗地亚', '捷克', '丹麦',
    '爱沙尼亚', '芬兰', '法国', '德国', '希腊', '匈牙利', '冰岛', '爱尔兰',
    '意大利', '日本', '韩国', '拉脱维亚', '列支敦士登', '立陶宛', '卢森堡',
    '马来西亚', '马耳他', '摩纳哥', '荷兰', '新西兰', '挪威', '波兰', '葡萄牙',
    '圣马力诺', '新加坡', '斯洛伐克', '斯洛文尼亚', '南非', '西班牙', '瑞典',
    '瑞士', '台湾', '英国'
  ],

  // 生物识别要求
  biometric: {
    required: true,
    types: ['fingerprint', 'facial_recognition', 'iris_scan'],
    preparation: [
      '保持手指清洁干燥',
      '摘掉眼镜和帽子',
      '保持自然表情',
      '头发不要遮挡脸部'
    ],
    dataCollection: [
      '抵达时现场采集',
      '用于身份验证',
      '数据安全存储',
      '符合美国隐私法'
    ],
    commonIssues: [
      '手指太湿或太干',
      '眼镜反光影响识别',
      '面部表情不自然',
      '设备故障需要重试'
    ]
  },

  // 入境卡信息
  entryCard: {
    required: true,
    sections: [
      'personal_information',
      'travel_purpose',
      'address_in_usa',
      'contact_information',
      'emergency_contact'
    ],
    languages: ['en'],
    submission: '在移民局窗口提交',
    tips: [
      '用英文填写',
      '字迹要清晰',
      '信息要与护照一致',
      '准备好地址和电话号码'
    ]
  },

  // 交通信息
  transport: {
    options: [
      {
        type: 'subway',
        name: '地铁',
        from: '机场',
        to: '市区',
        duration: '30-60分钟',
        cost: '$2.75-3',
        frequency: '每5-10分钟一班'
      },
      {
        type: 'taxi',
        name: '出租车',
        from: '机场',
        to: '市区',
        duration: '30-75分钟',
        cost: '$40-80',
        frequency: '24小时'
      },
      {
        type: 'rideshare',
        name: 'Uber/Lyft',
        from: '机场',
        to: '市区',
        duration: '30-75分钟',
        cost: '$35-70',
        frequency: '24小时'
      },
      {
        type: 'bus',
        name: '机场巴士',
        from: '机场',
        to: '市区',
        duration: '45-90分钟',
        cost: '$15-25',
        frequency: '每30分钟一班'
      }
    ],
    recommendations: {
      jfk: '地铁或巴士最经济',
      lax: 'Uber/Lyft最方便',
      ord: '出租车最快捷',
      budget: '机场巴士最实惠',
      comfort: 'Uber/Lyft最舒适'
    }
  },

  // 货币和ATM信息
  currencyInfo: {
    code: 'USD',
    name: '美元',
    denominations: [
      { value: 100, color: '蓝色', usage: '大额支付' },
      { value: 50, color: '红色', usage: '中等金额' },
      { value: 20, color: '绿色', usage: '小额支付' },
      { value: 10, color: '黄色', usage: '找零' }
    ],
    atm: {
      location: '机场到达大厅',
      banks: ['Bank of America', 'Chase', 'Wells Fargo', 'Citibank'],
      fees: '约$3-5',
      tips: [
        '机场ATM汇率较高',
        '建议使用市区ATM',
        '银行卡需支持国际交易',
        '准备好PIN码'
      ]
    }
  },

  // 紧急联系方式
  emergency: {
    police: '911',
    ambulance: '911',
    suicideCrisis: '988',
    poisonControl: '1-800-222-1222',
    embassy: {
      china: '+1-202-495-2266',
      korea: '+1-202-939-5600',
      japan: '+1-202-238-6700'
    },
    immigration: '+1-877-227-5511',
    airport: '+1-866-289-9673'
  },

  // 文化和礼仪提醒
  cultureTips: [
    '美国人注重个人空间，请保持适当距离',
    '小费文化：餐厅服务员15-20%，出租车司机10-15%',
    '公共场合保持安静，尊重他人隐私',
    '拍照前要征得同意',
    '了解当地法律法规，避免违法行为'
  ],

  // 语言帮助卡（备用）
  languageHelp: {
    useUber: 'Uber please',
    howMuch: 'How much?',
    noThankYou: 'No, thank you',
    needHelp: 'I need help',
    needChange: 'I need change please',
    receipt: 'Receipt please',
    whereIs: 'Where is...?',
    thankYou: 'Thank you'
  }
};

export default usaEntryGuide;