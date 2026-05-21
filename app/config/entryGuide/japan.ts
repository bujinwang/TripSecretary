// 日本入境指引配置文件 - 成田NRT/羽田HND/关西KIX/中部NGO/福冈FUK完整流程
// 基于实际机场体验和日本签证免签系统

const japanArrivalCardImage = require('../../../assets/forms/japan-entry-card-sample.jpg');
const japanCustomsDeclarationImage = require('../../../assets/forms/japan-customs-declaration.jpg');
const japanBiometricImage = require('../../../assets/forms/japan-biometric-scan.jpg');

export const japanEntryGuide = {
  country: 'japan',
  countryName: 'Japan',
  countryNameZh: '日本',
  airports: ['NRT', 'HND', 'KIX', 'NGO', 'FUK'], // 成田、羽田、关西、中部、福冈机场
  currency: 'JPY',
  language: ['ja', 'en', 'zh'], // 日语、英语、汉语

  // 重要提醒
  importantNotes: [
    '大多数国家公民享受日本90天免签待遇',
    '准备充足的资金证明，建议每人10万日元以上',
    '日本对食品和植物入境有严格限制',
    '现金准备：日本接受信用卡，但现金仍是主流',
    '准时到达，机场安检和入境可能需要1-2小时'
  ],
  importantNotesZh: [
    '大多数国家公民享受日本90天免签待遇',
    '准备充足的资金证明，建议每人10万日元以上',
    '日本对食品和植物入境有严格限制',
    '现金准备：日本接受信用卡，但现金仍是主流',
    '准时到达，机场安检和入境可能需要1-2小时'
  ],

  // 6步骤完整流程 (日本流程相对简单，免签国家无需签证)
  steps: [
    {
      id: 'emergency_contacts',
      title: 'Emergency Contacts',
      titleZh: '紧急联系方式',
      description: 'Save Japan emergency contact numbers for emergencies',
      descriptionZh: '保存日本紧急联系电话，以备不时之需',
      category: 'pre-arrival',
      priority: 1,
      estimatedTime: '2 minutes',
      icon: '🆘',
      required: false,
      tips: [
        'Police: 110',
        'Ambulance/Fire: 119',
        'Tourist Hotline (English): 050-3816-2787',
        'China Embassy: +81-3-3403-3388',
        'US Embassy: +81-3-3224-5000',
        'Immigration Information: +81-57-001-200',
        'Airport Service (Narita): +81-476-34-5000',
        'Save these numbers in your phone contacts',
        'Call immediately in case of emergency'
      ],
      tipsZh: [
        '警察：110',
        '急救/消防：119',
        '旅游服务热线（英语）：050-3816-2787',
        '中国驻日大使馆：+81-3-3403-3388',
        '美国大使馆：+81-3-3224-5000',
        '出入境咨询：+81-57-001-200',
        '成田机场服务台：+81-476-34-5000',
        '把这些号码保存到手机联系人',
        '遇到紧急情况立即拨打'
      ]
    },
    {
      id: 'visa_check',
      title: 'Visa Requirements Check',
      titleZh: '签证要求确认',
      description: 'Check if your country qualifies for visa-free entry',
      descriptionZh: '确认您的国家是否符合免签入境条件',
      category: 'pre-arrival',
      priority: 2,
      estimatedTime: '5 minutes',
      icon: '📋',
      required: true,
      warnings: [
        'Visa-free status only for tourism purposes',
        'Working is strictly prohibited',
        'Stay period is usually 90 days maximum'
      ],
      warningsZh: [
        '免签仅适用于旅游目的',
        '严禁在免签期间工作',
        '停留时间通常最多90天'
      ],
      tips: [
        'Check if your country is on the visa-free list',
        'Prepare proof of return ticket',
        'Confirm your passport validity (6+ months)',
        'Have travel insurance ready'
      ],
      tipsZh: [
        '确认本国是否在免签名单',
        '准备返程机票证明',
        '确认护照有效期至少6个月',
        '准备好旅行保险'
      ]
    },
    {
      id: 'arrival_card',
      title: 'Paper Arrival Card',
      titleZh: '纸质入境卡填写',
      description: 'Fill out the paper arrival/departure card (available in flight or at airport)',
      descriptionZh: '填写飞机上或入境柜台领取的纸质入出境卡，建议提前准备',
      category: 'pre-arrival',
      categoryZh: '表格填写',
      priority: 3,
      estimatedTime: '10 minutes',
      icon: '📝',
      required: true,
      media: {
        type: 'image',
        source: japanArrivalCardImage,
        caption: 'Japan Arrival Card Sample',
        captionZh: '日本入境卡填写示例',
      },
      warnings: [
        'Every traveler must complete their own card',
        'Use blue or black pen, write in English block letters',
        'Keep the departure portion for when you leave Japan'
      ],
      warningsZh: [
        '每位旅客都需单独填写入境卡',
        '使用黑色或蓝色签字笔，英文大写填写',
        '保留出境联，离境时需要提交'
      ],
      formFields: [
        {
          label: 'Family Name / Given Name',
          labelZh: '姓 / 名',
          guidance: 'Write exactly as shown in passport, use English block letters',
          guidanceZh: '与护照完全一致，使用英文字母大写'
        },
        {
          label: 'Nationality',
          labelZh: '国籍',
          guidance: 'Write your country name, e.g., CHINA, USA, KOREA',
          guidanceZh: '填写您的国家名称，例如 CHINA、USA、KOREA'
        },
        {
          label: 'Date of Birth',
          labelZh: '出生日期',
          guidance: 'Write in DD/MM/YYYY format',
          guidanceZh: '按日/月/年格式填写'
        },
        {
          label: 'Passport Number',
          labelZh: '护照号码',
          guidance: 'Enter complete passport number including letters',
          guidanceZh: '填写完整护照号码，包括字母'
        },
        {
          label: 'Flight Number',
          labelZh: '航班号',
          guidance: 'Enter your arriving flight number, e.g., JL123',
          guidanceZh: '填写抵达日本的航班号，例如 JL123'
        },
        {
          label: 'Purpose of Visit',
          labelZh: '入境目的',
          guidance: 'Tick Tourism / Business / Study / etc.',
          guidanceZh: '勾选旅游/商务/留学等对应选项'
        },
        {
          label: 'Address in Japan',
          labelZh: '在日本住宿地址',
          guidance: 'Write your hotel or accommodation address in Japan',
          guidanceZh: '填写在日本住宿的酒店或住宿地址'
        }
      ],
      tips: [
        'Bring your own pen to avoid asking flight attendants',
        'Practice filling the form before traveling to reduce stress',
        'If you forget to take one, you can get it at immigration but may need to queue again'
      ],
      tipsZh: [
        '随身携带签字笔，避免临时向空乘索要',
        '提前练习填写表格，减少现场压力',
        '若忘记领取可在入境处索取，但可能需要重新排队'
      ]
    },
    {
      id: 'landing_setup',
      title: 'Pre-Landing Preparation',
      titleZh: '落地前准备',
      description: 'Turn off mobile data, prepare for Japanese customs',
      descriptionZh: '关闭蜂窝数据，准备日本入境',
      category: 'post-landing',
      priority: 4,
      estimatedTime: '2 minutes',
      icon: '📱',
      required: true,
      warnings: [
        'Do not use mobile phones when aircraft is landing',
        'WiFi should also be turned off during landing'
      ],
      warningsZh: [
        '飞机降落滑行时不要使用手机',
        '降落时也应关闭WiFi'
      ],
      tips: [
        'Follow "Arrivals" signs',
        'Prepare for offline mode',
        'Be ready for Japanese efficiency and politeness'
      ],
      tipsZh: [
        '跟随“Arrivals”指示牌前进',
        '提前切换到离线模式',
        '做好迎接日本高效率与礼貌服务的准备'
      ]
    },
    {
      id: 'immigration_check',
      title: 'Immigration Check',
      titleZh: '入境检查',
      description: 'Present passport and arrival card for immigration verification',
      descriptionZh: '出示护照和入境卡完成入境检查',
      category: 'immigration',
      priority: 5,
      estimatedTime: '15 minutes',
      icon: '🛂',
      required: true,
      showEntryPack: true,
      entryPackHint: 'Organize your entry materials (passport, arrival card, travel plan, fund proof) to show directly to the officer.',
      entryPackHintZh: '把护照、入境卡、行程和资金证明整理好，方便直接出示给移民官。',
      tips: [
        'Queue for the appropriate lane (Visitor/Visa)',
        'Place passport and arrival card ready to present',
        'Be polite and answer questions clearly',
        'Fingerprints and photo may be required',
        'Keep arrival card departure portion safe for exit'
      ],
      tipsZh: [
        '排到合适通道（访客/签证）',
        '提前拿好护照和入境卡',
        '保持礼貌，清楚回答问题',
        '可能需要按指纹和拍照',
        '妥善保管出境联以便离境时使用'
      ]
    },
    {
      id: 'baggage_claim',
      title: 'Baggage Claim',
      titleZh: '行李领取',
      description: 'Collect your luggage from the carousel',
      descriptionZh: '从行李转盘领取行李',
      category: 'baggage',
      priority: 6,
      estimatedTime: '20 minutes',
      icon: '🧳',
      required: true,
      tips: [
        'Check screens for carousel number',
        'Japanese airports usually have efficient baggage systems',
        'Report missing baggage immediately',
        'Make sure you have all your luggage before proceeding'
      ],
      tipsZh: [
        '查看电子屏确认行李转盘号',
        '日本机场行李系统高效',
        '如有行李遗失立即报告',
        '离开前确认所有行李已取齐'
      ]
    },
    {
      id: 'customs_inspection',
      title: 'Customs Inspection',
      titleZh: '海关检查',
      description: 'Declare items and go through customs inspection',
      descriptionZh: '申报物品，通过海关检查',
      category: 'customs',
      priority: 7,
      estimatedTime: '10 minutes',
      icon: '🔍',
      required: true,
      media: {
        type: 'image',
        source: japanCustomsDeclarationImage,
        caption: 'Japan Customs Declaration Form',
        captionZh: '日本海关申报表',
      },
      tips: [
        'Declare all items honestly',
        'Food and plant items have strict restrictions',
        'Duty-free allowance: 1 liter alcohol, 200 cigarettes per person',
        'High-value electronics may need declaration'
      ],
      tipsZh: [
        '如实申报携带物品',
        '食品和植物有严格限制',
        '免税额度：酒1升、香烟200支',
        '高价值电子产品可能需申报'
      ]
    },
    {
      id: 'biometric_scan',
      title: 'Biometric Registration',
      titleZh: '生物信息登记',
      description: 'Fingerprints and photo for foreign visitors (biometric data)',
      descriptionZh: '为外国访客进行指纹和拍照登记（生物信息）',
      category: 'immigration',
      priority: 8,
      estimatedTime: '5 minutes',
      icon: '👆',
      required: true,
      media: {
        type: 'image',
        source: japanBiometricImage,
        caption: 'Japan Biometric Scan Process',
        captionZh: '日本生物信息扫描流程',
      },
      tips: [
        'Required for all foreign visitors aged 16+',
        'Place all fingers on scanner as instructed',
        'Look at camera for photo capture',
        'Process is quick and automated',
        'Data used for border security purposes'
      ],
      tipsZh: [
        '16岁以上外国旅客必须采集',
        '按指示把手指放在扫描仪上',
        '配合看向摄像头完成拍照',
        '流程快捷且自动化',
        '数据仅用于边境安全目的'
      ]
    }
  ],

  // 海关信息
  customs: {
    declarationRequired: true,
    prohibitedItems: [
      'Fresh fruits and vegetables',
      'Meat and meat products',
      'Seeds and soil',
      'Weapons and ammunition',
      'Drugs and narcotics'
    ],
    restrictedItems: [
      'Traditional Chinese medicine',
      'Tobacco products',
      'Alcoholic beverages',
      'Electronics over certain value',
      'Large amounts of cash (over 1 million yen)'
    ],
    dutyFree: {
      alcohol: '1 liter',
      tobacco: '200 cigarettes or 50 cigars',
      perfume: '2 ounces',
      gifts: 'Up to 200,000 yen value'
    }
  },

  // 签证信息
  visa: {
    types: [
      {
        name: 'Visa-Free Entry',
        duration: '90 days',
        cost: 'Free',
        processingTime: 'On arrival',
        validity: 'Must leave within 90 days',
        eligible: ['USA', 'China', 'UK', 'Canada', 'Australia', 'South Korea', 'Singapore', 'Malaysia', 'Thailand', 'Taiwan', 'Hong Kong', 'Macau']
      },
      {
        name: 'Tourist Visa',
        duration: '90 days',
        cost: 'Varies by country',
        processingTime: '5-10 business days',
        notes: 'For non-visa-free countries'
      },
      {
        name: 'Work Visa',
        duration: '1-5 years',
        cost: 'Varies',
        notes: 'Requires employer sponsorship'
      }
    ],
    requirements: [
      'Valid passport (6+ months remaining)',
      'Return or onward ticket',
      'Sufficient funds proof',
      'No work intention (for visa-free/tourist)',
      'Accommodation details'
    ],
    processingTime: '5-10 business days (if visa required)',
    cost: 'Free (visa-free countries), varies otherwise'
  },

  // 健康要求
  health: {
    yellowFever: {
      required: false,
      regions: ['Not typically required for most travelers'],
      notes: 'Only required if arriving from endemic areas'
    },
    covidRequirements: {
      current: 'Check latest requirements',
      testing: 'PCR test may be required',
      vaccination: 'Recommended but not mandatory',
      notes: 'Requirements change frequently'
    },
    healthDeclaration: {
      required: false,
      form: null,
      languages: [],
      submission: null
    }
  },

  // 资金证明要求
  fundingRequirements: {
    minimumAmount: {
      perPerson: 100000, // JPY (approximately $700 USD)
      family: 200000
    },
    acceptedProofs: [
      'Cash in hand',
      'Credit cards (multiple recommended)',
      'Bank statements',
      'Traveler\'s checks',
      'Employer guarantee letter'
    ],
    validityPeriod: 'Recent statements preferred',
    notes: [
      'Cash is still preferred in Japan',
      'Credit cards widely accepted but cash backup recommended',
      'Large amounts may need to be declared'
    ]
  },

  // 交通信息
  transport: {
    options: [
      {
        type: 'train',
        name: 'Airport Express Train',
        from: 'Airport',
        to: 'City Center',
        duration: '30-60 minutes',
        cost: 'JPY 1,000-3,000',
        frequency: 'Every 10-15 minutes'
      },
      {
        type: 'bus',
        name: 'Airport Limousine Bus',
        from: 'Airport',
        to: 'Major Hotels/Stations',
        duration: '45-90 minutes',
        cost: 'JPY 1,000-2,500',
        frequency: 'Every 20-30 minutes'
      },
      {
        type: 'taxi',
        name: 'Airport Taxi',
        from: 'Airport',
        to: 'City Center',
        duration: '45-90 minutes',
        cost: 'JPY 10,000-20,000',
        frequency: '24 hours'
      },
      {
        type: 'car_rental',
        name: 'Car Rental',
        from: 'Airport',
        to: 'Various',
        duration: 'Flexible',
        cost: 'JPY 5,000-10,000 per day',
        notes: 'International driving permit may be required'
      }
    ],
    recommendations: {
      narita: 'Narita Express train to Tokyo',
      haneda: 'Monorail to Hamamatsucho, then subway',
      kansai: 'Haruka Express to Osaka/Kyoto',
      chubu: 'Meitetsu train to Nagoya',
      fukuoka: 'Subway or taxi to city center'
    }
  },

  // 货币和ATM信息
  financialInfo: {
    code: 'JPY',
    name: 'Japanese Yen',
    denominations: [
      { value: 10000, color: 'Brown', usage: 'Large payments' },
      { value: 5000, color: 'Blue', usage: 'Medium payments' },
      { value: 1000, color: 'Green', usage: 'Small payments' },
      { value: 500, color: 'Silver', usage: 'Coins' }
    ],
    atm: {
      location: 'Airport arrival halls and city centers',
      banks: ['Seven Bank', 'Japan Post Bank', 'Mitsubishi UFJ', 'Sumitomo Mitsui'],
      fees: 'Usually JPY 200-300 for international cards',
      tips: [
        'Seven Bank ATMs at 7-Eleven accept international cards',
        'Japan Post ATMs widely available',
        'Check your card supports international transactions',
        'Have your PIN ready'
      ]
    }
  },

  // 紧急联系方式
  emergency: {
    police: '110',
    ambulance: '119',
    touristHotline: '050-3816-2787',
    embassy: {
      china: '+81-3-3403-3388',
      usa: '+81-3-3224-5000',
      canada: '+81-3-5212-4111',
      australia: '+81-3-5232-4111',
      uk: '+81-3-5211-1100'
    },
    immigration: '+81-57-001-200',
    airport: {
      narita: '+81-476-34-5000',
      haneda: '+81-3-5757-8111',
      kansai: '+81-72-455-2500',
      chubu: '+81-569-38-1111',
      fukuoka: '+81-92-477-1111'
    }
  },

  // 文化和礼仪提醒
  cultureTips: [
    'Japanese people value politeness and quiet behavior',
    'Remove shoes when entering homes and traditional buildings',
    'Do not eat or drink while walking',
    'Bow when greeting (slight bow is sufficient for foreigners)',
    'Be punctual - Japanese timekeeping is precise',
    'Quiet in public transportation',
    'Respect photography restrictions'
  ],

  // 语言帮助卡（备用）
  languageHelp: {
    thankYou: 'Arigatou gozaimasu',
    excuseMe: 'Sumimasen',
    whereIs: 'Doko desu ka?',
    howMuch: 'Ikura desu ka?',
    english: 'Eigo wo hanashimasu ka?',
    help: 'Tasukete kudasai',
    no: 'Iie',
    yes: 'Hai',
    sorry: 'Gomen nasai'
  }
};

export default japanEntryGuide;