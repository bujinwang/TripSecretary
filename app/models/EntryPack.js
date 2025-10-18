/**
 * EntryPack Model - Complete travel document package
 * Represents a complete entry pack with TDAC submission, documents, and display status
 * 
 * Requirements: 4.1-4.6, 10.1-10.6, 13.1-13.6
 */

class EntryPack {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.entryInfoId = data.entryInfoId;
    this.userId = data.userId;
    this.destinationId = data.destinationId;
    this.tripId = data.tripId;
    
    // TDAC submission data
    this.tdacSubmission = data.tdacSubmission || {
      arrCardNo: null,
      qrUri: null,
      pdfPath: null,
      submittedAt: null,
      submissionMethod: null // 'api', 'webview', 'hybrid'
    };
    
    // Submission history - tracks all attempts
    this.submissionHistory = data.submissionHistory || [];
    
    // Documents and assets
    this.documents = data.documents || {
      qrCodeImage: null,
      pdfDocument: null,
      entryCardImage: null
    };
    
    // Display status for UI
    this.displayStatus = data.displayStatus || {
      completionPercent: 0,
      categoryStates: {
        passport: 'missing',
        personalInfo: 'missing', 
        funds: 'missing',
        travel: 'missing'
      },
      countdownMessage: null,
      ctaState: 'disabled', // 'disabled', 'enabled', 'resubmit'
      showQR: false,
      showGuide: false
    };
    
    // Entry pack status
    this.status = data.status || 'in_progress'; // in_progress, submitted, superseded, completed, expired, archived
    
    // Timestamps
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.archivedAt = data.archivedAt || null;
  }

  /**
   * Generate unique entry pack ID
   * @returns {string} - Unique ID
   */
  generateId() {
    return `pack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update TDAC submission data
   * @param {Object} submissionData - TDAC submission result
   * @param {string} method - Submission method ('api', 'webview', 'hybrid')
   */
  updateTDACSubmission(submissionData, method = 'api') {
    const submission = {
      arrCardNo: submissionData.arrCardNo,
      qrUri: submissionData.qrUri,
      pdfPath: submissionData.pdfPath,
      submittedAt: new Date().toISOString(),
      submissionMethod: method,
      status: 'success'
    };

    // Update current submission
    this.tdacSubmission = submission;
    
    // Add to submission history
    this.submissionHistory.push({
      ...submission,
      attemptNumber: this.submissionHistory.length + 1,
      id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    });

    // Update status
    this.status = 'submitted';
    this.updatedAt = new Date().toISOString();

    console.log('TDAC submission updated:', {
      entryPackId: this.id,
      arrCardNo: submission.arrCardNo,
      method: method,
      attemptNumber: this.submissionHistory.length
    });
  }

  /**
   * Record failed TDAC submission attempt
   * @param {Object} error - Error details
   * @param {string} method - Submission method
   */
  recordFailedSubmission(error, method = 'api') {
    const failedAttempt = {
      submittedAt: new Date().toISOString(),
      submissionMethod: method,
      status: 'failed',
      error: {
        code: error.code || 'unknown',
        message: error.message || 'Submission failed',
        details: error.details || null
      },
      attemptNumber: this.submissionHistory.length + 1,
      id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    };

    // Add to submission history
    this.submissionHistory.push(failedAttempt);
    this.updatedAt = new Date().toISOString();

    console.log('Failed TDAC submission recorded:', {
      entryPackId: this.id,
      error: error.message,
      method: method,
      attemptNumber: this.submissionHistory.length
    });
  }

  /**
   * Update display status for UI
   * @param {Object} statusData - Display status data
   */
  updateDisplayStatus(statusData) {
    this.displayStatus = {
      ...this.displayStatus,
      ...statusData,
      lastUpdated: new Date().toISOString()
    };
    
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Mark as superseded (when user edits after submission)
   */
  markAsSuperseded() {
    if (this.status !== 'submitted') {
      throw new Error('Can only mark submitted entry packs as superseded');
    }

    this.status = 'superseded';
    this.updatedAt = new Date().toISOString();
    
    // Update display status
    this.displayStatus.ctaState = 'resubmit';
    this.displayStatus.showQR = false;
    this.displayStatus.showGuide = false;

    console.log('Entry pack marked as superseded:', {
      entryPackId: this.id,
      previousStatus: 'submitted'
    });
  }

  /**
   * Mark as completed (user finished immigration process)
   */
  markAsCompleted() {
    this.status = 'completed';
    this.updatedAt = new Date().toISOString();

    console.log('Entry pack marked as completed:', {
      entryPackId: this.id
    });
  }

  /**
   * Mark as expired
   */
  markAsExpired() {
    this.status = 'expired';
    this.updatedAt = new Date().toISOString();

    console.log('Entry pack marked as expired:', {
      entryPackId: this.id
    });
  }

  /**
   * Archive entry pack
   * @param {string} reason - Archive reason ('manual', 'auto', 'completed', 'expired')
   */
  archive(reason = 'manual') {
    this.status = 'archived';
    this.archivedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();

    console.log('Entry pack archived:', {
      entryPackId: this.id,
      reason: reason,
      archivedAt: this.archivedAt
    });
  }

  /**
   * Get most recent successful TDAC submission
   * @returns {Object|null} - Most recent successful submission
   */
  getMostRecentSuccessfulSubmission() {
    const successfulSubmissions = this.submissionHistory.filter(s => s.status === 'success');
    return successfulSubmissions.length > 0 ? successfulSubmissions[successfulSubmissions.length - 1] : null;
  }

  /**
   * Get submission attempt count
   * @returns {number} - Number of submission attempts
   */
  getSubmissionAttemptCount() {
    return this.submissionHistory.length;
  }

  /**
   * Get failed submission count
   * @returns {number} - Number of failed submissions
   */
  getFailedSubmissionCount() {
    return this.submissionHistory.filter(s => s.status === 'failed').length;
  }

  /**
   * Check if entry pack has valid TDAC submission
   * @returns {boolean} - Has valid submission
   */
  hasValidTDACSubmission() {
    return this.status === 'submitted' && 
           this.tdacSubmission.arrCardNo && 
           this.tdacSubmission.qrUri;
  }

  /**
   * Check if entry pack can be edited
   * @returns {boolean} - Can be edited
   */
  canBeEdited() {
    return ['in_progress', 'superseded'].includes(this.status);
  }

  /**
   * Check if entry pack requires resubmission
   * @returns {boolean} - Requires resubmission
   */
  requiresResubmission() {
    return this.status === 'superseded';
  }

  /**
   * Check if entry pack is active (should show on home screen)
   * @returns {boolean} - Is active
   */
  isActive() {
    return ['in_progress', 'submitted'].includes(this.status);
  }

  /**
   * Check if entry pack is historical (should show in history)
   * @returns {boolean} - Is historical
   */
  isHistorical() {
    return ['completed', 'expired', 'archived'].includes(this.status);
  }

  /**
   * Get display status for UI
   * @returns {Object} - Display status with color and message
   */
  getDisplayStatus() {
    const statusMap = {
      in_progress: { color: 'orange', message: '进行中', icon: '⚠️' },
      submitted: { color: 'green', message: '已提交', icon: '✅' },
      superseded: { color: 'red', message: '需要重新提交', icon: '🔄' },
      completed: { color: 'blue', message: '已完成', icon: '🎉' },
      expired: { color: 'gray', message: '已过期', icon: '⏰' },
      archived: { color: 'gray', message: '已归档', icon: '📁' }
    };

    return statusMap[this.status] || statusMap.in_progress;
  }

  /**
   * Validate entry pack data
   * @returns {Object} - Validation result
   */
  validate() {
    const errors = [];

    if (!this.entryInfoId) {
      errors.push('Entry info ID is required');
    }

    if (!this.userId) {
      errors.push('User ID is required');
    }

    if (!this.destinationId) {
      errors.push('Destination ID is required');
    }

    // Validate TDAC submission if status is submitted
    if (this.status === 'submitted') {
      if (!this.tdacSubmission.arrCardNo) {
        errors.push('TDAC arrival card number is required for submitted packs');
      }
      
      if (!this.tdacSubmission.qrUri) {
        errors.push('TDAC QR URI is required for submitted packs');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Save entry pack to storage
   * @param {Object} options - Save options
   * @returns {Promise<Object>} - Save result
   */
  async save(options = {}) {
    try {
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

      // Save to storage
      const result = await SecureStorageService.saveEntryPack(this);
      
      console.log('Entry pack saved successfully:', {
        id: this.id,
        status: this.status,
        hasSubmission: this.hasValidTDACSubmission()
      });

      return result;
    } catch (error) {
      console.error('Failed to save entry pack:', error);
      throw error;
    }
  }

  /**
   * Load entry pack by ID
   * @param {string} id - Entry pack ID
   * @returns {Promise<EntryPack|null>} - Entry pack instance
   */
  static async load(id) {
    try {
      const SecureStorageService = require('../services/security/SecureStorageService').default;
      const data = await SecureStorageService.getEntryPack(id);
      
      return data ? new EntryPack(data) : null;
    } catch (error) {
      console.error('Failed to load entry pack:', error);
      throw error;
    }
  }

  /**
   * Load entry packs by user ID
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - Array of entry packs
   */
  static async loadByUserId(userId, filters = {}) {
    try {
      const SecureStorageService = require('../services/security/SecureStorageService').default;
      const packs = await SecureStorageService.getEntryPacksByUserId(userId);
      
      let filteredPacks = (packs || []).map(pack => new EntryPack(pack));

      // Apply filters
      if (filters.status) {
        filteredPacks = filteredPacks.filter(pack => pack.status === filters.status);
      }

      if (filters.destinationId) {
        filteredPacks = filteredPacks.filter(pack => pack.destinationId === filters.destinationId);
      }

      if (filters.active) {
        filteredPacks = filteredPacks.filter(pack => pack.isActive());
      }

      if (filters.historical) {
        filteredPacks = filteredPacks.filter(pack => pack.isHistorical());
      }

      // Sort by creation date (newest first)
      filteredPacks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return filteredPacks;
    } catch (error) {
      console.error('Failed to load entry packs by user ID:', error);
      throw error;
    }
  }

  /**
   * Delete entry pack
   * @returns {Promise<Object>} - Delete result
   */
  async delete() {
    try {
      // Handle snapshot cleanup before deleting entry pack
      const EntryPackService = require('../services/entryPack/EntryPackService').default;
      const snapshotCleanup = await EntryPackService.handleSnapshotCleanupOnDeletion(this.id, this.userId);
      
      const SecureStorageService = require('../services/security/SecureStorageService').default;
      const result = await SecureStorageService.deleteEntryPack(this.id);
      
      console.log('Entry pack deleted:', {
        id: this.id,
        status: this.status,
        snapshotCleanup: snapshotCleanup
      });

      return {
        ...result,
        snapshotCleanup: snapshotCleanup
      };
    } catch (error) {
      console.error('Failed to delete entry pack:', error);
      throw error;
    }
  }

  /**
   * Get summary for display
   * @returns {Object} - Entry pack summary
   */
  getSummary() {
    return {
      id: this.id,
      entryInfoId: this.entryInfoId,
      userId: this.userId,
      destinationId: this.destinationId,
      tripId: this.tripId,
      status: this.status,
      displayStatus: this.getDisplayStatus(),
      hasValidSubmission: this.hasValidTDACSubmission(),
      submissionAttempts: this.getSubmissionAttemptCount(),
      failedAttempts: this.getFailedSubmissionCount(),
      canBeEdited: this.canBeEdited(),
      requiresResubmission: this.requiresResubmission(),
      isActive: this.isActive(),
      isHistorical: this.isHistorical(),
      completionPercent: this.displayStatus.completionPercent,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      archivedAt: this.archivedAt,
      tdacSubmission: this.hasValidTDACSubmission() ? {
        arrCardNo: this.tdacSubmission.arrCardNo,
        submittedAt: this.tdacSubmission.submittedAt,
        submissionMethod: this.tdacSubmission.submissionMethod
      } : null
    };
  }

  /**
   * Export entry pack data for GDPR compliance
   * @returns {Object} - Exportable data
   */
  exportData() {
    return {
      id: this.id,
      entryInfoId: this.entryInfoId,
      userId: this.userId,
      destinationId: this.destinationId,
      tripId: this.tripId,
      status: this.status,
      tdacSubmission: this.tdacSubmission,
      submissionHistory: this.submissionHistory,
      documents: this.documents,
      displayStatus: this.displayStatus,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      archivedAt: this.archivedAt,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Convert to JSON for serialization
   * @returns {Object} - JSON representation
   */
  toJSON() {
    return this.exportData();
  }
}

export default EntryPack;