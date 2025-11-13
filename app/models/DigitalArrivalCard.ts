/**
 * DigitalArrivalCard Model - Generic model for all Digital Arrival Cards (TDAC, MDAC, SDAC, HKDAC)
 */

import SecureStorageService from '../services/security/SecureStorageService';

export type DigitalArrivalCardType = 'TDAC' | 'MDAC' | 'SDAC' | 'HKDAC' | string;

export type DigitalArrivalCardStatus = 'success' | 'failed' | 'pending' | string;

export interface DigitalArrivalCardInit {
  id?: string;
  entryInfoId?: string;
  userId?: string;
  cardType?: DigitalArrivalCardType;
  destinationId?: string | null;
  arrCardNo?: string | null;
  qrUri?: string | null;
  pdfUrl?: string | null;
  submittedAt?: string | null;
  submissionMethod?: string | null;
  status?: DigitalArrivalCardStatus;
  apiResponse?: unknown;
  processingTime?: number | null;
  retryCount?: number;
  errorDetails?: unknown;
  isSuperseded?: boolean | number;
  supersededAt?: string | null;
  supersededBy?: string | null;
  supersededReason?: string | null;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface SaveResult {
  id: string;
}

interface Summary {
  id: string;
  cardType?: DigitalArrivalCardType;
  destinationId?: string | null;
  arrCardNo?: string | null;
  status: DigitalArrivalCardStatus;
  submittedAt: string | null;
  isSuperseded: boolean;
  qrUri?: string | null;
  pdfUrl?: string | null;
}

class DigitalArrivalCard {
  id: string;
  entryInfoId?: string;
  userId?: string;
  cardType?: DigitalArrivalCardType;
  destinationId?: string | null;
  arrCardNo?: string | null;
  qrUri?: string | null;
  pdfUrl?: string | null;
  submittedAt: string | null;
  submissionMethod: string;
  status: DigitalArrivalCardStatus;
  apiResponse: unknown;
  processingTime: number | null;
  retryCount: number;
  errorDetails: unknown;
  isSuperseded: boolean;
  supersededAt: string | null;
  supersededBy: string | null;
  supersededReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;

  constructor(data: DigitalArrivalCardInit = {}) {
    this.id = data.id ?? DigitalArrivalCard.generateId();
    this.entryInfoId = data.entryInfoId;
    this.userId = data.userId;
    this.cardType = data.cardType;
    this.destinationId = data.destinationId ?? null;
    this.arrCardNo = data.arrCardNo ?? null;
    this.qrUri = data.qrUri ?? null;
    this.pdfUrl = data.pdfUrl ?? null;
    this.submittedAt = data.submittedAt ?? new Date().toISOString();
    this.submissionMethod = data.submissionMethod ?? 'api';
    this.status = data.status ?? 'success';
    this.apiResponse = data.apiResponse ?? null;
    this.processingTime = data.processingTime ?? null;
    this.retryCount = data.retryCount ?? 0;
    this.errorDetails = data.errorDetails ?? null;
    this.isSuperseded = DigitalArrivalCard.normalizeBoolean(data.isSuperseded);
    this.supersededAt = data.supersededAt ?? null;
    this.supersededBy = data.supersededBy ?? null;
    this.supersededReason = data.supersededReason ?? null;
    this.version = data.version ?? 1;
    this.createdAt = data.createdAt ?? new Date().toISOString();
    this.updatedAt = data.updatedAt ?? new Date().toISOString();
  }

  static generateId(): string {
    return `dac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async save(): Promise<SaveResult> {
    try {
      const entryInfoId = this.entryInfoId;
      const userId = this.userId;
      if (!entryInfoId) {
        throw new Error('DigitalArrivalCard.save requires entryInfoId');
      }
      if (!userId) {
        throw new Error('DigitalArrivalCard.save requires userId');
      }
      this.updatedAt = new Date().toISOString();
      const result = await SecureStorageService.saveDigitalArrivalCard({
        id: this.id,
        entryInfoId,
        userId,
        cardType: this.cardType,
        destinationId: this.destinationId,
        arrCardNo: this.arrCardNo,
        qrUri: this.qrUri,
        pdfUrl: this.pdfUrl,
        submittedAt: this.submittedAt,
        submissionMethod: this.submissionMethod,
        status: this.status,
        apiResponse: this.apiResponse ?? null,
        processingTime: this.processingTime,
        retryCount: this.retryCount,
        errorDetails: this.errorDetails ?? null,
        isSuperseded: this.isSuperseded,
        supersededAt: this.supersededAt,
        supersededBy: this.supersededBy,
        supersededReason: this.supersededReason,
        version: this.version,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      });
      return result as SaveResult;
    } catch (error) {
      console.error('Failed to save DigitalArrivalCard:', error);
      throw error;
    }
  }

  static async load(id: string): Promise<DigitalArrivalCard | null> {
    try {
      const data = await SecureStorageService.getDigitalArrivalCard(id);
      if (!data) {
        return null;
      }
      return new DigitalArrivalCard(data as DigitalArrivalCardInit);
    } catch (error) {
      console.error('Failed to load DigitalArrivalCard:', error);
      throw error;
    }
  }

  static async getByEntryInfoId(entryInfoId: string): Promise<DigitalArrivalCard[]> {
    try {
      const data = await SecureStorageService.getDigitalArrivalCardsByEntryInfoId(entryInfoId);
      return data.map(item => new DigitalArrivalCard(item as DigitalArrivalCardInit));
    } catch (error) {
      console.error('Failed to get DigitalArrivalCards by entryInfoId:', error);
      throw error;
    }
  }

  static async getLatestSuccessful(entryInfoId: string, cardType: DigitalArrivalCardType): Promise<DigitalArrivalCard | null> {
    try {
      const data = await SecureStorageService.getLatestSuccessfulDigitalArrivalCard(entryInfoId, cardType);
      if (!data) {
        return null;
      }
      return new DigitalArrivalCard(data as DigitalArrivalCardInit);
    } catch (error) {
      console.error('Failed to get latest successful DigitalArrivalCard:', error);
      throw error;
    }
  }

  async markAsSuperseded(supersededBy: string, reason: string): Promise<SaveResult> {
    try {
      this.isSuperseded = true;
      this.supersededAt = new Date().toISOString();
      this.supersededBy = supersededBy;
      this.supersededReason = reason;
      return this.save();
    } catch (error) {
      console.error('Failed to mark DigitalArrivalCard as superseded:', error);
      throw error;
    }
  }

  getSummary(): Summary {
    return {
      id: this.id,
      cardType: this.cardType,
      destinationId: this.destinationId ?? null,
      arrCardNo: this.arrCardNo ?? null,
      status: this.status,
      submittedAt: this.submittedAt,
      isSuperseded: this.isSuperseded,
      qrUri: this.qrUri ?? null,
      pdfUrl: this.pdfUrl ?? null
    };
  }

  private static normalizeBoolean(value: boolean | number | undefined): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    return false;
  }
}

export default DigitalArrivalCard;
