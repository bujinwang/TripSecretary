// 通用入境指引服务 - 支持多国家入境流程管理
// 提供统一的接口管理泰国、日本等国家的入境指引

import { thailandEntryGuide } from '../../config/entryGuide/thailand.js';
import { japanEntryGuide } from '../../config/entryGuide/japan.js';
import JapanEntryGuideService from './JapanEntryGuideService.js';

class EntryGuideService {
  constructor() {
    this.guides = {
      thailand: thailandEntryGuide,
      japan: japanEntryGuide
      // 未来添加更多国家...
    };

    this.activeCountry = null;
    this.countryServices = {};
  }

  // 获取支持的国家列表
  getSupportedCountries() {
    return Object.keys(this.guides).map(country => ({
      code: country,
      name: this.guides[country].countryName,
      nameZh: this.guides[country].countryNameZh,
      flag: this._getCountryFlag(country),
      airport: this.guides[country].airport,
      currency: this.guides[country].currency
    }));
  }

  // 设置活动国家
  setActiveCountry(country) {
    if (!this.guides[country]) {
      throw new Error(`不支持的国家: ${country}`);
    }

    this.activeCountry = country;

    // 动态加载国家特定服务
    if (!this.countryServices[country]) {
      this.countryServices[country] = this._createCountryService(country);
    }

    return this.countryServices[country];
  }

  // 获取当前活动国家服务
  getActiveCountryService() {
    if (!this.activeCountry || !this.countryServices[this.activeCountry]) {
      throw new Error('请先设置活动国家');
    }
    return this.countryServices[this.activeCountry];
  }

  // 获取国家指南配置
  getGuide(country = null) {
    const targetCountry = country || this.activeCountry;
    if (!targetCountry || !this.guides[targetCountry]) {
      throw new Error(`未找到国家指南: ${targetCountry}`);
    }
    return this.guides[targetCountry];
  }

  // 创建国家特定服务实例
  _createCountryService(country) {
    const guide = this.guides[country];

    // 根据国家类型创建相应的服务
    switch (country) {
      case 'thailand':
        return new ThailandEntryGuideService(guide);
      case 'japan':
        return new JapanEntryGuideService(guide);
      default:
        return new GenericEntryGuideService(guide);
    }
  }

  // 获取国家旗帜表情符号
  _getCountryFlag(country) {
    const flags = {
      thailand: '🇹🇭',
      japan: '🇯🇵',
      singapore: '🇸🇬',
      malaysia: '🇲🇾',
      korea: '🇰🇷',
      hongkong: '🇭🇰',
      taiwan: '🇹🇼'
    };
    return flags[country] || '🌍';
  }

  // 检查国家是否支持
  isCountrySupported(country) {
    return country in this.guides;
  }

  // 获取所有步骤总数
  getTotalSteps(country = null) {
    const guide = this.getGuide(country);
    return guide.steps ? guide.steps.length : 0;
  }

  // 获取国家特色功能
  getCountryFeatures(country = null) {
    const guide = this.getGuide(country);
    const features = [];

    if (guide.atm) {
      features.push({
        type: 'atm',
        title: 'ATM取款指引',
        titleZh: 'ATM取款指引',
        available: true
      });
    }

    if (guide.taxi) {
      features.push({
        type: 'taxi',
        title: '出租车指引',
        titleZh: '出租车指引',
        available: true
      });
    }

    if (guide.biometric) {
      features.push({
        type: 'biometric',
        title: '生物识别',
        titleZh: '生物识别',
        available: true
      });
    }

    return features;
  }
}

// 泰国入境指引服务
class ThailandEntryGuideService {
  constructor(guide) {
    this.guide = guide;
    this.type = 'thailand';
  }

  getTDACInfo() {
    return {
      required: true,
      window: '72小时',
      qrCode: true,
      tips: [
        '抵达前72小时内提交',
        '保存QR码到手机相册',
        '替代纸质入境卡TM6'
      ]
    };
  }

  getATMInfo() {
    return this.guide.atm || null;
  }

  getTaxiInfo() {
    return this.guide.taxi || null;
  }
}

// 日本入境指引服务已移至单独文件

// 通用入境指引服务
class GenericEntryGuideService {
  constructor(guide) {
    this.guide = guide;
  }

  getBasicInfo() {
    return {
      country: this.guide.country,
      steps: this.guide.steps?.length || 0,
      emergency: this.guide.emergency || {}
    };
  }
}

export default EntryGuideService;