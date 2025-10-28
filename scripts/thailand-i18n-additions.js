/**
 * Thailand i18n Additions
 * These translations need to be added to app/i18n/locales.js
 *
 * Instructions:
 * 1. Merge these into the existing thailand section in locales.js for each language
 * 2. English translations (en.thailand)
 * 3. Chinese Simplified translations (zh-CN.thailand)
 * 4. Chinese Traditional translations (zh-TW.thailand)
 */

const thailandI18nAdditions = {
  en: {
    thailand: {
      // TDACSelectionScreen translations
      selection: {
        heroEmoji: '🌟',
        heroTitle: 'Choose Submission Method',
        heroSubtitle: 'Complete Thailand Arrival Card Quickly',
        backButton: 'Back',

        // Lightning submission card
        lightning: {
          badge: 'Recommended',
          badgeIcon: '📱',
          icon: '⚡',
          title: 'Lightning Submit',
          subtitle: 'Fast Track · Smart Validation',
          benefits: {
            time: {
              icon: '⏱️',
              value: '5-8 sec',
              label: 'Lightning Fast'
            },
            success: {
              icon: '🎯',
              value: '95%+',
              label: 'High Success Rate'
            },
            speed: {
              icon: '🚀',
              value: '3x Faster',
              label: 'Than Traditional'
            }
          },
          summary: 'Save queue time, get confirmation immediately after submission.',
          cta: 'Use Lightning Submit'
        },

        // Stable submission card
        stable: {
          icon: '🛡️',
          title: 'Stable Submit',
          subtitle: 'Stable Channel · Clearly Visible',
          benefits: {
            time: {
              icon: '⏱️',
              value: '24 sec',
              label: 'Stable Completion'
            },
            success: {
              icon: '🎯',
              value: '85%',
              label: 'Reliable Success Rate'
            }
          },
          summary: 'Suitable for travelers who want to see every step.',
          cta: 'Choose Stable Option'
        },

        // Smart tip
        smartTip: {
          icon: '💡',
          title: 'Smart Recommendation',
          text: 'Lightning Submit recommended; you can switch to stable option anytime if you need the full process.'
        },

        // Footer
        footer: {
          text: 'We will accompany you through the entire process to ensure smooth submission.'
        }
      },

      // ThailandEntryQuestionsScreen translations
      entryQuestions: {
        topBarTitle: 'Entry Questions',
        header: {
          title: 'ชุดคำถาม-คำตอบสำหรับเจ้าหน้าที่',
          subtitle: 'Immigration Questions & Answers',
          subtitleZh: 'Common Entry Questions and Answers',
          description: '📋 Pre-filled answers to common entry questions based on your travel information, ready to show immigration officers'
        },

        // Language selector
        languageSelector: {
          label: 'Language:',
          zh: 'Chinese',
          en: 'English',
          th: 'Thai'
        },

        // Filter toggle
        filter: {
          showRequired: 'Show Required Questions Only',
          showAll: 'Show All Questions',
          count: '({{count}} questions)'
        },

        // Question card
        question: {
          required: 'Required',
          answerLabel: 'Answer:',
          tipsLabel: '💡 Tips:',
          suggestedLabel: 'Other Optional Answers:'
        },

        // Footer
        footer: {
          icon: 'ℹ️',
          infoText: 'These answers are automatically generated based on your submitted entry information. If immigration officers ask other questions, please answer truthfully.',
          instructionsTitle: 'Usage Instructions:',
          instruction1: '1. Show this page to immigration officer as reference',
          instruction2: '2. Switch languages for easier communication',
          instruction3: '3. Required questions are marked with badges'
        },

        // Empty state
        empty: {
          icon: '📭',
          text: 'No questions to display',
          hint: 'Please ensure your entry information is completely filled'
        },

        // Loading
        loading: 'Loading entry questions...',

        // Errors
        errors: {
          missingEntryPack: 'Missing entry pack information',
          loadFailed: 'Failed to load entry questions, please try again later'
        }
      },

      // TravelInfoScreen additions
      travelInfo: {
        // Section introductions
        sectionIntros: {
          passport: {
            icon: '🛂',
            text: 'Customs officers will verify your passport information. Please ensure it matches your passport exactly. Don\'t worry, we\'ll help you format it!'
          },
          personal: {
            icon: '👤',
            text: 'This information helps Thailand understand your background and contact you if needed.'
          },
          funds: {
            icon: '💰',
            text: 'Show your financial capability to support your Thailand trip.'
          },
          travel: {
            icon: '✈️',
            text: 'Tell Thailand your travel plans so they can prepare a warm welcome for you.'
          }
        },

        // Save status
        saveStatus: {
          pending: 'Waiting to save...',
          saving: 'Saving...',
          saved: 'Saved',
          error: 'Save failed',
          retry: 'Retry'
        },

        // Last edited
        lastEdited: 'Last edited: {{time}}',

        // Privacy notice
        privacyNotice: 'All information is saved locally on your device only',

        // Progress and encouragement
        progress: {
          ready: 'Ready for Thailand! 🌴',
          completion: '{{percent}}% complete',
          hints: {
            start: '🌟 First step, start by introducing yourself!',
            early: 'Great start! Thailand welcomes you 🌺',
            mid: 'Continue my Thailand preparation journey 🏖️',
            late: '🚀 Almost done, your Thailand trip is just around the corner!'
          },
          nextSteps: {
            passport: '💡 Start with passport information, tell Thailand who you are',
            personal: '👤 Fill in personal information, let Thailand know you better',
            funds: '💰 Show your proof of funds, Thailand wants to ensure you have a great time',
            travel: '✈️ Last step, share your travel plans!'
          }
        },

        // Field labels and help text
        fields: {
          surname: {
            label: 'Surname',
            help: 'Enter surname as shown on passport (in English)'
          },
          middleName: {
            label: 'Middle Name',
            help: 'If any (optional)'
          },
          givenName: {
            label: 'Given Name',
            help: 'Enter given name as shown on passport (in English)'
          },
          passportName: {
            label: 'Name on Passport',
            help: 'Fill in English name as shown on passport, e.g.: LI, MAO (surname first, given name last)'
          },
          nationality: {
            label: 'Nationality',
            help: 'Please select your nationality'
          },
          passportNo: {
            label: 'Passport Number',
            help: 'Passport number is usually 8-9 alphanumeric characters, will be automatically capitalized'
          },
          visaNumber: {
            label: 'Visa Number (if any)',
            help: 'If you have a visa, please enter visa number (letters or numbers only)'
          },
          dob: {
            label: 'Date of Birth',
            help: 'Select your date of birth'
          },
          expiryDate: {
            label: 'Passport Expiry Date',
            help: 'Select passport expiry date'
          },
          sex: {
            label: 'Gender',
            options: {
              female: 'Female',
              male: 'Male',
              undefined: 'Undefined'
            }
          },
          occupation: {
            label: 'Occupation',
            custom: 'Other Occupation',
            help: 'Select or enter your occupation'
          },
          cityOfResidence: {
            label: 'City of Residence',
            labelChina: 'Province',
            help: 'Enter your city of residence',
            helpChina: 'Please select your province',
            placeholder: 'e.g., NEW YORK, LONDON',
            placeholderChina: 'e.g., BEIJING, SHANGHAI'
          },
          residentCountry: {
            label: 'Country of Residence',
            help: 'Select your country of residence'
          },
          phoneCode: {
            label: 'Country Code'
          },
          phoneNumber: {
            label: 'Phone Number',
            help: 'Enter your contact phone number'
          },
          email: {
            label: 'Email',
            help: 'Enter your email address'
          },
          travelPurpose: {
            label: 'Purpose of Visit',
            custom: 'Other Purpose',
            help: 'Select or describe your travel purpose'
          },
          recentStayCountry: {
            label: 'Country of Recent Stay',
            help: 'Country you stayed in before Thailand'
          },
          boardingCountry: {
            label: 'Boarding Country',
            help: 'Country where you board the flight to Thailand'
          },
          arrivalFlightNumber: {
            label: 'Arrival Flight Number',
            help: 'e.g., CX123',
            scanButton: '📷 Scan Ticket'
          },
          arrivalDate: {
            label: 'Arrival Date',
            help: 'Select your arrival date in Thailand'
          },
          departureFlightNumber: {
            label: 'Departure Flight Number',
            help: 'e.g., CX456',
            scanButton: '📷 Scan Ticket'
          },
          departureDate: {
            label: 'Departure Date',
            help: 'Select your departure date from Thailand'
          },
          isTransitPassenger: {
            label: 'Transit Passenger',
            help: 'Are you transiting through Thailand?'
          },
          accommodationType: {
            label: 'Accommodation Type',
            custom: 'Other Type',
            help: 'Select your accommodation type'
          },
          province: {
            label: 'Province',
            help: 'Select province in Thailand'
          },
          district: {
            label: 'District',
            help: 'Select district'
          },
          subDistrict: {
            label: 'Sub-district',
            help: 'Select sub-district'
          },
          postalCode: {
            label: 'Postal Code',
            help: 'Enter postal code'
          },
          hotelAddress: {
            label: 'Accommodation Address',
            help: 'Enter full address of your accommodation',
            scanButton: '📷 Scan Hotel Booking'
          }
        },

        // Section titles
        sectionTitles: {
          passport: '👤 Passport Information',
          passportSubtitle: 'Thailand customs needs to verify your identity',
          personal: '👤 Personal Information',
          personalSubtitle: 'Let Thailand know more about you',
          funds: '💰 Proof of Funds',
          fundsSubtitle: 'Show your financial capability',
          travel: '✈️ Travel Information',
          travelSubtitle: 'Your Thailand itinerary'
        },

        // Funds section
        funds: {
          empty: 'No fund items added yet',
          addButton: '+ Add Fund Item',
          totalAmount: 'Total: {{amount}} {{currency}}'
        },

        // Buttons
        buttons: {
          continue: 'Continue',
          saveAndContinue: 'Save and Continue',
          back: 'Back'
        }
      },

      // Constants - Occupation options
      occupations: {
        SOFTWARE_ENGINEER: 'Software Engineer',
        STUDENT: 'Student',
        TEACHER: 'Teacher',
        DOCTOR: 'Doctor',
        ACCOUNTANT: 'Accountant',
        SALES_MANAGER: 'Sales Manager',
        RETIRED: 'Retired',
        ENGINEER: 'Engineer',
        CIVIL_SERVANT: 'Civil Servant',
        LAWYER: 'Lawyer',
        NURSE: 'Nurse',
        FREELANCER: 'Freelancer',
        BUSINESS_OWNER: 'Business Owner',
        HOMEMAKER: 'Homemaker',
        DESIGNER: 'Designer',
        OTHER: 'Other'
      },

      // Constants - Travel purposes
      travelPurposes: {
        HOLIDAY: 'Holiday/Tourism',
        MEETING: 'Meeting',
        SPORTS: 'Sports',
        BUSINESS: 'Business',
        INCENTIVE: 'Incentive',
        CONVENTION: 'Convention/Conference',
        EDUCATION: 'Education',
        EMPLOYMENT: 'Employment',
        EXHIBITION: 'Exhibition',
        MEDICAL: 'Medical Treatment'
      },

      // Constants - Accommodation types
      accommodationTypes: {
        HOTEL: 'Hotel',
        HOSTEL: 'Hostel',
        GUESTHOUSE: 'Guesthouse',
        RESORT: 'Resort',
        APARTMENT: 'Apartment',
        FRIEND: 'Friend\'s House'
      },

      // TDACHybridScreen
      hybrid: {
        stages: {
          loading: 'Initializing...',
          extracting: 'Waiting for Cloudflare verification...',
          submitting: 'Submitting...',
          success: 'Submission successful!',
          error: 'Submission failed'
        },
        cloudflare: {
          ready: 'Please click "I\'m not a robot" checkbox',
          waiting: 'Waiting for verification to complete... ({{seconds}} sec remaining)',
          timeout: 'Verification timeout',
          timeoutMessage: 'You did not complete Cloudflare verification within the required time.\n\nPossible reasons:\n• Did not click verification box within 60 seconds\n• Network connection issues\n\nSuggest retry or use WebView version.',
          retry: 'Retry',
          back: 'Back',
          useWebView: 'Use WebView Version'
        },
        progress: {
          step: 'Step {{current}}/{{total}}: {{message}}'
        }
      },

      // Common validation messages
      validation: {
        required: 'This field is required',
        invalidFormat: 'Invalid format',
        tooShort: 'Too short',
        tooLong: 'Too long',
        invalidEmail: 'Invalid email format',
        invalidPhone: 'Invalid phone number',
        invalidPassport: 'Invalid passport number',
        invalidDate: 'Invalid date',
        datePast: 'Date must be in the past',
        dateFuture: 'Date must be in the future',
        passportExpired: 'Passport is expired or expiring soon'
      }
    }
  },

  'zh-CN': {
    thailand: {
      // TDACSelectionScreen 中文翻译
      selection: {
        heroEmoji: '🌟',
        heroTitle: '选择提交方式',
        heroSubtitle: '快速完成泰国入境卡',
        backButton: '返回',

        // 闪电提交卡片
        lightning: {
          badge: '推荐选择',
          badgeIcon: '📱',
          icon: '⚡',
          title: '闪电提交',
          subtitle: '快速通道 · 智能验证',
          benefits: {
            time: {
              icon: '⏱️',
              value: '5-8秒',
              label: '闪电完成'
            },
            success: {
              icon: '🎯',
              value: '95%+',
              label: '超高成功率'
            },
            speed: {
              icon: '🚀',
              value: '快3倍',
              label: '比传统方式'
            }
          },
          summary: '节省排队时间，提交后即可获得确认。',
          cta: '使用闪电提交'
        },

        // 稳妥提交卡片
        stable: {
          icon: '🛡️',
          title: '稳妥提交',
          subtitle: '稳定通道 · 清晰可见',
          benefits: {
            time: {
              icon: '⏱️',
              value: '24秒',
              label: '稳定完成'
            },
            success: {
              icon: '🎯',
              value: '85%',
              label: '可靠成功率'
            }
          },
          summary: '适合想亲自查看每一步的旅客。',
          cta: '选择稳妥方案'
        },

        // 智能推荐
        smartTip: {
          icon: '💡',
          title: '智能推荐',
          text: '推荐闪电提交；如需完整流程，可随时切换稳妥方案。'
        },

        // 底部
        footer: {
          text: '我们会陪您完成整个流程，确保顺利提交。'
        }
      },

      // ThailandEntryQuestionsScreen 中文翻译
      entryQuestions: {
        topBarTitle: '入境问题',
        header: {
          title: 'ชุดคำถาม-คำตอบสำหรับเจ้าหน้าที่',
          subtitle: 'Immigration Questions & Answers',
          subtitleZh: '入境常见问题及答案',
          description: '📋 基于您的旅行信息预填的常见入境问题答案，可向移民官员展示'
        },

        // 语言选择器
        languageSelector: {
          label: '语言 / Language:',
          zh: '中文',
          en: 'English',
          th: 'ไทย'
        },

        // 筛选切换
        filter: {
          showRequired: '仅显示必填问题',
          showAll: '显示全部问题',
          count: '({{count}} 个问题)'
        },

        // 问题卡片
        question: {
          required: '必填',
          answerLabel: '答案 / Answer:',
          tipsLabel: '💡 提示:',
          suggestedLabel: '其他可选答案:'
        },

        // 底部
        footer: {
          icon: 'ℹ️',
          infoText: '这些答案基于您提交的入境信息自动生成。如移民官提出其他问题，请如实回答。',
          instructionsTitle: '使用说明：',
          instruction1: '1. 向移民官展示此页面作为参考',
          instruction2: '2. 可切换语言以便沟通',
          instruction3: '3. 必填问题已用徽章标记'
        },

        // 空状态
        empty: {
          icon: '📭',
          text: '暂无可显示的问题',
          hint: '请确保您的入境信息已完整填写'
        },

        // 加载中
        loading: '加载入境问题...',

        // 错误
        errors: {
          missingEntryPack: '缺少入境包信息',
          loadFailed: '加载入境问题失败，请稍后重试'
        }
      },

      // TravelInfoScreen 补充
      travelInfo: {
        // 章节介绍
        sectionIntros: {
          passport: {
            icon: '🛂',
            text: '海关官员会核对你的护照信息，请确保与护照完全一致。别担心，我们会帮你格式化！'
          },
          personal: {
            icon: '👤',
            text: '这些信息帮助泰国了解你的背景，如有需要可以联系你。'
          },
          funds: {
            icon: '💰',
            text: '展示你的经济能力，证明可以支持泰国之旅。'
          },
          travel: {
            icon: '✈️',
            text: '告诉泰国你的旅行计划，让他们为你准备好热情的欢迎。'
          }
        },

        // 保存状态
        saveStatus: {
          pending: '等待保存...',
          saving: '正在保存...',
          saved: '已保存',
          error: '保存失败',
          retry: '重试'
        },

        // 最后编辑
        lastEdited: '最近编辑：{{time}}',

        // 隐私提示
        privacyNotice: '所有信息仅保存在您的手机本地',

        // 进度和鼓励
        progress: {
          ready: '泰国准备就绪！🌴',
          completion: '完成度 {{percent}}%',
          hints: {
            start: '🌟 第一步，从介绍自己开始吧！',
            early: '好的开始！泰国欢迎你 🌺',
            mid: '继续我的泰国准备之旅 🏖️',
            late: '🚀 快要完成了，你的泰国之旅近在咫尺！'
          },
          nextSteps: {
            passport: '💡 从护照信息开始，告诉泰国你是谁',
            personal: '👤 填写个人信息，让泰国更了解你',
            funds: '💰 展示你的资金证明，泰国想确保你玩得开心',
            travel: '✈️ 最后一步，分享你的旅行计划吧！'
          }
        },

        // 字段标签和帮助文本
        fields: {
          surname: {
            label: '姓',
            help: '填写护照上显示的姓（英文）'
          },
          middleName: {
            label: '中间名',
            help: '如有（可选）'
          },
          givenName: {
            label: '名',
            help: '填写护照上显示的名（英文）'
          },
          passportName: {
            label: '护照上的姓名',
            help: '填写护照上显示的英文姓名，例如：LI, MAO（姓在前，名在后）'
          },
          nationality: {
            label: '国籍',
            help: '请选择您的国籍'
          },
          passportNo: {
            label: '护照号码',
            help: '护照号码通常是8-9位字母和数字的组合，输入时会自动转大写'
          },
          visaNumber: {
            label: '签证号（如有）',
            help: '如有签证，请填写签证号码（仅限字母或数字）'
          },
          dob: {
            label: '出生日期',
            help: '选择您的出生日期'
          },
          expiryDate: {
            label: '护照有效期',
            help: '选择护照到期日期'
          },
          sex: {
            label: '性别',
            options: {
              female: '女性',
              male: '男性',
              undefined: '未定义'
            }
          },
          occupation: {
            label: '职业',
            custom: '其他职业',
            help: '选择或输入您的职业'
          },
          cityOfResidence: {
            label: '居住城市',
            labelChina: '省份',
            help: '请输入您居住的城市',
            helpChina: '请选择您居住的省份',
            placeholder: '例如：NEW YORK, LONDON',
            placeholderChina: '例如：BEIJING, SHANGHAI'
          },
          residentCountry: {
            label: '居住国家',
            help: '请选择您居住的国家'
          },
          phoneCode: {
            label: '国家代码'
          },
          phoneNumber: {
            label: '手机号码',
            help: '请输入您的联系电话'
          },
          email: {
            label: '电子邮箱',
            help: '请输入您的邮箱地址'
          },
          travelPurpose: {
            label: '访问目的',
            custom: '其他目的',
            help: '选择或描述您的旅行目的'
          },
          recentStayCountry: {
            label: '最近停留国家',
            help: '来泰国前停留的国家'
          },
          boardingCountry: {
            label: '登机国家',
            help: '登上前往泰国航班的国家'
          },
          arrivalFlightNumber: {
            label: '抵达航班号',
            help: '例如：CX123',
            scanButton: '📷 扫描机票'
          },
          arrivalDate: {
            label: '抵达日期',
            help: '选择您抵达泰国的日期'
          },
          departureFlightNumber: {
            label: '离境航班号',
            help: '例如：CX456',
            scanButton: '📷 扫描机票'
          },
          departureDate: {
            label: '离境日期',
            help: '选择您离开泰国的日期'
          },
          isTransitPassenger: {
            label: '过境旅客',
            help: '您是否只是过境泰国？'
          },
          accommodationType: {
            label: '住宿类型',
            custom: '其他类型',
            help: '选择您的住宿类型'
          },
          province: {
            label: '府',
            help: '选择泰国的府'
          },
          district: {
            label: '县',
            help: '选择县'
          },
          subDistrict: {
            label: '区',
            help: '选择区'
          },
          postalCode: {
            label: '邮编',
            help: '输入邮政编码'
          },
          hotelAddress: {
            label: '住宿地址',
            help: '输入您住宿的完整地址',
            scanButton: '📷 扫描酒店预订'
          }
        },

        // 章节标题
        sectionTitles: {
          passport: '👤 护照信息',
          passportSubtitle: '泰国海关需要核实你的身份',
          personal: '👤 个人信息',
          personalSubtitle: '让泰国更了解你',
          funds: '💰 资金证明',
          fundsSubtitle: '展示你的经济能力',
          travel: '✈️ 旅行信息',
          travelSubtitle: '你的泰国行程'
        },

        // 资金部分
        funds: {
          empty: '还没有添加资金项',
          addButton: '+ 添加资金项',
          totalAmount: '总计：{{amount}} {{currency}}'
        },

        // 按钮
        buttons: {
          continue: '继续',
          saveAndContinue: '保存并继续',
          back: '返回'
        }
      },

      // 常量 - 职业选项
      occupations: {
        SOFTWARE_ENGINEER: '软件工程师',
        STUDENT: '学生',
        TEACHER: '教师',
        DOCTOR: '医生',
        ACCOUNTANT: '会计师',
        SALES_MANAGER: '销售经理',
        RETIRED: '退休人员',
        ENGINEER: '工程师',
        CIVIL_SERVANT: '公务员',
        LAWYER: '律师',
        NURSE: '护士',
        FREELANCER: '自由职业者',
        BUSINESS_OWNER: '企业主',
        HOMEMAKER: '家庭主妇',
        DESIGNER: '设计师',
        OTHER: '其他'
      },

      // 常量 - 旅行目的
      travelPurposes: {
        HOLIDAY: '度假/旅游',
        MEETING: '会议',
        SPORTS: '体育',
        BUSINESS: '商务',
        INCENTIVE: '奖励旅游',
        CONVENTION: '会展/大会',
        EDUCATION: '教育',
        EMPLOYMENT: '就业',
        EXHIBITION: '展览',
        MEDICAL: '医疗'
      },

      // 常量 - 住宿类型
      accommodationTypes: {
        HOTEL: '酒店',
        HOSTEL: '青年旅舍',
        GUESTHOUSE: '民宿',
        RESORT: '度假村',
        APARTMENT: '公寓',
        FRIEND: '朋友家'
      },

      // TDACHybridScreen
      hybrid: {
        stages: {
          loading: '正在初始化...',
          extracting: '正在等待Cloudflare验证...',
          submitting: '正在提交...',
          success: '提交成功！',
          error: '提交失败'
        },
        cloudflare: {
          ready: '请点击"我不是机器人"复选框',
          waiting: '等待验证完成... (还剩 {{seconds}} 秒)',
          timeout: '验证超时',
          timeoutMessage: '您没有在规定时间内完成Cloudflare验证。\n\n可能原因：\n• 超过60秒未点击验证框\n• 网络连接问题\n\n建议重试或使用WebView版本。',
          retry: '重试',
          back: '返回',
          useWebView: '使用WebView版本'
        },
        progress: {
          step: '步骤 {{current}}/{{total}}: {{message}}'
        }
      },

      // 通用验证消息
      validation: {
        required: '此字段为必填项',
        invalidFormat: '格式不正确',
        tooShort: '太短',
        tooLong: '太长',
        invalidEmail: '邮箱格式不正确',
        invalidPhone: '电话号码不正确',
        invalidPassport: '护照号码不正确',
        invalidDate: '日期不正确',
        datePast: '日期必须在过去',
        dateFuture: '日期必须在未来',
        passportExpired: '护照已过期或即将过期'
      }
    }
  }
};

module.exports = thailandI18nAdditions;
