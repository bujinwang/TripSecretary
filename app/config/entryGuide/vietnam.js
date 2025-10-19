// 越南入境指引配置文件 - 内排机场HAN/新山一机场SGN/岘港机场DAD完整流程
// 基于实际机场体验和越南电子签证系统

export const vietnamEntryGuide = {
  country: 'vietnam',
  countryName: '越南',
  countryNameZh: '越南',
  airports: ['HAN', 'SGN', 'DAD'], // 内排、新山一、岘港机场
  currency: 'VND',
  language: ['vi', 'en', 'zh'], // 越南语、英语、汉语

  // 重要提醒
  importantNotes: [
    '电子签证申请需在抵达前至少3个工作日',
    '准备充足的资金证明，每人至少2000美元',
    '越南对黄热病疫苗有要求，部分地区需要接种',
    '现金准备：越南盾汇率波动大，建议带美元现金',
    '注意交通拥堵，机场到市区可能需要2-3小时'
  ],

  // 6步骤完整流程 (越南入境相对灵活但文件要求严格)
  steps: [
    {
      id: 'visa_application',
      title: '电子签证申请',
      titleZh: '电子签证申请',
      description: '申请越南电子签证或确认签证类型',
      descriptionZh: '申请越南电子签证或确认签证类型',
      category: 'pre-arrival',
      priority: 1,
      estimatedTime: '45分钟',
      icon: '📱',
      required: true,
      warnings: [
        '必须在抵达前至少3个工作日申请',
        '电子签证费用约25-50美元',
        '信息必须与护照完全一致'
      ],
      tips: [
        '准备护照扫描件和照片',
        '确认入境目的和停留时间',
        '保存批准邮件和签证PDF',
        '打印签证作为备份'
      ]
    },
    {
      id: 'health_declaration',
      title: '健康申报',
      titleZh: '健康申报',
      description: '完成健康申报表，确认疫苗要求',
      descriptionZh: '完成健康申报表，确认疫苗要求',
      category: 'pre-flight',
      priority: 2,
      estimatedTime: '15分钟',
      icon: '🏥',
      required: true,
      warnings: [
        '黄热病疫苗可能需要接种',
        'COVID-19相关要求请确认最新政策'
      ],
      tips: [
        '检查是否需要黄热病疫苗',
        '准备疫苗接种证明',
        '了解当前健康申报要求',
        '保存所有医疗文件'
      ]
    },
    {
      id: 'landing_setup',
      title: '落地前准备',
      titleZh: '落地前准备',
      description: '关闭蜂窝网络，准备越南dong兑换',
      descriptionZh: '关闭蜂窝网络，准备越南dong兑换',
      category: 'post-landing',
      priority: 3,
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
        '注意越南炎热潮湿气候'
      ]
    },
    {
      id: 'immigration_check',
      title: '移民局检查',
      titleZh: '移民局检查',
      description: '出示护照和签证，完成入境检查',
      descriptionZh: '出示护照和签证，完成入境检查',
      category: 'immigration',
      priority: 4,
      estimatedTime: '20分钟',
      icon: '🛂',
      required: true,
      tips: [
        '排队等候相应通道',
        '准备护照和签证文件',
        '出示健康申报表',
        '回答官员关于旅行目的的问题'
      ]
    },
    {
      id: 'baggage_claim',
      title: '行李领取',
      titleZh: '行李领取',
      description: '找到行李转盘，认领行李',
      descriptionZh: '找到行李转盘，认领行李',
      category: 'baggage',
      priority: 5,
      estimatedTime: '20分钟',
      icon: '🧳',
      required: true,
      tips: [
        '查看屏幕了解行李转盘号',
        '越南机场行李系统通常高效',
        '找不到行李立即报告'
      ]
    },
    {
      id: 'customs_inspection',
      title: '海关检查',
      titleZh: '海关检查',
      description: '申报物品，通过海关检查',
      descriptionZh: '申报物品，通过海关检查',
      category: 'customs',
      priority: 6,
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
      '武器弹药',
      '毒品及其制品'
    ],
    restrictedItems: [
      '中药材',
      '烟草制品',
      '酒类饮料',
      '电子产品'
    ],
    dutyFree: {
      alcohol: '1.5升',
      tobacco: '200支香烟或250克烟丝',
      perfume: '300ml',
      gifts: '相当于300美元'
    }
  },

  // 签证信息
  visa: {
    types: [
      {
        name: '电子签证',
        duration: '30天',
        cost: '25-50美元',
        processingTime: '3个工作日',
        validity: '90天'
      },
      {
        name: '落地签证',
        duration: '30天',
        cost: '25-50美元',
        notes: '仅限特定国籍和机场'
      },
      {
        name: '商务签证',
        duration: '30-90天',
        cost: '80-150美元',
        notes: '需要邀请函'
      }
    ],
    requirements: [
      '有效护照（剩余6个月以上）',
      '签证申请表',
      '近期照片',
      '邀请函（如适用）',
      '资金证明',
      '返程机票'
    ],
    processingTime: '3个工作日',
    cost: '25-80美元（视类型而定）'
  },

  // 健康要求
  health: {
    yellowFever: {
      required: true,
      regions: ['Brazil', 'Argentina', 'Angola', 'Nigeria', 'Congo', 'Peru', 'Colombia', 'Venezuela'],
      validity: '10年',
      notes: '从疫区抵达需要接种证明'
    },
    covidRequirements: {
      current: '请确认最新要求',
      testing: '可能需要PCR检测',
      vaccination: '建议接种疫苗',
      notes: '政策可能随时变化'
    },
    healthDeclaration: {
      required: true,
      form: '入境健康申报表',
      languages: ['en', 'vi'],
      submission: '抵达时提交'
    }
  },

  // 资金证明要求
  fundingRequirements: {
    minimumAmount: {
      perPerson: 2000, // 美元
      family: 3000
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
      '金额必须是美元或等值货币',
      '家庭成员可合并计算'
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
        duration: '45-90分钟',
        cost: 'VND 300,000-600,000',
        frequency: '24小时'
      },
      {
        type: 'grab',
        name: 'Grab打车',
        from: '机场',
        to: '市区',
        duration: '45-90分钟',
        cost: 'VND 200,000-500,000',
        frequency: '24小时'
      },
      {
        type: 'bus',
        name: '机场巴士',
        from: '机场',
        to: '市区',
        duration: '60-120分钟',
        cost: 'VND 30,000-50,000',
        frequency: '每30分钟一班'
      },
      {
        type: 'limousine',
        name: '豪华轿车',
        from: '机场',
        to: '市区',
        duration: '45-75分钟',
        cost: 'VND 800,000-1,500,000',
        tips: '适合商务旅客'
      }
    ],
    recommendations: {
      han: 'Grab打车最方便',
      sgn: '出租车或Grab最实用',
      dad: '机场巴士最经济',
      night: '出租车最安全'
    }
  },

  // 货币和ATM信息
  currency: {
    code: 'VND',
    name: '越南盾',
    denominations: [
      { value: 500000, color: '紫色', usage: '大额支付' },
      { value: 200000, color: '红色', usage: '中等金额' },
      { value: 100000, color: '蓝色', usage: '小额支付' },
      { value: 50000, color: '绿色', usage: '找零' }
    ],
    atm: {
      location: '机场到达大厅',
      banks: ['Vietcombank', 'BIDV', 'Techcombank', 'ACB'],
      fees: '约VND 30,000-50,000',
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
    police: '113',
    ambulance: '115',
    touristPolice: '1800-1524',
    embassy: {
      china: '+84-24-3845-3866',
      usa: '+84-24-3850-5000',
      korea: '+84-24-3831-5110'
    },
    immigration: '+84-24-3824-7795',
    airport: '+84-24-3827-1515'
  },

  // 文化和礼仪提醒
  cultureTips: [
    '越南人热情好客，微笑是最好的沟通方式',
    '见面时可以握手，但不要过于用力',
    '用餐时等长辈先开始',
    '脱鞋进入寺庙和某些家庭',
    '尊重佛教文化，穿着保守'
  ],

  // 语言帮助卡（备用）
  languageHelp: {
    useGrab: 'Grab xin',
    howMuch: 'Bao nhiêu?',
    noThankYou: 'Không, cảm ơn',
    needHelp: 'Tôi cần giúp đỡ',
    needChange: 'Tôi cần đổi tiền',
    receipt: 'Hóa đơn',
    whereIs: 'Ở đâu...?',
    thankYou: 'Cảm ơn'
  }
};

export default vietnamEntryGuide;