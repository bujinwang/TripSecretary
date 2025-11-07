// 美国入境指引服务 - 主要机场JFK/LAX/ORD/SFO完整流程管理
// 整合ESTA电子旅行许可、VWP资格验证、生物识别系统

import { usaEntryGuide } from '../../config/entryGuide/usa.js';
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

interface ESTAApplicationTimeCheck {
  canApply: boolean;
  daysUntilArrival: number;
  windowStatus: 'within_window' | 'too_early' | 'too_late';
  message: string;
}

interface ESTAStatus {
  status: 'approved' | 'processing' | 'delayed';
  message: string;
  approvedDate?: string;
  hoursSinceApplication?: number;
}

interface VWPQualification {
  isQualified: boolean;
  nationality: string;
  vwpCountries: string[];
  message: string;
  nextSteps: string[];
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
  esta?: any;
  vwpCountries?: string[];
  biometric?: any;
  entryCard?: any;
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

class USEntryGuideService {
  private guide: GuideConfig;
  private currentStep: string | null;
  private completedSteps: Set<string>;
  private userPreferences: UserPreferences;

  constructor() {
    this.guide = usaEntryGuide;
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

  getESTAInfo(): any { return this.guide.esta || null; }

  getVWPInfo(): any {
    return {
      countries: this.guide.vwpCountries || [],
      benefits: [
        '免签证入境美国',
        '停留期最长90天',
        '可进行商务或旅游活动',
        '无需提前申请签证'
      ],
      requirements: [
        '持有电子护照',
        '有返程或继续行程机票',
        '符合入境目的',
        '无犯罪记录'
      ]
    };
  }

  checkVWPQualification(nationality: string): VWPQualification {
    const isVWP = (this.guide.vwpCountries || []).includes(nationality);
    return {
      isQualified: isVWP,
      nationality,
      vwpCountries: this.guide.vwpCountries || [],
      message: isVWP
        ? `${nationality}属于VWP免签证计划国家，可以免签证入境美国`
        : `${nationality}不属于VWP免签证计划国家，需要申请B1/B2签证`,
      nextSteps: isVWP
        ? ['申请ESTA电子旅行许可', '准备生物识别信息', '确认旅行计划']
        : ['申请B1/B2签证', '准备签证材料', '预约面谈']
    };
  }

  getBiometricInfo(): any { return this.guide.biometric || null; }
  getEntryCardInfo(): any { return this.guide.entryCard || null; }
  getCustomsInfo(): any { return this.guide.customs || null; }
  getTransportInfo(): any { return this.guide.transport || null; }
  getCurrencyInfo(): any { return this.guide.currency || null; }
  getEmergencyContacts(): any { return this.guide.emergency; }
  getCultureTips(): any { return this.guide.cultureTips; }
  getImportantNotes(): string[] | undefined { return this.guide.importantNotes; }

  checkESTAApplicationTime(arrivalDateTime: Date | string): ESTAApplicationTimeCheck {
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
    if (days <= 3) return `可在${Math.round(days)}天后申请ESTA`;
    return `请在抵达前72小时内申请ESTA，目前还需等待${Math.round(days - 3)}天`;
  }

  checkESTAStatus(applicationDate: Date | string, approvalDate?: Date | string | null): ESTAStatus {
    const now = new Date();
    const applied = new Date(applicationDate);
    const approved = approvalDate ? new Date(approvalDate) : null;
    const hours = (now.getTime() - applied.getTime()) / (1000 * 60 * 60);

    if (approved) {
      return { status: 'approved', message: 'ESTA已批准，可以入境美国', approvedDate: approved.toISOString() };
    } else if (hours < 72) {
      return { status: 'processing', message: 'ESTA正在处理中，通常几秒到72小时内完成', hoursSinceApplication: Math.round(hours) };
    } else {
      return { status: 'delayed', message: 'ESTA处理时间超出预期，请联系美国移民局', hoursSinceApplication: Math.round(hours) };
    }
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
      await AsyncStorage.setItem('usa_entry_progress', JSON.stringify({
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
      const p = await AsyncStorage.getItem('usa_entry_progress');
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
      actions.push({ type: 'prepare', title: '准备入境材料', description: '确认签证/ESTA状态，准备护照等入境材料', priority: 'high' });
    } else if (p.completed < 2) {
      actions.push({ type: 'continue', title: '继续入境准备', description: '完成落地前准备和生物识别准备', priority: 'high' });
    } else if (p.completed >= 2 && p.completed < 5) {
      actions.push({ type: 'biometric', title: '确认生物识别', description: '确保生物识别数据已正确准备', priority: 'high' });
    } else if (p.completed >= 5) {
      actions.push({ type: 'transport', title: '准备交通安排', description: '选择合适的交通方式前往市区', priority: 'high' });
    }
    return actions;
  }
}

export default USEntryGuideService;

