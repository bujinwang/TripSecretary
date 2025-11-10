/**
 * EntryInfo Model - Progressive Entry Information Flow
 * Extends EntryData with completion tracking, status management, and progressive filling support
 */

import EntryData from './EntryData';
import SecureStorageService from '../services/security/SecureStorageService';
import entryCompletionCalculator from '../utils/EntryCompletionCalculator';

type CompletionState = 'missing' | 'partial' | 'complete';

interface CompletionMetric {
  complete: number;
  total: number;
  state: CompletionState;
  validFundCount?: number;
  fields?: Array<{ name: string; isValid: boolean; hasValue: boolean }>;
}

export interface CompletionMetrics {
  passport: CompletionMetric;
  personalInfo: CompletionMetric;
  funds: CompletionMetric;
  travel: CompletionMetric;
  [key: string]: CompletionMetric;
}

export type EntryInfoStatus = 'incomplete' | 'ready' | 'submitted' | 'superseded' | 'expired' | 'archived';

export interface EntryInfoInit {
  completionMetrics?: CompletionMetrics | string | null;
  completion_metrics?: CompletionMetrics | string | null;
  status?: EntryInfoStatus;
  createdAt?: string;
  created_at?: string;
  lastUpdatedAt?: string;
  last_updated_at?: string;
  documents?: unknown;
  displayStatus?: unknown;
  travelInfoId?: string | null;
  travel_info_id?: string | null;
  destinationId?: string | null;
  destination_id?: string | null;
  fundItemIds?: Iterable<string> | string | null;
  fund_item_ids?: Iterable<string> | string | null;
  [key: string]: unknown;
}

interface EntryInfoSaveOptions {
  skipValidation?: boolean;
}

interface EntryInfoSaveResult {
  id: string;
  saved: boolean;
  timestamp: string;
  completionPercent?: number;
  status?: EntryInfoStatus;
  isReady?: boolean;
}

interface EntryInfoSummary extends Record<string, unknown> {
  completionPercent: number;
  completionMetrics: CompletionMetrics;
  status: EntryInfoStatus;
  displayStatus: unknown;
  documents: unknown;
  travelInfoId: string | null;
  isReady: boolean;
  canBeEdited: boolean;
  requiresResubmission: boolean;
  missingFields: Record<string, string[]>;
  lastUpdatedAt: string;
  destinationId: string | null;
}

interface EntryInfoExportData extends Record<string, unknown> {
  progressiveEntryFlow: {
    completionMetrics: CompletionMetrics;
    status: EntryInfoStatus;
    lastUpdatedAt: string;
    destinationId: string | null;
    passportId?: string;
    personalInfoId?: string;
    travelInfoId: string | null;
    fundItemIds: string[];
    documents: unknown;
    displayStatus: unknown;
  };
}

interface EntryCompletionInput {
  passport: Record<string, unknown>;
  personalInfo: Record<string, unknown>;
  funds: unknown[];
  travel: Record<string, unknown>;
  lastUpdatedAt?: string;
}

interface EntryCompletionCalculator {
  calculateCompletionMetrics(entryInfo: EntryCompletionInput): CompletionMetrics;
  getMissingFields(metrics: CompletionMetrics): Record<string, string[]>;
}

type DigitalArrivalCardModule = {
  default: {
    getLatestSuccessful(entryInfoId: string, cardType: string): Promise<unknown>;
    getByEntryInfoId(entryInfoId: string): Promise<unknown[]>;
  };
};

export interface EntryDisplayStatus {
  color: string;
  message: string;
  icon: string;
}

const DEFAULT_COMPLETION_METRICS: CompletionMetrics = {
  passport: { complete: 0, total: 5, state: 'missing' },
  personalInfo: { complete: 0, total: 6, state: 'missing' },
  funds: { complete: 0, total: 1, state: 'missing' },
  travel: { complete: 0, total: 6, state: 'missing' }
};

const VALID_STATUSES: EntryInfoStatus[] = ['incomplete', 'ready', 'submitted', 'superseded', 'expired', 'archived'];

class EntryInfo extends EntryData {
  // Base class properties (from EntryData)
  id: string = '';
  userId: string = '';
  passportId?: string;
  personalInfoId?: string;
  fundingProof: Record<string, unknown> = {};
  immigrationNotes?: string;
  specialRequirements?: string;
  submissionDate?: string;
  generatedAt: string = new Date().toISOString();
  lastModified: string = new Date().toISOString();
  
  // Override base class status with more specific type
  status: EntryInfoStatus = 'incomplete';
  
  // EntryInfo specific properties
  travelInfoId: string | null = null;
  fundItemIds: string[] = [];
  completionMetrics: CompletionMetrics = { ...DEFAULT_COMPLETION_METRICS };
  createdAt: string = new Date().toISOString();
  lastUpdatedAt: string = new Date().toISOString();
  documents: unknown = null;
  displayStatus: unknown = null;
  destinationId: string | null = null;
  
  // Optional data references populated elsewhere in the lifecycle
  passport?: Record<string, unknown>;
  personalInfo?: Record<string, unknown>;
  funds?: unknown[];
  travel?: Record<string, unknown>;

  private static readonly completionCalculator: EntryCompletionCalculator =
    entryCompletionCalculator as EntryCompletionCalculator;

  constructor(data: EntryInfoInit = {}) {
    super(data);

    const resolvedIdCandidates = [
      typeof data.id === 'string' ? data.id.trim() : null,
      typeof (data as any).entryInfoId === 'string' ? (data as any).entryInfoId.trim() : null,
      typeof (data as any).entry_info_id === 'string' ? (data as any).entry_info_id.trim() : null,
      typeof (data as any).entryId === 'string' ? (data as any).entryId.trim() : null,
    ].filter((value) => value && value.length > 0) as string[];

    if (resolvedIdCandidates.length > 0) {
      this.id = resolvedIdCandidates[0];
    } else if (!this.id || this.id.trim().length === 0) {
      this.id = EntryData.generateId();
    }

    const resolvedUserIdCandidates = [
      typeof (data as any).userId === 'string' ? (data as any).userId.trim() : null,
      typeof (data as any).user_id === 'string' ? (data as any).user_id.trim() : null,
    ].filter((value) => value && value.length > 0) as string[];

    if (resolvedUserIdCandidates.length > 0) {
      this.userId = resolvedUserIdCandidates[0];
    }

    const parsedMetrics = EntryInfo.parseCompletionMetrics(
      data.completionMetrics ?? data.completion_metrics
    );

    this.completionMetrics = parsedMetrics ?? { ...DEFAULT_COMPLETION_METRICS };
    this.status = data.status ?? 'incomplete';
    this.createdAt = (data.createdAt ?? data.created_at ?? new Date().toISOString()) as string;
    this.lastUpdatedAt = (data.lastUpdatedAt ?? data.last_updated_at ?? new Date().toISOString()) as string;
    this.documents = data.documents ?? null;
    this.displayStatus = data.displayStatus ?? null;
    const travelId = data.travelInfoId ?? data.travel_info_id ?? null;
    this.travelInfoId = travelId ? String(travelId) : null;
    const destinationId = data.destinationId ?? data.destination_id ?? null;
    this.destinationId = destinationId ? String(destinationId) : null;
    this.fundItemIds = EntryInfo.normalizeFundItemIds(data.fundItemIds ?? data.fund_item_ids);
  }

  updateCompletionMetrics(
    passport: Record<string, unknown> = {},
    personalInfo: Record<string, unknown> = {},
    funds: unknown[] = [],
    travel: Record<string, unknown> = {}
  ): CompletionMetrics {
    const calculator = EntryInfo.completionCalculator;
    const entryInfoForCalculation: EntryCompletionInput = {
      passport,
      personalInfo,
      funds,
      travel,
      lastUpdatedAt: this.lastUpdatedAt ?? new Date().toISOString()
    };

    const calculatedMetrics = calculator.calculateCompletionMetrics(entryInfoForCalculation);

    this.completionMetrics = {
      passport: EntryInfo.cloneMetric(calculatedMetrics.passport),
      personalInfo: EntryInfo.cloneMetric(calculatedMetrics.personalInfo),
      funds: EntryInfo.cloneMetric(calculatedMetrics.funds),
      travel: EntryInfo.cloneMetric(calculatedMetrics.travel)
    };

    this.lastUpdatedAt = new Date().toISOString();

    return this.completionMetrics;
  }

  getTotalCompletionPercent(): number {
    const metrics = Object.values(this.completionMetrics);
    const totalComplete = metrics.reduce((sum, metric) => sum + metric.complete, 0);
    const totalRequired = metrics.reduce((sum, metric) => sum + metric.total, 0);
    return totalRequired > 0 ? Math.round((totalComplete / totalRequired) * 100) : 0;
  }

  isReadyForSubmission(): boolean {
    return Object.values(this.completionMetrics).every(metric => metric.state === 'complete');
  }

  getMissingFields(): Record<string, string[]> {
    const calculator = EntryInfo.completionCalculator;
    const metrics = calculator.calculateCompletionMetrics({
      passport: this.passport ?? {},
      personalInfo: this.personalInfo ?? {},
      funds: this.funds ?? [],
      travel: this.travel ?? {},
      lastUpdatedAt: this.lastUpdatedAt ?? new Date().toISOString()
    });
    return calculator.getMissingFields(metrics);
  }

  hasValidField(_category: string, _field: string): boolean {
    // Placeholder for future validation logic
    return false;
  }

  updateStatus(newStatus: EntryInfoStatus, reason: string | null = null): void {
    if (!VALID_STATUSES.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    const oldStatus = this.status;
    this.status = newStatus;
    this.lastUpdatedAt = new Date().toISOString();

    // Preserve existing console logging for audit trail until LoggingService integration
    console.log(`EntryInfo status changed: ${oldStatus} -> ${newStatus}`, {
      id: this.id,
      reason,
      timestamp: this.lastUpdatedAt
    });
  }

  markAsReady(): void {
    if (this.isReadyForSubmission()) {
      this.updateStatus('ready', 'All required fields completed');
    } else {
      throw new Error('Cannot mark as ready: missing required fields');
    }
  }

  markAsSubmitted(_submissionMetadata: Record<string, unknown> = {}): void {
    this.updateStatus('submitted', 'Submission successful');
  }

  markAsSuperseded(): void {
    if (this.status === 'submitted') {
      this.updateStatus('superseded', 'User edited data after submission');
    } else {
      throw new Error('Can only mark submitted entries as superseded');
    }
  }

  markAsExpired(): void {
    this.updateStatus('expired', 'Entry pack expired');
  }

  markAsArchived(reason: string = 'manual'): void {
    this.updateStatus('archived', reason);
  }

  canBeEdited(): boolean {
    return ['incomplete', 'ready', 'superseded'].includes(this.status);
  }

  requiresResubmission(): boolean {
    return this.status === 'superseded';
  }

  getDisplayStatus(): EntryDisplayStatus {
    const statusMap: Record<EntryInfoStatus, EntryDisplayStatus> = {
      incomplete: { color: 'orange', message: '进行中', icon: '⚠️' },
      ready: { color: 'green', message: '准备就绪', icon: '✅' },
      submitted: { color: 'blue', message: '已提交', icon: '📋' },
      superseded: { color: 'red', message: '需要重新提交', icon: '🔄' },
      expired: { color: 'gray', message: '已过期', icon: '⏰' },
      archived: { color: 'gray', message: '已归档', icon: '📁' }
    };

    return statusMap[this.status] ?? statusMap.incomplete;
  }

async save(options: EntryInfoSaveOptions = {}): Promise<EntryInfoSaveResult> {
  try {
    const saveOptions = { skipValidation: true, ...options };
    if (!saveOptions.skipValidation) {
      // TODO: Hook up validation pipeline when progressive validation is reinstated
    }

    // Validate that userId is provided
    if (!this.userId || this.userId.trim() === '') {
      throw new Error('EntryInfo cannot be saved: userId is required but not provided');
    }

    this.lastUpdatedAt = new Date().toISOString();

    const result = await SecureStorageService.saveEntryInfo({
      id: this.id,
      userId: this.userId,
      passportId: this.passportId,
      personalInfoId: this.personalInfoId,
      travelInfoId: this.travelInfoId,
      destinationId: this.destinationId,
      status: this.status,
      completionMetrics: JSON.stringify(this.completionMetrics),
      documents: this.documents,
      displayStatus: this.displayStatus,
      lastUpdatedAt: this.lastUpdatedAt,
      createdAt: this.createdAt ?? new Date().toISOString(),
      fundItemIds: this.fundItemIds.slice()
    });

    return {
      id: result.id,
      saved: true,
      timestamp: new Date().toISOString(),
      completionPercent: this.getTotalCompletionPercent(),
      status: this.status,
      isReady: this.isReadyForSubmission()
    };
  } catch (error) {
    console.error('Failed to save EntryInfo:', error);
    throw error;
  }
}

  static async load(id: string): Promise<EntryInfo | null> {
    try {
      const data = await SecureStorageService.getEntryInfo(id);
      if (!data) {
        return null;
      }

      const completionMetrics = EntryInfo.parseCompletionMetrics(
        data.completionMetrics ?? data.completion_metrics
      );

      return new EntryInfo({
        ...data,
        completionMetrics: completionMetrics ?? undefined,
        documents: data.documents,
        displayStatus: data.displayStatus,
        travelInfoId: data.travelInfoId ?? data.travel_info_id ?? null
      });
    } catch (error) {
      console.error('Failed to load EntryInfo:', error);
      throw error;
    }
  }

  static fromUserInput(inputData: Record<string, unknown>, userId: string, destinationId: string | null = null): EntryInfo {
    return new EntryInfo({
      userId,
      destinationId,
      travelInfoId: (inputData.travelInfoId as string | undefined) ?? null,
      ...inputData
    });
  }

getSummary(): EntryInfoSummary & { id: string; generatedAt: string; lastModified: string } {
  const baseSummary = super.getSummary() as Record<string, unknown>;

  return {
    ...baseSummary,
    id: this.id,
    generatedAt: this.generatedAt || this.createdAt,
    lastModified: this.lastUpdatedAt,
    completionPercent: this.getTotalCompletionPercent(),
    completionMetrics: this.completionMetrics,
    status: this.status,
    displayStatus: this.displayStatus,
    documents: this.documents,
    travelInfoId: this.travelInfoId,
    isReady: this.isReadyForSubmission(),
    canBeEdited: this.canBeEdited(),
    requiresResubmission: this.requiresResubmission(),
    missingFields: this.getMissingFields(),
    lastUpdatedAt: this.lastUpdatedAt,
    destinationId: this.destinationId
  };
}

  async getLatestDigitalArrivalCard(cardType: string): Promise<unknown> {
    try {
      const module = (await import('./DigitalArrivalCard')) as DigitalArrivalCardModule;
      return module.default.getLatestSuccessful(this.id, cardType);
    } catch (error) {
      console.error('Failed to get latest DigitalArrivalCard:', error);
      throw error;
    }
  }

  async getAllDigitalArrivalCards(): Promise<unknown[]> {
    try {
      const module = (await import('./DigitalArrivalCard')) as DigitalArrivalCardModule;
      const results = await module.default.getByEntryInfoId(this.id);
      return results ?? [];
    } catch (error) {
      console.error('Failed to get DigitalArrivalCards:', error);
      throw error;
    }
  }

  async getLatestDigitalArrivalCardByType(cardType: string): Promise<unknown> {
    try {
      const module = (await import('./DigitalArrivalCard')) as DigitalArrivalCardModule;
      return module.default.getLatestSuccessful(this.id, cardType);
    } catch (error) {
      console.error('Failed to get latest DigitalArrivalCard by type:', error);
      throw error;
    }
  }

async exportData(): Promise<EntryInfoExportData & { id: string; exportDate: string; entryData: any; travelInfo: any; passport: any; personalInfo: any; fundingProof: any; metadata: any }> {
try {
      const baseExport = (await super.exportData()) as Record<string, unknown>;

      return {
        id: this.id,
        exportDate: new Date().toISOString(),
        entryData: baseExport.entryData,
        travelInfo: baseExport.travelInfo,
        passport: baseExport.passport,
        personalInfo: baseExport.personalInfo,
        fundingProof: baseExport.fundingProof,
        metadata: baseExport.metadata,
        progressiveEntryFlow: {
          completionMetrics: this.completionMetrics,
          status: this.status,
          lastUpdatedAt: this.lastUpdatedAt,
          destinationId: this.destinationId,
          passportId: this.passportId,
          personalInfoId: this.personalInfoId,
          travelInfoId: this.travelInfoId,
          fundItemIds: this.fundItemIds.slice(),
          documents: this.documents,
          displayStatus: this.displayStatus
        }
      };
    } catch (error) {
      console.error('Failed to export EntryInfo data:', error);
      throw error;
    }
  }

  private static parseCompletionMetrics(value: unknown): CompletionMetrics | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
      } catch (error) {
        console.warn('Failed to parse completion metrics:', error);
        return null;
      }
    }

    if (typeof value === 'object') {
      return value as CompletionMetrics;
    }

    return null;
  }

  private static normalizeFundItemIds(source: EntryInfoInit['fundItemIds']): string[] {
    if (!source) {
      return [];
    }

    if (typeof source === 'string') {
      try {
        const parsed = JSON.parse(source);
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch (error) {
        console.warn('Failed to parse fundItemIds string:', error);
        return [];
      }
    }

    if (typeof (source as { values?: () => Iterable<string> }).values === 'function') {
      return Array.from(source as Iterable<string>, id => String(id));
    }

    return Array.from(source as Iterable<string>, id => String(id));
  }

  private static cloneMetric(metric: CompletionMetric): CompletionMetric {
    return {
      complete: metric.complete,
      total: metric.total,
      state: metric.state,
      validFundCount: metric.validFundCount,
      fields: metric.fields ? metric.fields.map(field => ({ ...field })) : undefined
    };
  }
}

export default EntryInfo;
