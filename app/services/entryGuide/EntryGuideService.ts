// 通用入境指引服务 - 支持多国家入境流程管理
// 提供统一的接口管理泰国、日本等国家的入境指引

import { thailandEntryGuide } from '../../config/entryGuide/thailand.js';
import { japanEntryGuide } from '../../config/entryGuide/japan.js';
import JapanEntryGuideService from './JapanEntryGuideService.js';
import ThailandEntryGuideService from './ThailandEntryGuideService.js';

// Type definitions
interface CountryGuide {
  country: string;
  countryName: string;
  countryNameZh: string;
  airport?: string;
  currency?: string;
  language?: string[];
  steps?: Array<{
    id: string;
    title: string;
    titleZh?: string;
    [key: string]: any;
  }>;
  atm?: any;
  taxi?: any;
  biometric?: any;
  emergency?: any;
  [key: string]: any;
}

interface SupportedCountry {
  code: string;
  name: string;
  nameZh: string;
  flag: string;
  airport?: string;
  currency?: string;
}

interface CountryFeature {
  type: string;
  title: string;
  titleZh: string;
  available: boolean;
}

type CountryCode = 'thailand' | 'japan' | 'singapore' | 'malaysia' | 'korea' | 'hongkong' | 'taiwan' | string;

interface CountryService {
  getTDACInfo?: () => any;
  getATMInfo?: () => any;
  getTaxiInfo?: () => any;
  getBasicInfo?: () => any;
  [key: string]: any;
}

class EntryGuideService {
  private guides: Record<string, CountryGuide>;
  private activeCountry: CountryCode | null;
  private countryServices: Record<string, CountryService>;

  constructor() {
    this.guides = {
      thailand: thailandEntryGuide,
      japan: japanEntryGuide
      // 未来添加更多国家...
    };

    this.activeCountry = null;
    this.countryServices = {};
  }

  /**
   * 获取支持的国家列表
   * @returns Supported countries list
   */
  getSupportedCountries(): SupportedCountry[] {
    return Object.keys(this.guides).map(country => ({
      code: country,
      name: this.guides[country].countryName,
      nameZh: this.guides[country].countryNameZh,
      flag: this._getCountryFlag(country),
      airport: this.guides[country].airport,
      currency: this.guides[country].currency
    }));
  }

  /**
   * 设置活动国家
   * @param country - Country code
   * @returns Country-specific service instance
   */
  setActiveCountry(country: CountryCode): CountryService {
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

  /**
   * 获取当前活动国家服务
   * @returns Active country service instance
   */
  getActiveCountryService(): CountryService {
    if (!this.activeCountry || !this.countryServices[this.activeCountry]) {
      throw new Error('请先设置活动国家');
    }
    return this.countryServices[this.activeCountry];
  }

  /**
   * 获取国家指南配置
   * @param country - Country code (optional, uses active country if not provided)
   * @returns Country guide configuration
   */
  getGuide(country: CountryCode | null = null): CountryGuide {
    const targetCountry = country || this.activeCountry;
    if (!targetCountry || !this.guides[targetCountry]) {
      throw new Error(`未找到国家指南: ${targetCountry}`);
    }
    return this.guides[targetCountry];
  }

  /**
   * 创建国家特定服务实例
   * @param country - Country code
   * @returns Country-specific service instance
   */
  private _createCountryService(country: CountryCode): CountryService {
    const guide = this.guides[country];

    // 根据国家类型创建相应的服务
    switch (country) {
      case 'thailand':
        // ThailandEntryGuideService is a class, instantiate it
        return new (ThailandEntryGuideService as any)();
      case 'japan':
        // JapanEntryGuideService is a class, instantiate it
        return new (JapanEntryGuideService as any)();
      default:
        return new GenericEntryGuideService(guide);
    }
  }

  /**
   * 获取国家旗帜表情符号
   * @param country - Country code
   * @returns Country flag emoji
   */
  private _getCountryFlag(country: CountryCode): string {
    const flags: Record<string, string> = {
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

  /**
   * 检查国家是否支持
   * @param country - Country code
   * @returns Whether country is supported
   */
  isCountrySupported(country: CountryCode): boolean {
    return country in this.guides;
  }

  /**
   * 获取所有步骤总数
   * @param country - Country code (optional)
   * @returns Total number of steps
   */
  getTotalSteps(country: CountryCode | null = null): number {
    const guide = this.getGuide(country);
    return guide.steps ? guide.steps.length : 0;
  }

  /**
   * 获取国家特色功能
   * @param country - Country code (optional)
   * @returns Array of country features
   */
  getCountryFeatures(country: CountryCode | null = null): CountryFeature[] {
    const guide = this.getGuide(country);
    const features: CountryFeature[] = [];

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

// 通用入境指引服务
class GenericEntryGuideService implements CountryService {
  private guide: CountryGuide;

  constructor(guide: CountryGuide) {
    this.guide = guide;
  }

  getBasicInfo(): {
    country: string;
    steps: number;
    emergency: any;
  } {
    return {
      country: this.guide.country,
      steps: this.guide.steps?.length || 0,
      emergency: this.guide.emergency || {}
    };
  }
}

export default EntryGuideService;

