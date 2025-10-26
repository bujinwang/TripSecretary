// 日本入境指引配置文件 - 成田/羽田/关西机场完整流程
// 基于实际机场体验和日本入境管理系统

export const japanEntryGuide = {
  country: 'japan',
  countryName: '日本',
  countryNameZh: '日本',
  airports: ['NRT', 'HND', 'KIX'], // 成田、羽田、关西
  currency: 'JPY',
  language: ['ja', 'en'],

  // 重要提醒
  importantNotes: [
    '抵达前准备好护照、居留卡和入境卡',
    '准备好通关包，包含个人信息、旅行计划等材料',
    '落地后立即关闭蜂窝网络数据',
    '准备现金或IC卡用于交通',
    '了解日本的入境规定和文化礼仪'
  ],

  // 7步骤完整流程 (包含紧急联系方式准备)
  steps: [
    {
      id: 'emergency_contacts',
      title: '紧急联系方式',
      titleZh: '紧急联系方式',
      description: '保存日本紧急联系电话，以备不时之需',
      descriptionZh: '保存日本紧急联系电话，以备不时之需',
      category: 'pre-arrival',
      priority: 1,
      estimatedTime: '2分钟',
      icon: '🆘',
      required: false,
      tips: [
        '警察：110',
        '救护车/火警：119',
        '旅游咨询：0570-000-330（有中文服务）',
        '中国大使馆：+81-3-3403-3066',
        '台湾驻日办事处：+81-3-3263-4244',
        '将这些号码保存到手机通讯录',
        '遇到紧急情况立即拨打',
        '旅游咨询提供中文服务'
      ]
    },
    {
      id: 'landing_setup',
      title: '落地前准备',
      titleZh: '落地前准备',
      description: '关闭蜂窝网络数据，激活日本eSIM卡',
      descriptionZh: '关闭蜂窝网络数据，激活日本eSIM卡',
      category: 'post-landing',
      priority: 2,
      estimatedTime: '2分钟',
      icon: '📱',
      required: true,
      warnings: [
        '飞机滑行时勿使用手机',
        '确保WiFi也已关闭'
      ],
      tips: [
        '跟着人群走，看Arrivals或Immigration标识',
        '准备手机离线模式',
        '确认护照和居留卡在手'
      ]
    },
    {
      id: 'immigration',
      title: '移民局检查',
      titleZh: '移民局检查',
      description: '出示通关包、护照和居留卡，核验入境信息',
      descriptionZh: '出示通关包、护照和居留卡，核验入境信息',
      category: 'immigration',
      priority: 3,
      estimatedTime: '20分钟',
      icon: '🛂',
      required: true,
      showEntryPack: true, // 重点显示通关包
      tips: [
        '排队等候Immigration检查柜台',
        '准备护照、居留卡和手机通关包页面',
        '出示：护照、居留卡、目的声明书',
        '配合官员：拍照、按指纹',
        '保持入境通APP开启',
        '通关包包含：个人信息、旅行信息、住宿信息、资金证明、常见问题回答',
        '外国人通道：Foreign Passport或Residents'
      ]
    },
    {
      id: 'baggage_claim',
      title: '行李领取',
      titleZh: '行李领取',
      description: '找到行李转盘，认领行李',
      descriptionZh: '找到行李转盘，认领行李',
      category: 'baggage',
      priority: 4,
      estimatedTime: '15分钟',
      icon: '🧳',
      required: true,
      tips: [
        '看屏幕找航班号和行李转盘编号',
        '去对应行李转盘',
        '拿好所有行李',
        '确认行李标签'
      ]
    },
    {
      id: 'customs_inspection',
      title: '海关物品检查',
      titleZh: '海关物品检查',
      description: '申报物品，海关X光机检查',
      descriptionZh: '申报物品，海关X光机检查',
      category: 'customs',
      priority: 5,
      estimatedTime: '10分钟',
      icon: '🔍',
      required: true,
      tips: [
        '根据物品选择申报通道',
        '绿色通道：无申报物品',
        '红色通道：有申报物品',
        '申报物品：酒类、烟草、现金超过100万日元',
        '准备好申报单和物品清单'
      ]
    },
    {
      id: 'transport_arrangement',
      title: '交通安排',
      titleZh: '交通安排',
      description: '选择交通方式前往目的地',
      descriptionZh: '选择交通方式前往目的地',
      category: 'transportation',
      priority: 6,
      estimatedTime: '30分钟',
      icon: '🚆',
      required: true,
      tips: [
        '机场铁路：JR线最便捷',
        '购买Suica或Pasmo IC卡',
        '出租车：费用较高但舒适',
        '机场大巴：经济实惠',
        '提前规划路线和时间',
        '准备现金或IC卡'
      ]
    },
    {
      id: 'arrival_destination',
      title: '抵达目的地',
      titleZh: '抵达目的地',
      description: '安全抵达住宿地点，完成入境手续',
      descriptionZh: '安全抵达住宿地点，完成入境手续',
      category: 'arrival',
      priority: 7,
      estimatedTime: '45分钟',
      icon: '🏨',
      required: true,
      tips: [
        '跟据导航找到住宿地点',
        '办理酒店入住手续',
        '确认入境章和停留期限',
        '保存重要文件',
        '开启日本旅行模式',
        '享受日本之旅'
      ]
    }
  ],

  // 海关信息
  customs: {
    declarationRequired: true,
    prohibitedItems: [
      '新鲜水果和蔬菜',
      '肉类制品',
      '种子和土壤',
      '现金超过100万日元（需申报）'
    ],
    dutyFree: {
      alcohol: '3瓶（每瓶760ml）',
      tobacco: '200支香烟或50支雪茄或250g烟丝',
      perfume: '2盎司',
      gifts: '价值不超过20万日元'
    },
    declarationChannels: {
      green: '无申报物品',
      red: '有申报物品',
      blue: '特殊申报'
    }
  },

  // 交通信息
  transport: {
    airportRail: {
      name: 'JR线',
      description: '从机场直达东京市区',
      options: [
        { name: '成田特快', destination: '东京', time: '60分钟', price: '¥3,020' },
        { name: '京成 Skyliner', destination: '日暮里', time: '36分钟', price: '¥2,470' }
      ]
    },
    icCard: {
      types: ['Suica', 'Pasmo'],
      purchase: '机场自动售票机或便利店',
      initialCharge: '¥500',
      usage: '地铁、公交、商店'
    },
    taxi: {
      cost: '从成田到东京约¥20,000-30,000',
      tips: '预约或使用机场出租车柜台'
    },
    bus: {
      cost: '¥1,000-3,000',
      routes: '直达主要酒店和车站'
    }
  },

  // 货币和ATM信息
  currency: {
    name: '日元',
    code: 'JPY',
    denominations: [
      { amount: 10000, color: '蓝色', usage: '大额支付' },
      { amount: 5000, color: '紫色', usage: '中等金额' },
      { amount: 1000, color: '绿色', usage: '日常使用' },
      { amount: 500, color: '红色', usage: '小额支付' }
    ],
    atm: {
      location: '机场到达大厅',
      recommendedBanks: ['三菱UFJ', '三井住友', '瑞穂'],
      fees: '约¥200-300/次',
      tips: [
        '选择英文界面',
        '确认手续费',
        '建议多取一些现金',
        '机场ATM汇率较好'
      ]
    }
  },

  // 紧急联系方式
  emergency: {
    police: '110',
    ambulance: '119',
    fire: '119',
    embassy: {
      china: '+81-3-3403-3066',
      taiwan: '+81-3-3263-4244'
    },
    touristInfo: '0570-000-330（有中文服务）'
  },

  // 语言帮助卡
  languageHelp: {
    whereIsTaxi: 'Taxi wa doko desu ka?',
    howMuch: 'Ikura desu ka?',
    receipt: 'Receipt onegaishimasu',
    help: 'Tasukete kudasai',
    thankYou: 'Arigatou gozaimasu',
    excuseMe: 'Sumimasen',
    iDontUnderstand: 'Wakarimasen'
  },

  // 文化提示
  cultureTips: [
    '日本人说话礼貌，常用"请"和"谢谢"',
    '排队时保持秩序',
    '在公共场合保持安静',
    '脱鞋进入室内',
    '使用湿巾清洁餐具'
  ]
};

export default japanEntryGuide;