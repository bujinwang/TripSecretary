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
    notes: [
      '需提前72小时在线申请TDAC电子入境卡',
      '入境时出示护照和TDAC二维码',
      '2025年5月1日起正式启用'
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
    entryMethod: 'none',   // 无需填表
    kioskName: 'e-Channel (e道)',
    kioskSupported: true,  // 内地居民可注册使用
    notes: [
      '持回乡证可直接通关',
      '持护照可注册e-道服务',
      '年满11岁即可使用'
    ]
  },

  // 台湾
  tw: {
    needsPaperForm: true,  // 需要填写入境卡
    needsCopyMode: true,   // 老人需要帮助
    hasAutoKiosk: false,   // 内地居民不能用自动通关
    pdfFormat: '入出境登记表',
    entryMethod: 'paper',  
    notes: [
      '需要填写纸质入境卡',
      '持台胞证或大陆居民往来台湾通行证',
      '人工柜台办理'
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
      '需提前3天在线提交SG Arrival Card',
      '入境时扫描护照和指纹',
      '部分护照可使用自动通关'
    ]
  },

  // 马来西亚
  my: {
    needsPaperForm: true,  // 需要入境卡
    needsCopyMode: true,   // 老人需要帮助
    hasAutoKiosk: false,   // 外国人不能用
    pdfFormat: '入境卡',
    entryMethod: 'paper',
    notes: [
      '需要填写入境卡',
      '人工柜台办理'
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
  if (!config) return null;

  return {
    method: config.entryMethod,
    notes: config.notes,
    digitalSystem: config.digitalSystem,
    digitalUrl: config.digitalUrl,
    kioskName: config.kioskName,
    pdfFormat: config.pdfFormat,
  };
};
