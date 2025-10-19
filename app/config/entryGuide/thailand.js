// 泰国入境指引配置文件 - 廊曼机场DMK完整流程
// 基于实际机场体验和TDAC数字入境卡系统

export const thailandEntryGuide = {
  country: 'thailand',
  countryName: '泰国',
  countryNameZh: '泰国',
  airport: 'DMK', // 廊曼机场
  currency: 'THB',
  language: ['th', 'en'],

  // 重要提醒
  importantNotes: [
    '抵达前72小时内必须提交TDAC数字入境卡',
    '准备好通关包，包含TDAC QR码、护照等材料',
    '落地后立即关闭蜂窝网络数据',
    'ATM取款手续费约220泰铢，建议一次多取',
    '只使用官方Public Taxi，避免黑车'
  ],

  // 6步骤完整流程 (从飞机落地后开始)
  steps: [
    {
      id: 'landing_setup',
      title: '落地前准备',
      titleZh: '落地前准备',
      description: '关闭蜂窝网络数据，激活泰国eSIM卡',
      descriptionZh: '关闭蜂窝网络数据，激活泰国eSIM卡',
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
        '跟着人群走，看Arrivals或Immigration标识',
        '准备手机离线模式'
      ]
    },
    {
      id: 'immigration',
      title: '移民局检查',
      titleZh: '移民局检查',
      description: '出示通关包和TDAC QR码，核验护照和入境信息',
      descriptionZh: '出示通关包和TDAC QR码，核验护照和入境信息',
      category: 'immigration',
      priority: 2,
      estimatedTime: '15分钟',
      icon: '🛂',
      required: true,
      showEntryPack: true, // 重点显示通关包
      tips: [
        '排队等候All Passports或Foreigners',
        '准备护照和手机通关包页面',
        '出示：护照、TDAC QR码',
        '配合官员：拍照、按指纹',
        '保持入境通APP开启',
        '通关包包含：个人信息、旅行信息、TDAC、资金信息、常见问题回答'
      ]
    },
    {
      id: 'baggage_claim',
      title: '行李领取',
      titleZh: '行李领取',
      description: '找到行李转盘，认领行李，海关检查',
      descriptionZh: '找到行李转盘，认领行李，海关检查',
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
      title: '海关物品检查',
      titleZh: '海关物品检查',
      description: '行李X光机检查，如需人工检查配合进行',
      descriptionZh: '行李X光机检查，如需人工检查配合进行',
      category: 'customs',
      priority: 4,
      estimatedTime: '5分钟',
      icon: '🔍',
      required: true,
      tips: [
        '走绿色通道(Green/Nothing to Declare)',
        '如有需申报物品走红色通道',
        '检查完成后离开'
      ]
    },
    {
      id: 'atm_withdrawal',
      title: 'ATM取泰铢现金',
      titleZh: 'ATM取泰铢现金',
      description: '在到达大厅ATM机取款，推荐银行和操作步骤',
      descriptionZh: '在到达大厅ATM机取款，推荐银行和操作步骤',
      category: 'financial',
      priority: 5,
      estimatedTime: '10分钟',
      icon: '💰',
      required: true,
      tips: [
        'ATM机位置：到达大厅1楼',
        '推荐银行：Bangkok Bank、Krungsri、Kasikorn Bank',
        '选择英语界面，输入密码',
        '选择储蓄账户，输入金额',
        '建议取款：3,000-5,000泰铢',
        '手续费：约220泰铢/次',
        '注意安全，保护密码和现金'
      ]
    },
    {
      id: 'taxi_to_hotel',
      title: '官方出租车到酒店',
      titleZh: '官方出租车到酒店',
      description: '使用入境通APP司机页面，找官方Public Taxi',
      descriptionZh: '使用入境通APP司机页面，找官方Public Taxi',
      category: 'transportation',
      priority: 6,
      estimatedTime: '45分钟',
      icon: '🚕',
      required: true,
      tips: [
        '找官方Public Taxi柜台（1楼6号门或8号门附近）',
        '出示入境通APP"给司机看的页面"',
        '酒店地址泰文+英文双语显示',
        '拿到排队号码单，确认司机打表',
        '费用：约320-470泰铢（打表+50机场费+高速费）',
        '现金支付，准备小额钞票',
        '抵达酒店后支付费用'
      ]
    }
  ],

  // 海关信息
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

  // ATM信息
  atm: {
    location: '到达大厅1楼，多台ATM机清晰可见',
    recommendedBanks: [
      'Bangkok Bank(曼谷银行)',
      'Krungsri(泰国大城银行)',
      'Kasikorn Bank(开泰银行)'
    ],
    withdrawalSteps: [
      '找到ATM机，看ATM或银行标志',
      '插入银行卡，按箭头方向，芯片朝上',
      '选择英语界面',
      '输入银行卡密码，按Enter或Confirm',
      '选择Withdrawal(取款)',
      '选择Savings(储蓄账户)',
      '输入取款金额，建议3,000-5,000泰铢',
      '确认手续费（约220泰铢）',
      '取出现金和卡，数清金额',
      '收好现金和银行卡'
    ],
    fees: {
      atmFee: 220,
      suggestedAmount: {
        min: 3000,
        max: 5000
      }
    },
    safetyTips: [
      '注意周边环境安全',
      '保护好密码输入',
      '不要接受陌生人"帮助"',
      '如果ATM吞卡，记下ATM编号联系银行'
    ],
    currency: {
      denominations: [
        { amount: 1000, color: '粉红色', usage: '大额支付' },
        { amount: 500, color: '紫色', usage: '中等金额' },
        { amount: 100, color: '红色', usage: '小额支付' }
      ],
      smallChange: [100, 50, 20]
    }
  },

  // 出租车信息
  taxi: {
    officialCounter: {
      location: '1楼6号门或8号门附近',
      procedure: [
        '跟着Public Taxi或Taxi标识走',
        '找到Public Taxi柜台',
        '出示入境通APP"给司机看的页面"',
        '工作人员会看懂泰文/英文地址',
        '拿到排队号码单（含车牌号、时间）',
        '到指定车道排队',
        '确认司机打表（Meter在跳字）',
        '系好安全带'
      ]
    },
    cost: {
      meter: '200-350泰铢（根据距离和路况）',
      airportFee: 50,
      highwayFee: 70,
      total: '320-470泰铢'
    },
    payment: {
      methods: ['现金（推荐）', '信用卡（部分出租车）'],
      tips: [
        '准备小额钞票（100、50、20泰铢）',
        '如果只有1,000泰铢大钞，提前告诉司机准备零钱',
        '或在机场便利店买水换零钱'
      ]
    },
    safety: [
      '只在官方Public Taxi柜台叫车',
      '避免机场内主动搭讪的黑车司机',
      '确认司机打表，如不打表礼貌拒绝',
      '上车检查行李是否拿齐',
      '打开手机地图跟踪路线'
    ]
  },

  // 紧急联系方式
  emergency: {
    police: '191',
    ambulance: '1669',
    embassy: '+66-2-245-7033',
    touristPolice: '1155（有中文服务）'
  },

  // 语言帮助卡（备用）
  languageHelp: {
    useMeter: 'Use meter please',
    howMuch: 'How much?',
    noThankYou: 'No, thank you',
    needHelp: 'I need help',
    needChange: 'I need change please',
    receipt: 'Receipt please'
  }
};

export default thailandEntryGuide;