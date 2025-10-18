/**
 * EntryPackSnapshot Model - Immutable historical record of entry packs
 * Creates read-only snapshots when entry packs are archived, completed, or expired
 * 
 * Requirements: 11.1-11.7, 12.1-12.7, 15.1-15.7
 */

class EntryPackSnapshot {
  constructor(data = {}) {
    // Core snapshot identification
    this.snapshotId = data.snapshotId || this.generateSnapshotId();
    this.entryPackId = data.entryPackId;
    this.userId = data.userId;
    this.destinationId = data.destinationId;
    this.tripId = data.tripId;
    
    // Snapshot metadata
    this.status = data.status; // 'completed', 'cancelled', 'expired'
    this.createdAt = data.createdAt || new Date().toISOString();
    this.arrivalDate = data.arrivalDate;
    this.version = data.version || 1;
    
    // Snapshot metadata for audit and debugging
    this.metadata = data.metadata || {
      appVersion: null,
      deviceInfo: null,
      creationMethod: 'auto', // 'auto' or 'manual'
      snapshotReason: null // 'completed', 'expired', 'cancelled', 'manual_archive'
    };

    // Complete data copies (immutable)
    this.passport = data.passport ? this.deepFreeze({ ...data.passport }) : null;
    this.personalInfo = data.personalInfo ? this.deepFreeze({ ...data.personalInfo }) : null;
    this.funds = data.funds ? this.deepFreeze([...data.funds]) : [];
    this.travel = data.travel ? this.deepFreeze({ ...data.travel }) : null;
    
    // TDAC submission data (most recent successful submission or null)
    this.tdacSubmission = data.tdacSubmission ? this.deepFreeze({ ...data.tdacSubmission }) : null;
    
    // Completeness indicator showing which sections were filled
    this.completenessIndicator = data.completenessIndicator || {
      passport: false,
      personalInfo: false,
      funds: false,
      travel: false,
      overall: 0 // percentage
    };
    
    // Photo manifest - references to copied photos in snapshot storage
    this.photoManifest = data.photoManifest || [];
    
    // Encryption information (Requirements: 19.1-19.5)
    this.encryptionInfo = data.encryptionInfo || {
      encrypted: false,
      encryptionMethod: null,
      encryptedFilePath: null,
      photosEncrypted: false,
      encryptedPhotoCount: 0
    };
    
    // Make the entire snapshot immutable
    this.deepFreeze(this);
  }

  /**
   * Generate unique snapshot ID
   * @returns {string} - Unique snapshot ID
   */
  generateSnapshotId() {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Deep freeze an object to make it immutable
   * @param {Object} obj - Object to freeze
   * @returns {Object} - Frozen object
   */
  deepFreeze(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // Freeze the object itself
    Object.freeze(obj);

    // Recursively freeze all properties
    Object.getOwnPropertyNames(obj).forEach(prop => {
      if (obj[prop] !== null && typeof obj[prop] === 'object') {
        this.deepFreeze(obj[prop]);
      }
    });

    return obj;
  }

  /**
   * Create snapshot from entry pack data
   * @param {Object} entryPackData - Complete entry pack data
   * @param {string} reason - Snapshot creation reason
   * @param {Object} metadata - Additional metadata
   * @returns {EntryPackSnapshot} - New snapshot instance
   */
  static createFromEntryPack(entryPackData, reason = 'auto', metadata = {}) {
    // Calculate completeness indicator
    const completenessIndicator = {
      passport: !!(entryPackData.passport && entryPackData.passport.passportNumber),
      personalInfo: !!(entryPackData.personalInfo && entryPackData.personalInfo.email),
      funds: !!(entryPackData.funds && entryPackData.funds.length > 0),
      travel: !!(entryPackData.travel && entryPackData.travel.arrivalDate),
      overall: 0
    };

    // Calculate overall completion percentage
    const completedSections = Object.values(completenessIndicator).filter(Boolean).length - 1; // -1 for overall
    completenessIndicator.overall = Math.round((completedSections / 4) * 100);

    // Create photo manifest for fund items
    const photoManifest = [];
    if (entryPackData.funds) {
      entryPackData.funds.forEach((fund, index) => {
        if (fund.photoUri) {
          photoManifest.push({
            fundItemId: fund.id,
            originalPath: fund.photoUri,
            snapshotPath: null, // Will be set when photos are copied
            fileName: `fund_${fund.id}_${Date.now()}.jpg`,
            copiedAt: new Date().toISOString()
          });
        }
      });
    }

    // Get most recent successful TDAC submission
    let tdacSubmission = null;
    if (entryPackData.submissionHistory) {
      const successfulSubmissions = entryPackData.submissionHistory.filter(s => s.status === 'success');
      if (successfulSubmissions.length > 0) {
        tdacSubmission = successfulSubmissions[successfulSubmissions.length - 1];
      }
    } else if (entryPackData.tdacSubmission && entryPackData.tdacSubmission.arrCardNo) {
      tdacSubmission = entryPackData.tdacSubmission;
    }

    const snapshot = new EntryPackSnapshot({
      entryPackId: entryPackData.id,
      userId: entryPackData.userId,
      destinationId: entryPackData.destinationId,
      tripId: entryPackData.tripId,
      status: reason,
      arrivalDate: entryPackData.travel?.arrivalDate || entryPackData.arrivalDate,
      
      // Data copies
      passport: entryPackData.passport,
      personalInfo: entryPackData.personalInfo,
      funds: entryPackData.funds,
      travel: entryPackData.travel,
      tdacSubmission: tdacSubmission,
      
      // Metadata
      completenessIndicator: completenessIndicator,
      photoManifest: photoManifest,
      metadata: {
        appVersion: metadata.appVersion || '1.0.0',
        deviceInfo: metadata.deviceInfo || 'unknown',
        creationMethod: metadata.creationMethod || 'auto',
        snapshotReason: reason
      }
    });

    console.log('Snapshot created from entry pack:', {
      snapshotId: snapshot.snapshotId,
      entryPackId: entryPackData.id,
      reason: reason,
      completeness: completenessIndicator.overall,
      hasPhotos: photoManifest.length > 0,
      hasTDAC: !!tdacSubmission
    });

    return snapshot;
  }

  /**
   * Get completeness indicator as formatted string
   * @returns {string} - Formatted completeness string
   */
  getCompletenessString() {
    const indicators = {
      passport: this.completenessIndicator.passport ? '✓' : '✗',
      personalInfo: this.completenessIndicator.personalInfo ? '✓' : '✗',
      funds: this.completenessIndicator.funds ? '✓' : '✗',
      travel: this.completenessIndicator.travel ? '✓' : '✗'
    };

    return `护照 ${indicators.passport}, 个人信息 ${indicators.personalInfo}, 资金 ${indicators.funds}, 旅行信息 ${indicators.travel}`;
  }

  /**
   * Check if snapshot is complete (all sections filled)
   * @returns {boolean} - Is complete
   */
  isComplete() {
    return this.completenessIndicator.overall === 100;
  }

  /**
   * Check if snapshot has TDAC submission
   * @returns {boolean} - Has TDAC submission
   */
  hasTDACSubmission() {
    return !!(this.tdacSubmission && this.tdacSubmission.arrCardNo);
  }

  /**
   * Get display status for UI
   * @returns {Object} - Display status
   */
  getDisplayStatus() {
    const statusMap = {
      completed: { color: 'green', message: '已完成', icon: '✅' },
      cancelled: { color: 'gray', message: '已取消', icon: '❌' },
      expired: { color: 'orange', message: '已过期', icon: '⏰'  }
    };

    return statusMap[this.status] || { color: 'gray', message: '未知', icon: '❓' };
  }

  /**
   * Get snapshot age in days
   * @returns {number} - Age in days
   */
  getAgeInDays() {
    const now = new Date();
    const created = new Date(this.createdAt);
    const diffTime = Math.abs(now - created);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if snapshot is legacy (created before snapshot feature)
   * @returns {boolean} - Is legacy
   */
  isLegacy() {
    // Snapshots created before version 1.0 are considered legacy
    return !this.version || this.version < 1;
  }

  /**
   * Get photo count
   * @returns {number} - Number of photos in manifest
   */
  getPhotoCount() {
    return this.photoManifest.length;
  }

  /**
   * Get estimated storage size (rough calculation)
   * @returns {number} - Estimated size in bytes
   */
  getEstimatedSize() {
    // Rough estimation based on data complexity
    const baseSize = JSON.stringify(this.exportData()).length;
    const photoEstimate = this.photoManifest.length * 500000; // ~500KB per photo
    return baseSize + photoEstimate;
  }

  /**
   * Validate snapshot data integrity
   * @returns {Object} - Validation result
   */
  validate() {
    const errors = [];

    if (!this.snapshotId) {
      errors.push('Snapshot ID is required');
    }

    if (!this.entryPackId) {
      errors.push('Entry pack ID is required');
    }

    if (!this.userId) {
      errors.push('User ID is required');
    }

    if (!this.status) {
      errors.push('Status is required');
    }

    const validStatuses = ['completed', 'cancelled', 'expired'];
    if (this.status && !validStatuses.includes(this.status)) {
      errors.push(`Invalid status: ${this.status}`);
    }

    if (!this.createdAt) {
      errors.push('Creation date is required');
    }

    // Check data integrity
    if (!this.passport && !this.personalInfo && !this.funds && !this.travel) {
      errors.push('Snapshot must contain at least some data');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Save snapshot to storage
   * @returns {Promise<Object>} - Save result
   */
  async save() {
    try {
      // Validate snapshot
      const validation = this.validate();
      if (!validation.isValid) {
        throw new Error(`Snapshot validation failed: ${validation.errors.join(', ')}`);
      }

      // Get SecureStorageService
      const SecureStorageService = require('../services/security/SecureStorageService').default;

      // Save snapshot to dedicated storage namespace
      const result = await SecureStorageService.saveSnapshot(this);
      
      console.log('Snapshot saved successfully:', {
        snapshotId: this.snapshotId,
        entryPackId: this.entryPackId,
        status: this.status,
        size: this.getEstimatedSize()
      });

      return result;
    } catch (error) {
      console.error('Failed to save snapshot:', error);
      throw error;
    }
  }

  /**
   * Load snapshot by ID
   * @param {string} snapshotId - Snapshot ID
   * @returns {Promise<EntryPackSnapshot|null>} - Snapshot instance
   */
  static async load(snapshotId) {
    try {
      const SecureStorageService = require('../services/security/SecureStorageService').default;
      const data = await SecureStorageService.getSnapshot(snapshotId);
      
      return data ? new EntryPackSnapshot(data) : null;
    } catch (error) {
      console.error('Failed to load snapshot:', error);
      throw error;
    }
  }

  /**
   * Load snapshots by user ID
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - Array of snapshots
   */
  static async loadByUserId(userId, filters = {}) {
    try {
      const SecureStorageService = require('../services/security/SecureStorageService').default;
      const snapshots = await SecureStorageService.getSnapshotsByUserId(userId);
      
      let filteredSnapshots = (snapshots || []).map(snapshot => new EntryPackSnapshot(snapshot));

      // Apply filters
      if (filters.status) {
        filteredSnapshots = filteredSnapshots.filter(snapshot => snapshot.status === filters.status);
      }

      if (filters.destinationId) {
        filteredSnapshots = filteredSnapshots.filter(snapshot => snapshot.destinationId === filters.destinationId);
      }

      if (filters.entryPackId) {
        filteredSnapshots = filteredSnapshots.filter(snapshot => snapshot.entryPackId === filters.entryPackId);
      }

      if (filters.hasSubmission !== undefined) {
        filteredSnapshots = filteredSnapshots.filter(snapshot => snapshot.hasTDACSubmission() === filters.hasSubmission);
      }

      if (filters.minAge) {
        filteredSnapshots = filteredSnapshots.filter(snapshot => snapshot.getAgeInDays() >= filters.minAge);
      }

      if (filters.maxAge) {
        filteredSnapshots = filteredSnapshots.filter(snapshot => snapshot.getAgeInDays() <= filters.maxAge);
      }

      // Sort by creation date (newest first)
      filteredSnapshots.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return filteredSnapshots;
    } catch (error) {
      console.error('Failed to load snapshots by user ID:', error);
      throw error;
    }
  }

  /**
   * Delete snapshot and associated photos
   * @returns {Promise<Object>} - Delete result
   */
  async delete() {
    try {
      const SecureStorageService = require('../services/security/SecureStorageService').default;
      
      // Delete snapshot record and associated photos
      const result = await SecureStorageService.deleteSnapshot(this.snapshotId);
      
      console.log('Snapshot deleted:', {
        snapshotId: this.snapshotId,
        photoCount: this.getPhotoCount()
      });

      return result;
    } catch (error) {
      console.error('Failed to delete snapshot:', error);
      throw error;
    }
  }

  /**
   * Get summary for display
   * @returns {Object} - Snapshot summary
   */
  getSummary() {
    return {
      snapshotId: this.snapshotId,
      entryPackId: this.entryPackId,
      userId: this.userId,
      destinationId: this.destinationId,
      tripId: this.tripId,
      status: this.status,
      displayStatus: this.getDisplayStatus(),
      createdAt: this.createdAt,
      arrivalDate: this.arrivalDate,
      completenessIndicator: this.completenessIndicator,
      completenessString: this.getCompletenessString(),
      isComplete: this.isComplete(),
      hasTDACSubmission: this.hasTDACSubmission(),
      photoCount: this.getPhotoCount(),
      ageInDays: this.getAgeInDays(),
      isLegacy: this.isLegacy(),
      estimatedSize: this.getEstimatedSize(),
      version: this.version,
      metadata: this.metadata
    };
  }

  /**
   * Update photo manifest with encryption info
   * @param {Array} encryptedPhotos - Array of encrypted photo info
   */
  updatePhotoManifest(encryptedPhotos) {
    // Create a new photo manifest (since original is frozen)
    const newManifest = encryptedPhotos.map(photo => ({
      ...photo,
      encrypted: photo.encrypted || false,
      encryptionMethod: photo.encryptionMethod || null,
      encryptedPath: photo.encryptedPath || null
    }));
    
    // Update the manifest (this creates a new frozen object)
    Object.defineProperty(this, 'photoManifest', {
      value: this.deepFreeze(newManifest),
      writable: false,
      enumerable: true,
      configurable: false
    });
    
    // Update encryption info
    const encryptedCount = encryptedPhotos.filter(p => p.encrypted).length;
    this.setEncryptionInfo({
      photosEncrypted: encryptedCount > 0,
      encryptedPhotoCount: encryptedCount
    });
  }

  /**
   * Set encryption information for the snapshot
   * @param {Object} encryptionInfo - Encryption information
   */
  setEncryptionInfo(encryptionInfo) {
    const newEncryptionInfo = {
      ...this.encryptionInfo,
      ...encryptionInfo
    };
    
    Object.defineProperty(this, 'encryptionInfo', {
      value: this.deepFreeze(newEncryptionInfo),
      writable: false,
      enumerable: true,
      configurable: false
    });
  }

  /**
   * Check if snapshot data is encrypted
   * @returns {boolean} - Is encrypted
   */
  isEncrypted() {
    return this.encryptionInfo.encrypted;
  }

  /**
   * Check if snapshot photos are encrypted
   * @returns {boolean} - Are photos encrypted
   */
  arePhotosEncrypted() {
    return this.encryptionInfo.photosEncrypted;
  }

  /**
   * Get encryption status summary
   * @returns {Object} - Encryption status
   */
  getEncryptionStatus() {
    return {
      dataEncrypted: this.encryptionInfo.encrypted,
      photosEncrypted: this.encryptionInfo.photosEncrypted,
      encryptionMethod: this.encryptionInfo.encryptionMethod,
      encryptedPhotoCount: this.encryptionInfo.encryptedPhotoCount,
      totalPhotoCount: this.photoManifest.length
    };
  }

  /**
   * Export snapshot data (for GDPR compliance or backup)
   * @returns {Object} - Complete snapshot data
   */
  exportData() {
    return {
      snapshotId: this.snapshotId,
      entryPackId: this.entryPackId,
      userId: this.userId,
      destinationId: this.destinationId,
      tripId: this.tripId,
      status: this.status,
      createdAt: this.createdAt,
      arrivalDate: this.arrivalDate,
      version: this.version,
      metadata: this.metadata,
      passport: this.passport,
      personalInfo: this.personalInfo,
      funds: this.funds,
      travel: this.travel,
      tdacSubmission: this.tdacSubmission,
      completenessIndicator: this.completenessIndicator,
      photoManifest: this.photoManifest,
      encryptionInfo: this.encryptionInfo,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Create a new entry pack based on this snapshot (for reuse)
   * @returns {Object} - Data for new entry pack creation
   */
  createReusableData() {
    // Only include reusable data (exclude travel info which should be updated)
    return {
      passport: this.passport,
      personalInfo: this.personalInfo,
      funds: this.funds,
      // Exclude travel info - user should update for new trip
      sourceSnapshotId: this.snapshotId,
      reusedAt: new Date().toISOString()
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

export default EntryPackSnapshot;