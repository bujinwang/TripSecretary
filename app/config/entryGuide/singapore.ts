// 新加坡入境指引配置文件 - 樟宜机场SIN完整流程
// 基于实际机场体验和SGAC数字入境卡系统

export const singaporeEntryGuide = {
  country: 'singapore',
  countryName: '新加坡',
  countryNameZh: '新加坡',
  airport: 'SIN', // 樟宜机场
  currencyCode: 'SGD',
  language: ['en', 'zh', 'ms', 'ta'], // 英语、华语、马来语、泰米尔语

  // 重要提醒
  importantNotes: [
    '必须在抵达前3天到抵达后15天提交SGAC数字入境卡',
    '准备好充足的资金证明，每人至少30,000新元或等值货币',
    '新加坡对毒品处罚极为严厉，申报所有药品',
    '地铁系统便捷但复杂，建议使用机场巴士或出租车'
  ],

  // 7步骤完整流程 (包含紧急联系方式准备)
  steps: [
    {
      id: 'emergency_contacts',
      title: '紧急联系方式',
      titleZh: '紧急联系方式',
      description: '保存新加坡紧急联系电话，以备不时之需',
      descriptionZh: '保存新加坡紧急联系电话，以备不时之需',
      category: 'pre-arrival',
      priority: 1,
      estimatedTime: '2分钟',
      icon: '🆘',
      required: false,
      tips: [
        '警察：999',
        '救护车：995',
        '旅游警察：1800-736-2000',
        '中国大使馆：+65-6471-5600',
        '美国大使馆：+65-6476-9100',
        '移民局：+65-6391-6100',
        '樟宜机场：+65-6595-6868',
        '将这些号码保存到手机通讯录',
        '遇到紧急情况立即拨打'
      ]
    },
    {
      id: 'sgac_submission',
      title: 'SGAC数字入境卡提交',
      titleZh: 'SGAC数字入境卡提交',
      description: '抵达前3天到抵达后15天提交新加坡数字入境卡',
      descriptionZh: '抵达前3天到抵达后15天提交新加坡数字入境卡',
      category: 'pre-arrival',
      priority: 2,
      estimatedTime: '15分钟',
      icon: '📱',
      required: true,
      warnings: [
        '必须在规定时间内提交，否则无法入境',
        '信息必须与护照完全一致',
        '保存好SGAC确认邮件和二维码'
      ],
      tips: [
        '准备护照、旅行信息、资金证明',
        '填写英文个人信息',
        '确认所有家庭成员信息'
      ]
    },
    {
      id: 'preparation',
      title: '飞机内准备通关包',
      titleZh: '飞机内准备通关包',
      description: '整理通关包，确认SGAC状态和所有材料',
      descriptionZh: '整理通关包，确认SGAC状态和所有材料',
      category: 'in-flight',
      priority: 3,
      estimatedTime: '5分钟',
      icon: '📋',
      required: true,
      tips: [
        '检查SGAC确认邮件',
        '准备护照和相关文件',
        '确认资金证明文件'
      ]
    },
    {
      id: 'landing_setup',
      title: '落地前准备',
      titleZh: '落地前准备',
      description: '关闭蜂窝网络，准备新加坡eSIM卡',
      descriptionZh: '关闭蜂窝网络，准备新加坡eSIM卡',
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
        '准备手机离线模式'
      ]
    },
    {
      id: 'immigration',
      title: '移民局检查',
      titleZh: '移民局检查',
      description: '出示护照和SGAC，完成生物识别',
      descriptionZh: '出示护照和SGAC，完成生物识别',
      category: 'immigration',
      priority: 5,
      estimatedTime: '10分钟',
      icon: '🛂',
      required: true,
      tips: [
        '排队等候相应通道',
        '准备护照和SGAC确认邮件',
        '配合生物识别扫描',
        '回答官员关于资金和目的的问题'
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
        '新加坡机场行李系统高效',
        '找不到行李立即报告'
      ]
    },
    {
      id: 'customs_inspection',
      title: '海关物品检查',
      titleZh: '海关物品检查',
      description: '申报物品，通过海关检查',
      descriptionZh: '申报物品，通过海关检查',
      category: 'customs',
      priority: 7,
      estimatedTime: '5分钟',
      icon: '🔍',
      required: true,
      tips: [
        '如实申报所有物品',
        '毒品和违禁品处罚严厉',
        '免税额度：香烟200支，酒类1升'
      ]
    }
  ],

  // 海关信息
  customs: {
    declarationRequired: true,
    prohibitedItems: [
      '毒品及其制品',
      '枪支弹药',
      '淫秽物品',
      '假冒商品',
      '超过免税额度的烟酒'
    ],
    restrictedItems: [
      '新鲜水果和蔬菜',
      '肉类制品',
      '种子和土壤'
    ],
    dutyFree: {
      alcohol: '1升',
      tobacco: '200支香烟或50克烟丝',
      perfume: '3盎司',
      gifts: '相当于500新元'
    }
  },

  // SGAC信息
  sgac: {
    systemName: 'Singapore Arrival Card',
    submissionWindow: {
      before: '3天',
      after: '15天'
    },
    requiredDocuments: [
      '有效护照',
      '旅行信息',
      '住宿地址',
      '资金证明',
      '返程机票'
    ],
    processingTime: '通常几分钟',
    validity: '从抵达之日起6个月',
    cost: '免费',
    languages: ['en', 'zh', 'ms', 'ta']
  },

  // 资金证明要求 (新加坡最严格)
  fundingRequirements: {
    minimumAmount: {
      perPerson: 30000, // 新元
      family: 50000
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
      '资金证明必须是英文或华文',
      '金额必须是新加坡元或等值货币',
      '家庭成员可合并计算'
    ]
  },

  // 地址要求
  addressRequirements: {
    required: true,
    formats: [
      '酒店名称和地址',
      '民宿地址',
      '亲友地址（需提供联系方式）',
      '邮轮停靠港'
    ],
    validation: [
      '地址必须具体到门牌号',
      '必须提供联系电话',
      '临时住宿需说明原因'
    ]
  },

  // 交通信息
  transport: {
    options: [
      {
        type: 'mrt',
        name: '地铁MRT',
        from: 'SIN',
        to: '市区',
        duration: '45-60分钟',
        cost: 'S$2-3',
        frequency: '每5分钟一班'
      },
      {
        type: 'bus',
        name: '机场巴士',
        from: 'SIN',
        to: '各大酒店',
        duration: '60-90分钟',
        cost: 'S$9-15',
        frequency: '每30分钟一班'
      },
      {
        type: 'taxi',
        name: '出租车',
        from: 'SIN',
        to: '市区',
        duration: '45-75分钟',
        cost: 'S$40-60',
        tips: '费用较高但舒适'
      },
      {
        type: 'limousine',
        name: '豪华轿车',
        from: 'SIN',
        to: '市区',
        duration: '45-60分钟',
        cost: 'S$80-120',
        tips: '适合商务旅客'
      }
    ],
    recommendations: {
      budget: '地铁MRT最经济',
      comfort: '豪华轿车最舒适',
      convenience: '机场巴士直达酒店',
      speed: '地铁最快捷'
    }
  },

  // 货币和ATM信息
  currency: {
    code: 'SGD',
    name: '新加坡元',
    denominations: [
      { value: 50, color: '紫色', usage: '大额支付' },
      { value: 10, color: '橙色', usage: '中等金额' },
      { value: 5, color: '绿色', usage: '小额支付' },
      { value: 2, color: '蓝色', usage: '找零' }
    ],
    atm: {
      location: '机场到达大厅',
      banks: ['DBS', 'OCBC', 'UOB', 'POSB'],
      fees: '约S$5-10',
      tips: [
        '机场ATM汇率较差',
        '建议使用市区ATM',
        '银行卡需支持国际交易',
        '准备好PIN码'
      ]
    }
  },

  // 紧急联系方式
  emergency: {
    police: '999',
    ambulance: '995',
    touristPolice: '1800-736-2000',
    embassy: {
      china: '+65-6471-5600',
      usa: '+65-6476-9100',
      korea: '+65-6733-2575'
    },
    immigration: '+65-6391-6100',
    airport: '+65-6595-6868'
  },

  // 文化和礼仪提醒
  cultureTips: [
    '新加坡法律严格，保持公共秩序',
    '地铁和公共场所禁止饮食',
    '随地吐痰、乱扔垃圾处罚严厉',
    '使用正确垃圾分类',
    '尊重多元文化，注意言行举止'
  ],

  // 语言帮助卡（备用）
  languageHelp: {
    useMRT: 'MRT please',
    howMuch: 'How much?',
    noThankYou: 'No, thank you',
    needHelp: 'I need help',
    needChange: 'I need change please',
    receipt: 'Receipt please',
    whereIs: 'Where is...?',
    thankYou: 'Thank you'
  }
};

export default singaporeEntryGuide;