/**
 * 入境通 - Funding Proof Data Model
 * Defines the structure and validation for funding proof information
 *
 * Security: Sensitive fields are encrypted at field level
 */

import SecureStorageService from '../services/security/SecureStorageService';

class FundingProof {
  constructor(data = {}) {
    // Use consistent ID based on userId to ensure updates work correctly
    this.id = data.id || (data.userId ? `funding_${data.userId}` : FundingProof.generateId());
    this.userId = data.userId;
    this.cashAmount = data.cashAmount; // 🔴 ENCRYPTED
    this.bankCards = data.bankCards; // 🔴 ENCRYPTED
    this.supportingDocs = data.supportingDocs; // 🔴 ENCRYPTED
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Generate unique funding proof ID
   * @returns {string} - Unique funding proof ID
   */
  static generateId() {
    return `funding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate funding proof data
   * @returns {Object} - Validation result {isValid, errors}
   */
  validate() {
    const errors = [];

    // At least one funding proof method should be provided
    const hasCash = this.cashAmount && this.cashAmount.trim().length > 0;
    const hasBankCards = this.bankCards && this.bankCards.trim().length > 0;
    const hasSupportingDocs = this.supportingDocs && this.supportingDocs.trim().length > 0;

    if (!hasCash && !hasBankCards && !hasSupportingDocs) {
      errors.push('At least one funding proof method is required (cash, bank cards, or supporting documents)');
    }

    // Validate cash amount format if provided
    if (this.cashAmount && !this.isValidCashAmount(this.cashAmount)) {
      errors.push('Invalid cash amount format');
    }

    // Validate bank cards format if provided
    if (this.bankCards && !this.isValidBankCards(this.bankCards)) {
      errors.push('Invalid bank cards format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate cash amount format
   * @param {string} amount - Cash amount string
   * @returns {boolean} - Is valid format
   */
  isValidCashAmount(amount) {
    if (!amount || amount.trim().length === 0) return false;
    
    // Should contain at least some numeric characters or currency keywords
    const hasNumbers = /\d/.test(amount);
    const hasCurrency = /THB|CNY|USD|EUR|JPY|KRW|SGD|MYR|TWD|HKD|¥|\$|€|฿/i.test(amount);
    
    return hasNumbers || hasCurrency;
  }

  /**
   * Validate bank cards format
   * @param {string} cards - Bank cards string
   * @returns {boolean} - Is valid format
   */
  isValidBankCards(cards) {
    if (!cards || cards.trim().length === 0) return false;
    
    // Should be at least 5 characters (e.g., "Visa" or "CMB")
    return cards.trim().length >= 3;
  }

  /**
   * Check if funding proof has complete information
   * @returns {boolean} - Has complete funding info
   */
  hasCompleteFundingInfo() {
    const hasCash = this.cashAmount && this.cashAmount.trim().length > 0;
    const hasBankCards = this.bankCards && this.bankCards.trim().length > 0;
    
    // Complete if has both cash and bank cards, or has supporting docs
    return (hasCash && hasBankCards) || 
           (this.supportingDocs && this.supportingDocs.trim().length > 0);
  }

  /**
   * Get funding methods summary
   * @returns {Object} - Summary of available funding methods
   */
  getFundingMethodsSummary() {
    return {
      hasCash: !!(this.cashAmount && this.cashAmount.trim().length > 0),
      hasBankCards: !!(this.bankCards && this.bankCards.trim().length > 0),
      hasSupportingDocs: !!(this.supportingDocs && this.supportingDocs.trim().length > 0),
      methodCount: [this.cashAmount, this.bankCards, this.supportingDocs]
        .filter(item => item && item.trim().length > 0).length
    };
  }

  /**
   * Save funding proof to secure storage
   * @param {Object} options - Save options
   * @param {boolean} options.skipValidation - Skip validation for progressive filling
   * @returns {Promise<Object>} - Save result
   */
  async save(options = {}) {
    try {
      // Validate before saving (unless skipped for progressive filling)
      if (!options.skipValidation) {
        const validation = this.validate();
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Update timestamp
      this.updatedAt = new Date().toISOString();

      // Save to secure storage
      const result = await SecureStorageService.saveFundingProof({
        id: this.id,
        userId: this.userId,
        cashAmount: this.cashAmount,
        bankCards: this.bankCards,
        supportingDocs: this.supportingDocs,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      });

      return result;
    } catch (error) {
      console.error('Failed to save funding proof:', error);
      throw error;
    }
  }

  /**
   * Load funding proof from secure storage
   * @param {string} userId - User ID
   * @returns {Promise<FundingProof>} - FundingProof instance
   */
  static async load(userId) {
    try {
      const data = await SecureStorageService.getFundingProof(userId);
      if (!data) return null;

      return new FundingProof(data);
    } catch (error) {
      console.error('Failed to load funding proof:', error);
      throw error;
    }
  }

  /**
   * Update specific fields
   * @param {Object} updates - Fields to update
   * @param {Object} options - Update options
   * @param {boolean} options.skipValidation - Skip validation for progressive filling
   * @returns {Promise<Object>} - Update result
   */
  async update(updates, options = {}) {
    try {
      // Update fields
      Object.assign(this, updates);
      this.updatedAt = new Date().toISOString();

      // Validate updated data (unless skipped for progressive filling)
      if (!options.skipValidation) {
        const validation = this.validate();
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Save updated data
      return await this.save(options);
    } catch (error) {
      console.error('Failed to update funding proof:', error);
      throw error;
    }
  }

  /**
   * Export funding proof data for GDPR compliance
   * @returns {Object} - Exportable funding proof data
   */
  exportData() {
    return {
      id: this.id,
      cashAmount: this.cashAmount, // Will be decrypted by storage service
      bankCards: this.bankCards,
      supportingDocs: this.supportingDocs,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: {
        hasCompleteFundingInfo: this.hasCompleteFundingInfo(),
        fundingMethods: this.getFundingMethodsSummary()
      }
    };
  }

  /**
   * Get funding proof summary (safe for logging)
   * @returns {Object} - Sanitized funding proof data
   */
  getSummary() {
    return {
      id: this.id,
      hasCash: !!(this.cashAmount && this.cashAmount.trim().length > 0),
      hasBankCards: !!(this.bankCards && this.bankCards.trim().length > 0),
      hasSupportingDocs: !!(this.supportingDocs && this.supportingDocs.trim().length > 0),
      hasCompleteFundingInfo: this.hasCompleteFundingInfo(),
      methodCount: this.getFundingMethodsSummary().methodCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create funding proof from user input
   * @param {Object} inputData - User input data
   * @param {string} userId - User ID
   * @returns {FundingProof} - FundingProof instance
   */
  static fromUserInput(inputData, userId) {
    return new FundingProof({
      userId,
      cashAmount: inputData.cashAmount,
      bankCards: inputData.bankCards,
      supportingDocs: inputData.supportingDocs
    });
  }

  /**
   * Get display name for funding proof
   * @returns {string} - Display name
   */
  getDisplayName() {
    const methods = [];
    if (this.cashAmount && this.cashAmount.trim().length > 0) {
      methods.push('Cash');
    }
    if (this.bankCards && this.bankCards.trim().length > 0) {
      methods.push('Bank Cards');
    }
    if (this.supportingDocs && this.supportingDocs.trim().length > 0) {
      methods.push('Supporting Docs');
    }

    if (methods.length > 0) {
      return methods.join(' + ');
    }
    return 'No funding proof provided';
  }

  /**
   * Check if funding proof is sufficient for immigration
   * @param {string} destination - Destination country code
   * @returns {Object} - Sufficiency check result
   */
  checkSufficiency(destination) {
    const summary = this.getFundingMethodsSummary();
    
    // Basic sufficiency: at least one method
    const isBasicallySufficient = summary.methodCount >= 1;
    
    // Recommended: multiple methods or supporting docs
    const isRecommended = summary.methodCount >= 2 || summary.hasSupportingDocs;

    return {
      isSufficient: isBasicallySufficient,
      isRecommended,
      methodCount: summary.methodCount,
      recommendations: this.generateRecommendations(summary, destination)
    };
  }

  /**
   * Generate recommendations for funding proof
   * @param {Object} summary - Funding methods summary
   * @param {string} destination - Destination country code
   * @returns {Array} - List of recommendations
   */
  generateRecommendations(summary, destination) {
    const recommendations = [];

    if (summary.methodCount === 0) {
      recommendations.push({
        type: 'critical',
        message: 'No funding proof provided. Please add at least one funding method.',
        action: 'add_funding_proof'
      });
    } else if (summary.methodCount === 1) {
      recommendations.push({
        type: 'warning',
        message: 'Consider adding multiple funding proof methods for better immigration clearance.',
        action: 'add_more_methods'
      });
    }

    if (!summary.hasSupportingDocs && (summary.hasCash || summary.hasBankCards)) {
      recommendations.push({
        type: 'info',
        message: 'Consider adding supporting documents (bank statements, screenshots) for verification.',
        action: 'add_supporting_docs'
      });
    }

    return recommendations;
  }
}

export default FundingProof;
