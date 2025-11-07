/**
 * 各国入境要求配置
 * 根据实际情况动态显示相应功能
 */

export const destinationRequirements = {
  // 泰国
  th: {
    needsPaperForm: false, // 2025年5月起启用电子入境卡TDAC，不需要纸质表格
    needsCopyMode: false,  // 不需要手写
    hasAutoKiosk: false,   // 没有自助通关机
    pdfFormat: null,       // 无PDF格式（完全电子化）
    entryMethod: 'digital', // digital | paper | both
    digitalSystem: 'TDAC', // 电子系统名称
    digitalUrl: 'https://tdac.immigration.go.th',
    requiresContactInfo: true, // 需要联系方式（泰国TDAC需要电话和邮箱）
    notes: [
      '应用将在航班前72小时内自动提交TDAC电子入境卡，无需手动填写',
      '完成后会生成TDAC二维码，和护照一起出示即可入境',
      '记得保持护照与航班信息最新，如有变化请在应用内更新'
    ]
  },

  // 加拿大
  ca: {
    needsPaperForm: false, // 使用电子申报
    needsCopyMode: true,   // 老人可能需要帮助填写自助机
    hasAutoKiosk: true,    // 有PIK自助通关机
    pdfFormat: 'E311',     // PDF为E311表格格式（备用）
    entryMethod: 'digital',
    digitalSystem: 'eDeclaration/ArriveCAN',
    kioskName: 'PIK Kiosk',
    kioskSupported: true,  // 中国护照可用
    requiresContactInfo: false, // 加拿大不需要联系方式
    notes: [
      '所有旅客必须使用PIK自助通关机',
      '可提前用手机申请eDeclaration',
      '支持中国护照'
    ]
  },

  // 美国
  us: {
    needsPaperForm: true,  // 仍需要I-94和海关申报表
    needsCopyMode: true,   // 老人需要帮助填写
    hasAutoKiosk: true,    // 有APC自助机
    pdfFormat: 'I-94 + Customs Declaration',
    entryMethod: 'both',
    kioskName: 'APC Kiosk',
    kioskSupported: false, // 中国护照不能用APC
    requiresContactInfo: true, // 美国需要联系方式（I-94和海关申报表）
    notes: [
      '需要填写I-94入境表和海关申报表',
      '中国护照不能使用APC自助机',
      '需要人工柜台办理'
    ]
  },

  // 香港
  hk: {
    needsPaperForm: false, // 不需要入境卡
    needsCopyMode: false,  // 不需要
    hasAutoKiosk: true,    // 有e-道
    pdfFormat: null,       // 无需PDF
    entryMethod: 'visa-free', // 免签入境
    kioskName: 'e-Channel (e道)',
    kioskSupported: true,  // 内地居民可注册使用
    visaInfo: {
      type: 'visa-free',
      duration: '7 days',
      requirements: [
        '中国大陆居民需要港澳通行证',
        '需要有效的香港签注',
        '适用于旅游、商务、探亲',
        '如需延期可通过香港入境处申请'
      ],
      documentOptions: [
        '港澳通行证：中国大陆居民必须持有效港澳通行证及香港签注',
        '护照入境：仅限特殊情况（如紧急情况、商务等）',
        '推荐证件：港澳通行证是最常用和便捷的入境证件',
        '首次申请：需要到出入境管理部门办理港澳通行证'
      ]
    },
    notes: [
      '持回乡证可直接通关',
      '持护照可注册e-道服务',
      '年满11岁即可使用',
      '入境须知：仅7天，必须按时离境或申请延期',
      '入境检查严格：可能被详细询问来港目的、住宿、资金情况',
      '证件需准备齐全：往返机票、酒店预订、资金证明均需准备',
      '可能需健康申报：视当前健康政策而定',
      'e道限制：首次访港需人工柜台，排队时间较长'
    ]
  },

  // 台湾
  tw: {
    needsPaperForm: false,  // 使用电子入境卡
    needsCopyMode: false,   // 线上填写，无需手写
    hasAutoKiosk: false,    // 主要人工柜台，但支持快速通关确认
    pdfFormat: null,
    entryMethod: 'digital',
    digitalSystem: 'Taiwan Online Arrival Card',
    digitalUrl: 'https://twac.immigration.gov.tw/submit',
    notes: [
      '抵达前先填写台湾电子入境卡（Online Arrival Card），支持事先在线提交',
      '需填写可用邮箱接收验证码并完成OTP验证后才能进入表单',
      '请准备航班、住宿、联络电话以及14日内旅行史等信息'
    ]
  },

  // 日本
  jp: {
    needsPaperForm: true,  // 需要入境卡和海关申报
    needsCopyMode: true,   // 老人需要帮助
    hasAutoKiosk: false,   // 外国人不能用自动通关
    pdfFormat: '入境卡 + 海关申报书',
    entryMethod: 'paper',
    notes: [
      '需要填写入境卡（蓝色）',
      '需要填写海关申报书（黄色）',
      '人工柜台办理'
    ]
  },

  // 韩国
  kr: {
    needsPaperForm: true,  // 需要入境卡
    needsCopyMode: true,   // 老人需要帮助
    hasAutoKiosk: true,    // 有自动通关但需注册
    pdfFormat: '入境卡 + 海关申报书',
    entryMethod: 'paper',
    kioskName: 'SES (Smart Entry Service)',
    kioskSupported: false, // 需要提前注册
    notes: [
      '需要填写入境卡',
      '自动通关需提前注册',
      '未注册者使用人工柜台'
    ]
  },

  // 新加坡
  sg: {
    needsPaperForm: false, // 使用电子入境卡
    needsCopyMode: false,  // 不需要
    hasAutoKiosk: true,    // 有自动通关
    pdfFormat: null,       // 无需PDF
    entryMethod: 'digital',
    digitalSystem: 'SG Arrival Card',
    digitalUrl: 'https://eservices.ica.gov.sg/sgarrivalcard',
    notes: [
      '抵达前3天内在线提交SG Arrival Card，超过窗口会被拒绝',
      '入境时需要出示提交确认与护照并完成指纹、面像采集',
      '同一旅客30天内重复入境可复用已提交信息或重新更新行程'
    ]
  },

  // 马来西亚
  my: {
    needsPaperForm: false,  // 使用数字入境卡MDAC
    needsCopyMode: false,   // 线上填写，无需手写
    hasAutoKiosk: false,    // 外国旅客主要走人工柜台
    pdfFormat: null,
    entryMethod: 'digital',
    digitalSystem: 'MDAC',
    digitalUrl: 'https://imigresen-online.imi.gov.my/mdac/main?registerMain',
    notes: [
      '所有外籍旅客需在抵达前3天内提交Malaysia Digital Arrival Card (MDAC)',
      '提交后会收到确认邮件与PIN码，入境时出示护照和PIN即可完成验证',
      '如果在近30天内再次入境，可复用上一次的PIN码或重新提交最新行程',
    ]
  },

  // 英国
  uk: {
    needsPaperForm: false, // 不需要入境卡
    needsCopyMode: false,  // 不需要
    hasAutoKiosk: true,    // 有e-gates
    pdfFormat: null,
    entryMethod: 'none',
    kioskName: 'e-gates',
    kioskSupported: false, // 中国护照不能用
    notes: [
      '无需填写入境卡',
      '中国护照不能使用e-gates',
      '人工柜台办理'
    ]
  },

  // 澳大利亚
  au: {
    needsPaperForm: false, // 不需要纸质表格
    needsCopyMode: false,  // 不需要
    hasAutoKiosk: true,    // 有SmartGate
    pdfFormat: null,
    entryMethod: 'digital',
    kioskName: 'SmartGate',
    kioskSupported: true,  // 中国护照可用
    notes: [
      '可使用SmartGate自助通关',
      '支持中国电子护照',
      '年满16岁即可使用'
    ]
  },

  // 新西兰
  nz: {
    needsPaperForm: false, // 不需要纸质表格
    needsCopyMode: false,  // 不需要
    hasAutoKiosk: true,    // 有eGate
    pdfFormat: null,
    entryMethod: 'digital',
    kioskName: 'eGate',
    kioskSupported: true,  // 中国护照可用
    notes: [
      '可使用eGate自助通关',
      '支持中国电子护照',
      '年满12岁即可使用'
    ]
  },
};

/**
 * 根据目的地获取可用功能
 */
export const getAvailableFeatures = (destinationId) => {
  const config = destinationRequirements[destinationId];
  if (!config) {
    // 默认配置
    return {
      showPresentToCustoms: true,
      showCopyMode: true,
      showKioskGuide: false,
      showDownloadPDF: true,
      showShare: true,
    };
  }

  return {
    showPresentToCustoms: config.entryMethod === 'paper' || config.entryMethod === 'both',
    showCopyMode: config.needsCopyMode,
    showKioskGuide: config.hasAutoKiosk && config.kioskSupported,
    showDownloadPDF: config.pdfFormat !== null,
    showShare: true, // 分享功能总是可用
    digitalInfo: config.entryMethod === 'digital' ? {
      systemName: config.digitalSystem,
      url: config.digitalUrl,
      notes: config.notes,
    } : null,
  };
};

/**
 * 获取目的地的入境说明
 */
export const getEntryInstructions = (destinationId) => {
  const config = destinationRequirements[destinationId];
  if (!config) {
return null;
}

  return {
    method: config.entryMethod,
    notes: config.notes,
    digitalSystem: config.digitalSystem,
    digitalUrl: config.digitalUrl,
    kioskName: config.kioskName,
    pdfFormat: config.pdfFormat,
  };
};
