// 越南入境指引服务 - 内排机场HAN/新山一机场SGN/岘港机场DAD完整流程管理
// 整合电子签证、健康申报、资金证明

import { vietnamEntryGuide } from '../../config/entryGuide/vietnam.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Type definitions
interface Step {
  id: string;
  title: string;
  titleZh?: string;
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

interface VisaApplicationTimeCheck {
  canApply: boolean;
  daysUntilArrival: number;
  windowStatus: 'within_window' | 'too_late' | 'too_early';
  message: string;
}

interface VisaStatus {
  status: 'approved' | 'processing' | 'delayed';
  message: string;
  approvedDate?: string;
  hoursSinceApplication?: number;
}

interface FundingAdequacyCheck {
  isAdequate: boolean;
  requiredAmount: number;
  providedAmount: number;
  shortfall: number;
  message: string;
}

interface YellowFeverCheck {
  required: boolean;
  regions: string[];
  validity: string;
  message: string;
}

interface EstimatedTime {
  minutes: number;
  formatted: string;
  breakdown: Array<{ step: string; time: string }>;
}

interface RecommendedAction {
  type: string;
  title: string;
  description: string;
  priority: string;
}

interface GuideConfig {
  steps: Step[];
  visa?: any;
  health?: {
    yellowFever?: { regions?: string[]; validity?: string };
    covidRequirements?: any;
    healthDeclaration?: any;
  };
  fundingRequirements?: {
    minimumAmount?: { perPerson?: number; family?: number };
    [key: string]: any;
  };
  customs?: any;
  transport?: any;
  currency?: any;
  emergency?: any;
  cultureTips?: any;
  importantNotes?: string[];
  [key: string]: any;
}

interface ProgressData {
  currentStep: string | null;
  completedSteps: string[];
  lastUpdated: string;
}

class VietnamEntryGuideService {
  private guide: GuideConfig;
  private currentStep: string | null;
  private completedSteps: Set<string>;
  private userPreferences: UserPreferences;

  constructor() {
    this.guide = vietnamEntryGuide;
    this.currentStep = null;
    this.completedSteps = new Set();
    this.userPreferences = {
      language: 'zh-CN',
      notifications: true,
      offlineMode: false
    };
    this.loadProgress();
  }

  getGuide(): GuideConfig { return this.guide; }
  getStep(stepId: string): Step | undefined { return this.guide.steps.find(step => step.id === stepId); }
  getAllSteps(): Step[] { return this.guide.steps; }

  getProgress(): Progress {
    const total = this.guide.steps.length;
    const completed = this.completedSteps.size;
    return {
      completed, total,
      percentage: Math.round((completed / total) * 100),
      currentStep: this.currentStep,
      completedSteps: Array.from(this.completedSteps)
    };
  }

  completeStep(stepId: string): Progress {
    this.completedSteps.add(stepId);
    this._saveProgress();
    return this.getProgress();
  }

  setCurrentStep(stepId: string): Step | undefined {
    this.currentStep = stepId;
    this._saveProgress();
    return this.getStep(stepId);
  }

  getNextStep(): Step | null {
    if (!this.currentStep) return this.guide.steps.length > 0 ? this.guide.steps[0] : null;
    const idx = this.guide.steps.findIndex(s => s.id === this.currentStep);
    return idx < this.guide.steps.length - 1 ? this.guide.steps[idx + 1] : null;
  }

  getPreviousStep(): Step | null {
    if (!this.currentStep) return null;
    const idx = this.guide.steps.findIndex(s => s.id === this.currentStep);
    return idx > 0 ? this.guide.steps[idx - 1] : null;
  }

  getVisaInfo(): any { return this.guide.visa || null; }
  getHealthRequirements(): any { return this.guide.health || null; }
  getFundingRequirements(): any { return this.guide.fundingRequirements || null; }
  getCustomsInfo(): any { return this.guide.customs || null; }
  getTransportInfo(): any { return this.guide.transport || null; }
  getCurrencyInfo(): any { return this.guide.currency || null; }
  getEmergencyContacts(): any { return this.guide.emergency; }
  getCultureTips(): any { return this.guide.cultureTips; }
  getImportantNotes(): string[] | undefined { return this.guide.importantNotes; }

  checkVisaApplicationTime(arrivalDateTime: Date | string): VisaApplicationTimeCheck {
    const now = new Date();
    const arrival = new Date(arrivalDateTime);
    const days = (arrival.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    const canApply = days >= 3 && days > 0;
    return {
      canApply,
      daysUntilArrival: Math.round(days),
      windowStatus: days >= 3 ? 'within_window' : 'too_late',
      message: this._getApplicationTimeMessage(days)
    };
  }

  private _getApplicationTimeMessage(days: number): string {
    if (days <= 0) return '航班已抵达，请尽快完成入境流程';
    if (days < 3) return '电子签证需要在抵达前至少3个工作日申请，目前时间不够';
    return `可在${Math.round(days)}天后申请电子签证`;
  }

  checkVisaStatus(applicationDate: Date | string, approvalDate?: Date | string | null): VisaStatus {
    const now = new Date();
    const applied = new Date(applicationDate);
    const approved = approvalDate ? new Date(approvalDate) : null;
    const hours = (now.getTime() - applied.getTime()) / (1000 * 60 * 60);

    if (approved) {
      return { status: 'approved', message: '签证已批准，可以入境', approvedDate: approved.toISOString() };
    } else if (hours < 72) {
      return { status: 'processing', message: '签证正在处理中，通常3个工作日内完成', hoursSinceApplication: Math.round(hours) };
    } else {
      return { status: 'delayed', message: '签证处理时间超出预期，请联系越南移民局', hoursSinceApplication: Math.round(hours) };
    }
  }

  checkFundingAdequacy(fundingAmount: number, groupSize: number = 1): FundingAdequacyCheck {
    const req = this.guide.fundingRequirements?.minimumAmount;
    if (!req) throw new Error('Funding requirements not configured');
    const required = groupSize > 1 ? (req.family || 0) : (req.perPerson || 0);
    return {
      isAdequate: fundingAmount >= required,
      requiredAmount: required,
      providedAmount: fundingAmount,
      shortfall: Math.max(0, required - fundingAmount),
      message: this._getFundingMessage(fundingAmount, required, groupSize)
    };
  }

  private _getFundingMessage(provided: number, required: number, groupSize: number): string {
    return provided >= required
      ? `资金证明充足：提供${provided}美元，满足${groupSize}人要求（${required}美元）`
      : `资金证明不足：还需要${required - provided}美元，${groupSize}人最低要求${required}美元`;
  }

  checkYellowFeverRequirement(travelHistory: string[]): YellowFeverCheck {
    const regions = this.guide.health?.yellowFever?.regions || [];
    const hasVisited = travelHistory.some(r => regions.some(rr => r.toLowerCase().includes(rr.toLowerCase())));
    return {
      required: hasVisited,
      regions,
      validity: this.guide.health?.yellowFever?.validity || '',
      message: hasVisited ? '根据旅行史，需要黄热病疫苗接种证明' : '根据旅行史，无需黄热病疫苗接种证明'
    };
  }

  getEstimatedTotalTime(): EstimatedTime {
    const minutes = this.guide.steps.reduce((t, s) => t + this._parseTimeToMinutes(s.estimatedTime), 0);
    return {
      minutes,
      formatted: this._formatMinutesToTime(minutes),
      breakdown: this.guide.steps.map(s => ({ step: s.titleZh || s.title || '', time: s.estimatedTime || '' }))
    };
  }

  private _parseTimeToMinutes(timeStr: string | undefined): number {
    if (!timeStr) return 0;
    const m = timeStr.match(/(\d+)\s*(分钟|小时|min|hour)/);
    if (!m) return 0;
    const v = parseInt(m[1], 10);
    return (m[2].includes('小时') || m[2].includes('hour')) ? v * 60 : v;
  }

  private _formatMinutesToTime(minutes: number): string {
    if (minutes < 60) return `${minutes}分钟`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
  }

  private async _saveProgress(): Promise<void> {
    try {
      await AsyncStorage.setItem('vietnam_entry_progress', JSON.stringify({
        currentStep: this.currentStep,
        completedSteps: Array.from(this.completedSteps),
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      console.error('保存进度失败:', error);
    }
  }

  async loadProgress(): Promise<void> {
    try {
      const p = await AsyncStorage.getItem('vietnam_entry_progress');
      if (p) {
        const d: ProgressData = JSON.parse(p);
        this.currentStep = d.currentStep;
        this.completedSteps = new Set(d.completedSteps);
      }
    } catch (error) {
      console.error('加载进度失败:', error);
    }
  }

  resetProgress(): void {
    this.currentStep = null;
    this.completedSteps.clear();
    this._saveProgress();
  }

  getStepStatus(stepId: string): 'completed' | 'current' | 'pending' {
    if (this.completedSteps.has(stepId)) return 'completed';
    if (this.currentStep === stepId) return 'current';
    return 'pending';
  }

  getStepIcon(stepId: string): string {
    return this.getStep(stepId)?.icon || '❓';
  }

  canProceedToStep(stepId: string): boolean {
    const idx = this.guide.steps.findIndex(s => s.id === stepId);
    if (idx === 0) return true;
    for (let i = 0; i < idx; i++) {
      if (!this.completedSteps.has(this.guide.steps[i].id)) return false;
    }
    return true;
  }

  getRecommendedActions(): RecommendedAction[] {
    const p = this.getProgress();
    const actions: RecommendedAction[] = [];
    if (p.completed === 0) {
      actions.push({ type: 'visa', title: '准备签证材料', description: '收集护照、照片等签证申请所需材料', priority: 'high' });
    } else if (p.completed < 3) {
      actions.push({ type: 'health', title: '确认健康要求', description: '检查疫苗要求和健康申报', priority: 'high' });
    } else if (p.completed >= 3 && p.completed < 6) {
      actions.push({ type: 'funding', title: '确认资金证明', description: '确保资金证明符合越南要求', priority: 'high' });
    } else if (p.completed >= 6) {
      actions.push({ type: 'transport', title: '准备交通安排', description: '选择合适的交通方式前往市区', priority: 'high' });
    }
    return actions;
  }
}

export default VietnamEntryGuideService;

