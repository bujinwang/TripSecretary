/**
 * Progressive Entry Flow Type Definitions
 * TypeScript interfaces for progressive entry flow models and utilities
 *
 * Requirements: All
 */

// Core completion types
export interface CompletionMetric {
  complete: number;
  total: number;
  state: 'complete' | 'partial' | 'missing';
}

export interface CompletionMetrics {
  passport: CompletionMetric;
  personalInfo: CompletionMetric;
  funds: CompletionMetric;
  travel: CompletionMetric;
}

// Entry info and submission types
export interface EntryInfoRecord {
  id: string;
  userId: string;
  destinationId: string;
  tripId: string;
  completionMetrics: CompletionMetrics;
  status: 'incomplete' | 'ready' | 'submitted' | 'superseded' | 'expired' | 'archived' | 'left';
  lastUpdatedAt: string;
  tdacSubmission: TDACSubmission;
  createdAt: string;
}

export interface TDACSubmission {
  arrCardNo: string;
  qrUri: string;
  pdfPath: string;
  submittedAt: string;
  submissionMethod: 'api' | 'webview' | 'hybrid';
  status: 'success' | 'failed';
  error?: Record<string, unknown>;
}

export interface SubmissionHistoryItem {
  id: string;
  attemptNumber: number;
  submittedAt: string;
  submissionMethod: 'api' | 'webview' | 'hybrid';
  status: 'success' | 'failed';
  arrCardNo?: string;
  qrUri?: string;
  pdfPath?: string;
  error?: Record<string, unknown>;
}

// Document and status types
export interface EntryPackDocuments {
  qrCodeImage: string;
  pdfDocument: string;
  entryCardImage: string;
}

export interface CategoryStates {
  passport: 'complete' | 'partial' | 'missing';
  personalInfo: 'complete' | 'partial' | 'missing';
  funds: 'complete' | 'partial' | 'missing';
  travel: 'complete' | 'partial' | 'missing';
}

export interface DisplayStatus {
  completionPercent: number;
  categoryStates: CategoryStates;
  countdownMessage: string;
  ctaState: 'disabled' | 'enabled' | 'resubmit';
  showQR: boolean;
  showGuide: boolean;
  lastUpdated: string;
}

// Entry pack and snapshot types
export interface EntryPack {
  id: string;
  entryInfoId: string;
  userId: string;
  destinationId: string;
  tripId: string;
  tdacSubmission: TDACSubmission;
  submissionHistory: SubmissionHistoryItem[];
  documents: EntryPackDocuments;
  displayStatus: DisplayStatus;
  status: 'in_progress' | 'submitted' | 'superseded' | 'completed' | 'expired' | 'archived';
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface PhotoManifestItem {
  fundItemId: string;
  originalPath: string;
  snapshotPath: string;
  fileName: string;
  copiedAt: string;
}

export interface CompletenessIndicator {
  passport: boolean;
  personalInfo: boolean;
  funds: boolean;
  travel: boolean;
  overall: number;
}

export interface SnapshotMetadata {
  appVersion: string;
  deviceInfo: string;
  creationMethod: 'auto' | 'manual';
  snapshotReason: string;
}

export interface EntryPackSnapshot {
  snapshotId: string;
  entryInfoId: string;
  userId: string;
  destinationId: string;
  status: 'completed' | 'cancelled' | 'expired';
  createdAt: string;
  arrivalDate: string;
  version: number;
  metadata: SnapshotMetadata;
  passport: Record<string, unknown>;
  personalInfo: Record<string, unknown>;
  funds: Record<string, unknown>[];
  travel: Record<string, unknown>;
  tdacSubmission: TDACSubmission;
  completenessIndicator: CompletenessIndicator;
  photoManifest: PhotoManifestItem[];
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ValidationStatus {
  passport: ValidationResult;
  personalInfo: ValidationResult;
  funds: ValidationResult;
  travel: ValidationResult;
  overall: ValidationResult;
}

// Time and window types
export interface ArrivalWindow {
  state: 'no-date' | 'pre-window' | 'within-window' | 'urgent' | 'past-deadline';
  message: string;
  timeRemaining?: number;
  submissionOpensAt?: string;
  submissionClosesAt?: string;
  canSubmit: boolean;
  urgencyColor: 'green' | 'yellow' | 'red' | 'gray';
}

export interface CountdownFormat {
  display: string;
  days: number;
  hours: number;
  minutes: number;
  color: 'green' | 'yellow' | 'red' | 'gray';
  isUrgent: boolean;
}

// Configuration types
export interface FieldConfiguration {
  name: string;
  label: string;
  type: 'required' | 'optional';
  category: 'passport' | 'personalInfo' | 'funds' | 'travel';
  validator: (value: unknown) => ValidationResult;
  helpText: string;
}

export interface CategoryConfiguration {
  name: string;
  label: string;
  icon: string;
  fields: FieldConfiguration[];
  requiredCount: number;
  validator: (data: Record<string, unknown>) => ValidationResult;
}

export interface EntryFieldsConfig {
  passport: CategoryConfiguration;
  personalInfo: CategoryConfiguration;
  funds: CategoryConfiguration;
  travel: CategoryConfiguration;
}

// System types
export interface NotificationConfig {
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  scheduledFor?: string;
  enabled: boolean;
}

export interface StorageQuota {
  activeData: number;
  snapshots: number;
  total: number;
  limit: number;
  percentage: number;
  isLow: boolean;
}

export interface AuditEvent {
  timestamp: string;
  eventType: 'created' | 'viewed' | 'status_changed' | 'deleted' | 'exported';
  metadata: Record<string, unknown>;
  userId: string;
  snapshotId?: string;
  entryInfoId?: string;
}

export interface ExportOptions {
  format: 'json' | 'pdf' | 'zip';
  includePhotos: boolean;
  encrypt: boolean;
  password?: string;
  sections?: string[];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
  warnings: string[];
}

export interface BackupInfo {
  id: string;
  createdAt: string;
  size: number;
  entryPackCount: number;
  snapshotCount: number;
  format: string;
  encrypted: boolean;
}

// Export type definitions for use in other modules
export const ProgressiveEntryFlowTypes = {
  // Re-export all typedef names for runtime checking if needed
  CompletionMetric: 'CompletionMetric',
  CompletionMetrics: 'CompletionMetrics',
  EntryInfoRecord: 'EntryInfoRecord',
  TDACSubmission: 'TDACSubmission',
  SubmissionHistoryItem: 'SubmissionHistoryItem',
  EntryPackDocuments: 'EntryPackDocuments',
  CategoryStates: 'CategoryStates',
  DisplayStatus: 'DisplayStatus',
  EntryPack: 'EntryPack',
  PhotoManifestItem: 'PhotoManifestItem',
  CompletenessIndicator: 'CompletenessIndicator',
  SnapshotMetadata: 'SnapshotMetadata',
  EntryPackSnapshot: 'EntryPackSnapshot',
  ValidationResult: 'ValidationResult',
  ValidationStatus: 'ValidationStatus',
  ArrivalWindow: 'ArrivalWindow',
  CountdownFormat: 'CountdownFormat',
  FieldConfiguration: 'FieldConfiguration',
  CategoryConfiguration: 'CategoryConfiguration',
  EntryFieldsConfig: 'EntryFieldsConfig',
  NotificationConfig: 'NotificationConfig',
  StorageQuota: 'StorageQuota',
  AuditEvent: 'AuditEvent',
  ExportOptions: 'ExportOptions',
  ImportResult: 'ImportResult',
  BackupInfo: 'BackupInfo'
};

/**
 * Type validation helpers
 */
export const TypeValidators = {
  /**
   * Validate completion metric structure
   * @param {*} obj - Object to validate
   * @returns {boolean} - Is valid CompletionMetric
   */
  isCompletionMetric(obj) {
    return obj && 
           typeof obj.complete === 'number' &&
           typeof obj.total === 'number' &&
           ['complete', 'partial', 'missing'].includes(obj.state);
  },

  /**
   * Validate completion metrics structure
   * @param {*} obj - Object to validate
   * @returns {boolean} - Is valid CompletionMetrics
   */
  isCompletionMetrics(obj) {
    return obj &&
           this.isCompletionMetric(obj.passport) &&
           this.isCompletionMetric(obj.personalInfo) &&
           this.isCompletionMetric(obj.funds) &&
           this.isCompletionMetric(obj.travel);
  },

  /**
   * Validate TDAC submission structure
   * @param {*} obj - Object to validate
   * @returns {boolean} - Is valid TDACSubmission
   */
  isTDACSubmission(obj) {
    return obj &&
           typeof obj.arrCardNo === 'string' &&
           typeof obj.qrUri === 'string' &&
           typeof obj.submittedAt === 'string' &&
           ['api', 'webview', 'hybrid'].includes(obj.submissionMethod);
  },

  /**
   * Validate entry pack structure
   * @param {*} obj - Object to validate
   * @returns {boolean} - Is valid EntryPack
   */
  isEntryPack(obj) {
    return obj &&
           typeof obj.id === 'string' &&
           typeof obj.entryInfoId === 'string' &&
           typeof obj.userId === 'string' &&
           ['in_progress', 'submitted', 'superseded', 'completed', 'expired', 'archived'].includes(obj.status) &&
           Array.isArray(obj.submissionHistory);
  },

  /**
   * Validate snapshot structure
   * @param {*} obj - Object to validate
   * @returns {boolean} - Is valid EntryPackSnapshot
   */
  isEntryPackSnapshot(obj) {
    return obj &&
           typeof obj.snapshotId === 'string' &&
           typeof obj.entryInfoId === 'string' &&
           typeof obj.userId === 'string' &&
           ['completed', 'cancelled', 'expired'].includes(obj.status) &&
           typeof obj.createdAt === 'string' &&
           Array.isArray(obj.photoManifest);
  },

  /**
   * Validate arrival window structure
   * @param {*} obj - Object to validate
   * @returns {boolean} - Is valid ArrivalWindow
   */
  isArrivalWindow(obj) {
    return obj &&
           ['no-date', 'pre-window', 'within-window', 'urgent', 'past-deadline'].includes(obj.state) &&
           typeof obj.message === 'string' &&
           typeof obj.canSubmit === 'boolean';
  }
};

export default ProgressiveEntryFlowTypes;