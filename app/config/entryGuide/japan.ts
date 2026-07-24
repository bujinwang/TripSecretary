/**
 * 日本入境指引配置
 * 融入日本入境卡和日本入境通概念的完整指引
 */

export const japanEntryGuide = {
  country: 'japan',
  countryName: 'Japan',
  countryNameZh: '日本',
  primaryAirport: 'NRT',
  currency: 'JPY',
  language: ['ja', 'en'],

  // 日本特有的入境卡系统
  features: {
    immigrationCard: {
      required: true,
      name: 'Immigration Card',
      nameZh: '入境卡',
      submissionWindow: '抵达时',
      qrCodeRequired: false,
      fields: [
        '护照号',
        '在留目的',
        '停留期间',
        '携入金额',
        '住址'
      ]
    },
    entryPack: {
      required: true,
      name: '入境通通关包',
      nameZh: '入境通通关包',
      contents: [
        '护照信息',
        '航班信息',
        '行程详情',
        '住宿信息',
        '资金证明'
      ]
    }
  },

  steps: [
    {
      id: 'arrival_procedures',
      category: '抵达手续',
      categoryZh: '抵达手续',
      title: '抵达手续',
      titleZh: '抵达手续',
      description: '完成入境卡填写，准备护照及必要文件',
      descriptionZh: '完成入境卡填写，准备护照及必要文件',
      priority: 1,
      estimatedTime: '10分钟',
      warnings: [
        '入境卡须用英文或日文填写',
        '确保护照在有效期内'
      ],
      tips: [
        '在飞机上提前填写入境卡',
        '准备住宿地址和联络方式'
      ],
      icon: '📋',
      required: true,
      skippable: false
    },
    {
      id: 'immigration_counter',
      category: '入境检查',
      categoryZh: '入境检查',
      title: '入境检查',
      titleZh: '入境检查',
      description: '在入境审查柜台提交护照和入境卡',
      descriptionZh: '在入境审查柜台提交护照和入境卡',
      priority: 2,
      estimatedTime: '5分钟',
      warnings: [
        '保持礼貌，清晰回答问题',
        '准备说明来日本的目的'
      ],
      tips: [
        '回答问题要简洁明了',
        '如需帮助可要求翻译服务'
      ],
      icon: '🛂',
      required: true,
      skippable: false
    },
    {
      id: 'baggage_claim',
      category: '行李提取',
      categoryZh: '行李提取',
      title: '行李提取',
      titleZh: '行李提取',
      description: '根据航班信息在行李转盘处提取行李',
      descriptionZh: '根据航班信息在行李转盘处提取行李',
      priority: 3,
      estimatedTime: '15分钟',
      warnings: [
        '检查行李标签，避免拿错',
        '如发现行李异常请立即联系'
      ],
      tips: [
        '提前准备行李认领凭证',
        '注意观察行李外形特征'
      ],
      icon: '🛄',
      required: true,
      skippable: false
    },
    {
      id: 'customs_declaration',
      category: '海关申报',
      categoryZh: '海关申报',
      title: '海关申报',
      titleZh: '海关申报',
      description: '根据携带物品进行海关申报',
      descriptionZh: '根据携带物品进行海关申报',
      priority: 4,
      estimatedTime: '10分钟',
      warnings: [
        '禁止携带毒品和违法物品',
        '现金超过100万日元需申报'
      ],
      tips: [
        '大多数旅客走绿色通道',
        '不确定时主动向海关咨询'
      ],
      icon: '🧾',
      required: true,
      skippable: false
    },
    {
      id: 'transportation',
      category: '交通出行',
      categoryZh: '交通出行',
      title: '前往市区',
      titleZh: '前往市区',
      description: '选择合适的交通工具前往目的地',
      descriptionZh: '选择合适的交通工具前往目的地',
      priority: 5,
      estimatedTime: '60分钟',
      warnings: [
        '注意电车末班车时间',
        '保管好交通卡和收据'
      ],
      tips: [
        '推荐购买JR Pass或IC卡',
        '可以利用机场巴士或电车'
      ],
      icon: '🚄',
      required: true,
      skippable: false
    }
  ],

  customs: {
    declarationRequired: true,
    prohibitedItems: [
      '毒品',
      '枪支',
      '生鲜食品',
      '超过规定金额的现金'
    ],
    dutyFree: {
      alcohol: '3瓶',
      tobacco: '200支'
    }
  },

  emergency: {
    police: '110',
    ambulance: '119',
    embassy: '+81-3-3224-5000'
  },

  tips: [
    '入境卡：抵达时填写，用英文或日文',
    '通关包：护照、机票、住宿确认等文件整理',
    '交通：购买IC卡可方便乘坐各种交通工具',
    '文化：保持礼貌，遵守日本的社会规范',
    '语言：机场有中文导引，多数服务有英文说明'
  ]
};

export default japanEntryGuide;