// @ts-nocheck
/**
 * 入境指引服务
 * 提供多国家入境指引的统一管理接口
 */

import { thailandEntryGuide } from '../../config/entryGuide/thailand';

// 定义 TypeScript 接口
interface EntryGuideStep {
  id: string;
  category: string;
  categoryZh: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  priority: number;
  estimatedTime: string;
  warnings: string[];
  tips: string[];
  icon: string;
  required: boolean;
  skippable: boolean;
}

interface EntryGuideCountry {
  country: string;
  countryName: string;
  countryNameZh: string;
  primaryAirport: string;
  currency: string;
  language: string[];
  steps: EntryGuideStep[];
  customs: {
    declarationRequired: boolean;
    prohibitedItems: string[];
    dutyFree: {
      alcohol: string;
      tobacco: string;
    };
  };
  emergency: {
    police: string;
    ambulance: string;
    embassy: string;
  };
  tips: string[];
}

interface CountryConfig {
  id: string;
  name: string;
  nameZh: string;
  flag: string;
  primaryAirport: string;
  currency: string;
  language: string[];
  guide: EntryGuideCountry;
}

interface ProgressInfo {
  currentStep: number;
  totalSteps: number;
  progress: number;
  isFirstStep: boolean;
  isLastStep: boolean;
}

class EntryGuideService {
  // 支持的国家列表
  static SUPPORTED_COUNTRIES: Record<string, CountryConfig> = {
    thailand: {
      id: 'thailand',
      name: '泰国',
      nameZh: '泰国',
      flag: '🇹🇭',
      primaryAirport: 'BKK',
      currency: 'THB',
      language: ['th', 'en'],
      guide: thailandEntryGuide as EntryGuideCountry
    }
    // 未来添加更多国家
    // japan: {
    //   id: 'japan',
    //   name: '日本',
    //   nameZh: '日本',
    //   flag: '🇯🇵',
    //   primaryAirport: 'NRT',
    //   currency: 'JPY',
    //   language: ['ja', 'en'],
    //   guide: japanEntryGuide
    // }
  };

  /**
   * 获取指定国家的入境指引
   * @param country - 国家代码
   * @returns 入境指引配置
   */
  static getGuide(country: string): EntryGuideCountry {
    const countryConfig = this.SUPPORTED_COUNTRIES[country];
    if (!countryConfig) {
      console.warn(`Country ${country} not supported, falling back to Thailand`);
      return this.SUPPORTED_COUNTRIES.thailand.guide;
    }
    return countryConfig.guide;
  }

  /**
   * 获取所有支持的国家
   * @returns 支持的国家配置
   */
  static getSupportedCountries(): Record<string, CountryConfig> {
    return this.SUPPORTED_COUNTRIES;
  }

  /**
   * 获取指定步骤的详细信息
   * @param country - 国家代码
   * @param stepId - 步骤ID
   * @returns 步骤详情或null
   */
  static getStep(country: string, stepId: string): EntryGuideStep | null {
    const guide = this.getGuide(country);
    return guide.steps.find(step => step.id === stepId) || null;
  }

  /**
   * 获取指定分类的所有步骤
   * @param country - 国家代码
   * @param category - 分类名称
   * @returns 该分类的所有步骤
   */
  static getStepsByCategory(country: string, category: string): EntryGuideStep[] {
    const guide = this.getGuide(country);
    return guide.steps.filter(step => step.category === category);
  }

  /**
   * 获取下一步骤
   * @param country - 国家代码
   * @param currentStepId - 当前步骤ID
   * @returns 下一步骤或null
   */
  static getNextStep(country: string, currentStepId: string): EntryGuideStep | null {
    const guide = this.getGuide(country);
    const currentIndex = guide.steps.findIndex(step => step.id === currentStepId);
    if (currentIndex >= 0 && currentIndex < guide.steps.length - 1) {
      return guide.steps[currentIndex + 1];
    }
    return null;
  }

  /**
   * 获取上一步骤
   * @param country - 国家代码
   * @param currentStepId - 当前步骤ID
   * @returns 上一步骤或null
   */
  static getPrevStep(country: string, currentStepId: string): EntryGuideStep | null {
    const guide = this.getGuide(country);
    const currentIndex = guide.steps.findIndex(step => step.id === currentStepId);
    if (currentIndex > 0) {
      return guide.steps[currentIndex - 1];
    }
    return null;
  }

  /**
   * 计算步骤进度
   * @param country - 国家代码
   * @param currentStepIndex - 当前步骤索引
   * @returns 进度信息
   */
  static calculateProgress(country: string, currentStepIndex: number): ProgressInfo {
    const guide = this.getGuide(country);
    const totalSteps = guide.steps.length;
    const progress = ((currentStepIndex + 1) / totalSteps) * 100;

    return {
      currentStep: currentStepIndex + 1,
      totalSteps,
      progress,
      isFirstStep: currentStepIndex === 0,
      isLastStep: currentStepIndex === totalSteps - 1
    };
  }

  /**
   * 获取国家特定配置
   * @param country - 国家代码
   * @returns 国家配置
   */
  static getCountryConfig(country: string): CountryConfig {
    return this.SUPPORTED_COUNTRIES[country] || this.SUPPORTED_COUNTRIES.thailand;
  }

  /**
   * 验证步骤是否可以跳转
   * @param country - 国家代码
   * @param fromIndex - 起始步骤索引
   * @param toIndex - 目标步骤索引
   * @returns 是否可以跳转
   */
  static canJumpToStep(country: string, fromIndex: number, toIndex: number): boolean {
    const guide = this.getGuide(country);

    // 允许跳转到已完成的步骤或相邻的步骤
    if (toIndex <= fromIndex) {
      return true;
    }

    // 检查目标步骤之前的所有步骤是否都已完成
    for (let i = fromIndex; i < toIndex; i++) {
      const step = guide.steps[i];
      if (step.required && !step.skippable) {
        return false;
      }
    }

    return true;
  }

  /**
   * 获取紧急联系方式
   * @param country - 国家代码
   * @returns 紧急联系方式
   */
  static getEmergencyContacts(country: string): { police: string; ambulance: string; embassy: string } {
    const guide = this.getGuide(country);
    return guide.emergency;
  }

  /**
   * 获取海关规定
   * @param country - 国家代码
   * @returns 海关规定
   */
  static getCustomsRules(country: string): any {
    const guide = this.getGuide(country);
    return guide.customs;
  }

  /**
   * 获取实用提示
   * @param country - 国家代码
   * @returns 实用提示列表
   */
  static getTips(country: string): string[] {
    const guide = this.getGuide(country);
    return guide.tips;
  }
}

export default EntryGuideService;