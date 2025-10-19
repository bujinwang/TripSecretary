// 日本入境指引服务 - 成田/羽田/关西机场完整流程管理
// 整合护照、居留卡、交通和官方指引

import { japanEntryGuide } from '../../config/entryGuide/japan.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

class JapanEntryGuideService {
  constructor() {
    this.guide = japanEntryGuide;
    this.currentStep = null;
    this.completedSteps = new Set();
    this.userPreferences = {
      language: 'zh-CN',
      notifications: true,
      offlineMode: false
    };
    // 初始化时加载进度
    this.loadProgress();
  }

  // 获取完整指南配置
  getGuide() {
    return this.guide;
  }

  // 获取特定步骤
  getStep(stepId) {
    return this.guide.steps.find(step => step.id === stepId);
  }

  // 获取所有步骤
  getAllSteps() {
    return this.guide.steps;
  }

  // 获取步骤进度
  getProgress() {
    const total = this.guide.steps.length;
    const completed = this.completedSteps.size;
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
      currentStep: this.currentStep,
      completedSteps: Array.from(this.completedSteps)
    };
  }

  // 标记步骤完成
  completeStep(stepId) {
    this.completedSteps.add(stepId);
    this._saveProgress();
    return this.getProgress();
  }

  // 设置当前步骤
  setCurrentStep(stepId) {
    this.currentStep = stepId;
    this._saveProgress();
    return this.getStep(stepId);
  }

  // 获取下一步
  getNextStep() {
    const currentIndex = this.guide.steps.findIndex(step => step.id === this.currentStep);
    if (currentIndex < this.guide.steps.length - 1) {
      return this.guide.steps[currentIndex + 1];
    }
    return null;
  }

  // 获取上一步
  getPreviousStep() {
    const currentIndex = this.guide.steps.findIndex(step => step.id === this.currentStep);
    if (currentIndex > 0) {
      return this.guide.steps[currentIndex - 1];
    }
    return null;
  }

  // 获取护照和居留卡信息
  getPassportInfo() {
    return {
      required: true,
      residenceCard: true,
      tips: [
        '准备护照原件和复印件',
        '居留卡必须在有效期内',
        '准备目的声明书',
        '护照至少有6个月有效期'
      ]
    };
  }

  // 获取交通信息
  getTransportInfo() {
    return {
      airportRail: this.guide.transport.airportRail,
      icCard: this.guide.transport.icCard,
      taxi: this.guide.transport.taxi,
      bus: this.guide.transport.bus
    };
  }

  // 获取货币和ATM信息
  getCurrencyInfo() {
    return {
      name: this.guide.currency.name,
      code: this.guide.currency.code,
      denominations: this.guide.currency.denominations,
      atm: this.guide.currency.atm
    };
  }

  // 获取海关信息
  getCustomsInfo() {
    return {
      declarationRequired: this.guide.customs.declarationRequired,
      prohibitedItems: this.guide.customs.prohibitedItems,
      dutyFree: this.guide.customs.dutyFree,
      declarationChannels: this.guide.customs.declarationChannels
    };
  }

  // 获取紧急联系方式
  getEmergencyContacts() {
    return this.guide.emergency;
  }

  // 获取重要提醒
  getImportantNotes() {
    return this.guide.importantNotes;
  }

  // 获取文化提示
  getCultureTips() {
    return this.guide.cultureTips;
  }

  // 检查入境准备时间是否合适
  checkEntryPreparationTime(arrivalDateTime) {
    const now = new Date();
    const arrival = new Date(arrivalDateTime);
    const hoursUntilArrival = (arrival - now) / (1000 * 60 * 60);

    return {
      canPrepare: hoursUntilArrival > 0,
      hoursUntilArrival: Math.round(hoursUntilArrival),
      preparationStatus: hoursUntilArrival > 24 ? 'good_time' : 'last_minute',
      message: this._getPreparationTimeMessage(hoursUntilArrival)
    };
  }

  // 获取准备时间提示信息
  _getPreparationTimeMessage(hoursUntilArrival) {
    if (hoursUntilArrival <= 0) {
      return '航班已抵达，请尽快完成入境流程';
    } else if (hoursUntilArrival <= 24) {
      return `还剩${Math.round(hoursUntilArrival)}小时，请抓紧时间准备入境材料`;
    } else {
      return `距离开机还有${Math.round(hoursUntilArrival)}小时，有充足时间准备`;
    }
  }

  // 计算预计总用时
  getEstimatedTotalTime() {
    const baseTime = this.guide.steps.reduce((total, step) => {
      const timeStr = step.estimatedTime;
      const minutes = this._parseTimeToMinutes(timeStr);
      return total + minutes;
    }, 0);

    return {
      minutes: baseTime,
      formatted: this._formatMinutesToTime(baseTime),
      breakdown: this.guide.steps.map(step => ({
        step: step.titleZh || step.title,
        time: step.estimatedTime
      }))
    };
  }

  // 解析时间字符串为分钟
  _parseTimeToMinutes(timeStr) {
    if (!timeStr) return 0;

    const match = timeStr.match(/(\d+)\s*(分钟|小时|min|hour)/);
    if (!match) return 0;

    const value = parseInt(match[1]);
    const unit = match[2];

    if (unit.includes('小时') || unit.includes('hour')) {
      return value * 60;
    }
    return value;
  }

  // 格式化分钟为时间字符串
  _formatMinutesToTime(minutes) {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
  }

  // 保存进度到本地存储
  async _saveProgress() {
    try {
      const progress = {
        currentStep: this.currentStep,
        completedSteps: Array.from(this.completedSteps),
        lastUpdated: new Date().toISOString()
      };
      // 在React Native中保存到AsyncStorage
      await AsyncStorage.setItem('japan_entry_progress', JSON.stringify(progress));
    } catch (error) {
      console.error('保存进度失败:', error);
    }
  }

  // 从本地存储加载进度
  async loadProgress() {
    try {
      // 在React Native中从AsyncStorage加载
      const progress = await AsyncStorage.getItem('japan_entry_progress');
      if (progress) {
        const data = JSON.parse(progress);
        this.currentStep = data.currentStep;
        this.completedSteps = new Set(data.completedSteps);
      }
    } catch (error) {
      console.error('加载进度失败:', error);
    }
  }

  // 重置进度
  resetProgress() {
    this.currentStep = null;
    this.completedSteps.clear();
    this._saveProgress();
  }

  // 获取步骤状态
  getStepStatus(stepId) {
    if (this.completedSteps.has(stepId)) {
      return 'completed';
    }
    if (this.currentStep === stepId) {
      return 'current';
    }
    return 'pending';
  }

  // 获取步骤图标
  getStepIcon(stepId) {
    const step = this.getStep(stepId);
    return step ? step.icon : '❓';
  }

  // 检查是否可以进入下一步
  canProceedToStep(stepId) {
    const stepIndex = this.guide.steps.findIndex(step => step.id === stepId);
    if (stepIndex === 0) return true; // 第一步总是可以进入

    // 检查前面的步骤是否都已完成
    for (let i = 0; i < stepIndex; i++) {
      if (!this.completedSteps.has(this.guide.steps[i].id)) {
        return false;
      }
    }
    return true;
  }

  // 获取推荐行动
  getRecommendedActions() {
    const actions = [];
    const progress = this.getProgress();

    if (progress.completed === 0) {
      actions.push({
        type: 'landing',
        title: '准备落地流程',
        description: '飞机落地后关闭蜂窝网络，激活eSIM',
        priority: 'high'
      });
    } else if (progress.completed < 2) {
      actions.push({
        type: 'immigration',
        title: '准备移民局检查',
        description: '准备护照、居留卡和通关包',
        priority: 'high',
        showEntryPack: true // 重点提示通关包
      });
    } else if (progress.completed >= 2 && progress.completed < 4) {
      actions.push({
        type: 'transport',
        title: '准备交通安排',
        description: '选择JR线或出租车前往目的地',
        priority: 'high'
      });
    } else if (progress.completed >= 4) {
      actions.push({
        type: 'arrival',
        title: '准备抵达目的地',
        description: '确认酒店位置和入住手续',
        priority: 'high'
      });
    }

    return actions;
  }

  // 获取通关包显示信息
  getEntryPackDisplayInfo() {
    return {
      title: '通关包 / Entry Pack',
      subtitle: '给移民官查看的重要信息 / Important information for immigration officer',
      tabs: [
        { key: 'overview', label: '总览', labelEn: 'Overview' },
        { key: 'personal', label: '个人信息', labelEn: 'Personal' },
        { key: 'travel', label: '旅行信息', labelEn: 'Travel' },
        { key: 'funds', label: '资金', labelEn: 'Funds' },
        { key: 'residence', label: '居留信息', labelEn: 'Residence' },
        { key: 'tips', label: '问答', labelEn: 'FAQs' }
      ],
      footerText: '请将此通关包展示给移民官查看 / Please show this entry pack to the immigration officer'
    };
  }

  // 检查步骤是否需要显示通关包
  shouldShowEntryPack(stepId) {
    const step = this.getStep(stepId);
    return step && step.showEntryPack === true;
  }

  // 获取通关包快速访问按钮配置
  getEntryPackQuickAccess() {
    return {
      icon: '📋',
      title: '通关包',
      titleEn: 'Entry Pack',
      description: '给移民官查看的重要信息',
      descriptionEn: 'Important info for immigration officer',
      availableInAllSteps: true,
      primaryStep: 'immigration'
    };
  }
}

export default JapanEntryGuideService;