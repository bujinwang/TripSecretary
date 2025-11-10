/**
 * FundItem Model - Individual funding proof item
 * Represents a single funding source (credit card, cash, bank balance, etc.)
 */

import SecureStorageService from '../services/security/SecureStorageService';

export type FundItemType = 'credit_card' | 'cash' | 'bank_balance' | 'investment' | 'other';

export interface FundItemInit {
  id?: string;
  userId?: string;
  type?: FundItemType | string | null;
  amount?: number | string | null;
  currency?: string | null;
  details?: string | null;
  photoUri?: string | null;
  photo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface SaveOptions {
  skipValidation?: boolean;
}

interface SaveResult {
  id: string;
}

interface FundItemSavePayload {
  id?: string;
  userId: string;
  type?: FundItemType | string | null;
  amount?: number | string | null;
  currency?: string | null;
  details?: string | null;
  photoUri?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

const VALID_TYPES: FundItemType[] = ['credit_card', 'cash', 'bank_balance', 'investment', 'other'];

class FundItem {
  id: string;
  userId?: string;
  type?: FundItemType | string | null;
  amount: number | string | null;
  currency: string | null;
  details: string | null;
  photoUri: string | null;
  createdAt: string;
  updatedAt: string;

  constructor(data: FundItemInit = {}) {
    this.id = data.id ?? FundItem.generateId();
    this.userId = data.userId;
    this.type = data.type ?? null;
    this.amount = data.amount ?? null;
    this.currency = data.currency ?? null;
    this.details = data.details ?? null;
    this.photoUri = data.photoUri ?? data.photo ?? null;
    this.createdAt = data.createdAt ?? new Date().toISOString();
    this.updatedAt = data.updatedAt ?? new Date().toISOString();
  }

  static generateId(): string {
    return `fund_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  validate(): ValidationResult {
    const errors: string[] = [];

    if (!this.userId) {
      errors.push('User ID is required');
    }

    if (!this.type) {
      errors.push('Fund type is required');
    } else if (typeof this.type === 'string' && !VALID_TYPES.includes(this.type as FundItemType)) {
      errors.push(`Invalid fund type: ${this.type}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async save(options: SaveOptions = {}): Promise<SaveResult> {
    try {
      console.log('=== FUND ITEM SAVE DEBUG ===');
      console.log('FundItem.save called');
      console.log('Fund item data:', {
        id: this.id,
        userId: this.userId,
        type: this.type,
        hasPhoto: !!this.photoUri,
        photoPreview: this.photoUri?.substring(0, 50)
      });

      if (!options.skipValidation) {
        const validation = this.validate();
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      this.updatedAt = new Date().toISOString();

      const payload = this.toSavingPayload();
      const result = await SecureStorageService.saveFundItem(payload);
      console.log('FundItem.save completed successfully');
      return result as SaveResult;
    } catch (error) {
      console.error('FundItem.save failed:', error);
      throw error;
    }
  }

  async delete(): Promise<void> {
    try {
      await SecureStorageService.deleteFundItem(this.id);
    } catch (error) {
      console.error('FundItem.delete failed:', error);
      throw error;
    }
  }

  static async load(id: string): Promise<FundItem | null> {
    try {
      const data = await SecureStorageService.getFundItem(id);
      return data ? new FundItem(data as FundItemInit) : null;
    } catch (error) {
      console.error('FundItem.load failed:', error);
      throw error;
    }
  }

  static async loadByUserId(userId: string): Promise<FundItem[]> {
    try {
      console.log('=== FUND ITEM LOAD BY USER ID ===');
      console.log('Loading fund items for userId:', userId);

      const items = await SecureStorageService.getFundItemsByUserId(userId);
      console.log('Raw fund items from DB:', items?.length || 0, 'items');

      const fundItems = (items || []).map(item => new FundItem(item as FundItemInit));

      console.log('Created FundItem instances:', fundItems.length);
      fundItems.forEach((item, index) => {
        console.log(`Fund item ${index}:`, {
          id: item.id,
          type: item.type,
          hasPhoto: !!item.photoUri,
          photoPreview: item.photoUri?.substring(0, 50)
        });
      });

      return fundItems;
    } catch (error) {
      console.error('FundItem.loadByUserId failed:', error);
      throw error;
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      amount: this.amount,
      currency: this.currency,
      details: this.details,
      photoUri: this.photoUri,
      photo: this.photoUri,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  private toSavingPayload(): FundItemSavePayload {
    if (!this.userId) {
      throw new Error('Cannot save fund item without userId');
    }

    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      amount: this.amount,
      currency: this.currency,
      details: this.details,
      photoUri: this.photoUri,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default FundItem;

