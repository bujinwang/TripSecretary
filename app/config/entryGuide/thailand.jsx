/**
 * 泰国入境指引配置
 * 融入TDAC（泰国数字入境卡）和通关包概念的完整指引
 */

export const thailandEntryGuide = {
  country: 'thailand',
  countryName: 'Thailand',
  countryNameZh: '泰国',
  primaryAirport: 'BKK',
  currency: 'THB',
  language: ['th', 'en'],

  // 泰国特有的数字入境卡系统
  features: {
    tdac: {
      required: true,
      name: 'Thailand Digital Arrival Card',
      nameZh: '泰国数字入境卡',
      submissionWindow: '抵达前72小时内',
      qrCodeRequired: true,
      fields: [
        '护照号',
        'TH Digital Arrival Card No.',
        'Flight No./Vehicle No.',
        'Date of Arrival',
        'Name'
      ]
    },
    entryPack: {
      required: true,
      name: '入境通通关包',
      nameZh: '入境通通关包',
      contents: [
        'TDAC申请成功QR码',
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
      description: '关闭蜂窝网络数据，激活泰国eSIM卡，打开通关包离线版本',
      descriptionZh: '关闭蜂窝网络数据，激活泰国eSIM卡，打开通关包离线版本',
      priority: 1,
      estimatedTime: '2分钟',
      warnings: [
        '落地前关闭蜂窝数据，避免漫游费用',
        '提前确认eSIM已购买并可离线安装'
      ],
      tips: [
        '提前在入境通App内截图保存通关包',
        '如需离线地图，可同步下载曼谷离线包'
      ],
      icon: '📱',
      required: true,
      skippable: false
    },
    {
      id: 'immigration',
      category: '移民局检查',
      categoryZh: '移民局检查',
      title: '移民局检查',
      titleZh: '移民局检查',
      description: '排队等候移民官检查，出示通关包中的TDAC QR码与护照信息',
      descriptionZh: '排队等候移民官检查，出示通关包中的TDAC QR码与护照信息',
      priority: 2,
      estimatedTime: '15分钟',
      warnings: [
        '保持秩序，勿插队',
        '提前打开手机通关包，亮度调高',
        '回答问题要诚实简洁'
      ],
      tips: [
        '出示材料：护照、TDAC QR码、TH Digital Arrival Card No.',
        '配合官员拍照与按指纹',
        '常见问答：来泰目的、停留时间、住宿地址'
      ],
      icon: '🛂',
      required: true,
      skippable: false
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
      id: 'atm_withdrawal',
      category: '金融服务',
      categoryZh: '金融服务',
      title: 'ATM取泰铢现金',
      titleZh: 'ATM取泰铢现金',
      description: '在到达大厅ATM机取款，完成旅途第一笔现金补给',
      descriptionZh: '在到达大厅ATM机取款，完成旅途第一笔现金补给',
      priority: 5,
      estimatedTime: '10分钟',
      warnings: [
        '泰国ATM固定手续费约220泰铢/次',
        '取款时注意遮挡密码，保留交易凭证'
      ],
      tips: [
        '推荐银行：Bangkok Bank、Krungsri、Kasikorn Bank',
        '建议一次取出3,000-5,000泰铢，减少手续费',
        '若使用银联卡，选择“Debit/Savings”账户'
      ],
      icon: '💰',
      required: true,
      skippable: false
    },
    {
      id: 'taxi_to_hotel',
      category: '交通出行',
      categoryZh: '交通出行',
      title: '官方出租车到酒店',
      titleZh: '官方出租车到酒店',
      description: '前往官方出租车柜台，使用通关包提供的泰文地址到酒店',
      descriptionZh: '前往官方出租车柜台，使用通关包提供的泰文地址到酒店',
      priority: 6,
      estimatedTime: '45分钟',
      warnings: [
        '务必在官方Public Taxi柜台排队，避免黑车',
        '上车前确认司机打表，保留排队号码单'
      ],
      tips: [
        '柜台位置：到达层1楼6号或8号门附近',
        '费用参考：车费约220-320泰铢，另加50泰铢机场费及高速费',
        '可出示入境通App的“给司机看的页面”，含中泰双语地址'
      ],
      icon: '🚕',
      required: true,
      skippable: false
    }
  ],

  customs: {
    declarationRequired: true,
    prohibitedItems: [
      '新鲜水果',
      '肉类制品',
      '香烟超过规定数量'
    ],
    dutyFree: {
      alcohol: '1升',
      tobacco: '200支'
    }
  },

  emergency: {
    police: '191',
    ambulance: '1669',
    embassy: '+66-2-245-7033'
  },

  tips: [
    'TDAC数字入境卡：抵达前72小时内提交，获得QR码',
    '通关包出示：移民局检查时出示TDAC QR码和护照',
    '机场交通：推荐使用机场快轨ARL快速进城',
    '货币兑换：在机场兑换少量现金，市中心汇率更好',
    '泰国文化：微笑致意，尊重佛教文化和王室'
  ]
};

export default thailandEntryGuide;
