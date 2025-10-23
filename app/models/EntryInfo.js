/**
 * EntryInfo Model - Progressive Entry Information Flow
 * Extends EntryData with completion tracking, status management, and progressive filling support
 *
 * Requirements: 1.4, 2.1-2.6, 4.1-4.6
 */

import EntryData from './EntryData';
import SecureStorageService from '../services/security/SecureStorageService';

class EntryInfo extends EntryData {
  constructor(data = {}) {
    super(data);
    
    // Progressive entry flow specific fields
    this.completionMetrics = data.completionMetrics || {
      passport: { complete: 0, total: 5, state: 'missing' }, // passportNo, fullName, nationality, dob, expiryDate
      personalInfo: { complete: 0, total: 6, state: 'missing' }, // occupation, provinceCity, countryRegion, phoneNumber, email, gender
      funds: { complete: 0, total: 1, state: 'missing' }, // at least 1 fund item
      travel: { complete: 0, total: 6, state: 'missing' } // travelPurpose, arrivalArrivalDate, departureDepartureDate, arrivalFlightNumber, departureFlightNumber, accommodation
    };
    
    // Entry pack status: incomplete, ready, submitted, superseded, expired, archived
    this.status = data.status || 'incomplete';
    
    // Timestamp tracking
    this.lastUpdatedAt = data.lastUpdatedAt || new Date().toISOString();
    
    // Documents and display status (NEW in v2.0)
    this.documents = data.documents || null; // JSON string or object
    this.displayStatus = data.displayStatus || null; // JSON string or object

    // Travel info reference (NEW in v2.0)
    this.travelInfoId = data.travelInfoId || null; // Link to travel_info table

    // Destination context
    this.destinationId = data.destinationId || null;
  }



  /**
   * Update completion metrics based on current data
   * @param {Object} passport - Passport data
   * @param {Object} personalInfo - Personal info data
   * @param {Array} funds - Fund items array
   * @param {Object} travel - Travel info data
   * @returns {Object} - Updated completion metrics
   */
  updateCompletionMetrics(passport = {}, personalInfo = {}, funds = [], travel = {}) {
    // Passport completion (5 required fields)
    const passportFields = ['passportNumber', 'fullName', 'nationality', 'dateOfBirth', 'expiryDate'];
    const passportComplete = passportFields.filter(field => passport[field] && passport[field].trim()).length;
    this.completionMetrics.passport = {
      complete: passportComplete,
      total: 5,
      state: passportComplete === 5 ? 'complete' : passportComplete > 0 ? 'partial' : 'missing'
    };

    // Personal info completion (6 required fields)
    const personalFields = ['occupation', 'provinceCity', 'countryRegion', 'phoneNumber', 'email', 'gender'];
    const personalComplete = personalFields.filter(field => {
      let value = personalInfo[field];
      if ((!value || (typeof value === 'string' && !value.trim())) && field === 'gender') {
        value = personalInfo.sex;
      }

      if (typeof value === 'string') {
        return value.trim().length > 0;
      }

      return Boolean(value);
    }).length;
    this.completionMetrics.personalInfo = {
      complete: personalComplete,
      total: 6,
      state: personalComplete === 6 ? 'complete' : personalComplete > 0 ? 'partial' : 'missing'
    };

    // Funds completion (at least 1 fund item with type, amount, currency)
    const validFunds = funds.filter(fund => 
      fund.type && fund.amount && fund.currency
    ).length;
    this.completionMetrics.funds = {
      complete: validFunds > 0 ? 1 : 0,
      total: 1,
      state: validFunds > 0 ? 'complete' : 'missing'
    };

    // Travel completion (6 required fields)
    const travelFields = ['travelPurpose', 'arrivalArrivalDate', 'departureDepartureDate', 'arrivalFlightNumber', 'departureFlightNumber', 'hotelName'];
    const travelComplete = travelFields.filter(field => {
      const value = travel[field];
      return value && (typeof value === 'string' ? value.trim() : true);
    }).length;
    this.completionMetrics.travel = {
      complete: travelComplete,
      total: 6,
      state: travelComplete === 6 ? 'complete' : travelComplete > 0 ? 'partial' : 'missing'
    };

    // Update timestamp
    this.lastUpdatedAt = new Date().toISOString();

    return this.completionMetrics;
  }

  /**
   * Get total completion percentage
   * @returns {number} - Completion percentage (0-100)
   */
  getTotalCompletionPercent() {
    const totalComplete = Object.values(this.completionMetrics).reduce((sum, metric) => sum + metric.complete, 0);
    const totalRequired = Object.values(this.completionMetrics).reduce((sum, metric) => sum + metric.total, 0);
    
    return totalRequired > 0 ? Math.round((totalComplete / totalRequired) * 100) : 0;
  }

  /**
   * Check if entry info is ready for TDAC submission
   * @returns {boolean} - Is ready for submission
   */
  isReadyForSubmission() {
    return Object.values(this.completionMetrics).every(metric => metric.state === 'complete');
  }

  /**
   * Get missing fields by category
   * @returns {Object} - Missing fields grouped by category
   */
  getMissingFields() {
    const missing = {
      passport: [],
      personalInfo: [],
      funds: [],
      travel: []
    };

    // Passport missing fields
    if (this.completionMetrics.passport.state !== 'complete') {
      const passportFields = ['passportNumber', 'fullName', 'nationality', 'dateOfBirth', 'expiryDate'];
      missing.passport = passportFields.filter(field => !this.hasValidField('passport', field));
    }

    // Personal info missing fields
    if (this.completionMetrics.personalInfo.state !== 'complete') {
      const personalFields = ['occupation', 'provinceCity', 'countryRegion', 'phoneNumber', 'email', 'gender'];
      missing.personalInfo = personalFields.filter(field => !this.hasValidField('personalInfo', field));
    }

    // Funds missing
    if (this.completionMetrics.funds.state !== 'complete') {
      missing.funds = ['At least one fund item with type, amount, and currency'];
    }

    // Travel missing fields
    if (this.completionMetrics.travel.state !== 'complete') {
      const travelFields = ['travelPurpose', 'arrivalArrivalDate', 'departureDepartureDate', 'arrivalFlightNumber', 'departureFlightNumber', 'hotelName'];
      missing.travel = travelFields.filter(field => !this.hasValidField('travel', field));
    }

    return missing;
  }

  /**
   * Helper method to check if a field has valid data
   * @param {string} category - Data category
   * @param {string} field - Field name
   * @returns {boolean} - Has valid field
   */
  hasValidField(category, field) {
    // This is a placeholder - in real implementation, this would check actual data
    // For now, we'll assume fields are missing unless explicitly set
    return false;
  }

  /**
   * Update entry status
   * @param {string} newStatus - New status
   * @param {string} reason - Reason for status change
   */
  updateStatus(newStatus, reason = null) {
    const validStatuses = ['incomplete', 'ready', 'submitted', 'superseded', 'expired', 'archived'];
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    const oldStatus = this.status;
    this.status = newStatus;
    this.lastUpdatedAt = new Date().toISOString();

    // Log status change for audit trail
    console.log(`EntryInfo status changed: ${oldStatus} -> ${newStatus}`, {
      id: this.id,
      reason,
      timestamp: this.lastUpdatedAt
    });
  }

  /**
   * Mark as ready for submission
   */
  markAsReady() {
    if (this.isReadyForSubmission()) {
      this.updateStatus('ready', 'All required fields completed');
    } else {
      throw new Error('Cannot mark as ready: missing required fields');
    }
  }

  /**
   * Mark as submitted
   * @param {Object} submissionMetadata - Submission metadata (e.g., from digital_arrival_cards)
   */
  markAsSubmitted(submissionMetadata = {}) {
    this.updateStatus('submitted', 'Submission successful');
    // No longer storing submission details directly in EntryInfo
    // These are now managed in the digital_arrival_cards table
  }

  /**
   * Mark as superseded (when user edits after submission)
   */
  markAsSuperseded() {
    if (this.status === 'submitted') {
      this.updateStatus('superseded', 'User edited data after submission');
    } else {
      throw new Error('Can only mark submitted entries as superseded');
    }
  }

  /**
   * Mark as expired
   */
  markAsExpired() {
    this.updateStatus('expired', 'Entry pack expired');
  }

  /**
   * Mark as archived
   * @param {string} reason - Archive reason
   */
  markAsArchived(reason = 'manual') {
    this.updateStatus('archived', reason);
  }

  /**
   * Check if entry can be edited
   * @returns {boolean} - Can be edited
   */
  canBeEdited() {
    return ['incomplete', 'ready', 'superseded'].includes(this.status);
  }

  /**
   * Check if entry requires resubmission
   * @returns {boolean} - Requires resubmission
   */
  requiresResubmission() {
    return this.status === 'superseded';
  }

  /**
   * Get display status for UI
   * @returns {Object} - Display status with color and message
   */
  getDisplayStatus() {
    const statusMap = {
      incomplete: { color: 'orange', message: '进行中', icon: '⚠️' },
      ready: { color: 'green', message: '准备就绪', icon: '✅' },
      submitted: { color: 'blue', message: '已提交', icon: '📋' },
      superseded: { color: 'red', message: '需要重新提交', icon: '🔄' },
      expired: { color: 'gray', message: '已过期', icon: '⏰' },
      archived: { color: 'gray', message: '已归档', icon: '📁' }
    };

    return statusMap[this.status] || statusMap.incomplete;
  }

  /**
   * Save entry info with progressive support
   * @param {Object} options - Save options
   * @returns {Promise<Object>} - Save result
   */
  async save(options = {}) {
    try {
      // Always allow saving for progressive filling (skip validation by default)
      const saveOptions = { skipValidation: true, ...options };

      // Update timestamp
      this.lastUpdatedAt = new Date().toISOString();

      // Save to secure storage with Schema v2.0 fields
      const result = await SecureStorageService.saveEntryInfo({
        id: this.id,
        userId: this.userId,
        passportId: this.passportId,
        personalInfoId: this.personalInfoId,
        travelInfoId: this.travelInfoId, // NEW: Schema v2.0 field
        destinationId: this.destinationId,
        status: this.status,
        completionMetrics: JSON.stringify(this.completionMetrics),
        documents: this.documents, // NEW: Schema v2.0 field
        displayStatus: this.displayStatus, // NEW: Schema v2.0 field
        lastUpdatedAt: this.lastUpdatedAt,
        createdAt: this.createdAt || new Date().toISOString()
      });

      return {
        ...result,
        completionPercent: this.getTotalCompletionPercent(),
        status: this.status,
        isReady: this.isReadyForSubmission()
      };
    } catch (error) {
      console.error('Failed to save EntryInfo:', error);
      throw error;
    }
  }

  /**
   * Load EntryInfo with completion metrics
   * @param {string} id - Entry info ID
   * @returns {Promise<EntryInfo>} - EntryInfo instance
   */
  static async load(id) {
    try {
      // Load from secure storage with Schema v2.0 fields
      const data = await SecureStorageService.getEntryInfo(id);

      if (!data) {
        return null;
      }

      // Convert to EntryInfo
      const entryInfo = new EntryInfo({
        ...data,
        completionMetrics: data.completionMetrics ? JSON.parse(data.completionMetrics) : {},
        documents: data.documents,
        displayStatus: data.displayStatus,
        travelInfoId: data.travelInfoId // NEW: Schema v2.0 field
      });

      return entryInfo;
    } catch (error) {
      console.error('Failed to load EntryInfo:', error);
      throw error;
    }
  }

  /**
   * Create EntryInfo from user input with progressive support
   * @param {Object} inputData - User input data
   * @param {string} userId - User ID
   * @param {string} destinationId - Destination ID
   * @returns {EntryInfo} - EntryInfo instance
   */
  static fromUserInput(inputData, userId, destinationId = null) {
    const entryInfo = new EntryInfo({
      userId,
      destinationId,
      travelInfoId: inputData.travelInfoId || null, // NEW: Include travel info reference
      ...inputData
    });

    return entryInfo;
  }

  /**
   * Get summary for dashboard display
   * @returns {Object} - Entry info summary
   */
  getSummary() {
    const baseSummary = super.getSummary();

    return {
      ...baseSummary,
      completionPercent: this.getTotalCompletionPercent(),
      completionMetrics: this.completionMetrics,
      status: this.status,
      displayStatus: this.displayStatus, // Use the stored displayStatus
      documents: this.documents, // Include documents
      travelInfoId: this.travelInfoId, // Include travel info reference
      isReady: this.isReadyForSubmission(),
      canBeEdited: this.canBeEdited(),
      requiresResubmission: this.requiresResubmission(),
      missingFields: this.getMissingFields(),
      lastUpdatedAt: this.lastUpdatedAt,
      destinationId: this.destinationId
    };
  }

  /**
   * Get the latest successful DigitalArrivalCard for a specific card type
   * @param {string} cardType - Card type (e.g., 'TDAC', 'MDAC', 'SDAC', 'HKDAC')
   * @returns {Promise<DigitalArrivalCard|null>} - Latest successful DAC or null
   */
  async getLatestDigitalArrivalCard(cardType) {
    try {
      const DigitalArrivalCard = (await import('./DigitalArrivalCard')).default;
      return await DigitalArrivalCard.getLatestSuccessful(this.id, cardType);
    } catch (error) {
      console.error('Failed to get latest DigitalArrivalCard:', error);
      throw error;
    }
  }

  /**
   * Get all DigitalArrivalCards for this entry info
   * @returns {Promise<Array<DigitalArrivalCard>>} - Array of DAC instances
   */
  async getAllDigitalArrivalCards() {
    try {
      const DigitalArrivalCard = (await import('./DigitalArrivalCard')).default;
      const results = await DigitalArrivalCard.getByEntryInfoId(this.id);
      return results || []; // Return empty array if results is undefined
    } catch (error) {
      console.error('Failed to get DigitalArrivalCards:', error);
      throw error;
    }
  }

  /**
   * Get the latest DigitalArrivalCard for a specific card type
   * @param {string} cardType - Card type (e.g., 'TDAC', 'MDAC', 'SDAC', 'HKDAC')
   * @returns {Promise<DigitalArrivalCard|null>} - Latest DAC for the type or null
   */
  async getLatestDigitalArrivalCardByType(cardType) {
    try {
      const DigitalArrivalCard = (await import('./DigitalArrivalCard')).default;
      return await DigitalArrivalCard.getLatestSuccessful(this.id, cardType);
    } catch (error) {
      console.error('Failed to get latest DigitalArrivalCard by type:', error);
      throw error;
    }
  }

  /**
   * Export EntryInfo data for GDPR compliance
   * @returns {Promise<Object>} - Exportable data
   */
  async exportData() {
    try {
      const baseExport = await super.exportData();

      return {
        ...baseExport,
        progressiveEntryFlow: {
          completionMetrics: this.completionMetrics,
          status: this.status,
          lastUpdatedAt: this.lastUpdatedAt,
          destinationId: this.destinationId,
          passportId: this.passportId,
          personalInfoId: this.personalInfoId,
          travelInfoId: this.travelInfoId, // NEW: Include travel info reference
          fundItemIds: [...this.fundItemIds],
          documents: this.documents,
          displayStatus: this.displayStatus
        }
      };
    } catch (error) {
      console.error('Failed to export EntryInfo data:', error);
      throw error;
    }
  }
}

export default EntryInfo;
