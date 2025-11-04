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
    'malaysia.entryGuide.importantNotes.0',
    'malaysia.entryGuide.importantNotes.1',
    'malaysia.entryGuide.importantNotes.2',
    'malaysia.entryGuide.importantNotes.3',
    'malaysia.entryGuide.importantNotes.4'
  ],

  // 8步骤完整流程 (包含紧急联系方式准备)
  steps: [
    {
      id: 'emergency_contacts',
      titleKey: 'malaysia.entryGuide.steps.emergency_contacts.title',
      defaultTitle: 'Emergency Contacts',
      descriptionKey: 'malaysia.entryGuide.steps.emergency_contacts.description',
      defaultDescription: 'Save Malaysia emergency contact numbers for emergencies',
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
      titleKey: 'malaysia.entryGuide.steps.mdac_submission.title',
      defaultTitle: 'MDAC Digital Arrival Card Submission',
      descriptionKey: 'malaysia.entryGuide.steps.mdAC_submission.description',
      defaultDescription: 'Submit Malaysia Digital Arrival Card 3 days before arrival',
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
      titleKey: 'malaysia.entryGuide.steps.visa_check.title',
      defaultTitle: 'Visa Confirmation',
      descriptionKey: 'malaysia.entryGuide.steps.visa_check.description',
      defaultDescription: 'Confirm visa type and validity',
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
      titleKey: 'malaysia.entryGuide.steps.preparation.title',
      defaultTitle: 'In-flight Preparation',
      descriptionKey: 'malaysia.entryGuide.steps.preparation.description',
      defaultDescription: 'Organize entry pack and confirm MDAC status',
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
      titleKey: 'malaysia.entryGuide.steps.landing_setup.title',
      defaultTitle: 'Pre-landing Setup',
      descriptionKey: 'malaysia.entryGuide.steps.landing_setup.description',
      defaultDescription: 'Turn off cellular data and prepare Malaysia eSIM',
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
      titleKey: 'malaysia.entryGuide.steps.immigration.title',
      defaultTitle: 'Immigration Check',
      descriptionKey: 'malaysia.entryGuide.steps.immigration.description',
      defaultDescription: 'Present passport and MDAC, complete check',
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
      titleKey: 'malaysia.entryGuide.steps.baggage_claim.title',
      defaultTitle: 'Baggage Claim',
      descriptionKey: 'malaysia.entryGuide.steps.baggage_claim.description',
      defaultDescription: 'Find the baggage carousel and claim your luggage',
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
      titleKey: 'malaysia.entryGuide.steps.customs_inspection.title',
      defaultTitle: 'Customs Inspection',
      descriptionKey: 'malaysia.entryGuide.steps.customs_inspection.description',
      defaultDescription: 'Declare items and pass through customs inspection',
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
      'malaysia.entryGuide.customs.prohibitedItems.0',
      'malaysia.entryGuide.customs.prohibitedItems.1',
      'malaysia.entryGuide.customs.prohibitedItems.2',
      'malaysia.entryGuide.customs.prohibitedItems.3',
      'malaysia.entryGuide.customs.prohibitedItems.4'
    ],
    restrictedItems: [
      'malaysia.entryGuide.customs.restrictedItems.0',
      'malaysia.entryGuide.customs.restrictedItems.1',
      'malaysia.entryGuide.customs.restrictedItems.2'
    ],
    dutyFree: {
      alcohol: 'malaysia.entryGuide.customs.dutyFree.alcohol',
      tobacco: 'malaysia.entryGuide.customs.dutyFree.tobacco',
      perfume: 'malaysia.entryGuide.customs.dutyFree.perfume',
      gifts: 'malaysia.entryGuide.customs.dutyFree.gifts'
    }
  },

  // MDAC信息
  mdac: {
    systemName: 'malaysia.entryGuide.mdac.systemName',
    submissionWindow: 'malaysia.entryGuide.mdac.submissionWindow',
    requiredDocuments: [
      'malaysia.entryGuide.mdac.requiredDocuments.0',
      'malaysia.entryGuide.mdac.requiredDocuments.1',
      'malaysia.entryGuide.mdac.requiredDocuments.2',
      'malaysia.entryGuide.mdac.requiredDocuments.3',
      'malaysia.entryGuide.mdac.requiredDocuments.4'
    ],
    processingTime: 'malaysia.entryGuide.mdac.processingTime',
    validity: 'malaysia.entryGuide.mdac.validity',
    cost: 'malaysia.entryGuide.mdac.cost',
    languages: [
      'malaysia.entryGuide.mdac.languages.0',
      'malaysia.entryGuide.mdac.languages.1',
      'malaysia.entryGuide.mdac.languages.2'
    ]
  },

  // 资金证明要求
  fundingRequirements: {
    minimumAmount: {
      perPerson: 350, // 林吉特
      family: 500
    },
    acceptedProofs: [
      'malaysia.entryGuide.fundingRequirements.acceptedProofs.0',
      'malaysia.entryGuide.fundingRequirements.acceptedProofs.1',
      'malaysia.entryGuide.fundingRequirements.acceptedProofs.2',
      'malaysia.entryGuide.fundingRequirements.acceptedProofs.3',
      'malaysia.entryGuide.fundingRequirements.acceptedProofs.4'
    ],
    validityPeriod: 'malaysia.entryGuide.fundingRequirements.validityPeriod',
    notes: [
      'malaysia.entryGuide.fundingRequirements.notes.0',
      'malaysia.entryGuide.fundingRequirements.notes.1',
      'malaysia.entryGuide.fundingRequirements.notes.2'
    ]
  },

  // 地区差异 (东马/西马)
  regionalDifferences: {
    westMalaysia: {
      name: 'malaysia.entryGuide.regionalDifferences.westMalaysia.name',
      airports: ['KUL', 'PEN'],
      requirements: 'malaysia.entryGuide.regionalDifferences.westMalaysia.requirements',
      notes: [
        'malaysia.entryGuide.regionalDifferences.westMalaysia.notes.0',
        'malaysia.entryGuide.regionalDifferences.westMalaysia.notes.1'
      ]
    },
    eastMalaysia: {
      name: 'malaysia.entryGuide.regionalDifferences.eastMalaysia.name',
      airports: ['BKI', 'KCH'],
      requirements: 'malaysia.entryGuide.regionalDifferences.eastMalaysia.requirements',
      notes: [
        'malaysia.entryGuide.regionalDifferences.eastMalaysia.notes.0',
        'malaysia.entryGuide.regionalDifferences.eastMalaysia.notes.1'
      ]
    }
  },

  // 交通信息
  transport: {
    options: [
      {
        type: 'taxi',
        name: 'malaysia.entryGuide.transport.options.taxi.name',
        from: 'malaysia.entryGuide.transport.options.taxi.from',
        to: 'malaysia.entryGuide.transport.options.taxi.to',
        duration: 'malaysia.entryGuide.transport.options.taxi.duration',
        cost: 'malaysia.entryGuide.transport.options.taxi.cost',
        frequency: 'malaysia.entryGuide.transport.options.taxi.frequency'
      },
      {
        type: 'grab',
        name: 'malaysia.entryGuide.transport.options.grab.name',
        from: 'malaysia.entryGuide.transport.options.grab.from',
        to: 'malaysia.entryGuide.transport.options.grab.to',
        duration: 'malaysia.entryGuide.transport.options.grab.duration',
        cost: 'malaysia.entryGuide.transport.options.grab.cost',
        frequency: 'malaysia.entryGuide.transport.options.grab.frequency'
      },
      {
        type: 'bus',
        name: 'malaysia.entryGuide.transport.options.bus.name',
        from: 'malaysia.entryGuide.transport.options.bus.from',
        to: 'malaysia.entryGuide.transport.options.bus.to',
        duration: 'malaysia.entryGuide.transport.options.bus.duration',
        cost: 'malaysia.entryGuide.transport.options.bus.cost',
        frequency: 'malaysia.entryGuide.transport.options.bus.frequency'
      },
      {
        type: 'kliaexpress',
        name: 'malaysia.entryGuide.transport.options.kliaexpress.name',
        from: 'malaysia.entryGuide.transport.options.kliaexpress.from',
        to: 'malaysia.entryGuide.transport.options.kliaexpress.to',
        duration: 'malaysia.entryGuide.transport.options.kliaexpress.duration',
        cost: 'malaysia.entryGuide.transport.options.kliaexpress.cost',
        frequency: 'malaysia.entryGuide.transport.options.kliaexpress.frequency'
      }
    ],
    recommendations: {
      kul: 'malaysia.entryGuide.transport.recommendations.kul',
      budget: 'malaysia.entryGuide.transport.recommendations.budget',
      comfort: 'malaysia.entryGuide.transport.recommendations.comfort',
      night: 'malaysia.entryGuide.transport.recommendations.night'
    }
  },

  // 货币和ATM信息
  currency: {
    code: 'MYR',
    name: 'malaysia.entryGuide.currency.name',
    denominations: [
      { value: 100, color: 'malaysia.entryGuide.currency.denominations.0.color', usage: 'malaysia.entryGuide.currency.denominations.0.usage' },
      { value: 50, color: 'malaysia.entryGuide.currency.denominations.1.color', usage: 'malaysia.entryGuide.currency.denominations.1.usage' },
      { value: 20, color: 'malaysia.entryGuide.currency.denominations.2.color', usage: 'malaysia.entryGuide.currency.denominations.2.usage' },
      { value: 10, color: 'malaysia.entryGuide.currency.denominations.3.color', usage: 'malaysia.entryGuide.currency.denominations.3.usage' }
    ],
    atm: {
      location: 'malaysia.entryGuide.currency.atm.location',
      banks: ['Maybank', 'CIMB', 'Public Bank', 'RHB'],
      fees: 'malaysia.entryGuide.currency.atm.fees',
      tips: [
        'malaysia.entryGuide.currency.atm.tips.0',
        'malaysia.entryGuide.currency.atm.tips.1',
        'malaysia.entryGuide.currency.atm.tips.2',
        'malaysia.entryGuide.currency.atm.tips.3'
      ]
    }
  },

  // 紧急联系方式
  emergency: {
    police: 'malaysia.entryGuide.emergency.police',
    ambulance: 'malaysia.entryGuide.emergency.police',
    touristPolice: 'malaysia.entryGuide.emergency.touristPolice',
    embassy: {
      china: 'malaysia.entryGuide.emergency.embassy.china',
      usa: 'malaysia.entryGuide.emergency.embassy.usa',
      korea: 'malaysia.entryGuide.emergency.embassy.korea'
    },
    immigration: 'malaysia.entryGuide.emergency.immigration',
    airport: 'malaysia.entryGuide.emergency.airport'
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
    useGrab: 'malaysia.entryGuide.languageHelp.useGrab',
    howMuch: 'malaysia.entryGuide.languageHelp.howMuch',
    noThankYou: 'malaysia.entryGuide.languageHelp.noThankYou',
    needHelp: 'malaysia.entryGuide.languageHelp.needHelp',
    needChange: 'malaysia.entryGuide.languageHelp.needChange',
    receipt: 'malaysia.entryGuide.languageHelp.receipt',
    whereIs: 'malaysia.entryGuide.languageHelp.whereIs',
    thankYou: 'malaysia.entryGuide.languageHelp.thankYou'
  }
};

export default malaysiaEntryGuide;