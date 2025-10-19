/**
 * 入境指引服务
 * 提供多国家入境指引的统一管理接口
 */

import { thailandEntryGuide } from '../../config/entryGuide/thailand';
// 未来可以添加更多国家
// import { japanEntryGuide } from '../../config/entryGuide/japan';
// import { singaporeEntryGuide } from '../../config/entryGuide/singapore';

class EntryGuideService {
  // 支持的国家列表
  static SUPPORTED_COUNTRIES = {
    thailand: {
      id: 'thailand',
      name: '泰国',
      nameZh: '泰国',
      flag: '🇹🇭',
      primaryAirport: 'BKK',
      currency: 'THB',
      language: ['th', 'en'],
      guide: thailandEntryGuide
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
   * @param {string} country - 国家代码
   * @returns {object} 入境指引配置
   */
  static getGuide(country) {
    const countryConfig = this.SUPPORTED_COUNTRIES[country];
    if (!countryConfig) {
      console.warn(`Country ${country} not supported, falling back to Thailand`);
      return this.SUPPORTED_COUNTRIES.thailand.guide;
    }
    return countryConfig.guide;
  }

  /**
   * 获取所有支持的国家
   * @returns {object} 支持的国家配置
   */
  static getSupportedCountries() {
    return this.SUPPORTED_COUNTRIES;
  }

  /**
   * 获取指定步骤的详细信息
   * @param {string} country - 国家代码
   * @param {string} stepId - 步骤ID
   * @returns {object|null} 步骤详情或null
   */
  static getStep(country, stepId) {
    const guide = this.getGuide(country);
    return guide.steps.find(step => step.id === stepId) || null;
  }

  /**
   * 获取指定分类的所有步骤
   * @param {string} country - 国家代码
   * @param {string} category - 分类名称
   * @returns {array} 该分类的所有步骤
   */
  static getStepsByCategory(country, category) {
    const guide = this.getGuide(country);
    return guide.steps.filter(step => step.category === category);
  }

  /**
   * 获取下一步骤
   * @param {string} country - 国家代码
   * @param {string} currentStepId - 当前步骤ID
   * @returns {object|null} 下一步骤或null
   */
  static getNextStep(country, currentStepId) {
    const guide = this.getGuide(country);
    const currentIndex = guide.steps.findIndex(step => step.id === currentStepId);
    if (currentIndex >= 0 && currentIndex < guide.steps.length - 1) {
      return guide.steps[currentIndex + 1];
    }
    return null;
  }

  /**
   * 获取上一步骤
   * @param {string} country - 国家代码
   * @param {string} currentStepId - 当前步骤ID
   * @returns {object|null} 上一步骤或null
   */
  static getPrevStep(country, currentStepId) {
    const guide = this.getGuide(country);
    const currentIndex = guide.steps.findIndex(step => step.id === currentStepId);
    if (currentIndex > 0) {
      return guide.steps[currentIndex - 1];
    }
    return null;
  }

  /**
   * 计算步骤进度
   * @param {string} country - 国家代码
   * @param {number} currentStepIndex - 当前步骤索引
   * @returns {object} 进度信息
   */
  static calculateProgress(country, currentStepIndex) {
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
   * @param {string} country - 国家代码
   * @returns {object} 国家配置
   */
  static getCountryConfig(country) {
    return this.SUPPORTED_COUNTRIES[country] || this.SUPPORTED_COUNTRIES.thailand;
  }

  /**
   * 验证步骤是否可以跳转
   * @param {string} country - 国家代码
   * @param {number} fromIndex - 起始步骤索引
   * @param {number} toIndex - 目标步骤索引
   * @returns {boolean} 是否可以跳转
   */
  static canJumpToStep(country, fromIndex, toIndex) {
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
   * @param {string} country - 国家代码
   * @returns {object} 紧急联系方式
   */
  static getEmergencyContacts(country) {
    const guide = this.getGuide(country);
    return guide.emergency || {};
  }

  /**
   * 获取海关规定
   * @param {string} country - 国家代码
   * @returns {object} 海关规定
   */
  static getCustomsRules(country) {
    const guide = this.getGuide(country);
    return guide.customs || {};
  }

  /**
   * 获取实用提示
   * @param {string} country - 国家代码
   * @returns {array} 实用提示列表
   */
  static getTips(country) {
    const guide = this.getGuide(country);
    return guide.tips || [];
  }
}

export default EntryGuideService;