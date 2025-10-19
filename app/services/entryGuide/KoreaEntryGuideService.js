// 韩国入境指引服务 - 仁川机场ICN/金浦机场GMP完整流程管理
// 整合K-ETA电子旅行许可、生物识别预注册

import { koreaEntryGuide } from '../../config/entryGuide/korea.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

class KoreaEntryGuideService {
  constructor() {
    this.guide = koreaEntryGuide;
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

  // 获取K-ETA信息
  getKETAInfo() {
    return {
      systemName: this.guide.keta.systemName,
      applicationWindow: this.guide.keta.applicationWindow,
      requiredDocuments: this.guide.keta.requiredDocuments,
      processingTime: this.guide.keta.processingTime,
      validity: this.guide.keta.validity,
      cost: this.guide.keta.cost,
      languages: this.guide.keta.languages
    };
  }

  // 获取生物识别信息
  getBiometricInfo() {
    return {
      required: this.guide.biometric.required,
      types: this.guide.biometric.types,
      preparation: this.guide.biometric.preparation,
      dataCollection: this.guide.biometric.dataCollection,
      commonIssues: this.guide.biometric.commonIssues
    };
  }

  // 获取入境卡信息
  getEntryCardInfo() {
    return {
      required: this.guide.entryCard.required,
      sections: this.guide.entryCard.sections,
      languages: this.guide.entryCard.languages,
      submission: this.guide.entryCard.submission,
      tips: this.guide.entryCard.tips
    };
  }

  // 获取海关信息
  getCustomsInfo() {
    return {
      declarationRequired: this.guide.customs.declarationRequired,
      prohibitedItems: this.guide.customs.prohibitedItems,
      restrictedItems: this.guide.customs.restrictedItems,
      dutyFree: this.guide.customs.dutyFree
    };
  }

  // 获取交通信息
  getTransportInfo() {
    return {
      options: this.guide.transport.options,
      recommendations: this.guide.transport.recommendations
    };
  }

  // 获取货币和ATM信息
  getCurrencyInfo() {
    return {
      code: this.guide.currency.code,
      name: this.guide.currency.name,
      denominations: this.guide.currency.denominations,
      atm: this.guide.currency.atm
    };
  }

  // 获取紧急联系方式
  getEmergencyContacts() {
    return this.guide.emergency;
  }

  // 获取文化提醒
  getCultureTips() {
    return this.guide.cultureTips;
  }

  // 获取重要提醒
  getImportantNotes() {
    return this.guide.importantNotes;
  }

  // 检查K-ETA申请时间是否合适
  checkKETAApplicationTime(arrivalDateTime) {
    const now = new Date();
    const arrival = new Date(arrivalDateTime);
    const hoursUntilArrival = (arrival - now) / (1000 * 60 * 60);
    const daysUntilArrival = hoursUntilArrival / 24;

    // K-ETA必须在抵达前72小时申请
    const canApply = daysUntilArrival <= 3 && daysUntilArrival > 0;

    return {
      canApply,
      daysUntilArrival: Math.round(daysUntilArrival),
      windowStatus: daysUntilArrival <= 3 ? 'within_window' : 'too_early',
      message: this._getApplicationTimeMessage(daysUntilArrival)
    };
  }

  // 获取申请时间提示信息
  _getApplicationTimeMessage(daysUntilArrival) {
    if (daysUntilArrival <= 0) {
      return '航班已抵达，请尽快完成入境流程';
    } else if (daysUntilArrival <= 3) {
      return `可在${Math.round(daysUntilArrival)}天后申请K-ETA`;
    } else {
      return `请在抵达前72小时内申请K-ETA，目前还需等待${Math.round(daysUntilArrival - 3)}天`;
    }
  }

  // 检查K-ETA状态
  checkKETAStatus(applicationDate, approvalDate) {
    const now = new Date();
    const applied = new Date(applicationDate);
    const approved = approvalDate ? new Date(approvalDate) : null;

    const hoursSinceApplication = (now - applied) / (1000 * 60 * 60);

    if (approved) {
      return {
        status: 'approved',
        message: 'K-ETA已批准，可以入境',
        approvedDate: approved.toISOString()
      };
    } else if (hoursSinceApplication < 24) {
      return {
        status: 'processing',
        message: 'K-ETA正在处理中，通常24小时内完成',
        hoursSinceApplication: Math.round(hoursSinceApplication)
      };
    } else {
      return {
        status: 'delayed',
        message: 'K-ETA处理时间超出预期，请联系韩国移民局',
        hoursSinceApplication: Math.round(hoursSinceApplication)
      };
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
      await AsyncStorage.setItem('korea_entry_progress', JSON.stringify(progress));
    } catch (error) {
      console.error('保存进度失败:', error);
    }
  }

  // 从本地存储加载进度
  async loadProgress() {
    try {
      // 在React Native中从AsyncStorage加载
      const progress = await AsyncStorage.getItem('korea_entry_progress');
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
        type: 'keta',
        title: '准备K-ETA材料',
        description: '收集护照、照片等K-ETA申请所需材料',
        priority: 'high'
      });
    } else if (progress.completed < 3) {
      actions.push({
        type: 'continue',
        title: '继续入境准备',
        description: '完成K-ETA申请和生物识别准备',
        priority: 'high'
      });
    } else if (progress.completed >= 3 && progress.completed < 6) {
      actions.push({
        type: 'biometric',
        title: '确认生物识别',
        description: '确保生物识别数据已正确注册',
        priority: 'high'
      });
    } else if (progress.completed >= 6) {
      actions.push({
        type: 'transport',
        title: '准备交通安排',
        description: '选择合适的交通方式前往市区',
        priority: 'high'
      });
    }

    return actions;
  }
}

export default KoreaEntryGuideService;