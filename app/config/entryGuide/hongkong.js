// 香港入境指引配置文件 - 香港国际机场HKG完整流程
// 基于实际机场体验

export const hongkongEntryGuide = {
  country: 'hongkong',
  countryName: '香港',
  countryNameZh: '香港',
  airport: 'HKG', // 香港国际机场
  currency: 'HKD',
  language: ['zh', 'en'],

  // 重要提醒
  importantNotes: [
    '中国内地居民持有效往来港澳通行证及签注可入境',
    '其他国家和地区旅客需持有效护照和签证（如需要）',
    '准备好充足的资金证明，建议每天至少HKD 1,000',
    '机场快线最便捷，八达通卡非常实用',
    '香港入境处理速度快，通常15-30分钟即可完成'
  ],

  // 5步骤完整流程 (从飞机落地后开始)
  steps: [
    {
      id: 'landing_setup',
      title: '落地前准备',
      titleZh: '落地前准备',
      description: '关闭蜂窝网络数据，激活香港eSIM卡或准备八达通',
      descriptionZh: '关闭蜂窝网络数据，激活香港eSIM卡或准备八达通',
      category: 'post-landing',
      priority: 1,
      estimatedTime: '2分钟',
      icon: '📱',
      required: true,
      warnings: [
        '飞机滑行时勿使用手机',
        '确保WiFi也已关闭'
      ],
      tips: [
        '跟着人群走，看Arrivals或入境标识',
        '准备手机离线模式或香港eSIM'
      ]
    },
    {
      id: 'immigration',
      title: '入境检查',
      titleZh: '入境检查',
      description: '出示护照/港澳通行证，完成入境手续',
      descriptionZh: '出示护照/港澳通行证，完成入境手续',
      category: 'immigration',
      priority: 2,
      estimatedTime: '15分钟',
      icon: '🛂',
      required: true,
      tips: [
        '内地居民排队港澳居民通道',
        '其他旅客排队访港旅客通道',
        '准备护照或港澳通行证',
        '出示：往返机票、酒店预订',
        '配合官员：回答问题',
        '入境通APP提供：个人信息、旅行信息、资金信息、常见问题回答'
      ]
    },
    {
      id: 'baggage_claim',
      title: '行李领取',
      titleZh: '行李领取',
      description: '找到行李转盘，认领行李',
      descriptionZh: '找到行李转盘，认领行李',
      category: 'baggage',
      priority: 3,
      estimatedTime: '20分钟',
      icon: '🧳',
      required: true,
      tips: [
        '看屏幕找航班号',
        '去对应行李转盘',
        '拿好所有行李'
      ]
    },
    {
      id: 'customs_inspection',
      title: '海关检查',
      titleZh: '海关检查',
      description: '行李检查，如需申报配合进行',
      descriptionZh: '行李检查，如需申报配合进行',
      category: 'customs',
      priority: 4,
      estimatedTime: '5分钟',
      icon: '🔍',
      required: true,
      tips: [
        '走绿色通道(无需申报)',
        '如有需申报物品走红色通道',
        '检查完成后离开'
      ]
    },
    {
      id: 'transport_to_city',
      title: '前往市区',
      titleZh: '前往市区',
      description: '选择机场快线、巴士或出租车前往市区',
      descriptionZh: '选择机场快线、巴士或出租车前往市区',
      category: 'transportation',
      priority: 5,
      estimatedTime: '30-60分钟',
      icon: '🚄',
      required: true,
      tips: [
        '机场快线：最快最舒适，约24分钟到中环',
        '机场巴士：经济实惠，约45-60分钟',
        '出租车：便捷但较贵，约300-400港币',
        '可在机场购买八达通卡，方便乘坐公共交通',
        '费用：机场快线HKD 115，巴士HKD 40-50，出租车HKD 300-400'
      ]
    }
  ],

  // 海关信息
  customs: {
    declarationRequired: true,
    prohibitedItems: [
      '新鲜水果（某些类型）',
      '肉类制品',
      '危险品',
      '假冒商品'
    ],
    dutyFree: {
      alcohol: '1升',
      tobacco: '19支香烟'
    }
  },

  // 入境要求
  entryRequirements: {
    documents: {
      mainlandChina: [
        '有效往来港澳通行证',
        '有效签注（个人旅游签注或商务签注等）'
      ],
      international: [
        '有效护照（有效期至少6个月）',
        '签证（如需要）',
        '往返机票',
        '酒店预订确认'
      ]
    },
    visaFreeCountries: [
      '中国内地（需港澳通行证）',
      '英国（6个月）',
      '美国（90天）',
      '加拿大（90天）',
      '澳大利亚（90天）',
      '新西兰（90天）',
      '日本（90天）',
      '韩国（90天）',
      '新加坡（90天）',
      '马来西亚（90天）'
    ],
    fundingProof: {
      recommended: 1000, // HKD per day
      acceptedProofs: [
        '银行存款证明',
        '信用卡对账单',
        '现金',
        '旅行支票'
      ]
    }
  },

  // 交通信息
  transport: {
    airportExpress: {
      name: '机场快线',
      nameEn: 'Airport Express',
      stations: ['机场', '青衣', '九龙', '香港'],
      duration: {
        toKowloon: '21分钟',
        toHongKong: '24分钟'
      },
      frequency: '每10-12分钟一班',
      operatingHours: '05:54 - 00:48',
      cost: {
        toKowloon: 105,
        toHongKong: 115,
        roundTrip: 205 // 往返优惠
      },
      tips: [
        '可在机场快线站购买八达通卡',
        '提供免费穿梭巴士到主要酒店',
        '车厢内有行李架，舒适便捷',
        '支持八达通、信用卡、现金支付'
      ]
    },
    bus: {
      name: '机场巴士',
      routes: [
        { number: 'A11', destination: '北角（港岛）', cost: 40 },
        { number: 'A21', destination: '红磡（九龙）', cost: 33 },
        { number: 'A22', destination: '蓝田（九龙）', cost: 39 },
        { number: 'E11', destination: '天后（港岛）', cost: 21 }
      ],
      frequency: '10-20分钟一班',
      operatingHours: '24小时（部分路线）',
      tips: [
        '最经济的选择',
        '可使用八达通或现金',
        '有行李架',
        '根据目的地选择路线'
      ]
    },
    taxi: {
      types: [
        {
          type: 'red',
          name: '红色出租车',
          service: '市区（港岛、九龙）',
          cost: '300-400港币到市区'
        },
        {
          type: 'green',
          name: '绿色出租车',
          service: '新界',
          cost: '根据距离计算'
        },
        {
          type: 'blue',
          name: '蓝色出租车',
          service: '大屿山',
          cost: '根据距离计算'
        }
      ],
      paymentMethods: ['现金（推荐）', '八达通', '信用卡（部分车辆）'],
      tips: [
        '机场有专门的出租车站',
        '按表收费，无需担心被宰',
        '可能需要支付行李费和隧道费',
        '准备港币现金最方便'
      ]
    }
  },

  // 货币和支付
  currency: {
    code: 'HKD',
    name: '港币',
    denominations: [
      { value: 1000, color: '金色', usage: '大额支付' },
      { value: 500, color: '棕色', usage: '中等金额' },
      { value: 100, color: '红色', usage: '常用面额' },
      { value: 50, color: '紫色', usage: '小额支付' },
      { value: 20, color: '蓝色', usage: '零钱' },
      { value: 10, color: '绿色/紫色', usage: '零钱' }
    ],
    atm: {
      location: '机场到达大厅、市区随处可见',
      banks: ['汇丰银行', '恒生银行', '中国银行', '渣打银行'],
      fees: '约HKD 30-50（根据发卡行）',
      tips: [
        '机场ATM汇率合理',
        '银联卡普遍支持',
        '准备好PIN码',
        '建议取适量现金，很多地方支持移动支付'
      ]
    },
    octopusCard: {
      name: '八达通卡',
      nameEn: 'Octopus Card',
      purchaseLocation: [
        '机场客运大楼客务中心',
        '港铁站客务中心',
        '便利店（7-Eleven、OK）'
      ],
      initialDeposit: 50, // 可退还
      minimumValue: 150, // 购买时最低储值
      usage: [
        '地铁MTR',
        '巴士',
        '电车',
        '渡轮',
        '便利店',
        '餐厅',
        '部分商店'
      ],
      tips: [
        '非常推荐购买，使用方便',
        '可在便利店充值',
        '离开时可退还余额和押金',
        '支持Apple Pay添加'
      ]
    }
  },

  // 紧急联系方式
  emergency: {
    police: '999',
    ambulance: '999',
    fire: '999',
    immigration: '+852-2824-6111',
    touristHotline: '+852-2508-1234',
    embassy: {
      china: '+852-3413-2300',
      usa: '+852-2523-9011',
      uk: '+852-2901-3000',
      japan: '+852-2522-1184',
      korea: '+852-2529-4141'
    }
  },

  // 实用信息
  usefulInfo: {
    language: '粤语、英语、普通话',
    timezone: 'UTC+8',
    voltage: '220V, 英式三脚插头',
    tips: [
      '香港人习惯使用繁体中文',
      '大部分场所接受信用卡和移动支付',
      '公共交通非常发达，推荐使用八达通',
      '注意靠左行走（英式习惯）',
      '地铁、巴士内禁止饮食'
    ]
  },

  // 语言帮助卡（备用）
  languageHelp: {
    hello: '你好 (Nei hou)',
    thankYou: '唔该 (M̀h gōi) / 谢谢 (Dō jeh)',
    howMuch: '几多钱？ (Géi dō chín?)',
    whereIs: '...喺边？ (...hái bīn?)',
    airport: '机场 (Gēi chèuhng)',
    hotel: '酒店 (Jáu dim)',
    help: '唔该帮帮手 (M̀h gōi bōng bōng sáu)',
    noThankYou: '唔使，唔该 (M̀h sái, m̀h gōi)'
  }
};

export default hongkongEntryGuide;
