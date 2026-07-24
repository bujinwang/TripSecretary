// 马来西亚入境指引配置文件 - 吉隆坡机场KUL/亚庇机场BKI完整流程
// 基于实际机场体验和MDAC数字入境卡系统

export const malaysiaEntryGuide = {
  country: 'malaysia',
  countryName: 'Malaysia',
  countryNameZh: '马来西亚',
  airports: ['KUL', 'BKI', 'PEN'], // 吉隆坡、亚庇、槟城机场
  currencyCode: 'MYR',
  language: ['ms', 'en', 'zh'], // 马来语、英语、华语

  // Navigation targets for related screens
  screens: {
    entryPackPreview: 'MalaysiaEntryPackPreview',
  },

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
      title: 'Emergency Contacts',
      titleZh: '紧急联系方式',
      titleKey: 'malaysia.entryGuide.steps.emergency_contacts.title',
      defaultTitle: 'Emergency Contacts',
      description: 'Save Malaysia emergency contact numbers for emergencies',
      descriptionZh: '保存马来西亚紧急联系电话，以备不时之需',
      descriptionKey: 'malaysia.entryGuide.steps.emergency_contacts.description',
      defaultDescription: 'Save Malaysia emergency contact numbers for emergencies',
      category: 'pre-arrival',
      categoryZh: '出发前',
      priority: 1,
      estimatedTime: '2 minutes',
      icon: '🆘',
      required: false,
      tips: [
        'Police/Ambulance: 999',
        'Tourist Police: 03-2115-9999',
        'Chinese Embassy: +60-3-2161-6000',
        'U.S. Embassy: +60-3-2168-5000',
        'Korean Embassy: +60-3-4251-5000',
        'Immigration Department: +60-3-8000-8000',
        'KUL Airport Hotline: +60-3-8776-4000',
        'Save these numbers in your phone contacts',
        'Dial 999 immediately for emergencies'
      ]
    },
    {
      id: 'mdac_submission',
      title: 'MDAC Digital Arrival Card Submission',
      titleZh: 'MDAC数字入境卡提交',
      titleKey: 'malaysia.entryGuide.steps.mdac_submission.title',
      defaultTitle: 'MDAC Digital Arrival Card Submission',
      description: 'Submit Malaysia Digital Arrival Card 3 days before arrival',
      descriptionZh: '在抵达前3天内提交马来西亚数字入境卡',
      descriptionKey: 'malaysia.entryGuide.steps.mdAC_submission.description',
      defaultDescription: 'Submit Malaysia Digital Arrival Card 3 days before arrival',
      category: 'pre-arrival',
      categoryZh: '出发前',
      priority: 2,
      estimatedTime: '10 minutes',
      icon: '📱',
      required: true,
      warnings: [
        'Must be submitted within 3 days before arrival',
        'East and West Malaysia can have different requirements',
        'Keep the MDAC confirmation email and QR code'
      ],
      tips: [
        'Have your passport, trip details, and proof of funds ready',
        'Confirm your arrival airport (East vs West Malaysia)',
        'Fill out all personal details in English',
        'Save the confirmation email on your phone'
      ]
    },
    {
      id: 'visa_check',
      title: 'Visa Confirmation',
      titleZh: '签证确认',
      titleKey: 'malaysia.entryGuide.steps.visa_check.title',
      defaultTitle: 'Visa Confirmation',
      description: 'Confirm visa type and validity',
      descriptionZh: '确认签证类型和有效期',
      descriptionKey: 'malaysia.entryGuide.steps.visa_check.description',
      defaultDescription: 'Confirm visa type and validity',
      category: 'pre-flight',
      categoryZh: '登机前',
      priority: 3,
      estimatedTime: '5 minutes',
      icon: '🛂',
      required: true,
      warnings: [
        'Business and technical visas may have extra requirements',
        'Entering East Malaysia can require additional permits'
      ],
      tips: [
        'Double-check visa validity and permitted stay length',
        'Make sure your visit purpose matches the visa type',
        'Business visitors should carry an invitation letter'
      ]
    },
    {
      id: 'preparation',
      title: 'In-flight Preparation',
      titleZh: '机上准备',
      titleKey: 'malaysia.entryGuide.steps.preparation.title',
      defaultTitle: 'In-flight Preparation',
      description: 'Organize entry pack and confirm MDAC status',
      descriptionZh: '整理入境资料包并确认MDAC状态',
      descriptionKey: 'malaysia.entryGuide.steps.preparation.description',
      defaultDescription: 'Organize entry pack and confirm MDAC status',
      category: 'in-flight',
      categoryZh: '飞行中',
      priority: 4,
      estimatedTime: '5 minutes',
      icon: '📋',
      required: true,
      tips: [
        'Review the MDAC confirmation email',
        'Keep your passport and documents within reach',
        'Make sure proof-of-funds documents are accessible'
      ]
    },
    {
      id: 'landing_setup',
      title: 'Pre-landing Setup',
      titleZh: '落地前准备',
      titleKey: 'malaysia.entryGuide.steps.landing_setup.title',
      defaultTitle: 'Pre-landing Setup',
      description: 'Turn off cellular data and prepare Malaysia eSIM',
      descriptionZh: '关闭蜂窝网络，准备马来西亚eSIM',
      descriptionKey: 'malaysia.entryGuide.steps.landing_setup.description',
      defaultDescription: 'Turn off cellular data and prepare Malaysia eSIM',
      category: 'post-landing',
      categoryZh: '落地后',
      priority: 5,
      estimatedTime: '2 minutes',
      icon: '📱',
      required: true,
      warnings: [
        'Do not use your phone while the plane is taxiing',
        'Switch off Wi-Fi as well'
      ],
      tips: [
        'Follow the “Arrivals” signage',
        'Put your phone in airplane/offline mode',
        'Remember the tropical climate and prep sun protection'
      ]
    },
    {
      id: 'immigration',
      title: 'Immigration Check',
      titleZh: '移民局检查',
      titleKey: 'malaysia.entryGuide.steps.immigration.title',
      defaultTitle: 'Immigration Check',
      description: 'Present passport and MDAC, complete check',
      descriptionZh: '出示护照和MDAC，完成入境检查',
      descriptionKey: 'malaysia.entryGuide.steps.immigration.description',
      defaultDescription: 'Present passport and MDAC, complete check',
      category: 'immigration',
      categoryZh: '移民检查',
      priority: 6,
      estimatedTime: '15 minutes',
      icon: '🛂',
      required: true,
      showEntryPack: true,
      entryPackHint: 'Organize your passport, MDAC confirmation email, and proof of funds so you can show them quickly to the officer.',
      tips: [
        'Queue in the appropriate immigration lane',
        'Have your passport and MDAC confirmation ready',
        'Follow the officer\'s instructions',
        'Expect additional screening when entering East Malaysia'
      ]
    },
    {
      id: 'baggage_claim',
      title: 'Baggage Claim',
      titleZh: '行李领取',
      titleKey: 'malaysia.entryGuide.steps.baggage_claim.title',
      defaultTitle: 'Baggage Claim',
      description: 'Find the baggage carousel and claim your luggage',
      descriptionZh: '找到行李转盘，认领行李',
      descriptionKey: 'malaysia.entryGuide.steps.baggage_claim.description',
      defaultDescription: 'Find the baggage carousel and claim your luggage',
      category: 'baggage',
      categoryZh: '行李',
      priority: 7,
      estimatedTime: '15 minutes',
      icon: '🧳',
      required: true,
      tips: [
        'Check the monitor for your carousel number',
        'Baggage handling is efficient but stay alert',
        'Report missing luggage immediately'
      ]
    },
    {
      id: 'customs_inspection',
      title: 'Customs Inspection',
      titleZh: '海关检查',
      titleKey: 'malaysia.entryGuide.steps.customs_inspection.title',
      defaultTitle: 'Customs Inspection',
      description: 'Declare items and pass through customs inspection',
      descriptionZh: '申报物品，通过海关检查',
      descriptionKey: 'malaysia.entryGuide.steps.customs_inspection.description',
      defaultDescription: 'Declare items and pass through customs inspection',
      category: 'customs',
      categoryZh: '海关',
      priority: 8,
      estimatedTime: '10 minutes',
      icon: '🔍',
      required: true,
      tips: [
        'Declare everything honestly',
        'Pork products are not allowed',
        'Duty-free allowance: 200 cigarettes and 1L of alcohol'
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
    'Malaysia is majority Muslim - respect Islamic customs',
    'Dress modestly in public spaces',
    'Use your right hand when giving or receiving items',
    'Look for the Halal label at restaurants',
    'Expect changing business hours during Ramadan'
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
