/**
 * 日本入境指引配置
 * 日本入境完整流程指南 - 扩展框架示例
 */

export const japanEntryGuide = {
  country: 'japan',
  countryName: 'Japan',
  countryNameZh: '日本',
  primaryAirport: 'NRT',
  currency: 'JPY',
  language: ['ja', 'en'],

  // 日本特有的入境程序
  features: {
    biometricRequired: true,           // 需要生物识别
    forms: {
      landingCard: {
        color: '黑色',
        colorZh: '黑色',
        fields: ['姓名', '护照号', '航班号', '住宿地址']
      },
      customsDeclaration: {
        color: '黄色',
        colorZh: '黄色',
        questions: ['携带违禁品', '携带现金超过限额']
      }
    },
    jrPass: {
      available: true,                 // 可使用JR Pass
      description: '日本铁路通票，可无限次搭乘JR线路'
    }
  },

  steps: [
    {
      id: 'in_flight_prep',
      category: '飞机内准备',
      categoryZh: '飞机内准备',
      title: '填写日本入境卡',
      titleZh: '填写日本入境卡',
      description: '飞机上领取黑色入境卡，用黑色或蓝色笔填写个人信息、护照信息和日本地址',
      descriptionZh: '飞机上领取黑色入境卡，用黑色或蓝色笔填写个人信息、护照信息和日本地址',
      priority: 1,
      estimatedTime: '10分钟',
      warnings: [
        '必须用黑色或蓝色笔填写',
        '字迹要清晰工整，避免涂改',
        '姓名必须与护照完全一致'
      ],
      tips: [
        '姓名格式：SURNAME, Given Name',
        '航班号格式：NH123',
        '住宿地址可填写酒店名称和城市'
      ],
      icon: '✈️',
      required: true,
      skippable: false
    },
    {
      id: 'post_landing_1',
      category: '落地后立即',
      categoryZh: '落地后立即',
      title: '关闭蜂窝网络',
      titleZh: '关闭蜂窝网络',
      description: '飞机落地滑行时关闭手机蜂窝网络数据，避免国际漫游费用',
      descriptionZh: '飞机落地滑行时关闭手机蜂窝网络数据，避免国际漫游费用',
      priority: 2,
      estimatedTime: '1分钟',
      warnings: [
        '飞机滑行时请勿使用手机',
        '确保WiFi也已关闭'
      ],
      tips: [
        '可在设置中快速关闭蜂窝数据',
        '落地后立即关闭节省国际漫游费'
      ],
      icon: '📱',
      required: true,
      skippable: false
    },
    {
      id: 'customs_declaration',
      category: '海关申报',
      categoryZh: '海关申报',
      title: '填写海关申报单',
      titleZh: '填写海关申报单',
      description: '填写黄色海关申报单，如实申报携带物品和现金金额',
      descriptionZh: '填写黄色海关申报单，如实申报携带物品和现金金额',
      priority: 3,
      estimatedTime: '5分钟',
      warnings: [
        '现金超过100万日元必须申报',
        '禁止携带新鲜肉类和水果',
        '申报信息必须真实准确'
      ],
      tips: [
        '大多数旅客选择"无申报物品"通道',
        '如不确定是否需要申报，选择红色通道咨询'
      ],
      icon: '🛂',
      required: true,
      skippable: false
    },
    {
      id: 'immigration_check',
      category: '移民局检查',
      categoryZh: '移民局检查',
      title: '移民官生物识别检查',
      titleZh: '移民官生物识别检查',
      description: '排队等候移民官检查，出示护照和入境卡，进行指纹和面部识别',
      descriptionZh: '排队等候移民官检查，出示护照和入境卡，进行指纹和面部识别',
      priority: 4,
      estimatedTime: '15分钟',
      warnings: [
        '保持秩序，勿插队',
        '准备好护照和入境卡',
        '指纹采集时手指要干净干燥'
      ],
      tips: [
        '常见问题：访问目的、停留时间、住宿地址',
        '保持微笑，有礼貌',
        '如有沟通困难，可请工作人员协助'
      ],
      icon: '👮‍♀️',
      required: true,
      skippable: false
    },
    {
      id: 'baggage_claim',
      category: '行李领取',
      categoryZh: '行李领取',
      title: '领取行李',
      titleZh: '领取行李',
      description: '查看航班信息显示屏，找到对应行李转盘，等待行李出现并认领',
      descriptionZh: '查看航班信息显示屏，找到对应行李转盘，等待行李出现并认领',
      priority: 5,
      estimatedTime: '10分钟',
      warnings: [
        '注意行李转盘号，避免拿错行李',
        '行李出现后尽快领取',
        '如行李丢失，立即联系航空公司'
      ],
      tips: [
        '提前准备行李票根',
        '注意观察行李外形特征',
        '可请机场工作人员协助'
      ],
      icon: '🛄',
      required: true,
      skippable: false
    },
    {
      id: 'airport_rail',
      category: '机场交通',
      categoryZh: '机场交通',
      title: '搭乘机场快轨',
      titleZh: '搭乘机场快轨',
      description: '从成田机场搭乘JR成田特快或京成Skyliner前往东京市区',
      descriptionZh: '从成田机场搭乘JR成田特快或京成Skyliner前往东京市区',
      priority: 6,
      estimatedTime: '60分钟',
      warnings: [
        '注意选择正确的轨道线路',
        '高峰时段可能需要等候',
        '行李较多时选择宽敞车厢'
      ],
      tips: [
        'JR成田特快：东京站约60分钟，票价约3000日元',
        '京成Skyliner：上野站约40分钟，票价约2500日元',
        '可提前购买ICOCA或Suica交通卡'
      ],
      icon: '🚆',
      required: true,
      skippable: false
    }
  ],

  customs: {
    declarationRequired: true,
    prohibitedItems: [
      '新鲜肉类和水果',
      '枪支弹药',
      '毒品和违禁药品',
      '盗版物品'
    ],
    dutyFree: {
      alcohol: '3瓶',
      tobacco: '400支',
      currency: '等值100万日元'
    }
  },

  emergency: {
    police: '110',
    ambulance: '119',
    embassy: '+81-3-3403-3380',
    airportPolice: '+81-476-32-0110' // 成田机场警察
  },

  tips: [
    '机场交通：推荐使用JR成田特快或京成电铁Skyliner',
    '货币兑换：在机场兑换少量现金，市中心汇率更好',
    '语言沟通：机场工作人员大多会英语和中文',
    '生物识别：指纹采集时手指要干净，面部识别时避免戴口罩'
  ]
};

export default japanEntryGuide;