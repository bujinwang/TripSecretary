// 韩国入境指引配置文件 - 仁川机场ICN/金浦机场GMP完整流程
// 基于实际机场体验和K-ETA电子旅行许可系统

export const koreaEntryGuide = {
  country: 'korea',
  countryName: '韩国',
  countryNameZh: '韩国',
  airports: ['ICN', 'GMP', 'PUS'], // 仁川、金浦、釜山机场
  currencyCode: 'KRW',
  language: ['ko', 'en', 'zh'], // 韩语、英语、汉语

  // 重要提醒
  importantNotes: [
    '必须在抵达前72小时申请K-ETA电子旅行许可',
    '准备好生物识别信息：指纹和面部照片',
    '韩国对入境要求极为严格，材料必须完整准确',
    '现金准备：机场汇率较高，建议带韩元现金',
    '地铁系统发达但标识复杂，建议使用机场巴士'
  ],

  // 7步骤完整流程 (包含紧急联系方式准备)
  steps: [
    {
      id: 'emergency_contacts',
      title: '紧急联系方式',
      titleZh: '紧急联系方式',
      description: '保存韩国紧急联系电话，以备不时之需',
      descriptionZh: '保存韩国紧急联系电话，以备不时之需',
      category: 'pre-arrival',
      priority: 1,
      estimatedTime: '2分钟',
      icon: '🆘',
      required: false,
      tips: [
        '警察：112',
        '救护车：119',
        '旅游警察：1345',
        '中国大使馆：+82-2-3210-0700',
        '美国大使馆：+82-2-397-4114',
        '移民局：+82-1345',
        '机场服务：+82-1577-2600',
        '将这些号码保存到手机通讯录',
        '遇到紧急情况立即拨打'
      ]
    },
    {
      id: 'keta_application',
      title: 'K-ETA电子旅行许可申请',
      titleZh: 'K-ETA电子旅行许可申请',
      description: '抵达前72小时申请韩国电子旅行许可',
      descriptionZh: '抵达前72小时申请韩国电子旅行许可',
      category: 'pre-arrival',
      priority: 2,
      estimatedTime: '30分钟',
      icon: '📱',
      required: true,
      warnings: [
        '必须在抵达前72小时申请',
        '信息必须与护照完全一致',
        '申请费用约2万美元'
      ],
      tips: [
        '准备护照扫描件',
        '准备近期照片',
        '确认旅行信息准确',
        '保存批准邮件和二维码'
      ]
    },
    {
      id: 'biometric_preparation',
      title: '生物识别信息准备',
      titleZh: '生物识别信息准备',
      description: '准备指纹和面部识别数据',
      descriptionZh: '准备指纹和面部识别数据',
      category: 'pre-flight',
      priority: 3,
      estimatedTime: '10分钟',
      icon: '👆',
      required: true,
      tips: [
        '保持手指清洁干燥',
        '准备正面照片',
        '了解生物识别流程',
        '确认设备兼容性'
      ]
    },
    {
      id: 'landing_setup',
      title: '落地前准备',
      titleZh: '落地前准备',
      description: '关闭蜂窝网络，准备韩国eSIM卡',
      descriptionZh: '关闭蜂窝网络，准备韩国eSIM卡',
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
        '注意韩国寒冷气候'
      ]
    },
    {
      id: 'immigration_biometric',
      title: '移民局生物识别检查',
      titleZh: '移民局生物识别检查',
      description: '进行指纹和面部识别，提交入境卡',
      descriptionZh: '进行指纹和面部识别，提交入境卡',
      category: 'immigration',
      priority: 5,
      estimatedTime: '10分钟',
      icon: '🛂',
      required: true,
      tips: [
        '排队等候相应通道',
        '准备护照和K-ETA批准邮件',
        '配合生物识别扫描',
        '回答官员关于访问目的的问题'
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
        '韩国机场行李系统高效',
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
      estimatedTime: '10分钟',
      icon: '🔍',
      required: true,
      tips: [
        '如实申报所有物品',
        '新鲜水果和肉类禁止入境',
        '免税额度：香烟200支，酒类1升'
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
      '中药材',
      '烟草制品',
      '酒类饮料'
    ],
    dutyFree: {
      alcohol: '1升',
      tobacco: '200支香烟或50克烟丝',
      perfume: '60ml',
      gifts: '相当于600,000韩元'
    }
  },

  // K-ETA信息
  keta: {
    systemName: 'Korea Electronic Travel Authorization',
    applicationWindow: '72小时',
    requiredDocuments: [
      '有效护照',
      '近期照片',
      '旅行信息',
      '住宿地址',
      '返程机票'
    ],
    processingTime: '通常24小时内',
    validity: '从抵达之日起2年',
    cost: '约20,000韩元',
    languages: ['ko', 'en', 'zh', 'ja']
  },

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
      'K-ETA申请时预注册',
      '抵达时现场验证',
      '数据用于身份确认',
      '信息安全有保障'
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
      'address_in_korea',
      'contact_information',
      'emergency_contact'
    ],
    languages: ['ko', 'en'],
    submission: '在移民局窗口提交',
    tips: [
      '用韩文或英文填写',
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
        name: '地铁AREX',
        from: 'ICN',
        to: '首尔站',
        duration: '43分钟',
        cost: '₩9,000',
        frequency: '每5-10分钟一班'
      },
      {
        type: 'bus',
        name: '机场巴士',
        from: 'ICN/GMP',
        to: '首尔各大酒店',
        duration: '60-90分钟',
        cost: '₩10,000-15,000',
        frequency: '每15-30分钟一班'
      },
      {
        type: 'limousine',
        name: '豪华轿车',
        from: '机场',
        to: '市区',
        duration: '45-75分钟',
        cost: '₩80,000-120,000',
        tips: '适合商务旅客'
      },
      {
        type: 'taxi',
        name: '出租车',
        from: '机场',
        to: '市区',
        duration: '45-75分钟',
        cost: '₩50,000-80,000',
        tips: '费用较高但舒适'
      }
    ],
    recommendations: {
      icn: 'AREX地铁最快捷',
      gmp: '地铁或巴士最经济',
      budget: '机场巴士最实惠',
      comfort: '豪华轿车最舒适'
    }
  },

  // 货币和ATM信息
  currency: {
    code: 'KRW',
    name: '韩元',
    denominations: [
      { value: 50000, color: '紫色', usage: '大额支付' },
      { value: 10000, color: '红色', usage: '中等金额' },
      { value: 5000, color: '蓝色', usage: '小额支付' },
      { value: 1000, color: '绿色', usage: '找零' }
    ],
    atm: {
      location: '机场到达大厅',
      banks: ['Shinhan', 'KB Kookmin', 'Woori', 'Hana'],
      fees: '约₩3,000-5,000',
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
    police: '112',
    ambulance: '119',
    touristPolice: '1345',
    embassy: {
      china: '+82-2-3210-0700',
      usa: '+82-2-397-4114',
      japan: '+82-2-2170-5200'
    },
    immigration: '+82-1345',
    airport: '+82-1577-2600'
  },

  // 文化和礼仪提醒
  cultureTips: [
    '韩国人注重礼貌和秩序',
    '见面时鞠躬问候',
    '用餐时等长辈先动筷子',
    '公共场合保持安静',
    '尊重年长者和权威'
  ],

  // 语言帮助卡（备用）
  languageHelp: {
    useSubway: 'Subway please',
    howMuch: 'How much?',
    noThankYou: 'No, thank you',
    needHelp: 'I need help',
    needChange: 'I need change please',
    receipt: 'Receipt please',
    whereIs: 'Where is...?',
    thankYou: 'Kamsahamnida'
  }
};

export default koreaEntryGuide;