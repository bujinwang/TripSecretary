// 泰国入境指引服务 - 廊曼机场DMK完整流程管理
// 整合TDAC、通关包、ATM取款和官方出租车指引

import { thailandEntryGuide } from '../../config/entryGuide/thailand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Type definitions
interface Step {
  id: string;
  title: string;
  titleZh?: string;
  description?: string;
  descriptionZh?: string;
  category?: string;
  priority?: number;
  estimatedTime?: string;
  icon?: string;
  required?: boolean;
  tips?: string[];
  showEntryPack?: boolean;
  [key: string]: any;
}

interface Progress {
  completed: number;
  total: number;
  percentage: number;
  currentStep: string | null;
  completedSteps: string[];
}

interface UserPreferences {
  language: string;
  notifications: boolean;
  offlineMode: boolean;
}

interface TDACInfo {
  submissionWindow: string;
  required: boolean;
  qrCodeRequired: boolean;
  alternative: string;
  tips: string[];
}

interface TDACSubmissionTimeCheck {
  canSubmit: boolean;
  hoursUntilArrival: number;
  windowStatus: 'within_window' | 'too_early' | 'too_late';
  message: string;
}

interface EstimatedTime {
  minutes: number;
  formatted: string;
  breakdown: Array<{
    step: string;
    time: string;
  }>;
}

interface RecommendedAction {
  type: string;
  title: string;
  description: string;
  priority: string;
  showEntryPack?: boolean;
}

interface EntryPackDisplayInfo {
  title: string;
  subtitle: string;
  tabs: Array<{
    key: string;
    label: string;
    labelEn: string;
  }>;
  footerText: string;
}

interface EntryPackQuickAccess {
  icon: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  availableInAllSteps: boolean;
  primaryStep: string;
}

interface TravelerProfile {
  travelInfo?: {
    travelPurpose?: string;
    [key: string]: any;
  };
  passport?: any;
  personalInfo?: any;
}

interface QuestionOptions {
  language?: 'en' | 'th' | 'zh';
  includeOptional?: boolean;
}

interface QuestionAnswer {
  id: string;
  question: string;
  answer: string | null;
  category: string;
  required: boolean;
  tips: string[];
  suggestedAnswers: string[];
}

interface QuestionsCompleteness {
  total: number;
  answered: number;
  missing: number;
  percentage: number;
  isComplete: boolean;
  missingQuestions: QuestionAnswer[];
}

interface GuideConfig {
  steps: Step[];
  atm?: Record<string, unknown>;
  taxi?: Record<string, unknown>;
  languageHelp?: Record<string, unknown>;
  emergency?: Record<string, unknown>;
  importantNotes?: string[];
  immigrationQuestions?: {
    basic?: QuestionConfig[];
    holiday?: QuestionConfig[];
    business?: QuestionConfig[];
    health_finance?: QuestionConfig[];
    visa?: QuestionConfig[];
    [key: string]: QuestionConfig[] | undefined;
  };
  [key: string]: unknown;
}

interface QuestionConfig {
  id: string;
  questionEn?: string;
  questionTh?: string;
  questionZh?: string;
  category?: string;
  required?: boolean;
  tips?: string[];
  condition?: Record<string, any>;
  profileField?: string;
  answerMapping?: Record<string, Record<string, string>>;
  generateAnswer?: (travelInfo: any) => Record<string, string> | null;
  manualAnswer?: boolean;
  suggestedAnswers?: Array<Record<string, string>>;
  [key: string]: any;
}

interface ProgressData {
  currentStep: string | null;
  completedSteps: string[];
  lastUpdated: string;
}

class ThailandEntryGuideService {
  private guide: GuideConfig;
  private currentStep: string | null;
  private completedSteps: Set<string>;
  private userPreferences: UserPreferences;

  constructor() {
    this.guide = thailandEntryGuide;
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

  /**
   * 获取完整指南配置
   * @returns Guide configuration
   */
  getGuide(): GuideConfig {
    return this.guide;
  }

  /**
   * 获取特定步骤
   * @param stepId - Step ID
   * @returns Step configuration or undefined
   */
  getStep(stepId: string): Step | undefined {
    return this.guide.steps.find(step => step.id === stepId);
  }

  /**
   * 获取所有步骤
   * @returns All steps
   */
  getAllSteps(): Step[] {
    return this.guide.steps;
  }

  /**
   * 获取步骤进度
   * @returns Progress information
   */
  getProgress(): Progress {
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

  /**
   * 标记步骤完成
   * @param stepId - Step ID to mark as completed
   * @returns Updated progress
   */
  completeStep(stepId: string): Progress {
    this.completedSteps.add(stepId);
    this._saveProgress();
    return this.getProgress();
  }

  /**
   * 设置当前步骤
   * @param stepId - Step ID to set as current
   * @returns Step configuration or undefined
   */
  setCurrentStep(stepId: string): Step | undefined {
    this.currentStep = stepId;
    this._saveProgress();
    return this.getStep(stepId);
  }

  /**
   * 获取下一步
   * @returns Next step or null
   */
  getNextStep(): Step | null {
    if (!this.currentStep) {
      return this.guide.steps.length > 0 ? this.guide.steps[0] : null;
    }
    const currentIndex = this.guide.steps.findIndex(step => step.id === this.currentStep);
    if (currentIndex < this.guide.steps.length - 1) {
      return this.guide.steps[currentIndex + 1];
    }
    return null;
  }

  /**
   * 获取上一步
   * @returns Previous step or null
   */
  getPreviousStep(): Step | null {
    if (!this.currentStep) {
      return null;
    }
    const currentIndex = this.guide.steps.findIndex(step => step.id === this.currentStep);
    if (currentIndex > 0) {
      return this.guide.steps[currentIndex - 1];
    }
    return null;
  }

  /**
   * 获取TDAC相关信息
   * @returns TDAC information
   */
  getTDACInfo(): TDACInfo {
    return {
      submissionWindow: '72小时',
      required: true,
      qrCodeRequired: true,
      alternative: '纸质入境卡TM6',
      tips: [
        '准备护照、航班信息、泰国地址',
        '填写英文个人信息',
        '保存QR码到手机相册',
        'TDAC替代了纸质入境卡TM6'
      ]
    };
  }

  /**
   * 获取ATM取款信息
   * @returns ATM information or null
   */
  getATMInfo(): any {
    if (!this.guide.atm) {
      return null;
    }
    return {
      location: this.guide.atm.location,
      recommendedBanks: this.guide.atm.recommendedBanks,
      steps: this.guide.atm.withdrawalSteps,
      fees: this.guide.atm.fees,
      safetyTips: this.guide.atm.safetyTips,
      currency: this.guide.atm.currency
    };
  }

  /**
   * 获取出租车信息
   * @returns Taxi information or null
   */
  getTaxiInfo(): any {
    if (!this.guide.taxi) {
      return null;
    }
    return {
      officialCounter: this.guide.taxi.officialCounter,
      cost: this.guide.taxi.cost,
      payment: this.guide.taxi.payment,
      safety: this.guide.taxi.safety,
      languageHelp: this.guide.languageHelp
    };
  }

  /**
   * 获取紧急联系方式
   * @returns Emergency contacts
   */
  getEmergencyContacts(): any {
    return this.guide.emergency;
  }

  /**
   * 获取重要提醒
   * @returns Important notes
   */
  getImportantNotes(): string[] | undefined {
    return this.guide.importantNotes;
  }

  /**
   * 检查TDAC提交时间是否合适
   * @param arrivalDateTime - Arrival date/time
   * @returns TDAC submission time check result
   */
  checkTDACSubmissionTime(arrivalDateTime: Date | string): TDACSubmissionTimeCheck {
    const now = new Date();
    const arrival = new Date(arrivalDateTime);
    const hoursUntilArrival = (arrival.getTime() - now.getTime()) / (1000 * 60 * 60);

    return {
      canSubmit: hoursUntilArrival <= 72 && hoursUntilArrival > 0,
      hoursUntilArrival: Math.round(hoursUntilArrival),
      windowStatus: hoursUntilArrival <= 72 ? 'within_window' : 'too_early',
      message: this._getSubmissionTimeMessage(hoursUntilArrival)
    };
  }

  /**
   * 获取提交时间提示信息
   * @private
   */
  private _getSubmissionTimeMessage(hoursUntilArrival: number): string {
    if (hoursUntilArrival <= 0) {
      return '航班已抵达，请尽快完成入境流程';
    } else if (hoursUntilArrival <= 72) {
      return `可在${Math.round(hoursUntilArrival)}小时后提交TDAC`;
    } else {
      return `请在抵达前72小时内提交TDAC，目前还需等待${Math.round(hoursUntilArrival - 72)}小时`;
    }
  }

  /**
   * 计算预计总用时
   * @returns Estimated total time
   */
  getEstimatedTotalTime(): EstimatedTime {
    const baseTime = this.guide.steps.reduce((total, step) => {
      const timeStr = step.estimatedTime;
      const minutes = this._parseTimeToMinutes(timeStr);
      return total + minutes;
    }, 0);

    return {
      minutes: baseTime,
      formatted: this._formatMinutesToTime(baseTime),
      breakdown: this.guide.steps.map(step => ({
        step: step.titleZh || step.title || '',
        time: step.estimatedTime || ''
      }))
    };
  }

  /**
   * 解析时间字符串为分钟
   * @private
   */
  private _parseTimeToMinutes(timeStr: string | undefined): number {
    if (!timeStr) {
      return 0;
    }

    const match = timeStr.match(/(\d+)\s*(分钟|小时|min|hour)/);
    if (!match) {
      return 0;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    if (unit.includes('小时') || unit.includes('hour')) {
      return value * 60;
    }
    return value;
  }

  /**
   * 格式化分钟为时间字符串
   * @private
   */
  private _formatMinutesToTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
  }

  /**
   * 保存进度到本地存储
   * @private
   */
  private async _saveProgress(): Promise<void> {
    try {
      const progress: ProgressData = {
        currentStep: this.currentStep,
        completedSteps: Array.from(this.completedSteps),
        lastUpdated: new Date().toISOString()
      };
      // 在React Native中保存到AsyncStorage
      await AsyncStorage.setItem('thailand_entry_progress', JSON.stringify(progress));
    } catch (error) {
      console.error('保存进度失败:', error);
    }
  }

  /**
   * 从本地存储加载进度
   */
  async loadProgress(): Promise<void> {
    try {
      // 在React Native中从AsyncStorage加载
      const progress = await AsyncStorage.getItem('thailand_entry_progress');
      if (progress) {
        const data: ProgressData = JSON.parse(progress);
        this.currentStep = data.currentStep;
        this.completedSteps = new Set(data.completedSteps);
      }
    } catch (error) {
      console.error('加载进度失败:', error);
    }
  }

  /**
   * 重置进度
   */
  resetProgress(): void {
    this.currentStep = null;
    this.completedSteps.clear();
    this._saveProgress();
  }

  /**
   * 获取步骤状态
   * @param stepId - Step ID
   * @returns Step status
   */
  getStepStatus(stepId: string): 'completed' | 'current' | 'pending' {
    if (this.completedSteps.has(stepId)) {
      return 'completed';
    }
    if (this.currentStep === stepId) {
      return 'current';
    }
    return 'pending';
  }

  /**
   * 获取步骤图标
   * @param stepId - Step ID
   * @returns Step icon
   */
  getStepIcon(stepId: string): string {
    const step = this.getStep(stepId);
    return step?.icon || '❓';
  }

  /**
   * 检查是否可以进入下一步
   * @param stepId - Step ID
   * @returns Whether can proceed to step
   */
  canProceedToStep(stepId: string): boolean {
    const stepIndex = this.guide.steps.findIndex(step => step.id === stepId);
    if (stepIndex === 0) {
      return true; // 第一步总是可以进入
    }

    // 检查前面的步骤是否都已完成
    for (let i = 0; i < stepIndex; i++) {
      if (!this.completedSteps.has(this.guide.steps[i].id)) {
        return false;
      }
    }
    return true;
  }

  /**
   * 获取推荐行动
   * @returns Recommended actions
   */
  getRecommendedActions(): RecommendedAction[] {
    const actions: RecommendedAction[] = [];
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
        description: '准备护照、TDAC QR码和通关包',
        priority: 'high',
        showEntryPack: true // 重点提示通关包
      });
    } else if (progress.completed >= 2 && progress.completed < 4) {
      actions.push({
        type: 'atm',
        title: '准备ATM取款',
        description: '落地后在机场ATM取3,000-5,000泰铢',
        priority: 'high'
      });
    } else if (progress.completed >= 4) {
      actions.push({
        type: 'taxi',
        title: '准备打车',
        description: '使用入境通司机页面找官方出租车',
        priority: 'high'
      });
    }

    return actions;
  }

  /**
   * 获取通关包显示信息
   * @returns Entry pack display information
   */
  getEntryPackDisplayInfo(): EntryPackDisplayInfo {
    return {
      title: 'ชุดข้อมูลตรวจคนเข้าเมือง / Entry Pack',
      subtitle: 'ข้อมูลสำคัญสำหรับเจ้าหน้าที่ตรวจคนเข้าเมือง / Important information for immigration officer',
      tabs: [
        { key: 'overview', label: 'ภาพรวม', labelEn: 'Overview' },
        { key: 'personal', label: 'ข้อมูลส่วนตัว', labelEn: 'Personal' },
        { key: 'travel', label: 'ข้อมูลการเดินทาง', labelEn: 'Travel' },
        { key: 'funds', label: 'เงินทุน', labelEn: 'Funds' },
        { key: 'tdac', label: 'บัตร TDAC', labelEn: 'TDAC' },
        { key: 'tips', label: 'คำถาม-คำตอบ', labelEn: 'FAQs' }
      ],
      footerText: 'กรุณาแสดงชุดข้อมูลนี้ต่อเจ้าหน้าที่ตรวจคนเข้าเมือง / Please show this entry pack to the immigration officer'
    };
  }

  /**
   * 检查步骤是否需要显示通关包
   * @param stepId - Step ID
   * @returns Whether should show entry pack
   */
  shouldShowEntryPack(stepId: string): boolean {
    const step = this.getStep(stepId);
    return step?.showEntryPack === true;
  }

  /**
   * 获取通关包快速访问按钮配置
   * @returns Entry pack quick access configuration
   */
  getEntryPackQuickAccess(): EntryPackQuickAccess {
    return {
      icon: '📋',
      title: 'ชุดข้อมูลเข้าเมือง',
      titleEn: 'Entry Pack',
      description: 'ข้อมูลสำคัญสำหรับเจ้าหน้าที่ตรวจคนเข้าเมือง',
      descriptionEn: 'Important info for immigration officer',
      availableInAllSteps: true,
      primaryStep: 'immigration'
    };
  }

  // ===== 入境问题相关方法 =====

  /**
   * 获取所有入境问题配置
   * @returns Immigration questions configuration
   */
  getImmigrationQuestions(): any {
    return this.guide.immigrationQuestions;
  }

  /**
   * 根据旅客档案生成带答案的入境问题列表
   * @param travelerProfile - Traveler profile
   * @param options - Options
   * @returns Questions with answers
   */
  generateQuestionsWithAnswers(travelerProfile: TravelerProfile, options: QuestionOptions = {}): QuestionAnswer[] {
    const { language = 'zh', includeOptional = true } = options;
    const questions = this.guide.immigrationQuestions;
    const result: QuestionAnswer[] = [];

    if (!travelerProfile || !travelerProfile.travelInfo) {
      console.warn('Traveler profile is incomplete');
      return result;
    }

    const {travelInfo} = travelerProfile;

    // 处理基础问题
    if (questions?.basic) {
      questions.basic.forEach(q => {
        if (!includeOptional && !q.required) {
          return;
        }

        const questionAnswer = this._processQuestion(q, travelInfo, language);
        if (questionAnswer) {
          result.push(questionAnswer);
        }
      });
    }

    // 根据旅行目的添加特定问题
    if (travelInfo.travelPurpose === 'HOLIDAY' && questions?.holiday) {
      questions.holiday.forEach(q => {
        if (!includeOptional && !q.required) {
          return;
        }
        if (this._shouldIncludeQuestion(q, travelInfo)) {
          const questionAnswer = this._processQuestion(q, travelInfo, language);
          if (questionAnswer) {
            result.push(questionAnswer);
          }
        }
      });
    }

    if (['BUSINESS', 'MEETING'].includes(travelInfo.travelPurpose || '') && questions?.business) {
      questions.business.forEach(q => {
        if (!includeOptional && !q.required) {
          return;
        }
        if (this._shouldIncludeQuestion(q, travelInfo)) {
          const questionAnswer = this._processQuestion(q, travelInfo, language);
          if (questionAnswer) {
            result.push(questionAnswer);
          }
        }
      });
    }

    // 添加健康和资金问题
    if (questions?.health_finance) {
      questions.health_finance.forEach(q => {
        if (!includeOptional && !q.required) {
          return;
        }
        const questionAnswer = this._processQuestion(q, travelInfo, language);
        if (questionAnswer) {
          result.push(questionAnswer);
        }
      });
    }

    // 添加签证问题
    if (questions?.visa) {
      questions.visa.forEach(q => {
        const questionAnswer = this._processQuestion(q, travelInfo, language);
        if (questionAnswer) {
          result.push(questionAnswer);
        }
      });
    }

    return result;
  }

  /**
   * 处理单个问题，生成带答案的问题对象
   * @private
   */
  private _processQuestion(questionConfig: QuestionConfig, travelInfo: any, language: 'en' | 'th' | 'zh'): QuestionAnswer | null {
    const langSuffix = this._getLangSuffix(language);
    const question = questionConfig[`question${langSuffix}` as keyof QuestionConfig] as string || questionConfig.questionEn || '';

    let answer: string | null = null;
    const tips = questionConfig.tips || [];

    // 如果有答案生成函数，使用它
    if (questionConfig.generateAnswer && typeof questionConfig.generateAnswer === 'function') {
      const answerObj = questionConfig.generateAnswer(travelInfo);
      if (answerObj) {
        answer = answerObj[language] || answerObj.en || null;
      }
    }
    // 如果有答案映射，使用它
    else if (questionConfig.answerMapping && questionConfig.profileField) {
      const fieldValue = travelInfo[questionConfig.profileField];
      if (fieldValue && questionConfig.answerMapping[fieldValue]) {
        const answerObj = questionConfig.answerMapping[fieldValue];
        answer = answerObj[language] || answerObj.en || null;
      }
    }
    // 如果是需要手动回答的问题，提供建议答案
    else if (questionConfig.manualAnswer && questionConfig.suggestedAnswers) {
      const suggestedAnswers = questionConfig.suggestedAnswers.map(sa =>
        sa[language] || sa.en || ''
      );
      answer = suggestedAnswers.length > 0 ? suggestedAnswers[0] : null;
    }
    // 如果有单个profileField，直接读取
    else if (questionConfig.profileField) {
      answer = travelInfo[questionConfig.profileField] || null;
    }

    // 如果没有答案，跳过这个问题
    if (!answer) {
      return null;
    }

    return {
      id: questionConfig.id,
      question,
      answer,
      category: questionConfig.category || '',
      required: questionConfig.required || false,
      tips,
      suggestedAnswers: questionConfig.suggestedAnswers ?
        questionConfig.suggestedAnswers.map(sa => sa[language] || sa.en || '') :
        []
    };
  }

  /**
   * 判断是否应包含某个问题
   * @private
   */
  private _shouldIncludeQuestion(questionConfig: QuestionConfig, travelInfo: any): boolean {
    if (!questionConfig.condition) {
      return true;
    }

    for (const [field, value] of Object.entries(questionConfig.condition)) {
      if (Array.isArray(value)) {
        if (!value.includes(travelInfo[field])) {
          return false;
        }
      } else {
        if (travelInfo[field] !== value) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * 获取语言后缀
   * @private
   */
  private _getLangSuffix(language: 'en' | 'th' | 'zh'): string {
    const langMap: Record<string, string> = {
      'en': 'En',
      'th': 'Th',
      'zh': 'Zh'
    };
    return langMap[language] || 'En';
  }

  /**
   * 按类别获取问题
   * @param travelerProfile - Traveler profile
   * @param category - Category
   * @param options - Options
   * @returns Questions by category
   */
  getQuestionsByCategory(travelerProfile: TravelerProfile, category: string, options: QuestionOptions = {}): QuestionAnswer[] {
    const allQuestions = this.generateQuestionsWithAnswers(travelerProfile, options);
    return allQuestions.filter(q => q.category === category);
  }

  /**
   * 获取必填问题
   * @param travelerProfile - Traveler profile
   * @param options - Options
   * @returns Required questions
   */
  getRequiredQuestions(travelerProfile: TravelerProfile, options: QuestionOptions = {}): QuestionAnswer[] {
    const allQuestions = this.generateQuestionsWithAnswers(travelerProfile, options);
    return allQuestions.filter(q => q.required);
  }

  /**
   * 检查问题答案完整性
   * @param travelerProfile - Traveler profile
   * @returns Completeness check result
   */
  checkQuestionsCompleteness(travelerProfile: TravelerProfile): QuestionsCompleteness {
    const requiredQuestions = this.getRequiredQuestions(travelerProfile);
    const answeredQuestions = requiredQuestions.filter(q => q.answer && q.answer.trim() !== '');

    return {
      total: requiredQuestions.length,
      answered: answeredQuestions.length,
      missing: requiredQuestions.length - answeredQuestions.length,
      percentage: Math.round((answeredQuestions.length / requiredQuestions.length) * 100),
      isComplete: answeredQuestions.length === requiredQuestions.length,
      missingQuestions: requiredQuestions.filter(q => !q.answer || q.answer.trim() === '')
    };
  }
}

export default ThailandEntryGuideService;

