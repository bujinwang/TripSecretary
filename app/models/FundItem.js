/**
 * FundItem Model - Individual funding proof item
 * Represents a single funding source (credit card, cash, bank balance, etc.)
 */
class FundItem {
  constructor(data = {}) {
    this.id = data.id || FundItem.generateId();
    this.userId = data.userId;
    this.type = data.type; // 'credit_card', 'cash', 'bank_balance', 'investment', 'other'
    this.amount = data.amount || null;
    this.currency = data.currency || null;
    this.details = data.details || null;
    this.photoUri = data.photoUri || data.photo || null; // Support both field names
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Generate unique ID for fund item
   */
  static generateId() {
    return `fund_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Validate fund item data
   */
  validate() {
    const errors = [];

    if (!this.userId) {
      errors.push('User ID is required');
    }

    if (!this.type) {
      errors.push('Fund type is required');
    }

    const validTypes = ['credit_card', 'cash', 'bank_balance', 'investment', 'other'];
    if (this.type && !validTypes.includes(this.type)) {
      errors.push(`Invalid fund type: ${this.type}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Save fund item to database
   */
  async save(options = {}) {
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

      // Validate unless skipped
      if (!options.skipValidation) {
        const validation = this.validate();
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Update timestamp
      this.updatedAt = new Date().toISOString();

      // Get SecureStorageService
      const SecureStorageService = require('../services/security/SecureStorageService').default;

      // Save to database
      const result = await SecureStorageService.saveFundItem(this);
      console.log('FundItem.save completed successfully');
      return result;
    } catch (error) {
      console.error('FundItem.save failed:', error);
      throw error;
    }
  }

  /**
   * Delete fund item from database
   */
  async delete() {
    try {
      const SecureStorageService = require('../services/security/SecureStorageService').default;
      return await SecureStorageService.deleteFundItem(this.id);
    } catch (error) {
      console.error('FundItem.delete failed:', error);
      throw error;
    }
  }

  /**
   * Load fund item by ID
   */
  static async load(id) {
    try {
      const SecureStorageService = require('../services/security/SecureStorageService').default;
      const data = await SecureStorageService.getFundItem(id);
      return data ? new FundItem(data) : null;
    } catch (error) {
      console.error('FundItem.load failed:', error);
      throw error;
    }
  }

  /**
   * Load all fund items for a user
   */
  static async loadByUserId(userId) {
    try {
      console.log('=== FUND ITEM LOAD BY USER ID ===');
      console.log('Loading fund items for userId:', userId);

      const SecureStorageService = require('../services/security/SecureStorageService').default;
      const items = await SecureStorageService.getFundItemsByUserId(userId);
      
      console.log('Raw fund items from DB:', items?.length || 0, 'items');
      
      const fundItems = (items || []).map(item => new FundItem(item));
      
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

  /**
   * Convert to plain object for JSON serialization
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      amount: this.amount,
      currency: this.currency,
      details: this.details,
      photoUri: this.photoUri,
      photo: this.photoUri, // Alias for backward compatibility
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default FundItem;
