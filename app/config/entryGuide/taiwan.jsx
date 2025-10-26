/**
 * 台湾入境指引配置
 * 完整入境流程指引
 */

export const taiwanEntryGuide = {
  country: 'taiwan',
  countryName: 'Taiwan',
  countryNameZh: '台湾',
  primaryAirport: 'TPE',
  currency: 'TWD',
  language: ['zh-TW', 'en'],

  // 台湾入境特点
  features: {
    arrivalCard: {
      required: true,
      name: 'Taiwan Arrival Card',
      nameZh: '台湾入境登记表',
      submissionWindow: '抵达前可在线填写',
      qrCodeRequired: false,
      fields: [
        '护照号',
        '航班号',
        '抵达日期',
        '在台住址'
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
        '住宿信息'
      ]
    }
  },

  steps: [
    {
      id: 'landing_setup',
      category: '落地前准备',
      categoryZh: '落地前准备',
      title: '落地前准备',
      titleZh: '落地前准备',
      description: '打开通关包，准备护照和入境资料',
      descriptionZh: '打开通关包，准备护照和入境资料',
      priority: 1,
      estimatedTime: '2分钟',
      warnings: [
        '提前准备好护照',
        '确认已填写入境登记表'
      ],
      tips: [
        '提前在入境通App内截图保存通关包',
        '准备好在台住宿地址'
      ],
      icon: '📱',
      required: true,
      skippable: false,
      showEntryPack: true
    },
    {
      id: 'immigration',
      category: '移民局检查',
      categoryZh: '移民局检查',
      title: '移民局检查',
      titleZh: '移民局检查',
      description: '排队等候移民官检查，出示护照和入境登记表',
      descriptionZh: '排队等候移民官检查，出示护照和入境登记表',
      priority: 2,
      estimatedTime: '15分钟',
      warnings: [
        '保持秩序，勿插队',
        '提前准备好护照和入境表',
        '回答问题要诚实简洁'
      ],
      tips: [
        '出示材料：护照、入境登记表、回程机票',
        '配合官员拍照与按指纹',
        '常见问答：来台目的、停留时间、住宿地址'
      ],
      icon: '🛂',
      required: true,
      skippable: false,
      showEntryPack: true
    },
    {
      id: 'baggage_claim',
      category: '行李领取',
      categoryZh: '行李领取',
      title: '行李领取',
      titleZh: '行李领取',
      description: '查看航班信息屏幕，找到对应转盘并认领所有行李',
      descriptionZh: '查看航班信息屏幕，找到对应转盘并认领所有行李',
      priority: 3,
      estimatedTime: '10分钟',
      warnings: [
        '核对行李牌，避免拿错',
        '如行李异常，请立即联系航空公司柜台'
      ],
      tips: [
        '提前准备登机牌或行李票根',
        '注意观察行李外形特征，方便识别'
      ],
      icon: '🛄',
      required: true,
      skippable: false
    },
    {
      id: 'customs_inspection',
      category: '海关检查',
      categoryZh: '海关检查',
      title: '海关检查',
      titleZh: '海关检查',
      description: '根据携带物品选择绿色或红色通道，配合海关完成X光检查',
      descriptionZh: '根据携带物品选择绿色或红色通道，配合海关完成X光检查',
      priority: 4,
      estimatedTime: '5分钟',
      warnings: [
        '禁止携带新鲜水果、肉类等违禁品',
        '香烟超过200支或酒类超过1升需申报'
      ],
      tips: [
        '大多数旅客走绿色通道（Nothing to Declare）',
        '如不确定是否需要申报，可选择红色通道询问'
      ],
      icon: '🧾',
      required: true,
      skippable: false
    },
    {
      id: 'currency_exchange',
      category: '金融服务',
      categoryZh: '金融服务',
      title: '兑换台币现金',
      titleZh: '兑换台币现金',
      description: '在到达大厅兑换台币或使用ATM取款',
      descriptionZh: '在到达大厅兑换台币或使用ATM取款',
      priority: 5,
      estimatedTime: '10分钟',
      warnings: [
        '机场汇率可能不是最优',
        '取款时注意遮挡密码，保留交易凭证'
      ],
      tips: [
        '推荐银行：台湾银行、兆丰银行、台北富邦',
        '便利店也可取款，手续费较低'
      ],
      icon: '💰',
      required: false,
      skippable: true
    },
    {
      id: 'transportation',
      category: '离开机场',
      categoryZh: '离开机场',
      title: '前往市区',
      titleZh: '前往市区',
      description: '选择机场捷运、巴士或出租车前往市区',
      descriptionZh: '选择机场捷运、巴士或出租车前往市区',
      priority: 6,
      estimatedTime: '45-60分钟',
      warnings: [
        '避免搭乘非法运营车辆',
        '注意保管好行李和贵重物品'
      ],
      tips: [
        '推荐：桃园机场捷运直达台北车站',
        '购买悠游卡可用于捷运、公交和便利店',
        '出租车按表计费，可使用信用卡'
      ],
      icon: '🚄',
      required: true,
      skippable: false
    }
  ],

  emergencyContacts: [
    {
      name: '台湾观光局旅游服务热线',
      phone: '0800-011-765',
      available: '24/7'
    },
    {
      name: '外国人在台生活谘询热线',
      phone: '0800-024-111',
      available: '24/7'
    },
    {
      name: '警察局（报案）',
      phone: '110',
      available: '24/7'
    },
    {
      name: '消防局（火警、救护）',
      phone: '119',
      available: '24/7'
    }
  ],

  importantNotes: [
    '台湾为繁体中文地区，注意与简体中文的差异',
    '台币为新台币（TWD），汇率约为1人民币=4.5新台币',
    '台湾使用110V电压，大陆电器需转换器',
    '遵守当地法律法规，禁止携带违禁品入境'
  ],

  culturalTips: [
    '台湾人民热情友好，可以用普通话沟通',
    '餐厅通常不收服务费，部分高档餐厅会加收10%',
    '公共场所禁止吸烟，违者罚款',
    '搭乘捷运时请勿饮食，靠右站立让出左侧通道'
  ]
};
