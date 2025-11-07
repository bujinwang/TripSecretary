// 马来西亚入境指引服务 - 吉隆坡机场KUL/亚庇机场BKI完整流程管理
// 整合MDAC、地区差异（东马西马）、资金证明

import { malaysiaEntryGuide } from '../../config/entryGuide/malaysia.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Type definitions (reusing common types)
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

interface FundingAdequacyCheck {
  isAdequate: boolean;
  requiredAmount: number;
  providedAmount: number;
  shortfall: number;
  message: string;
}

interface MDACSubmissionTimeCheck {
  canSubmit: boolean;
  daysUntilArrival: number;
  windowStatus: 'within_window' | 'too_early' | 'too_late';
  message: string;
}

interface RegionalRequirements {
  region: 'east' | 'west';
  name: string;
  requirements: any;
  notes: any;
  additionalCheck: boolean;
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
  mdac?: any;
  fundingRequirements?: {
    minimumAmount?: { perPerson?: number; family?: number };
    [key: string]: any;
  };
  regionalDifferences?: {
    westMalaysia?: any;
    eastMalaysia?: any;
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

class MalaysiaEntryGuideService {
  private guide: GuideConfig;
  private currentStep: string | null;
  private completedSteps: Set<string>;
  private userPreferences: UserPreferences;

  constructor() {
    this.guide = malaysiaEntryGuide;
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

  getMDACInfo(): any { return this.guide.mdac || null; }
  getFundingRequirements(): any { return this.guide.fundingRequirements || null; }
  getRegionalDifferences(): any { return this.guide.regionalDifferences || null; }
  getCustomsInfo(): any { return this.guide.customs || null; }
  getTransportInfo(): any { return this.guide.transport || null; }
  getCurrencyInfo(): any { return this.guide.currency || null; }
  getEmergencyContacts(): any { return this.guide.emergency; }
  getCultureTips(): any { return this.guide.cultureTips; }
  getImportantNotes(): string[] | undefined { return this.guide.importantNotes; }

  checkRegionalRequirements(destinationAirport: string): RegionalRequirements {
    const eastAirports = ['BKI', 'KCH', 'LBU'];
    const isEast = eastAirports.includes(destinationAirport);
    const diff = this.guide.regionalDifferences;
    return {
      region: isEast ? 'east' : 'west',
      name: isEast ? '东马来西亚' : '西马来西亚',
      requirements: isEast ? diff?.eastMalaysia?.requirements : diff?.westMalaysia?.requirements,
      notes: isEast ? diff?.eastMalaysia?.notes : diff?.westMalaysia?.notes,
      additionalCheck: isEast
    };
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
      ? `资金证明充足：提供${provided}林吉特，满足${groupSize}人要求（${required}林吉特）`
      : `资金证明不足：还需要${required - provided}林吉特，${groupSize}人最低要求${required}林吉特`;
  }

  checkMDACSubmissionTime(arrivalDateTime: Date | string): MDACSubmissionTimeCheck {
    const now = new Date();
    const arrival = new Date(arrivalDateTime);
    const days = (arrival.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    const canSubmit = days <= 3 && days > 0;
    return {
      canSubmit,
      daysUntilArrival: Math.round(days),
      windowStatus: days <= 3 ? 'within_window' : 'too_early',
      message: this._getSubmissionTimeMessage(days)
    };
  }

  private _getSubmissionTimeMessage(days: number): string {
    if (days <= 0) return '航班已抵达，请尽快完成入境流程';
    if (days <= 3) return `可在${Math.round(days)}天后提交MDAC`;
    return `请在抵达前3天内提交MDAC，目前还需等待${Math.round(days - 3)}天`;
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
      await AsyncStorage.setItem('malaysia_entry_progress', JSON.stringify({
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
      const p = await AsyncStorage.getItem('malaysia_entry_progress');
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
      actions.push({ type: 'mdac', title: '准备MDAC材料', description: '收集护照、资金证明等MDAC所需材料', priority: 'high' });
    } else if (p.completed < 3) {
      actions.push({ type: 'continue', title: '继续入境准备', description: '完成MDAC提交和通关包准备', priority: 'high' });
    } else if (p.completed >= 3 && p.completed < 6) {
      actions.push({ type: 'funding', title: '确认资金证明', description: '确保资金证明符合马来西亚要求', priority: 'high' });
    } else if (p.completed >= 6) {
      actions.push({ type: 'transport', title: '准备交通安排', description: '选择合适的交通方式前往市区', priority: 'high' });
    }
    return actions;
  }
}

export default MalaysiaEntryGuideService;

