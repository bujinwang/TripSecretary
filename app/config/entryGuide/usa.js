// 美国入境指引配置文件 - 主要机场JFK/LAX/ORD/SFO完整流程
// 基于实际机场体验和ESTA电子旅行许可系统

export const usaEntryGuide = {
  country: 'usa',
  countryName: '美国',
  countryNameZh: '美国',
  airports: ['JFK', 'LAX', 'ORD', 'SFO', 'MIA', 'SEA'], // 主要国际机场
  currency: 'USD',
  language: ['en', 'es'], // 英语、西班牙语

  // 重要提醒
  importantNotes: [
    '必须在抵达前72小时申请ESTA电子旅行许可',
    '确认是否属于免签证计划(VWP)国家公民',
    '准备好生物识别信息：指纹和面部照片',
    '海关申报：申报所有食品、动植物产品',
    '注意美国严苛的安检和海关检查程序'
  ],

  // 7步骤完整流程 (包含紧急联系方式准备)
  steps: [
    {
      id: 'emergency_contacts',
      title: '紧急联系方式',
      titleZh: '紧急联系方式',
      description: '保存美国紧急联系电话，以备不时之需',
      descriptionZh: '保存美国紧急联系电话，以备不时之需',
      category: 'pre-arrival',
      priority: 1,
      estimatedTime: '2分钟',
      icon: '🆘',
      required: false,
      tips: [
        '警察/救护车/火警：911',
        '旅游警察：1-202-501-4444',
        '中国大使馆：+1-202-495-2266',
        '韩国大使馆：+1-202-939-5600',
        '日本大使馆：+1-202-238-6700',
        '移民局：+1-202-325-3535',
        '机场服务：+1-800-882-8880',
        '将这些号码保存到手机通讯录',
        '遇到紧急情况立即拨打911'
      ]
    },
    {
      id: 'esta_application',
      title: 'ESTA电子旅行许可申请',
      titleZh: 'ESTA电子旅行许可申请',
      description: '抵达前72小时申请美国电子旅行许可',
      descriptionZh: '抵达前72小时申请美国电子旅行许可',
      category: 'pre-arrival',
      priority: 2,
      estimatedTime: '15分钟',
      icon: '📱',
      required: true,
      warnings: [
        '必须在抵达前72小时申请',
        '费用21美元，有效期2年',
        '信息必须与护照完全一致'
      ],
      tips: [
        '确认VWP资格（免签证计划国家）',
        '准备护照扫描件和照片',
        '填写英文个人信息',
        '保存批准邮件和ESTA号码'
      ]
    },
    {
      id: 'biometric_prep',
      title: '生物识别信息准备',
      titleZh: '生物识别信息准备',
      description: '准备指纹和面部识别数据',
      descriptionZh: '准备指纹和面部识别数据',
      category: 'pre-flight',
      priority: 3,
      estimatedTime: '5分钟',
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
      description: '关闭蜂窝网络，准备美元兑换',
      descriptionZh: '关闭蜂窝网络，准备美元兑换',
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
        '注意美国海关的严格检查'
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
      estimatedTime: '15分钟',
      icon: '🛂',
      required: true,
      tips: [
        '排队等候相应通道',
        '准备护照和ESTA批准邮件',
        '配合生物识别扫描',
        '回答官员关于访问目的的问题'
      ]
    },
    {
      id: 'baggage_customs',
      title: '行李领取和海关检查',
      titleZh: '行李领取和海关检查',
      description: '认领行李并通过海关申报',
      descriptionZh: '认领行李并通过海关申报',
      category: 'baggage',
      priority: 6,
      estimatedTime: '20分钟',
      icon: '🧳',
      required: true,
      tips: [
        '查看屏幕了解行李转盘号',
        '如实申报所有物品',
        '准备好海关申报表'
      ]
    },
    {
      id: 'customs_inspection',
      title: '海关物品检查',
      titleZh: '海关物品检查',
      description: '最终海关检查和物品验证',
      descriptionZh: '最终海关检查和物品验证',
      category: 'customs',
      priority: 7,
      estimatedTime: '10分钟',
      icon: '🔍',
      required: true,
      tips: [
        '配合海关官员检查',
        '出示申报的物品',
        '回答关于物品来源的问题'
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
  currency: {
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
    touristPolice: '1-202-501-4444',
    embassy: {
      china: '+1-202-495-2266',
      korea: '+1-202-939-5600',
      japan: '+1-202-238-6700'
    },
    immigration: '+1-202-325-3535',
    airport: '+1-800-882-8880'
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