/**
 * 入境通 - Entry Data Model
 * Defines the structure and validation for immigration entry data
 */

import SecureStorageService from '../services/security/SecureStorageService';

export interface EntryDataParams {
  id?: string;
  userId?: string;
  passportId?: string;
  personalInfoId?: string;
  travelInfoId?: string;
  fundingProof?: Record<string, unknown>;
  fundItemIds?: string[];
  immigrationNotes?: string;
  specialRequirements?: string;
  status?: string;
  submissionDate?: string;
  generatedAt?: string;
  lastModified?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface SaveResult {
  id: string;
  saved: boolean;
  timestamp: string;
}

interface FundingProofRaw {
  cashAmount?: unknown;
  bankCards?: unknown;
  supportingDocs?: unknown;
  createdAt?: string;
  updatedAt?: string;
}

class EntryData {
  id: string;
  userId: string | undefined;
  passportId: string | undefined;
  personalInfoId: string | undefined;
  travelInfoId: string | null | undefined;
  fundingProof: Record<string, unknown>;
  fundItemIds: string[];
  immigrationNotes: string | undefined;
  specialRequirements: string | undefined;
  status: string;
  submissionDate: string | undefined;
  generatedAt: string;
  lastModified: string;

  constructor(data: EntryDataParams = {}) {
    this.id = data.id || EntryData.generateId();
    this.userId = data.userId;
    this.passportId = data.passportId;
    this.personalInfoId = data.personalInfoId;
    this.travelInfoId = data.travelInfoId;
    this.fundingProof = data.fundingProof || {};
    this.fundItemIds = Array.isArray(data.fundItemIds) ? [...data.fundItemIds] : [];
    this.immigrationNotes = data.immigrationNotes;
    this.specialRequirements = data.specialRequirements;
    this.status = data.status || 'draft';
    this.submissionDate = data.submissionDate;
    this.generatedAt = data.generatedAt || new Date().toISOString();
    this.lastModified = data.lastModified || new Date().toISOString();
  }

  static generateId(): string {
    return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validate(): ValidationResult {
    const errors: string[] = [];

    if (!this.passportId) {
      errors.push('Passport information is required');
    }

    if (!this.travelInfoId) {
      errors.push('Travel information is required');
    }

    const fundingErrors = this.validateFundingProof();
    errors.push(...fundingErrors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateFundingProof(): string[] {
    const errors: string[] = [];
    const funding = this.fundingProof || {};

    if (!funding.cashAmount && !funding.bankCards && !funding.supportingDocs) {
      errors.push('At least one form of funding proof is required');
      return errors;
    }

    if (funding.cashAmount && !this.isValidCashAmount(funding.cashAmount)) {
      errors.push('Invalid cash amount format');
    }

    if (
      funding.bankCards &&
      typeof funding.bankCards === 'string' &&
      funding.bankCards.trim().length < 10
    ) {
      errors.push('Bank card information is too brief');
    }

    return errors;
  }

  isValidCashAmount(amount: unknown): boolean {
    if (typeof amount === 'number') {
      return amount > 0;
    }
    if (typeof amount === 'string') {
      return !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
    }
    return false;
  }

  async save(options: { skipValidation?: boolean } = {}): Promise<SaveResult> {
    try {
      if (!options.skipValidation) {
        const validation = this.validate();
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      this.lastModified = new Date().toISOString();

      if (Object.keys(this.fundingProof).length > 0) {
        await SecureStorageService.saveFundingProof({
          id: this.id,
          userId: this.userId,
          cashAmount: this.fundingProof.cashAmount as number | undefined,
          bankCards: this.fundingProof.bankCards as string | undefined,
          supportingDocs: this.fundingProof.supportingDocs as string | undefined,
          createdAt: this.generatedAt,
          updatedAt: this.lastModified,
        });
      }

      return {
        id: this.id,
        saved: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to save entry data:', error);
      throw error;
    }
  }

  static async load(id: string): Promise<EntryData | null> {
    try {
      const fundingData = (await SecureStorageService.getFundingProof(id)) as
        | FundingProofRaw
        | undefined;

      const entryData = new EntryData({
        id,
        fundingProof: fundingData
          ? {
              cashAmount: fundingData.cashAmount,
              bankCards: fundingData.bankCards,
              supportingDocs: fundingData.supportingDocs,
            }
          : {},
        generatedAt: fundingData?.createdAt,
        lastModified: fundingData?.updatedAt,
      });

      return entryData;
    } catch (error) {
      console.error('Failed to load entry data:', error);
      throw error;
    }
  }

  async getCompleteData(): Promise<Record<string, unknown>> {
    const completeData: Record<string, unknown> = {
      id: this.id,
      userId: this.userId,
      status: this.status,
      immigrationNotes: this.immigrationNotes,
      specialRequirements: this.specialRequirements,
      fundingProof: this.fundingProof,
      fundItemIds: [...this.fundItemIds],
      submissionDate: this.submissionDate,
      generatedAt: this.generatedAt,
      lastModified: this.lastModified,
      metadata: {
        hasFundingProof: Object.keys(this.fundingProof).length > 0,
        fundItemCount: this.fundItemIds.length,
        isComplete: this.validate().isValid,
      },
    };

    return completeData;
  }

  getSummary(): Record<string, unknown> {
    return this.toJSON();
  }

  async exportData(): Promise<Record<string, unknown>> {
    return this.toJSON();
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      userId: this.userId,
      passportId: this.passportId,
      personalInfoId: this.personalInfoId,
      travelInfoId: this.travelInfoId,
      fundingProof: this.fundingProof,
      fundItemIds: [...this.fundItemIds],
      immigrationNotes: this.immigrationNotes,
      specialRequirements: this.specialRequirements,
      status: this.status,
      submissionDate: this.submissionDate,
      generatedAt: this.generatedAt,
      lastModified: this.lastModified,
    };
  }
}

export default EntryData;
