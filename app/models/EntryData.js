/**
 * 入境通 - Entry Data Model
 * Defines the structure and validation for immigration entry data
 *
 * Security: Combines passport, personal info, and travel-specific data
 */

import SecureStorageService from '../services/security/SecureStorageService';
import Passport from './Passport';
import PersonalInfo from './PersonalInfo';

class EntryData {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.userId = data.userId;

    // Core data references
    this.passportId = data.passportId;
    this.personalInfoId = data.personalInfoId;

    // Travel-specific information
    this.destination = data.destination; // 🟢 PLAINTEXT (not sensitive)
    this.purpose = data.purpose; // 🟢 PLAINTEXT (not sensitive)
    this.arrivalDate = data.arrivalDate; // 🟢 PLAINTEXT (not sensitive)
    this.departureDate = data.departureDate; // 🟢 PLAINTEXT (not sensitive)
    this.flightNumber = data.flightNumber; // 🟢 PLAINTEXT (not sensitive)
    this.accommodation = data.accommodation; // 🟡 MODERATE (may contain address)

    // Funding proof (encrypted)
    this.fundingProof = data.fundingProof || {}; // 🔴 ENCRYPTED object

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

    if (!this.destination || !this.destination.id) {
      errors.push('Destination is required');
    }

    if (!this.arrivalDate) {
      errors.push('Arrival date is required');
    }

    // Date validations
    if (this.arrivalDate && !this.isValidDate(this.arrivalDate)) {
      errors.push('Invalid arrival date format');
    }

    if (this.departureDate && !this.isValidDate(this.departureDate)) {
      errors.push('Invalid departure date format');
    }

    // Date logic validations
    if (this.arrivalDate && this.departureDate) {
      const arrival = new Date(this.arrivalDate);
      const departure = new Date(this.departureDate);
      if (departure <= arrival) {
        errors.push('Departure date must be after arrival date');
      }
    }

    // Flight number validation (if provided)
    if (this.flightNumber && !this.isValidFlightNumber(this.flightNumber)) {
      errors.push('Invalid flight number format');
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
   * Validate date format (YYYY-MM-DD)
   * @param {string} dateStr - Date string
   * @returns {boolean} - Is valid date
   */
  isValidDate(dateStr) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) return false;

    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * Validate flight number format
   * @param {string} flightNumber - Flight number
   * @returns {boolean} - Is valid format
   */
  isValidFlightNumber(flightNumber) {
    // Basic flight number validation: airline code (2-3 letters) + number (1-4 digits)
    const flightRegex = /^[A-Z]{2,3}\d{1,4}$/i;
    return flightRegex.test(flightNumber.replace(/\s/g, ''));
  }

  /**
   * Validate cash amount format
   * @param {string} amount - Cash amount string
   * @returns {boolean} - Is valid format
   */
  isValidCashAmount(amount) {
    // Allow formats like: "10000 THB", "¥2000", "$500", "10,000 THB equivalent"
    const amountRegex = /^[\d,]+\s*(?:THB|USD|CNY|¥|\$|equivalent).*$/i;
    return amountRegex.test(amount);
  }

  /**
   * Check if entry data is ready for submission
   * @returns {boolean} - Is ready
   */
  isReadyForSubmission() {
    const validation = this.validate();
    return validation.isValid && this.status === 'draft';
  }

  /**
   * Mark as submitted
   */
  markAsSubmitted() {
    this.status = 'submitted';
    this.submissionDate = new Date().toISOString();
    this.lastModified = new Date().toISOString();
  }

  /**
   * Get duration of stay in days
   * @returns {number} - Duration in days
   */
  getStayDuration() {
    if (!this.arrivalDate || !this.departureDate) return null;

    const arrival = new Date(this.arrivalDate);
    const departure = new Date(this.departureDate);
    const diffTime = departure - arrival;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if travel dates are in the future
   * @returns {boolean} - Is upcoming travel
   */
  isUpcomingTravel() {
    if (!this.arrivalDate) return false;
    const arrival = new Date(this.arrivalDate);
    const now = new Date();
    return arrival > now;
  }

  /**
   * Get days until arrival
   * @returns {number} - Days until arrival (negative if past)
   */
  getDaysUntilArrival() {
    if (!this.arrivalDate) return null;
    const arrival = new Date(this.arrivalDate);
    const now = new Date();
    const diffTime = arrival - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
  static async load(id) {
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
        destination: this.destination,
        purpose: this.purpose,
        arrivalDate: this.arrivalDate,
        departureDate: this.departureDate,
        flightNumber: this.flightNumber,
        accommodation: this.accommodation,
        immigrationNotes: this.immigrationNotes,
        specialRequirements: this.specialRequirements,
        fundingProof: this.fundingProof,
        submissionDate: this.submissionDate,
        generatedAt: this.generatedAt,
        lastModified: this.lastModified,

        // Metadata
        metadata: {
          stayDuration: this.getStayDuration(),
          isUpcomingTravel: this.isUpcomingTravel(),
          daysUntilArrival: this.getDaysUntilArrival(),
          isReadyForSubmission: this.isReadyForSubmission()
        }
      };

      // Load related data if IDs are available
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
          destination: completeData.destination,
          purpose: completeData.purpose,
          arrivalDate: completeData.arrivalDate,
          departureDate: completeData.departureDate,
          flightNumber: completeData.flightNumber,
          accommodation: completeData.accommodation,
          immigrationNotes: completeData.immigrationNotes,
          specialRequirements: completeData.specialRequirements,
          status: completeData.status,
          submissionDate: completeData.submissionDate,
          generatedAt: completeData.generatedAt,
          lastModified: completeData.lastModified
        },
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
      destination: this.destination?.name || 'Unknown',
      arrivalDate: this.arrivalDate,
      departureDate: this.departureDate,
      flightNumber: this.flightNumber,
      status: this.status,
      stayDuration: this.getStayDuration(),
      isUpcomingTravel: this.isUpcomingTravel(),
      daysUntilArrival: this.getDaysUntilArrival(),
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
  static fromUserInput(inputData, userId, passportId = null, personalInfoId = null) {
    return new EntryData({
      userId,
      passportId,
      personalInfoId,
      destination: inputData.destination,
      purpose: inputData.purpose,
      arrivalDate: inputData.arrivalDate,
      departureDate: inputData.departureDate,
      flightNumber: inputData.flightNumber,
      accommodation: inputData.accommodation,
      fundingProof: inputData.fundingProof || {},
      immigrationNotes: inputData.immigrationNotes,
      specialRequirements: inputData.specialRequirements
    });
  }

  /**
   * Get display title for entry data
   * @returns {string} - Display title
   */
  getDisplayTitle() {
    const destination = this.destination?.name || 'Unknown Destination';
    const date = this.arrivalDate || 'No Date';
    return `${destination} - ${date}`;
  }
}

export default EntryData;