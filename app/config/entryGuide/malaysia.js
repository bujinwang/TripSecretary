// 马来西亚入境指引配置文件 - 吉隆坡机场KUL/亚庇机场BKI完整流程
// 基于实际机场体验和MDAC数字入境卡系统

export const malaysiaEntryGuide = {
  country: 'malaysia',
  countryName: '马来西亚',
  countryNameZh: '马来西亚',
  airports: ['KUL', 'BKI', 'PEN'], // 吉隆坡、亚庇、槟城机场
  currency: 'MYR',
  language: ['ms', 'en', 'zh'], // 马来语、英语、华语

  // 重要提醒
  importantNotes: [
    '必须在抵达前3天提交MDAC数字入境卡',
    '准备好充足的资金证明，每人至少350林吉特',
    '马来西亚有东马和西马两个区域，入境要求不同',
    '热带气候，注意防晒和饮水',
    '穆斯林国家，尊重当地文化和宗教习俗'
  ],

  // 8步骤完整流程 (包含紧急联系方式准备)
  steps: [
    {
      id: 'emergency_contacts',
      title: '紧急联系方式',
      titleZh: '紧急联系方式',
      description: '保存马来西亚紧急联系电话，以备不时之需',
      descriptionZh: '保存马来西亚紧急联系电话，以备不时之需',
      category: 'pre-arrival',
      priority: 1,
      estimatedTime: '2分钟',
      icon: '🆘',
      required: false,
      tips: [
        '警察/救护车：999',
        '旅游警察：03-2115-9999',
        '中国大使馆：+60-3-2161-6000',
        '美国大使馆：+60-3-2168-5000',
        '韩国大使馆：+60-3-4251-5000',
        '移民局：+60-3-8000-8000',
        '吉隆坡机场：+60-3-8776-4000',
        '将这些号码保存到手机通讯录',
        '遇到紧急情况立即拨打999'
      ]
    },
    {
      id: 'mdac_submission',
      title: 'MDAC数字入境卡提交',
      titleZh: 'MDAC数字入境卡提交',
      description: '抵达前3天提交马来西亚数字入境卡',
      descriptionZh: '抵达前3天提交马来西亚数字入境卡',
      category: 'pre-arrival',
      priority: 2,
      estimatedTime: '10分钟',
      icon: '📱',
      required: true,
      warnings: [
        '必须在抵达前3天内提交',
        '东马和西马可能有不同要求',
        '保存好MDAC确认邮件和二维码'
      ],
      tips: [
        '准备护照、旅行信息、资金证明',
        '确认入境机场（东马/西马）',
        '填写英文个人信息',
        '保存确认邮件到手机'
      ]
    },
    {
      id: 'visa_check',
      title: '签证确认',
      titleZh: '签证确认',
      description: '确认签证类型和有效性',
      descriptionZh: '确认签证类型和有效性',
      category: 'pre-flight',
      priority: 3,
      estimatedTime: '5分钟',
      icon: '🛂',
      required: true,
      warnings: [
        '商务签证和技术签证有特殊要求',
        '东马入境可能需要额外许可'
      ],
      tips: [
        '检查签证有效期和停留天数',
        '确认入境目的与签证类型匹配',
        '商务访问者准备邀请函'
      ]
    },
    {
      id: 'preparation',
      title: '飞机内准备通关包',
      titleZh: '飞机内准备通关包',
      description: '整理通关包，确认MDAC状态',
      descriptionZh: '整理通关包，确认MDAC状态',
      category: 'in-flight',
      priority: 4,
      estimatedTime: '5分钟',
      icon: '📋',
      required: true,
      tips: [
        '检查MDAC确认邮件',
        '准备护照和相关文件',
        '确认资金证明文件'
      ]
    },
    {
      id: 'landing_setup',
      title: '落地前准备',
      titleZh: '落地前准备',
      description: '关闭蜂窝网络，准备马来西亚eSIM卡',
      descriptionZh: '关闭蜂窝网络，准备马来西亚eSIM卡',
      category: 'post-landing',
      priority: 5,
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
        '注意热带气候，做好防晒准备'
      ]
    },
    {
      id: 'immigration',
      title: '移民局检查',
      titleZh: '移民局检查',
      description: '出示护照和MDAC，完成检查',
      descriptionZh: '出示护照和MDAC，完成检查',
      category: 'immigration',
      priority: 6,
      estimatedTime: '15分钟',
      icon: '🛂',
      required: true,
      tips: [
        '排队等候相应通道',
        '准备护照和MDAC确认邮件',
        '配合官员检查',
        '东马入境可能需要额外检查'
      ]
    },
    {
      id: 'baggage_claim',
      title: '行李领取',
      titleZh: '行李领取',
      description: '找到行李转盘，认领行李',
      descriptionZh: '找到行李转盘，认领行李',
      category: 'baggage',
      priority: 7,
      estimatedTime: '15分钟',
      icon: '🧳',
      required: true,
      tips: [
        '查看屏幕了解行李转盘号',
        '马来西亚机场行李系统高效',
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
      priority: 8,
      estimatedTime: '10分钟',
      icon: '🔍',
      required: true,
      tips: [
        '如实申报所有物品',
        '猪肉制品禁止入境',
        '免税额度：香烟200支，酒类1升'
      ]
    }
  ],

  // 海关信息
  customs: {
    declarationRequired: true,
    prohibitedItems: [
      '猪肉及其制品',
      '毒品及其制品',
      '枪支弹药',
      '淫秽物品',
      '超过免税额度的烟酒'
    ],
    restrictedItems: [
      '新鲜水果和蔬菜',
      '种子和土壤',
      '中药材'
    ],
    dutyFree: {
      alcohol: '1升',
      tobacco: '200支香烟或225克烟丝',
      perfume: '250ml',
      gifts: '相当于500林吉特'
    }
  },

  // MDAC信息
  mdac: {
    systemName: 'Malaysia Digital Arrival Card',
    submissionWindow: '3天',
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
    languages: ['ms', 'en', 'zh']
  },

  // 资金证明要求
  fundingRequirements: {
    minimumAmount: {
      perPerson: 350, // 林吉特
      family: 500
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
      '资金证明必须是英文',
      '金额必须是马来西亚林吉特或等值货币',
      '家庭成员可合并计算'
    ]
  },

  // 地区差异 (东马/西马)
  regionalDifferences: {
    westMalaysia: {
      name: '西马来西亚',
      airports: ['KUL', 'PEN'],
      requirements: '标准入境要求',
      notes: ['吉隆坡是主要入境点', '基础设施完善']
    },
    eastMalaysia: {
      name: '东马来西亚',
      airports: ['BKI', 'KCH'],
      requirements: '可能需要额外许可',
      notes: ['沙巴和砂拉越有不同要求', '可能需要额外签证']
    }
  },

  // 交通信息
  transport: {
    options: [
      {
        type: 'taxi',
        name: '出租车',
        from: '机场',
        to: '市区',
        duration: '45-75分钟',
        cost: 'MYR 50-100',
        frequency: '24小时'
      },
      {
        type: 'grab',
        name: 'Grab打车',
        from: '机场',
        to: '市区',
        duration: '45-75分钟',
        cost: 'MYR 30-80',
        frequency: '24小时'
      },
      {
        type: 'bus',
        name: '机场巴士',
        from: '机场',
        to: '市区',
        duration: '60-90分钟',
        cost: 'MYR 10-15',
        frequency: '每30分钟一班'
      },
      {
        type: 'kliaexpress',
        name: 'KLIA Express',
        from: 'KUL',
        to: 'KL Sentral',
        duration: '28分钟',
        cost: 'MYR 55',
        frequency: '每15分钟一班'
      }
    ],
    recommendations: {
      kul: 'KLIA Express最快捷',
      budget: '机场巴士最经济',
      comfort: 'Grab打车最方便',
      night: '出租车最安全'
    }
  },

  // 货币和ATM信息
  currency: {
    code: 'MYR',
    name: '马来西亚林吉特',
    denominations: [
      { value: 100, color: '紫色', usage: '大额支付' },
      { value: 50, color: '红色', usage: '中等金额' },
      { value: 20, color: '黄色', usage: '小额支付' },
      { value: 10, color: '蓝色', usage: '找零' }
    ],
    atm: {
      location: '机场到达大厅',
      banks: ['Maybank', 'CIMB', 'Public Bank', 'RHB'],
      fees: '约MYR 5-10',
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
    ambulance: '999',
    touristPolice: '03-2115-9999',
    embassy: {
      china: '+60-3-2161-6000',
      usa: '+60-3-2168-5000',
      korea: '+60-3-4251-5000'
    },
    immigration: '+60-3-8000-8000',
    airport: '+60-3-8776-4000'
  },

  // 文化和礼仪提醒
  cultureTips: [
    '马来西亚是穆斯林国家，尊重伊斯兰教义',
    '公共场合着装保守',
    '用右手递接物品',
    '清真餐厅标有Halal标识',
    '斋戒月期间注意营业时间变化'
  ],

  // 语言帮助卡（备用）
  languageHelp: {
    useGrab: 'Grab please',
    howMuch: 'How much?',
    noThankYou: 'No, thank you',
    needHelp: 'I need help',
    needChange: 'I need change please',
    receipt: 'Receipt please',
    whereIs: 'Where is...?',
    thankYou: 'Terima kasih'
  }
};

export default malaysiaEntryGuide;