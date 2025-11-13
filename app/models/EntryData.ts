// @ts-nocheck

/**
 * 入境通 - Entry Data Model
 * Defines the structure and validation for immigration entry data
 *
 * Security: Combines passport, personal info, and travel-specific data
 */

import SecureStorageService from '../services/security/SecureStorageService';
import Passport from './Passport';
import PersonalInfo from './PersonalInfo';

import TravelInfo from './TravelInfo';

class EntryData {
  constructor(data = {}) {
    this.id = data.id || EntryData.generateId();
    this.userId = data.userId;

    // Core data references
    this.passportId = data.passportId;
    this.personalInfoId = data.personalInfoId;

    // Travel-specific information
    this.travelInfoId = data.travelInfoId;

    // Funding proof (encrypted)
    this.fundingProof = data.fundingProof || {}; // 🔴 ENCRYPTED object
    this.fundItemIds = Array.isArray(data.fundItemIds) ? [...data.fundItemIds] : [];

    // Immigration-specific data
    this.immigrationNotes = data.immigrationNotes; // 🟢 PLAINTEXT
    this.specialRequirements = data.specialRequirements; // 🟢 PLAINTEXT

    // Status and metadata
    this.status = data.status || 'draft'; // draft, submitted, approved, rejected
    this.submissionDate = data.submissionDate;
    this.generatedAt = data.generatedAt || new Date().toISOString();
    this.lastModified = data.lastModified || new Date().toISOString();
  }

  /**
   * Generate unique entry data ID
   * @returns {string} - Unique entry data ID
   */
  static generateId() {
    return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate entry data
   * @returns {Object} - Validation result {isValid, errors}
   */
  validate() {
    const errors = [];

    // Required fields
    if (!this.passportId) {
      errors.push('Passport information is required');
    }

    if (!this.travelInfoId) {
      errors.push('Travel information is required');
    }

    // Funding proof validation
    const fundingErrors = this.validateFundingProof();
    errors.push(...fundingErrors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate funding proof data
   * @returns {Array} - Validation errors
   */
  validateFundingProof() {
    const errors = [];
    const funding = this.fundingProof || {};

    // Check if funding proof is provided
    if (!funding.cashAmount && !funding.bankCards && !funding.supportingDocs) {
      errors.push('At least one form of funding proof is required');
      return errors;
    }

    // Validate cash amount (if provided)
    if (funding.cashAmount && !this.isValidCashAmount(funding.cashAmount)) {
      errors.push('Invalid cash amount format');
    }

    // Validate bank cards (if provided)
    if (funding.bankCards && funding.bankCards.trim().length < 10) {
      errors.push('Bank card information is too brief');
    }

    return errors;
  }



  /**
   * Save entry data (funding proof only, other data is referenced)
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
      this.lastModified = new Date().toISOString();

      // Save funding proof to secure storage
      if (Object.keys(this.fundingProof).length > 0) {
        await SecureStorageService.saveFundingProof({
          id: this.id,
          userId: this.userId,
          cashAmount: this.fundingProof.cashAmount,
          bankCards: this.fundingProof.bankCards,
          supportingDocs: this.fundingProof.supportingDocs,
          createdAt: this.generatedAt,
          updatedAt: this.lastModified
        });
      }

      // Note: Other data (passport, personal info) are stored separately
      // This entry data acts as a reference/combination

      return {
        id: this.id,
        saved: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to save entry data:', error);
      throw error;
    }
  }

  /**
   * Load entry data with related information
   * @param {string} id - Entry data ID
   * @returns {Promise<EntryData>} - Complete entry data instance
   */
  static async load(id: string): Promise<EntryData | null> {
    try {
      // Load funding proof from secure storage
      const fundingData = await SecureStorageService.getFundingProof(id);

      // For now, return basic structure
      // In a full implementation, you'd also load passport and personal info
      const entryData = new EntryData({
        id,
        fundingProof: fundingData ? {
          cashAmount: fundingData.cashAmount,
          bankCards: fundingData.bankCards,
          supportingDocs: fundingData.supportingDocs
        } : {},
        generatedAt: fundingData?.createdAt,
        lastModified: fundingData?.updatedAt
      });

      return entryData;
    } catch (error) {
      console.error('Failed to load entry data:', error);
      throw error;
    }
  }

  /**
   * Get complete entry data with all related information
   * @returns {Promise<Object>} - Complete entry data object
   */
  async getCompleteData() {
    try {
      const completeData = {
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

        // Metadata
        metadata: {
          isReadyForSubmission: this.isReadyForSubmission()
        }
      };

      // Load related data if IDs are available
      if (this.travelInfoId) {
        try {
          completeData.travelInfo = await TravelInfo.load(this.travelInfoId);
        } catch (error) {
          console.warn('Failed to load travel info:', error);
        }
      }
      if (this.passportId) {
        try {
          completeData.passport = await Passport.load(this.passportId);
        } catch (error) {
          console.warn('Failed to load passport data:', error);
        }
      }

      if (this.personalInfoId) {
        try {
          completeData.personalInfo = await PersonalInfo.load(this.personalInfoId);
        } catch (error) {
          console.warn('Failed to load personal info:', error);
        }
      }

      return completeData;
    } catch (error) {
      console.error('Failed to get complete entry data:', error);
      throw error;
    }
  }

  /**
   * Export entry data for GDPR compliance
   * @returns {Promise<Object>} - Exportable entry data
   */
  async exportData() {
    try {
      const completeData = await this.getCompleteData();

      return {
        id: this.id,
        exportDate: new Date().toISOString(),
        entryData: {
          immigrationNotes: completeData.immigrationNotes,
          specialRequirements: completeData.specialRequirements,
          status: completeData.status,
          submissionDate: completeData.submissionDate,
          generatedAt: completeData.generatedAt,
          lastModified: completeData.lastModified
        },
        travelInfo: completeData.travelInfo?.exportData(),
        passport: completeData.passport?.exportData(),
        personalInfo: completeData.personalInfo?.exportData(),
        fundingProof: completeData.fundingProof,
        metadata: completeData.metadata
      };
    } catch (error) {
      console.error('Failed to export entry data:', error);
      throw error;
    }
  }

  /**
   * Get entry data summary (safe for logging)
   * @returns {Object} - Sanitized entry data summary
   */
  getSummary() {
    return {
      id: this.id,
      status: this.status,
      generatedAt: this.generatedAt,
      lastModified: this.lastModified
    };
  }

  /**
   * Create entry data from user input
   * @param {Object} inputData - User input data
   * @param {string} userId - User ID
   * @param {string} passportId - Passport ID
   * @param {string} personalInfoId - Personal info ID
   * @returns {EntryData} - EntryData instance
   */
  static fromUserInput(inputData, userId, passportId = null, personalInfoId = null, travelInfoId = null) {
    return new EntryData({
      userId,
      passportId,
      personalInfoId,
      travelInfoId,
      fundingProof: inputData.fundingProof || {},
      immigrationNotes: inputData.immigrationNotes,
      specialRequirements: inputData.specialRequirements
    });
  }


}

export default EntryData;
