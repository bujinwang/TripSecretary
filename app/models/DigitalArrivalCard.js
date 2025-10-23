/**
 * DigitalArrivalCard Model - Generic model for all Digital Arrival Cards (TDAC, MDAC, SDAC, HKDAC)
 * Replaces the old TDACSubmission model.
 */

import SecureStorageService from '../services/security/SecureStorageService';

class DigitalArrivalCard {
  constructor(data = {}) {
    this.id = data.id || DigitalArrivalCard.generateId();
    this.entryInfoId = data.entryInfoId;
    this.userId = data.userId;
    this.cardType = data.cardType; // e.g., 'TDAC', 'MDAC', 'SDAC', 'HKDAC'
    this.destinationId = data.destinationId;
    this.arrCardNo = data.arrCardNo || null;
    this.qrUri = data.qrUri || null;
    this.pdfUrl = data.pdfUrl || null;
    this.submittedAt = data.submittedAt || new Date().toISOString();
    this.submissionMethod = data.submissionMethod || 'api';
    this.status = data.status || 'success'; // e.g., 'success', 'failed', 'pending'
    this.apiResponse = data.apiResponse || null; // JSON string or object
    this.processingTime = data.processingTime || null;
    this.retryCount = data.retryCount || 0;
    this.errorDetails = data.errorDetails || null; // JSON string or object
    this.isSuperseded = data.isSuperseded || 0;
    this.supersededAt = data.supersededAt || null;
    this.supersededBy = data.supersededBy || null;
    this.supersededReason = data.supersededReason || null;
    this.version = data.version || 1;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Generate unique ID for DigitalArrivalCard
   * @returns {string} - Unique ID
   */
  static generateId() {
    return `dac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save DigitalArrivalCard to secure storage
   * @returns {Promise<Object>} - Save result
   */
  async save() {
    try {
      this.updatedAt = new Date().toISOString();
      const result = await SecureStorageService.saveDigitalArrivalCard({
        id: this.id,
        entryInfoId: this.entryInfoId,
        userId: this.userId,
        cardType: this.cardType,
        destinationId: this.destinationId,
        arrCardNo: this.arrCardNo,
        qrUri: this.qrUri,
        pdfUrl: this.pdfUrl,
        submittedAt: this.submittedAt,
        submissionMethod: this.submissionMethod,
        status: this.status,
        apiResponse: this.apiResponse ? JSON.stringify(this.apiResponse) : null,
        processingTime: this.processingTime,
        retryCount: this.retryCount,
        errorDetails: this.errorDetails ? JSON.stringify(this.errorDetails) : null,
        isSuperseded: this.isSuperseded,
        supersededAt: this.supersededAt,
        supersededBy: this.supersededBy,
        supersededReason: this.supersededReason,
        version: this.version,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      });
      return result;
    } catch (error) {
      console.error('Failed to save DigitalArrivalCard:', error);
      throw error;
    }
  }

  /**
   * Load DigitalArrivalCard from secure storage by ID
   * @param {string} id - DigitalArrivalCard ID
   * @returns {Promise<DigitalArrivalCard|null>} - DigitalArrivalCard instance or null
   */
  static async load(id) {
    try {
      const data = await SecureStorageService.getDigitalArrivalCard(id);
      if (!data) {
        return null;
      }
      return new DigitalArrivalCard({
        ...data,
        apiResponse: data.apiResponse ? JSON.parse(data.apiResponse) : null,
        errorDetails: data.errorDetails ? JSON.parse(data.errorDetails) : null,
      });
    } catch (error) {
      console.error('Failed to load DigitalArrivalCard:', error);
      throw error;
    }
  }

  /**
   * Get all DigitalArrivalCards for a given entryInfoId
   * @param {string} entryInfoId - EntryInfo ID
   * @returns {Promise<Array<DigitalArrivalCard>>} - Array of DigitalArrivalCard instances
   */
  static async getByEntryInfoId(entryInfoId) {
    try {
      const data = await SecureStorageService.getDigitalArrivalCardsByEntryInfoId(entryInfoId);
      return data.map(item => new DigitalArrivalCard({
        ...item,
        apiResponse: item.apiResponse ? JSON.parse(item.apiResponse) : null,
        errorDetails: item.errorDetails ? JSON.parse(item.errorDetails) : null,
      }));
    } catch (error) {
      console.error('Failed to get DigitalArrivalCards by entryInfoId:', error);
      throw error;
    }
  }

  /**
   * Get the latest successful DigitalArrivalCard for a given entryInfoId and cardType
   * @param {string} entryInfoId - EntryInfo ID
   * @param {string} cardType - Card type (e.g., 'TDAC')
   * @returns {Promise<DigitalArrivalCard|null>} - Latest successful DigitalArrivalCard instance or null
   */
  static async getLatestSuccessful(entryInfoId, cardType) {
    try {
      const data = await SecureStorageService.getLatestSuccessfulDigitalArrivalCard(entryInfoId, cardType);
      if (!data) {
        return null;
      }
      return new DigitalArrivalCard({
        ...data,
        apiResponse: data.apiResponse ? JSON.parse(data.apiResponse) : null,
        errorDetails: data.errorDetails ? JSON.parse(data.errorDetails) : null,
      });
    } catch (error) {
      console.error('Failed to get latest successful DigitalArrivalCard:', error);
      throw error;
    }
  }

  /**
   * Mark a DigitalArrivalCard as superseded
   * @param {string} id - ID of the card to supersede
   * @param {string} supersededBy - ID of the card that superseded it
   * @param {string} reason - Reason for superseding
   * @returns {Promise<Object>} - Update result
   */
  async markAsSuperseded(supersededBy, reason) {
    try {
      this.isSuperseded = 1;
      this.supersededAt = new Date().toISOString();
      this.supersededBy = supersededBy;
      this.supersededReason = reason;
      return await this.save();
    } catch (error) {
      console.error('Failed to mark DigitalArrivalCard as superseded:', error);
      throw error;
    }
  }

  /**
   * Get a summary of the DigitalArrivalCard for display
   * @returns {Object} - Summary object
   */
  getSummary() {
    return {
      id: this.id,
      cardType: this.cardType,
      destinationId: this.destinationId,
      arrCardNo: this.arrCardNo,
      status: this.status,
      submittedAt: this.submittedAt,
      isSuperseded: this.isSuperseded === 1,
      qrUri: this.qrUri,
      pdfUrl: this.pdfUrl,
    };
  }
}

export default DigitalArrivalCard;
