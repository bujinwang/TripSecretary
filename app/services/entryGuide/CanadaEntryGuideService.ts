// 加拿大入境指引服务 - 多伦多机场YYZ/温哥华机场YVR完整流程管理
// 整合eTA电子旅行许可、旅行计划验证、资金证明

import { canadaEntryGuide } from '../../config/entryGuide/canada.js';
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

interface ETAApplicationTimeCheck {
  canApply: boolean;
  daysUntilArrival: number;
  windowStatus: 'within_window' | 'too_early' | 'too_late';
  message: string;
}

interface ETAStatus {
  status: 'approved' | 'processing' | 'delayed';
  message: string;
  approvedDate?: string;
  hoursSinceApplication?: number;
}

interface VisaExemptQualification {
  isQualified: boolean;
  nationality: string;
  exemptCountries: string[];
  message: string;
  nextSteps: string[];
}

interface FundingAdequacyCheck {
  isAdequate: boolean;
  requiredAmount: number;
  providedAmount: number;
  shortfall: number;
  message: string;
}

interface TravelPlanValidation {
  isValid: boolean;
  missingDocuments: string[];
  validationIssues: string[];
  recommendations: string[];
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
  eta?: any;
  visaExemptCountries?: string[];
  travelPlanRequirements?: {
    required?: boolean;
    documents?: string[];
    validation?: string[];
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

class CanadaEntryGuideService {
  private guide: GuideConfig;
  private currentStep: string | null;
  private completedSteps: Set<string>;
  private userPreferences: UserPreferences;

  constructor() {
    this.guide = canadaEntryGuide;
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

  getETAInfo(): any { return this.guide.eta || null; }

  getVisaExemptInfo(): any {
    return {
      countries: this.guide.visaExemptCountries || [],
      benefits: [
        '免签证入境加拿大',
        '停留期最长6个月',
        '可进行商务、旅游或探亲',
        '无需提前申请签证'
      ],
      requirements: [
        '持有有效护照',
        '有返程或继续行程机票',
        '符合入境目的',
        '有足够资金维持停留期间'
      ]
    };
  }

  checkVisaExemptQualification(nationality: string): VisaExemptQualification {
    const isExempt = (this.guide.visaExemptCountries || []).includes(nationality);
    return {
      isQualified: isExempt,
      nationality,
      exemptCountries: this.guide.visaExemptCountries || [],
      message: isExempt
        ? `${nationality}属于免签证计划国家，可以免签证入境加拿大`
        : `${nationality}不属于免签证计划国家，需要申请签证`,
      nextSteps: isExempt
        ? ['申请eTA电子旅行许可', '准备旅行计划文件', '确认资金证明']
        : ['申请加拿大签证', '准备签证材料', '预约面谈']
    };
  }

  getTravelPlanRequirements(): any { return this.guide.travelPlanRequirements || null; }
  getFundingRequirements(): any { return this.guide.fundingRequirements || null; }
  getCustomsInfo(): any { return this.guide.customs || null; }
  getTransportInfo(): any { return this.guide.transport || null; }
  getCurrencyInfo(): any { return this.guide.currency || null; }
  getEmergencyContacts(): any { return this.guide.emergency; }
  getCultureTips(): any { return this.guide.cultureTips; }
  getImportantNotes(): string[] | undefined { return this.guide.importantNotes; }

  checkETAApplicationTime(arrivalDateTime: Date | string): ETAApplicationTimeCheck {
    const now = new Date();
    const arrival = new Date(arrivalDateTime);
    const days = (arrival.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    const canApply = days <= 3 && days > 0;
    return {
      canApply,
      daysUntilArrival: Math.round(days),
      windowStatus: days <= 3 ? 'within_window' : 'too_early',
      message: this._getApplicationTimeMessage(days)
    };
  }

  private _getApplicationTimeMessage(days: number): string {
    if (days <= 0) return '航班已抵达，请尽快完成入境流程';
    if (days <= 3) return `可在${Math.round(days)}天后申请eTA`;
    return `请在抵达前72小时内申请eTA，目前还需等待${Math.round(days - 3)}天`;
  }

  checkETAStatus(applicationDate: Date | string, approvalDate?: Date | string | null): ETAStatus {
    const now = new Date();
    const applied = new Date(applicationDate);
    const approved = approvalDate ? new Date(approvalDate) : null;
    const hours = (now.getTime() - applied.getTime()) / (1000 * 60 * 60);

    if (approved) {
      return { status: 'approved', message: 'eTA已批准，可以入境加拿大', approvedDate: approved.toISOString() };
    } else if (hours < 72) {
      return { status: 'processing', message: 'eTA正在处理中，通常几分钟到72小时内完成', hoursSinceApplication: Math.round(hours) };
    } else {
      return { status: 'delayed', message: 'eTA处理时间超出预期，请联系加拿大移民局', hoursSinceApplication: Math.round(hours) };
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
      ? `资金证明充足：提供${provided}加元，满足${groupSize}人要求（${required}加元）`
      : `资金证明不足：还需要${required - provided}加元，${groupSize}人最低要求${required}加元`;
  }

  validateTravelPlan(travelPlan: Record<string, any>): TravelPlanValidation {
    const req = this.guide.travelPlanRequirements;
    if (!req) {
      return { isValid: true, missingDocuments: [], validationIssues: [], recommendations: [] };
    }

    const result: TravelPlanValidation = {
      isValid: true,
      missingDocuments: [],
      validationIssues: [],
      recommendations: []
    };

    // 检查必需文件
    if (req.documents) {
      req.documents.forEach((doc: string) => {
        if (!travelPlan[doc] || String(travelPlan[doc]).trim() === '') {
          result.isValid = false;
          result.missingDocuments.push(doc);
        }
      });
    }

    // 验证具体要求
    if (req.validation) {
      req.validation.forEach((validation: string) => {
        switch (validation) {
          case '地址必须具体':
            if (!travelPlan.address || String(travelPlan.address).length < 10) {
              result.validationIssues.push('住宿地址不够具体');
              result.isValid = false;
            }
            break;
          case '日期必须明确':
            if (!travelPlan.dates || !travelPlan.dates.start || !travelPlan.dates.end) {
              result.validationIssues.push('旅行日期不明确');
              result.isValid = false;
            }
            break;
          case '目的必须合理':
            if (!travelPlan.purpose || String(travelPlan.purpose).length < 5) {
              result.validationIssues.push('访问目的描述不够详细');
              result.isValid = false;
            }
            break;
          case '联系方式必须有效':
            if (!travelPlan.contact || !travelPlan.contact.phone || !travelPlan.contact.email) {
              result.validationIssues.push('联系方式不完整');
              result.isValid = false;
            }
            break;
        }
      });
    }

    // 生成建议
    if (result.missingDocuments.length > 0) {
      result.recommendations.push(`补充缺少的文件：${result.missingDocuments.join('、')}`);
    }
    if (result.validationIssues.length > 0) {
      result.recommendations.push('完善旅行计划细节以提高批准率');
    }

    return result;
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
      await AsyncStorage.setItem('canada_entry_progress', JSON.stringify({
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
      const p = await AsyncStorage.getItem('canada_entry_progress');
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
      actions.push({ type: 'eta', title: '准备eTA材料', description: '收集护照、旅行计划等eTA申请所需材料', priority: 'high' });
    } else if (p.completed < 3) {
      actions.push({ type: 'travel_plan', title: '完善旅行计划', description: '准备详细的旅行计划和住宿证明', priority: 'high' });
    } else if (p.completed >= 3 && p.completed < 6) {
      actions.push({ type: 'funding', title: '确认资金证明', description: '确保资金证明符合加拿大要求', priority: 'high' });
    } else if (p.completed >= 6) {
      actions.push({ type: 'transport', title: '准备交通安排', description: '选择合适的交通方式前往市区', priority: 'high' });
    }
    return actions;
  }
}

export default CanadaEntryGuideService;

