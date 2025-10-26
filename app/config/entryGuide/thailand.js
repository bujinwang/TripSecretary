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

  // 7步骤完整流程 (包含紧急联系方式准备)
  steps: [
    {
      id: 'emergency_contacts',
      title: '紧急联系方式',
      titleZh: '紧急联系方式',
      description: '保存泰国紧急联系电话，以备不时之需',
      descriptionZh: '保存泰国紧急联系电话，以备不时之需',
      category: 'pre-arrival',
      priority: 1,
      estimatedTime: '2分钟',
      icon: '🆘',
      required: false,
      tips: [
        '警察：191',
        '救护车：1669',
        '旅游警察：1155（有中文服务）',
        '中国大使馆：+66-2-245-7033',
        '将这些号码保存到手机通讯录',
        '遇到紧急情况立即拨打',
        '旅游警察提供中文服务'
      ]
    },
    {
      id: 'landing_setup',
      title: '落地前准备',
      titleZh: '落地前准备',
      description: '关闭蜂窝网络数据，激活泰国eSIM卡',
      descriptionZh: '关闭蜂窝网络数据，激活泰国eSIM卡',
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
      priority: 3,
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
      priority: 4,
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
      priority: 5,
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
      priority: 6,
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
      priority: 7,
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
  },

  // 入境常见问题及答案（基于旅客档案预填）
  // Common immigration questions with pre-filled answers based on traveler profile
  immigrationQuestions: {
    // 基础问题 - 所有旅客都可能被问到
    basic: [
      {
        id: 'purpose_of_visit',
        questionEn: 'What is the purpose of your visit?',
        questionTh: 'คุณมาเพื่ออะไร',
        questionZh: '访问目的是什么？',
        category: 'basic',
        required: true,
        profileField: 'travelPurpose',
        answerMapping: {
          'HOLIDAY': { en: 'Holiday/Tourism', th: 'ท่องเที่ยว', zh: '度假旅游' },
          'BUSINESS': { en: 'Business', th: 'ธุรกิจ', zh: '商务' },
          'MEETING': { en: 'Business Meeting', th: 'ประชุมธุรกิจ', zh: '商务会议' },
          'SPORTS': { en: 'Sports Event', th: 'กีฬา', zh: '体育活动' },
          'EDUCATION': { en: 'Education', th: 'การศึกษา', zh: '教育' },
          'EMPLOYMENT': { en: 'Employment', th: 'การจ้างงาน', zh: '工作' }
        }
      },
      {
        id: 'length_of_stay',
        questionEn: 'How long will you stay in Thailand?',
        questionTh: 'คุณจะอยู่ที่ไทยนานแค่ไหน',
        questionZh: '您将在泰国停留多久？',
        category: 'basic',
        required: true,
        profileFields: ['arrivalArrivalDate', 'departureDepartureDate'],
        generateAnswer: (profile) => {
          if (profile.arrivalArrivalDate && profile.departureDepartureDate) {
            const arrival = new Date(profile.arrivalArrivalDate);
            const departure = new Date(profile.departureDepartureDate);
            const days = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));
            return {
              en: `${days} days (${profile.arrivalArrivalDate} to ${profile.departureDepartureDate})`,
              th: `${days} วัน`,
              zh: `${days}天 (${profile.arrivalArrivalDate} 至 ${profile.departureDepartureDate})`
            };
          }
          return null;
        }
      },
      {
        id: 'accommodation',
        questionEn: 'Where will you be staying?',
        questionTh: 'คุณจะพักที่ไหน',
        questionZh: '您将住在哪里？',
        category: 'basic',
        required: true,
        profileFields: ['hotelName', 'hotelAddress', 'accommodationType', 'province'],
        generateAnswer: (profile) => {
          const type = profile.accommodationType;
          if (type === 'HOTEL' && profile.hotelName) {
            return {
              en: `Hotel: ${profile.hotelName}`,
              th: `โรงแรม: ${profile.hotelName}`,
              zh: `酒店：${profile.hotelName}`
            };
          } else if (type === 'FRIEND_HOUSE') {
            return {
              en: `Friend's House in ${profile.province || 'Thailand'}`,
              th: `บ้านเพื่อนที่ ${profile.province || 'ประเทศไทย'}`,
              zh: `朋友家 (${profile.province || '泰国'})`
            };
          } else if (type === 'APARTMENT') {
            return {
              en: `Apartment in ${profile.province || 'Thailand'}`,
              th: `อพาร์ทเมนต์ที่ ${profile.province || 'ประเทศไทย'}`,
              zh: `公寓 (${profile.province || '泰国'})`
            };
          }
          return {
            en: profile.hotelAddress || 'See TDAC form',
            th: profile.hotelAddress || 'ดูแบบฟอร์ม TDAC',
            zh: profile.hotelAddress || '见TDAC表格'
          };
        }
      },
      {
        id: 'return_ticket',
        questionEn: 'Do you have a return ticket?',
        questionTh: 'คุณมีตั๋วกลับหรือไม่',
        questionZh: '您有回程机票吗？',
        category: 'basic',
        required: true,
        profileField: 'departureFlightNumber',
        generateAnswer: (profile) => {
          if (profile.departureFlightNumber) {
            return {
              en: `Yes, ${profile.departureFlightNumber} on ${profile.departureDepartureDate}`,
              th: `มี, เที่ยวบิน ${profile.departureFlightNumber} วันที่ ${profile.departureDepartureDate}`,
              zh: `有，航班${profile.departureFlightNumber}，${profile.departureDepartureDate}`
            };
          }
          return null;
        }
      },
      {
        id: 'previous_visits',
        questionEn: 'Have you been to Thailand before?',
        questionTh: 'คุณเคยมาประเทศไทยมาก่อนหรือไม่',
        questionZh: '您以前来过泰国吗？',
        category: 'basic',
        required: false,
        manualAnswer: true,
        suggestedAnswers: [
          { en: 'No, this is my first time', th: 'ไม่ นี่คือครั้งแรกของฉัน', zh: '没有，这是第一次' },
          { en: 'Yes, I visited before', th: 'ใช่ ฉันเคยมาแล้ว', zh: '是的，之前来过' }
        ]
      }
    ],

    // 度假旅游特定问题
    holiday: [
      {
        id: 'tourist_activities',
        questionEn: 'What places do you plan to visit?',
        questionTh: 'คุณวางแผนจะไปที่ไหนบ้าง',
        questionZh: '您计划去哪些地方？',
        category: 'holiday',
        required: false,
        condition: { travelPurpose: 'HOLIDAY' },
        manualAnswer: true,
        suggestedAnswers: [
          { en: 'Bangkok temples and markets', th: 'วัดและตลาดในกรุงเทพฯ', zh: '曼谷寺庙和市场' },
          { en: 'Beaches in Phuket/Pattaya', th: 'ชายหาดภูเก็ต/พัทยา', zh: '普吉岛/芭提雅海滩' },
          { en: 'Cultural sites and shopping', th: 'สถานที่ทางวัฒนธรรมและช้อปปิ้ง', zh: '文化景点和购物' }
        ]
      },
      {
        id: 'traveling_alone',
        questionEn: 'Are you traveling alone or with others?',
        questionTh: 'คุณเดินทางคนเดียวหรือกับผู้อื่น',
        questionZh: '您是独自旅行还是与他人同行？',
        category: 'holiday',
        required: false,
        condition: { travelPurpose: 'HOLIDAY' },
        manualAnswer: true,
        suggestedAnswers: [
          { en: 'Traveling alone', th: 'เดินทางคนเดียว', zh: '独自旅行' },
          { en: 'With family', th: 'กับครอบครัว', zh: '与家人同行' },
          { en: 'With friends', th: 'กับเพื่อน', zh: '与朋友同行' }
        ]
      }
    ],

    // 商务旅行特定问题
    business: [
      {
        id: 'company_visiting',
        questionEn: 'Which company are you visiting?',
        questionTh: 'คุณจะไปเยี่ยมบริษัทไหน',
        questionZh: '您要拜访哪家公司？',
        category: 'business',
        required: true,
        condition: { travelPurpose: ['BUSINESS', 'MEETING'] },
        manualAnswer: true
      },
      {
        id: 'business_nature',
        questionEn: 'What is the nature of your business?',
        questionTh: 'ธุรกิจของคุณคืออะไร',
        questionZh: '您的业务性质是什么？',
        category: 'business',
        required: false,
        condition: { travelPurpose: ['BUSINESS', 'MEETING'] },
        manualAnswer: true,
        suggestedAnswers: [
          { en: 'Business meeting/conference', th: 'ประชุมธุรกิจ/การประชุม', zh: '商务会议' },
          { en: 'Training/Workshop', th: 'การฝึกอบรม/เวิร์กช็อป', zh: '培训/研讨会' },
          { en: 'Site visit/Inspection', th: 'ตรวจสถานที่/ตรวจสอบ', zh: '现场考察/检查' }
        ]
      },
      {
        id: 'business_documents',
        questionEn: 'Do you have an invitation letter?',
        questionTh: 'คุณมีจดหมายเชิญหรือไม่',
        questionZh: '您有邀请函吗？',
        category: 'business',
        required: false,
        condition: { travelPurpose: ['BUSINESS', 'MEETING'] },
        manualAnswer: true,
        suggestedAnswers: [
          { en: 'Yes, I have the invitation letter', th: 'มี ฉันมีจดหมายเชิญ', zh: '有，我有邀请函' },
          { en: 'No, but I have company contact details', th: 'ไม่ แต่ฉันมีรายละเอียดการติดต่อบริษัท', zh: '没有，但我有公司联系方式' }
        ]
      }
    ],

    // 健康与资金相关
    health_finance: [
      {
        id: 'health_condition',
        questionEn: 'Do you have any health issues?',
        questionTh: 'คุณมีปัญหาสุขภาพหรือไม่',
        questionZh: '您有任何健康问题吗？',
        category: 'health',
        required: false,
        manualAnswer: true,
        suggestedAnswers: [
          { en: 'No health issues', th: 'ไม่มีปัญหาสุขภาพ', zh: '没有健康问题' }
        ]
      },
      {
        id: 'recent_countries',
        questionEn: 'Which countries have you visited in the last 14 days?',
        questionTh: 'คุณไปประเทศไหนบ้างใน 14 วันที่ผ่านมา',
        questionZh: '过去14天您去过哪些国家？',
        category: 'health',
        required: false,
        profileField: 'recentStayCountry',
        generateAnswer: (profile) => {
          if (profile.recentStayCountry) {
            return {
              en: profile.recentStayCountry,
              th: profile.recentStayCountry,
              zh: profile.recentStayCountry
            };
          }
          return null;
        }
      },
      {
        id: 'sufficient_funds',
        questionEn: 'Do you have sufficient funds for your stay?',
        questionTh: 'คุณมีเงินเพียงพอสำหรับการพักของคุณหรือไม่',
        questionZh: '您有足够的资金支付停留期间的费用吗？',
        category: 'finance',
        required: true,
        manualAnswer: true,
        suggestedAnswers: [
          { en: 'Yes, I have cash and credit cards', th: 'มี ฉันมีเงินสดและบัตรเครดิต', zh: '有，我有现金和信用卡' },
          { en: 'Yes, approximately 10,000-20,000 THB', th: 'มี ประมาณ 10,000-20,000 บาท', zh: '有，大约10,000-20,000泰铢' }
        ],
        tips: [
          '建议准备足够现金，约10,000-20,000泰铢/人',
          '可出示银行卡、信用卡作为资金证明',
          '如住朋友家，可能需要更多资金证明'
        ]
      }
    ],

    // 签证相关
    visa: [
      {
        id: 'visa_type',
        questionEn: 'What type of visa do you have?',
        questionTh: 'คุณมีวีซ่าประเภทไหน',
        questionZh: '您持有什么类型的签证？',
        category: 'visa',
        required: false,
        profileField: 'visaNumber',
        generateAnswer: (profile) => {
          if (profile.visaNumber) {
            return {
              en: `Visa Number: ${profile.visaNumber}`,
              th: `หมายเลขวีซ่า: ${profile.visaNumber}`,
              zh: `签证号：${profile.visaNumber}`
            };
          } else {
            return {
              en: 'Visa-exempt entry (30 days)',
              th: 'เข้าประเทศไทยโดยไม่ต้องมีวีซ่า (30 วัน)',
              zh: '免签入境（30天）'
            };
          }
        }
      }
    ]
  }
};

export default thailandEntryGuide;