/**
 * EntryPackSnapshot Model - Immutable historical record of entry packs
 */

import SecureStorageService from '../services/security/SecureStorageService';
import logger from '../services/LoggingService';

type SnapshotStatus = 'completed' | 'cancelled' | 'expired' | string;

interface CompletenessIndicator {
  passport: boolean;
  personalInfo: boolean;
  funds: boolean;
  travel: boolean;
  overall: number;
  [key: string]: boolean | number;
}

interface SnapshotMetadata {
  appVersion: string | null;
  deviceInfo: string | null;
  creationMethod: 'auto' | 'manual';
  snapshotReason: string | null;
  [key: string]: unknown;
}

interface PhotoManifestItem {
  fundItemId?: string | null;
  fundType?: string | null;
  originalPath: string | null;
  snapshotPath: string | null;
  fileName: string | null;
  copiedAt: string;
  fileSize?: number | null;
  status?: 'success' | 'missing' | 'failed' | 'no_photo';
  error?: string | null;
  encrypted?: boolean;
  encryptedPath?: string | null;
  encryptedSize?: number | null;
  encryptionMethod?: string | null;
  encryptionError?: string | null;
}

interface EncryptionInfo {
  encrypted: boolean;
  encryptionMethod: string | null;
  encryptedFilePath: string | null;
  photosEncrypted: boolean;
  encryptedPhotoCount: number;
  [key: string]: unknown;
}

interface EntryPackSnapshotInit {
  snapshotId?: string;
  entryInfoId?: string;
  entryPackId?: string;
  userId?: string;
  destinationId?: string | null;
  status?: SnapshotStatus;
  createdAt?: string;
  arrivalDate?: string | null;
  version?: number;
  metadata?: SnapshotMetadata;
  passport?: Record<string, unknown> | null;
  personalInfo?: Record<string, unknown> | null;
  funds?: unknown[] | null;
  travel?: Record<string, unknown> | null;
  tdacSubmission?: Record<string, unknown> | null;
  completenessIndicator?: CompletenessIndicator;
  photoManifest?: PhotoManifestItem[];
  encryptionInfo?: EncryptionInfo;
}

interface EntryPackData {
  id?: string;
  userId?: string;
  destinationId?: string | null;
  arrivalDate?: string | null;
  passport?: Record<string, unknown> | null;
  personalInfo?: Record<string, unknown> | null;
  funds?: Array<Record<string, any>> | null;
  travel?: Record<string, any> | null;
  tdacSubmission?: Record<string, any> | null;
  submissionHistory?: Array<Record<string, any>> | null;
  [key: string]: any;
}

interface SnapshotFilters {
  status?: SnapshotStatus;
  destinationId?: string | null;
  entryInfoId?: string;
  hasSubmission?: boolean;
  minAge?: number;
  maxAge?: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface SnapshotSaveResult {
  snapshotId: string;
}

interface SnapshotDeleteResult {
  success: boolean;
  error?: string;
}

class EntryPackSnapshot {
  snapshotId: string;
  entryInfoId?: string;
  userId?: string;
  destinationId?: string | null;
  status?: SnapshotStatus;
  createdAt: string;
  arrivalDate?: string | null;
  version: number;
  metadata: SnapshotMetadata;
  passport: Record<string, unknown> | null;
  personalInfo: Record<string, unknown> | null;
  funds: unknown[];
  travel: Record<string, unknown> | null;
  tdacSubmission: Record<string, unknown> | null;
  completenessIndicator: CompletenessIndicator;
  photoManifest: PhotoManifestItem[];
  encryptionInfo: EncryptionInfo;

  constructor(data: EntryPackSnapshotInit = {}) {
    this.snapshotId = data.snapshotId ?? this.generateSnapshotId();
    this.entryInfoId = data.entryInfoId ?? data.entryPackId;
    this.userId = data.userId;
    this.destinationId = data.destinationId ?? null;
    this.status = data.status;
    this.createdAt = data.createdAt ?? new Date().toISOString();
    this.arrivalDate = data.arrivalDate ?? null;
    this.version = data.version ?? 1;
    this.metadata = data.metadata ?? {
      appVersion: null,
      deviceInfo: null,
      creationMethod: 'auto',
      snapshotReason: null
    };

    this.passport = data.passport ? this.deepFreeze({ ...data.passport }) : null;
    this.personalInfo = data.personalInfo ? this.deepFreeze({ ...data.personalInfo }) : null;
    this.funds = data.funds ? this.deepFreeze([...data.funds]) : [];
    this.travel = data.travel ? this.deepFreeze({ ...data.travel }) : null;
    this.tdacSubmission = data.tdacSubmission ? this.deepFreeze({ ...data.tdacSubmission }) : null;
    this.completenessIndicator = data.completenessIndicator ?? {
      passport: false,
      personalInfo: false,
      funds: false,
      travel: false,
      overall: 0
    };
    this.photoManifest = data.photoManifest ? [...data.photoManifest] : [];
    this.encryptionInfo = data.encryptionInfo ?? {
      encrypted: false,
      encryptionMethod: null,
      encryptedFilePath: null,
      photosEncrypted: false,
      encryptedPhotoCount: 0
    };

    this.deepFreeze(this);
  }

  private generateSnapshotId(): string {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private deepFreeze<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    Object.freeze(obj);

    Object.getOwnPropertyNames(obj).forEach(prop => {
      const value = (obj as Record<string, unknown>)[prop];
      if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
        this.deepFreeze(value);
      }
    });

    return obj;
  }

  static createFromEntryPack(entryPackData: EntryPackData, reason: SnapshotStatus = 'auto', metadata: Partial<SnapshotMetadata> = {}): EntryPackSnapshot {
    const completenessIndicator: CompletenessIndicator = {
      passport: !!(entryPackData.passport && (entryPackData.passport as Record<string, unknown>).passportNumber),
      personalInfo: !!(entryPackData.personalInfo && (entryPackData.personalInfo as Record<string, unknown>).email),
      funds: !!(entryPackData.funds && entryPackData.funds.length > 0),
      travel: !!(entryPackData.travel && (entryPackData.travel as Record<string, unknown>).arrivalDate),
      overall: 0
    };

    const completedSections = Number(completenessIndicator.passport) +
      Number(completenessIndicator.personalInfo) +
      Number(completenessIndicator.funds) +
      Number(completenessIndicator.travel);
    completenessIndicator.overall = Math.round((completedSections / 4) * 100);

    const photoManifest: PhotoManifestItem[] = [];
    if (entryPackData.funds) {
      entryPackData.funds.forEach(fund => {
        if (fund.photoUri) {
          photoManifest.push({
            fundItemId: fund.id,
            originalPath: fund.photoUri,
            snapshotPath: null,
            fileName: `fund_${fund.id}_${Date.now()}.jpg`,
            copiedAt: new Date().toISOString()
          });
        }
      });
    }

    let tdacSubmission: Record<string, unknown> | null = null;
    if (entryPackData.submissionHistory && entryPackData.submissionHistory.length > 0) {
      const successfulSubmissions = entryPackData.submissionHistory.filter(s => s.status === 'success');
      if (successfulSubmissions.length > 0) {
        tdacSubmission = successfulSubmissions[successfulSubmissions.length - 1];
      }
    } else if (entryPackData.tdacSubmission && entryPackData.tdacSubmission.arrCardNo) {
      tdacSubmission = entryPackData.tdacSubmission;
    }

    const snapshot = new EntryPackSnapshot({
      entryInfoId: entryPackData.id,
      userId: entryPackData.userId,
      destinationId: entryPackData.destinationId ?? null,
      status: reason,
      arrivalDate: entryPackData.travel?.arrivalDate ?? entryPackData.arrivalDate ?? null,
      passport: entryPackData.passport ?? null,
      personalInfo: entryPackData.personalInfo ?? null,
      funds: entryPackData.funds ?? [],
      travel: entryPackData.travel ?? null,
      tdacSubmission,
      completenessIndicator,
      photoManifest,
      metadata: {
        appVersion: metadata.appVersion ?? '1.0.0',
        deviceInfo: metadata.deviceInfo ?? 'unknown',
        creationMethod: (metadata.creationMethod as 'auto' | 'manual') ?? 'auto',
        snapshotReason: metadata.snapshotReason ?? reason
      }
    });

    logger.info('EntryPackSnapshot', 'Snapshot created from entry info', {
      snapshotId: snapshot.snapshotId,
      entryInfoId: entryPackData.id,
      reason,
      completeness: completenessIndicator.overall,
      hasPhotos: photoManifest.length > 0,
      hasTDAC: !!tdacSubmission
    });

    return snapshot;
  }

  getCompletenessString(): string {
    const indicators = {
      passport: this.completenessIndicator.passport ? '✓' : '✗',
      personalInfo: this.completenessIndicator.personalInfo ? '✓' : '✗',
      funds: this.completenessIndicator.funds ? '✓' : '✗',
      travel: this.completenessIndicator.travel ? '✓' : '✗'
    };

    return `护照 ${indicators.passport}, 个人信息 ${indicators.personalInfo}, 资金 ${indicators.funds}, 旅行信息 ${indicators.travel}`;
  }

  isComplete(): boolean {
    return this.completenessIndicator.overall === 100;
  }

  hasTDACSubmission(): boolean {
    return !!(this.tdacSubmission && this.tdacSubmission.arrCardNo);
  }

  getDisplayStatus(): { color: string; message: string; icon: string } {
    const statusMap: Record<string, { color: string; message: string; icon: string }> = {
      completed: { color: 'green', message: '已完成', icon: '✅' },
      cancelled: { color: 'gray', message: '已取消', icon: '❌' },
      expired: { color: 'orange', message: '已过期', icon: '⏰' }
    };

    return statusMap[this.status ?? ''] || { color: 'gray', message: '未知', icon: '❓' };
  }

  getAgeInDays(): number {
    const now = new Date();
    const created = new Date(this.createdAt);
    const diffTime = Math.abs(Number(now) - Number(created));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isLegacy(): boolean {
    return !this.version || this.version < 1;
  }

  getPhotoCount(): number {
    return this.photoManifest.length;
  }

  getEstimatedSize(): number {
    const baseSize = JSON.stringify(this.exportData()).length;
    const photoEstimate = this.photoManifest.length * 500_000; // ~500KB per photo
    return baseSize + photoEstimate;
  }

  validate(): ValidationResult {
    const errors: string[] = [];

    if (!this.snapshotId) {
      errors.push('Snapshot ID is required');
    }
    if (!this.entryInfoId) {
      errors.push('Entry info ID is required');
    }
    if (!this.userId) {
      errors.push('User ID is required');
    }
    if (!this.status) {
      errors.push('Status is required');
    }

    const validStatuses: SnapshotStatus[] = ['completed', 'cancelled', 'expired'];
    if (this.status && !validStatuses.includes(this.status)) {
      errors.push(`Invalid status: ${this.status}`);
    }

    if (!this.createdAt) {
      errors.push('Creation date is required');
    }

    if (!this.passport && !this.personalInfo && (!this.funds || this.funds.length === 0) && !this.travel) {
      errors.push('Snapshot must contain at least some data');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async save(): Promise<SnapshotSaveResult> {
    try {
      const validation = this.validate();
      if (!validation.isValid) {
        throw new Error(`Snapshot validation failed: ${validation.errors.join(', ')}`);
      }

      const result = await SecureStorageService.saveSnapshot(this);

      logger.info('EntryPackSnapshot', 'Snapshot saved successfully', {
        snapshotId: this.snapshotId,
        entryInfoId: this.entryInfoId,
        status: this.status,
        size: this.getEstimatedSize()
      });

      return { snapshotId: result.id ?? this.snapshotId };
    } catch (error) {
      logger.error('EntryPackSnapshot', error, { operation: 'save', snapshotId: this.snapshotId });
      throw error;
    }
  }

  static async load(snapshotId: string): Promise<EntryPackSnapshot | null> {
    try {
      const data = await SecureStorageService.getSnapshot(snapshotId);
      return data ? new EntryPackSnapshot(data as EntryPackSnapshotInit) : null;
    } catch (error) {
      logger.error('EntryPackSnapshot', error, { operation: 'load', snapshotId });
      throw error;
    }
  }

  static async loadByUserId(userId: string, filters: SnapshotFilters = {}): Promise<EntryPackSnapshot[]> {
    try {
      const snapshots = await SecureStorageService.getSnapshotsByUserId(userId);
      let filteredSnapshots = (snapshots || []).map(snapshot => new EntryPackSnapshot(snapshot as EntryPackSnapshotInit));

      if (filters.status) {
        filteredSnapshots = filteredSnapshots.filter(snapshot => snapshot.status === filters.status);
      }
      if (filters.destinationId) {
        filteredSnapshots = filteredSnapshots.filter(snapshot => snapshot.destinationId === filters.destinationId);
      }
      if (filters.entryInfoId) {
        filteredSnapshots = filteredSnapshots.filter(snapshot => snapshot.entryInfoId === filters.entryInfoId);
      }
      if (filters.hasSubmission !== undefined) {
        filteredSnapshots = filteredSnapshots.filter(snapshot => snapshot.hasTDACSubmission() === filters.hasSubmission);
      }
      if (filters.minAge !== undefined) {
        filteredSnapshots = filteredSnapshots.filter(snapshot => snapshot.getAgeInDays() >= filters.minAge);
      }
      if (filters.maxAge !== undefined) {
        filteredSnapshots = filteredSnapshots.filter(snapshot => snapshot.getAgeInDays() <= filters.maxAge);
      }

      filteredSnapshots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return filteredSnapshots;
    } catch (error) {
      logger.error('EntryPackSnapshot', error, { operation: 'loadByUserId', userId });
      throw error;
    }
  }

  async delete(): Promise<SnapshotDeleteResult> {
    try {
      const result = await SecureStorageService.deleteSnapshot(this.snapshotId);

      logger.info('EntryPackSnapshot', 'Snapshot deleted', {
        snapshotId: this.snapshotId,
        photoCount: this.getPhotoCount()
      });

      return result;
    } catch (error) {
      logger.error('EntryPackSnapshot', error, { operation: 'delete', snapshotId: this.snapshotId });
      throw error;
    }
  }

  getSummary(): Record<string, unknown> {
    return {
      snapshotId: this.snapshotId,
      entryInfoId: this.entryInfoId,
      userId: this.userId,
      destinationId: this.destinationId,
      status: this.status,
      displayStatus: this.getDisplayStatus(),
      createdAt: this.createdAt,
      arrivalDate: this.arrivalDate,
      completenessIndicator: this.completenessIndicator,
      completenessString: this.getCompletenessString(),
      isComplete: this.isComplete(),
      hasTDACSubmission: this.hasTDACSubmission(),
      photoCount: this.getPhotoCount(),
      ageInDays: this.getAgeInDays(),
      isLegacy: this.isLegacy(),
      estimatedSize: this.getEstimatedSize(),
      version: this.version,
      metadata: this.metadata
    };
  }

  updatePhotoManifest(encryptedPhotos: PhotoManifestItem[]): void {
    const newManifest = encryptedPhotos.map(photo => ({
      ...photo,
      encrypted: photo.encrypted ?? false,
      encryptionMethod: photo.encryptionMethod ?? null,
      encryptedPath: photo.encryptedPath ?? null,
      encryptedSize: photo.encryptedSize ?? null,
      encryptionError: photo.encryptionError ?? null,
      fundType: photo.fundType ?? null,
      fileName: photo.fileName ?? null,
      fileSize: photo.fileSize ?? 0,
      snapshotPath: photo.snapshotPath ?? null,
      originalPath: photo.originalPath ?? null,
      status: photo.status ?? 'no_photo',
      error: photo.error ?? null
    }));

    Object.defineProperty(this, 'photoManifest', {
      value: this.deepFreeze(newManifest),
      writable: false,
      enumerable: true,
      configurable: false
    });

    const encryptedCount = encryptedPhotos.filter(p => p.encrypted).length;
    this.setEncryptionInfo({
      photosEncrypted: encryptedCount > 0,
      encryptedPhotoCount: encryptedCount
    });
  }

  setEncryptionInfo(encryptionInfo: Partial<EncryptionInfo>): void {
    const newEncryptionInfo: EncryptionInfo = {
      ...this.encryptionInfo,
      ...encryptionInfo
    };

    Object.defineProperty(this, 'encryptionInfo', {
      value: this.deepFreeze(newEncryptionInfo),
      writable: false,
      enumerable: true,
      configurable: false
    });
  }

  isEncrypted(): boolean {
    return this.encryptionInfo.encrypted;
  }

  arePhotosEncrypted(): boolean {
    return this.encryptionInfo.photosEncrypted;
  }

  getEncryptionStatus(): Record<string, unknown> {
    return {
      dataEncrypted: this.encryptionInfo.encrypted,
      photosEncrypted: this.encryptionInfo.photosEncrypted,
      encryptionMethod: this.encryptionInfo.encryptionMethod,
      encryptedPhotoCount: this.encryptionInfo.encryptedPhotoCount,
      totalPhotoCount: this.photoManifest.length
    };
  }

  exportData(): Record<string, unknown> {
    return {
      snapshotId: this.snapshotId,
      entryInfoId: this.entryInfoId,
      userId: this.userId,
      destinationId: this.destinationId,
      status: this.status,
      createdAt: this.createdAt,
      arrivalDate: this.arrivalDate,
      version: this.version,
      metadata: this.metadata,
      passport: this.passport,
      personalInfo: this.personalInfo,
      funds: this.funds,
      travel: this.travel,
      tdacSubmission: this.tdacSubmission,
      completenessIndicator: this.completenessIndicator,
      photoManifest: this.photoManifest,
      encryptionInfo: this.encryptionInfo,
      exportedAt: new Date().toISOString()
    };
  }

  createReusableData(): Record<string, unknown> {
    return {
      passport: this.passport,
      personalInfo: this.personalInfo,
      funds: this.funds,
      sourceSnapshotId: this.snapshotId,
      reusedAt: new Date().toISOString()
    };
  }

  toJSON(): Record<string, unknown> {
    return this.exportData();
  }
}

export default EntryPackSnapshot;

