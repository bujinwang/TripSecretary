// @ts-nocheck

// 加拿大入境指引配置文件 - 多伦多机场YYZ/温哥华机场YVR完整流程
// 基于实际机场体验和eTA电子旅行许可系统

export const canadaEntryGuide = {
  country: 'canada',
  countryName: '加拿大',
  countryNameZh: '加拿大',
  airports: ['YYZ', 'YVR', 'YUL', 'YYC'], // 多伦多、温哥华、蒙特利尔、卡尔加里
  currency: 'CAD',
  language: ['en', 'fr'], // 英语、法语

  // 重要提醒
  importantNotes: [
    '必须在抵达前72小时申请eTA电子旅行许可',
    '确认是否属于免签证计划国家公民',
    '加拿大对资金证明要求严格',
    '准备好详细的旅行计划和地址证明',
    '注意加拿大严寒气候，做好保暖准备'
  ],

  // 7步骤完整流程 (包含紧急联系方式准备)
  steps: [
    {
      id: 'emergency_contacts',
      title: '紧急联系方式',
      titleZh: '紧急联系方式',
      description: '保存加拿大紧急联系电话，以备不时之需',
      descriptionZh: '保存加拿大紧急联系电话，以备不时之需',
      category: 'pre-arrival',
      priority: 1,
      estimatedTime: '2分钟',
      icon: '🆘',
      required: false,
      tips: [
        '警察/救护车/火警：911',
        '旅游警察：1-888-315-4626',
        '中国大使馆：+1-613-230-6298',
        '韩国大使馆：+1-613-244-5010',
        '日本大使馆：+1-613-241-8541',
        '移民局：+1-613-952-3200',
        '机场服务：+1-888-226-1797',
        '将这些号码保存到手机通讯录',
        '遇到紧急情况立即拨打911'
      ]
    },
    {
      id: 'eta_application',
      title: 'eTA电子旅行许可申请',
      titleZh: 'eTA电子旅行许可申请',
      description: '抵达前72小时申请加拿大电子旅行许可',
      descriptionZh: '抵达前72小时申请加拿大电子旅行许可',
      category: 'pre-arrival',
      priority: 2,
      estimatedTime: '10分钟',
      icon: '📱',
      required: true,
      warnings: [
        '必须在抵达前72小时申请',
        '费用7加元，有效期5年',
        '信息必须与护照完全一致'
      ],
      tips: [
        '确认免签证资格',
        '准备护照扫描件',
        '填写英文个人信息',
        '保存批准邮件和eTA号码'
      ]
    },
    {
      id: 'travel_plan_prep',
      title: '旅行计划准备',
      titleZh: '旅行计划准备',
      description: '准备详细的旅行计划和住宿证明',
      descriptionZh: '准备详细的旅行计划和住宿证明',
      category: 'pre-flight',
      priority: 3,
      estimatedTime: '15分钟',
      icon: '📋',
      required: true,
      tips: [
        '准备酒店预订确认',
        '准备详细行程安排',
        '准备返程机票',
        '准备资金证明文件'
      ]
    },
    {
      id: 'landing_setup',
      title: '落地前准备',
      titleZh: '落地前准备',
      description: '关闭蜂窝网络，准备加元兑换',
      descriptionZh: '关闭蜂窝网络，准备加元兑换',
      category: 'post-landing',
      priority: 4,
      estimatedTime: '2分钟',
      icon: '📱',
      required: true,
      warnings: [
        '飞机滑行时勿使用手机',
        'WiFi也需要关闭'
      ],
      tips: [
        '跟着Arrivals标识前进',
        '准备手机离线模式',
        '注意加拿大海关的检查程序'
      ]
    },
    {
      id: 'immigration_check',
      title: '移民局检查',
      titleZh: '移民局检查',
      description: '出示护照和eTA，回答移民官问题',
      descriptionZh: '出示护照和eTA，回答移民官问题',
      category: 'immigration',
      priority: 5,
      estimatedTime: '20分钟',
      icon: '🛂',
      required: true,
      tips: [
        '排队等候相应通道',
        '准备护照和eTA批准邮件',
        '准备旅行计划文件',
        '回答关于访问目的和资金的问题'
      ]
    },
    {
      id: 'baggage_claim',
      title: '行李领取',
      titleZh: '行李领取',
      description: '找到行李转盘，认领行李',
      descriptionZh: '找到行李转盘，认领行李',
      category: 'baggage',
      priority: 6,
      estimatedTime: '15分钟',
      icon: '🧳',
      required: true,
      tips: [
        '查看屏幕了解行李转盘号',
        '加拿大机场行李系统高效',
        '找不到行李立即报告'
      ]
    },
    {
      id: 'customs_declaration',
      title: '海关申报检查',
      titleZh: '海关申报检查',
      description: '申报物品，通过海关检查',
      descriptionZh: '申报物品，通过海关检查',
      category: 'customs',
      priority: 7,
      estimatedTime: '15分钟',
      icon: '🔍',
      required: true,
      tips: [
        '如实申报所有物品',
        '新鲜水果和肉类禁止入境',
        '免税额度：香烟200支，酒类1.5升'
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
      '未经检疫的动植物产品'
    ],
    restrictedItems: [
      '烟草制品',
      '酒类饮料',
      '现金超过1万加元'
    ],
    dutyFree: {
      alcohol: '1.5升',
      tobacco: '200支香烟或50克烟丝',
      perfume: '60ml',
      gifts: '相当于200加元'
    }
  },

  // eTA信息
  eta: {
    systemName: 'Electronic Travel Authorization',
    applicationWindow: '72小时',
    requiredDocuments: [
      '有效护照',
      '旅行信息',
      '住宿地址',
      '返程机票',
      '资金证明'
    ],
    processingTime: '通常几分钟',
    validity: '5年或护照到期前',
    cost: '7加元',
    languages: ['en', 'fr']
  },

  // 免签证国家列表
  visaExemptCountries: [
    '澳大利亚', '奥地利', '比利时', '文莱', '智利', '克罗地亚', '捷克', '丹麦',
    '爱沙尼亚', '芬兰', '法国', '德国', '希腊', '匈牙利', '冰岛', '爱尔兰',
    '意大利', '日本', '韩国', '拉脱维亚', '列支敦士登', '立陶宛', '卢森堡',
    '马来西亚', '马耳他', '墨西哥', '摩纳哥', '荷兰', '新西兰', '挪威', '波兰',
    '葡萄牙', '圣马力诺', '新加坡', '斯洛伐克', '斯洛文尼亚', '南非', '西班牙',
    '瑞典', '瑞士', '台湾', '英国', '美国'
  ],

  // 资金证明要求
  fundingRequirements: {
    minimumAmount: {
      perPerson: 2500, // 加元
      family: 4000
    },
    acceptedProofs: [
      '银行存款证明',
      '信用卡对账单',
      '旅行支票',
      '雇主担保信',
      '房产证明'
    ],
    validityPeriod: '3个月内',
    notes: [
      '资金证明必须是英文或法文',
      '金额必须是加拿大元或等值货币',
      '家庭成员可合并计算'
    ]
  },

  // 旅行计划要求
  travelPlanRequirements: {
    required: true,
    documents: [
      '酒店预订确认',
      '详细行程安排',
      '返程机票',
      '访问目的说明',
      '联系人信息'
    ],
    validation: [
      '地址必须具体',
      '日期必须明确',
      '目的必须合理',
      '联系方式必须有效'
    ]
  },

  // 交通信息
  transport: {
    options: [
      {
        type: 'taxi',
        name: '出租车',
        from: '机场',
        to: '市区',
        duration: '30-60分钟',
        cost: 'CAD 40-70',
        frequency: '24小时'
      },
      {
        type: 'uber',
        name: 'Uber',
        from: '机场',
        to: '市区',
        duration: '30-60分钟',
        cost: 'CAD 35-60',
        frequency: '24小时'
      },
      {
        type: 'bus',
        name: '机场巴士',
        from: '机场',
        to: '市区',
        duration: '45-90分钟',
        cost: 'CAD 15-25',
        frequency: '每30分钟一班'
      },
      {
        type: 'train',
        name: '机场快轨',
        from: 'YYZ',
        to: 'Union Station',
        duration: '25分钟',
        cost: 'CAD 12',
        frequency: '每5-15分钟一班'
      }
    ],
    recommendations: {
      yyz: '机场快轨最快捷',
      yvr: '出租车或Uber最方便',
      yul: '公交系统发达',
      budget: '机场巴士最经济',
      comfort: 'Uber最舒适'
    }
  },

  // 货币和ATM信息
  currency: {
    code: 'CAD',
    name: '加拿大元',
    denominations: [
      { value: 100, color: '紫色', usage: '大额支付' },
      { value: 50, color: '红色', usage: '中等金额' },
      { value: 20, color: '绿色', usage: '小额支付' },
      { value: 10, color: '蓝色', usage: '找零' }
    ],
    atm: {
      location: '机场到达大厅',
      banks: ['RBC', 'TD', 'Scotiabank', 'BMO'],
      fees: '约CAD 3-5',
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
    touristPolice: '1-888-315-4626',
    embassy: {
      china: '+1-613-230-6298',
      korea: '+1-613-244-5010',
      japan: '+1-613-241-8541'
    },
    immigration: '+1-613-952-3200',
    airport: '+1-888-226-1797'
  },

  // 文化和礼仪提醒
  cultureTips: [
    '加拿大人友好热情，喜欢寒暄',
    '尊重多元文化，加拿大是移民国家',
    '公共场合保持礼貌，排队有序',
    '小费文化：餐厅服务员15%，出租车司机10%',
    '了解加拿大严寒气候，做好保暖准备'
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

export default canadaEntryGuide;