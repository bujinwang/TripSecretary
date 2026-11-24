// 新加坡入境指引服务 - 樟宜机场SIN完整流程管理
// 整合SGAC、资金证明、严格海关检查

import { singaporeEntryGuide } from '../../config/entryGuide/singapore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Type definitions (reusing common types)
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

interface FundingAdequacyCheck {
  isAdequate: boolean;
  requiredAmount: number;
  providedAmount: number;
  shortfall: number;
  message: string;
}

interface SGACSubmissionTimeCheck {
  canSubmit: boolean;
  daysUntilArrival: number;
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

export interface EntryRequirementsValidationResult {
  isPassportReady: boolean;
  hasPassportExpiryWarning: boolean;
  hasPassportIssues: boolean;
  hasCapturedPassportPhoto: boolean;
  hasTravelInfo: boolean;
  hasLodging: boolean;
  hasFunds: boolean;
  hasSGAC: boolean;
  hasSGACSubmissionWarning: boolean;
  hasRecentVisa: boolean;
  sgacWindowStatus: SGACSubmissionTimeCheck['windowStatus'];
  warnings: string[];
  nextActions: RecommendedAction[];
}

interface GuideConfig {
  steps: Step[];
  sgac?: {
    submissionWindow?: string | { before: string; after: string };
  } & Record<string, unknown>;
  fundingRequirements?: {
    minimumAmount?: {
      perPerson?: number;
      family?: number;
    };
  } & Record<string, unknown>;
  addressRequirements?: Record<string, unknown>;
  customs?: Record<string, unknown>;
  transport?: Record<string, unknown>;
  currency?: Record<string, unknown>;
  emergency?: Record<string, unknown>;
  cultureTips?: unknown;
  importantNotes?: string[];
  [key: string]: unknown;
}

interface ProgressData {
  currentStep: string | null;
  completedSteps: string[];
  lastUpdated: string;
}

class SingaporeEntryGuideService {
  private guide: GuideConfig;
  private currentStep: string | null;
  private completedSteps: Set<string>;
  private userPreferences: UserPreferences;

  constructor() {
    this.guide = singaporeEntryGuide;
    this.currentStep = null;
    this.completedSteps = new Set();
    this.userPreferences = {
      language: 'zh-CN',
      notifications: true,
      offlineMode: false
    };
    // 初始化时加载进度
    void this.loadProgress();
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
   * 获取SGAC信息
   * @returns SGAC information
   */
  getSGACInfo(): any {
    if (!this.guide.sgac) {
      return null;
    }
    return {
      systemName: this.guide.sgac.systemName,
      submissionWindow: this.guide.sgac.submissionWindow,
      requiredDocuments: this.guide.sgac.requiredDocuments,
      processingTime: this.guide.sgac.processingTime,
      validity: this.guide.sgac.validity,
      cost: this.guide.sgac.cost,
      languages: this.guide.sgac.languages
    };
  }

  /**
   * 获取资金证明要求
   * @returns Funding requirements
   */
  getFundingRequirements(): any {
    if (!this.guide.fundingRequirements) {
      return null;
    }
    return {
      minimumAmount: this.guide.fundingRequirements.minimumAmount,
      acceptedProofs: this.guide.fundingRequirements.acceptedProofs,
      validityPeriod: this.guide.fundingRequirements.validityPeriod,
      notes: this.guide.fundingRequirements.notes
    };
  }

  /**
   * 获取地址要求
   * @returns Address requirements
   */
  getAddressRequirements(): any {
    if (!this.guide.addressRequirements) {
      return null;
    }
    return {
      required: this.guide.addressRequirements.required,
      formats: this.guide.addressRequirements.formats,
      validation: this.guide.addressRequirements.validation
    };
  }

  /**
   * 获取海关信息
   * @returns Customs information
   */
  getCustomsInfo(): any {
    if (!this.guide.customs) {
      return null;
    }
    return {
      declarationRequired: this.guide.customs.declarationRequired,
      prohibitedItems: this.guide.customs.prohibitedItems,
      restrictedItems: this.guide.customs.restrictedItems,
      dutyFree: this.guide.customs.dutyFree
    };
  }

  /**
   * 获取交通信息
   * @returns Transport information
   */
  getTransportInfo(): any {
    if (!this.guide.transport) {
      return null;
    }
    return {
      options: this.guide.transport.options,
      recommendations: this.guide.transport.recommendations
    };
  }

  /**
   * 获取货币和ATM信息
   * @returns Currency and ATM information
   */
  getCurrencyInfo(): any {
    if (!this.guide.currency) {
      return null;
    }
    return {
      code: this.guide.currency.code,
      name: this.guide.currency.name,
      denominations: this.guide.currency.denominations,
      atm: this.guide.currency.atm
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
   * 获取文化提醒
   * @returns Culture tips
   */
  getCultureTips(): any {
    return this.guide.cultureTips;
  }

  /**
   * 获取重要提醒
   * @returns Important notes
   */
  getImportantNotes(): string[] | undefined {
    return this.guide.importantNotes;
  }

  /**
   * 检查资金证明是否充足
   * @param fundingAmount - Funding amount
   * @param groupSize - Group size (default: 1)
   * @returns Funding adequacy check result
   */
  checkFundingAdequacy(fundingAmount: number, groupSize: number = 1): FundingAdequacyCheck {
    if (!this.guide.fundingRequirements?.minimumAmount) {
      throw new Error('Funding requirements not configured');
    }
    const requirements = this.guide.fundingRequirements.minimumAmount;
    const requiredAmount = groupSize > 1 ? (requirements.family || 0) : (requirements.perPerson || 0);

    return {
      isAdequate: fundingAmount >= requiredAmount,
      requiredAmount,
      providedAmount: fundingAmount,
      shortfall: Math.max(0, requiredAmount - fundingAmount),
      message: this._getFundingMessage(fundingAmount, requiredAmount, groupSize)
    };
  }

  /**
   * 获取资金证明提示信息
   * @private
   */
  private _getFundingMessage(provided: number, required: number, groupSize: number): string {
    if (provided >= required) {
      return `资金证明充足：提供${provided}新元，满足${groupSize}人要求（${required}新元）`;
    } else {
      const shortfall = required - provided;
      return `资金证明不足：还需要${shortfall}新元，${groupSize}人最低要求${required}新元`;
    }
  }

  /**
   * 检查SGAC提交时间是否合适
   * @param arrivalDateTime - Arrival date/time
   * @returns SGAC submission time check result
   */
  checkSGACSubmissionTime(arrivalDateTime: Date | string): SGACSubmissionTimeCheck {
    const now = new Date();
    const arrival = new Date(arrivalDateTime);
    const hoursUntilArrival = (arrival.getTime() - now.getTime()) / (1000 * 60 * 60);
    const daysUntilArrival = hoursUntilArrival / 24;

    // SGAC可以在抵达前3天到抵达后15天提交
    const canSubmit = daysUntilArrival >= -15 && daysUntilArrival <= 3;

    return {
      canSubmit,
      daysUntilArrival: Math.round(daysUntilArrival),
      windowStatus: this._getWindowStatus(daysUntilArrival),
      message: this._getSubmissionTimeMessage(daysUntilArrival)
    };
  }

  /**
   * 获取提交时间窗口状态
   * @private
   */
  private _getWindowStatus(daysUntilArrival: number): 'within_window' | 'too_early' | 'too_late' {
    if (daysUntilArrival > 3) {
      return 'too_early';
    }
    if (daysUntilArrival >= -15) {
      return 'within_window';
    }
    return 'too_late';
  }

  /**
   * 获取提交时间提示信息
   * @private
   */
  private _getSubmissionTimeMessage(daysUntilArrival: number): string {
    if (daysUntilArrival > 3) {
      return `请在抵达前3天内提交SGAC，目前还需等待${Math.round(daysUntilArrival - 3)}天`;
    } else if (daysUntilArrival >= -15) {
      if (daysUntilArrival > 0) {
        return `可在${Math.round(daysUntilArrival)}天后提交SGAC`;
      } else {
        return `可以在抵达后${Math.round(Math.abs(daysUntilArrival))}天内提交SGAC`;
      }
    } else {
      return 'SGAC提交时间已过期，请尽快联系新加坡移民局';
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
      await AsyncStorage.setItem('singapore_entry_progress', JSON.stringify(progress));
    } catch (error) {
      console.error('保存进度失败:', error);
    }
  }

  /**
   * 从本地存储加载进度
   */
  async loadProgress(): Promise<void> {
    try {
      const progress = await AsyncStorage.getItem('singapore_entry_progress');
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
        type: 'sgac',
        title: '准备SGAC材料',
        description: '收集护照、资金证明等SGAC所需材料',
        priority: 'high'
      });
    } else if (progress.completed < 3) {
      actions.push({
        type: 'continue',
        title: '继续入境准备',
        description: '完成SGAC提交和通关包准备',
        priority: 'high'
      });
    } else if (progress.completed >= 3 && progress.completed < 6) {
      actions.push({
        type: 'funding',
        title: '确认资金证明',
        description: '确保资金证明符合新加坡要求',
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

  validateEntryRequirements(entryInfo: {
    passport?: Record<string, unknown> | null;
    travel?: {
      arrivalDate?: string | Date | null;
      accommodationAddress?: string | null;
      accommodationType?: string | null;
      accommodationPhone?: string | null;
      contactNumber?: string | null;
    } | null;
    funds?: Array<{ amount?: number | string; currency?: string; type?: string }> | null;
    sgac?: {
      submissionStatus?: string;
      submissionTime?: string;
      qrCodeUri?: string;
    } | null;
  } = {}): EntryRequirementsValidationResult {
    const now = new Date();
    const passport = entryInfo.passport ?? {};
    const expiryRaw = typeof passport === 'object' ? (passport as any)?.expiryDate || (passport as any)?.expiry || null : null;
    const expiryDate = expiryRaw ? new Date(expiryRaw) : null;
    const hasPassportExpiryWarning = Boolean(expiryDate && (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) < 180);
    const hasPassportIssues = !passport || !('passportNo' in passport) || !passport.passportNo;
    const hasCapturedPassportPhoto = Boolean((passport as any)?.photoUri || (passport as any)?.photo);

    const travel = entryInfo.travel ?? {};
    const arrivalDate = travel.arrivalDate ? new Date(travel.arrivalDate) : null;
    const hasTravelInfo = Boolean(arrivalDate && !Number.isNaN(arrivalDate.getTime()));
    const hasLodging = Boolean(travel.accommodationAddress || travel.accommodationType);

    const funds = Array.isArray(entryInfo.funds) ? entryInfo.funds : [];
    const totalFunds = funds.reduce<number>((sum, fund) => {
      const amount = typeof fund.amount === 'string' ? parseFloat(fund.amount) : fund.amount;
      return sum + (Number.isFinite(amount) ? (amount as number) : 0);
    }, 0);
    const fundingCheck = this.guide?.fundingRequirements?.minimumAmount
      ? this.checkFundingAdequacy(totalFunds, 1)
      : { isAdequate: totalFunds > 0, shortfall: 0 };
    const hasFunds = fundingCheck.isAdequate;

    const sgac = entryInfo.sgac ?? {};
    const hasSGAC = Boolean(sgac.submissionStatus === 'submitted' && sgac.qrCodeUri);
    const sgacWindow = hasTravelInfo && arrivalDate ? this.checkSGACSubmissionTime(arrivalDate) : {
      canSubmit: false,
      daysUntilArrival: 0,
      windowStatus: 'too_early' as const,
      message: '尚未提供抵达日期'
    };

    const warnings: string[] = [];
    if (hasPassportIssues) {
      warnings.push('passport_missing');
    }
    if (hasPassportExpiryWarning) {
      warnings.push('passport_expiring');
    }
    if (!hasTravelInfo) {
      warnings.push('travel_missing');
    }
    if (!hasLodging) {
      warnings.push('lodging_missing');
    }
    if (!hasFunds) {
      warnings.push('funds_insufficient');
    }
    if (!hasSGAC) {
      warnings.push('sgac_missing');
    }
    if (sgacWindow.windowStatus !== 'within_window') {
      warnings.push(`sgac_${sgacWindow.windowStatus}`);
    }

    const nextActions: RecommendedAction[] = [];
    if (hasPassportIssues) {
      nextActions.push({
        type: 'passport',
        title: '上传护照信息',
        description: '完善护照号码及基本信息以便生成入境资料。',
        priority: 'high'
      });
    }
    if (!hasTravelInfo) {
      nextActions.push({
        type: 'travel',
        title: '填写抵达航班信息',
        description: '提供抵达日期与航班号以安排入境流程。',
        priority: 'high'
      });
    }
    if (!hasLodging) {
      nextActions.push({
        type: 'lodging',
        title: '添加住宿信息',
        description: '新加坡要求提供落地住宿地址或联系电话。',
        priority: 'medium'
      });
    }
    if (!hasFunds) {
      nextActions.push({
        type: 'funds',
        title: '更新资金证明',
        description: `当前资金不足，缺口约 ${fundingCheck.shortfall} 新元。`,
        priority: 'medium'
      });
    }
    if (!hasSGAC || sgacWindow.windowStatus !== 'within_window') {
      nextActions.push({
        type: 'sgac',
        title: '提交电子入境卡（SGAC）',
        description: sgacWindow.message,
        priority: 'high',
        showEntryPack: true,
      });
    }

    return {
      isPassportReady: !hasPassportIssues,
      hasPassportExpiryWarning,
      hasPassportIssues,
      hasCapturedPassportPhoto,
      hasTravelInfo,
      hasLodging,
      hasFunds,
      hasSGAC,
      hasSGACSubmissionWarning: sgacWindow.windowStatus !== 'within_window',
      hasRecentVisa: Boolean((passport as any)?.visaNumber || (passport as any)?.lastVisaIssueDate),
      sgacWindowStatus: sgacWindow.windowStatus,
      warnings,
      nextActions,
    };
  }

  async setUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    this.userPreferences = {
      ...this.userPreferences,
      ...preferences,
    };
    await this._savePreferences();
    return this.userPreferences;
  }

  getUserPreferences(): UserPreferences {
    return this.userPreferences;
  }

  private async _savePreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem('sg_entry_preferences', JSON.stringify(this.userPreferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  async loadPreferences(): Promise<UserPreferences> {
    try {
      const data = await AsyncStorage.getItem('sg_entry_preferences');
      if (data) {
        this.userPreferences = {
          ...this.userPreferences,
          ...(JSON.parse(data) as Partial<UserPreferences>),
        };
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
    return this.userPreferences;
  }
}

export default new SingaporeEntryGuideService();

