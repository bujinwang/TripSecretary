// 签证要求数据
// 根据护照国籍和目的地国家确定签证要求

/**
 * 获取签证要求
 * @param {string} passportCountry - 护照国家代码 (如 'CN' 中国)
 * @param {string} destinationCountry - 目的地国家代码 (如 'jp' 日本)
 * @returns {object} 签证要求信息
 */
export const getVisaRequirement = (passportCountry, destinationCountry) => {
  const requirements = VISA_REQUIREMENTS[passportCountry] || {};
  return requirements[destinationCountry] || { visaFree: false, stayDays: 0 };
};

// 签证要求数据库
// 格式: { 护照国家: { 目的地国家: { visaFree: boolean, stayDays: number } } }
const VISA_REQUIREMENTS = {
  // 中国护照
  CN: {
    jp: { visaFree: false, stayDays: 0, visaType: 'required' }, // 日本需要签证
    th: { visaFree: true, stayDays: 30, visaType: 'visa-free' }, // 泰国免签30天
    hk: { visaFree: true, stayDays: 7, visaType: 'visa-free' }, // 香港免签7天
    tw: { visaFree: false, stayDays: 0, visaType: 'permit' }, // 台湾需要入台证
    kr: { visaFree: false, stayDays: 0, visaType: 'required' }, // 韩国需要签证
    sg: { visaFree: true, stayDays: 30, visaType: 'visa-free' }, // 新加坡免签30天
    my: { visaFree: true, stayDays: 30, visaType: 'visa-free' }, // 马来西亚免签30天
    us: { visaFree: false, stayDays: 0, visaType: 'required' }, // 美国需要签证
    ca: { visaFree: false, stayDays: 0, visaType: 'required' }, // 加拿大需要签证
    au: { visaFree: false, stayDays: 0, visaType: 'required' }, // 澳大利亚需要签证
    nz: { visaFree: false, stayDays: 0, visaType: 'required' }, // 新西兰需要签证
    gb: { visaFree: false, stayDays: 0, visaType: 'required' }, // 英国需要签证
    fr: { visaFree: false, stayDays: 0, visaType: 'required' }, // 法国需要签证
    de: { visaFree: false, stayDays: 0, visaType: 'required' }, // 德国需要签证
    it: { visaFree: false, stayDays: 0, visaType: 'required' }, // 意大利需要签证
    es: { visaFree: false, stayDays: 0, visaType: 'required' }, // 西班牙需要签证
  },
  
  // 香港特区护照
  HK: {
    jp: { visaFree: true, stayDays: 90, visaType: 'visa-free' },
    th: { visaFree: true, stayDays: 30, visaType: 'visa-free' },
    hk: { visaFree: true, stayDays: 0, visaType: 'resident' },
    tw: { visaFree: true, stayDays: 30, visaType: 'visa-free' },
    kr: { visaFree: true, stayDays: 90, visaType: 'visa-free' },
    sg: { visaFree: true, stayDays: 30, visaType: 'visa-free' },
    my: { visaFree: true, stayDays: 30, visaType: 'visa-free' },
    us: { visaFree: false, stayDays: 0, visaType: 'required' },
    ca: { visaFree: false, stayDays: 0, visaType: 'eta' },
    au: { visaFree: false, stayDays: 0, visaType: 'eta' },
    nz: { visaFree: false, stayDays: 0, visaType: 'eta' },
    gb: { visaFree: true, stayDays: 180, visaType: 'visa-free' },
    fr: { visaFree: true, stayDays: 90, visaType: 'visa-free' },
    de: { visaFree: true, stayDays: 90, visaType: 'visa-free' },
    it: { visaFree: true, stayDays: 90, visaType: 'visa-free' },
    es: { visaFree: true, stayDays: 90, visaType: 'visa-free' },
  },
  
  // 台湾护照
  TW: {
    jp: { visaFree: true, stayDays: 90, visaType: 'visa-free' },
    th: { visaFree: true, stayDays: 30, visaType: 'visa-free' },
    hk: { visaFree: true, stayDays: 30, visaType: 'visa-free' },
    tw: { visaFree: true, stayDays: 0, visaType: 'resident' },
    kr: { visaFree: true, stayDays: 90, visaType: 'visa-free' },
    sg: { visaFree: true, stayDays: 30, visaType: 'visa-free' },
    my: { visaFree: true, stayDays: 30, visaType: 'visa-free' },
    us: { visaFree: true, stayDays: 90, visaType: 'visa-free' },
    ca: { visaFree: false, stayDays: 0, visaType: 'eta' },
    au: { visaFree: false, stayDays: 0, visaType: 'eta' },
    nz: { visaFree: false, stayDays: 0, visaType: 'eta' },
    gb: { visaFree: true, stayDays: 180, visaType: 'visa-free' },
    fr: { visaFree: true, stayDays: 90, visaType: 'visa-free' },
    de: { visaFree: true, stayDays: 90, visaType: 'visa-free' },
    it: { visaFree: true, stayDays: 90, visaType: 'visa-free' },
    es: { visaFree: true, stayDays: 90, visaType: 'visa-free' },
  },
};

export default VISA_REQUIREMENTS;
