/**
 * Progressive Entry Flow Type Definitions
 * JSDoc type definitions for progressive entry flow models and interfaces
 * 
 * Requirements: All
 */

/**
 * @typedef {Object} CompletionMetric
 * @property {number} complete - Number of completed fields
 * @property {number} total - Total number of required fields
 * @property {'complete'|'partial'|'missing'} state - Completion state
 */

/**
 * @typedef {Object} CompletionMetrics
 * @property {CompletionMetric} passport - Passport completion metrics
 * @property {CompletionMetric} personalInfo - Personal info completion metrics
 * @property {CompletionMetric} funds - Funds completion metrics
 * @property {CompletionMetric} travel - Travel completion metrics
 */

/**
 * @typedef {Object} EntryInfoRecord
 * @property {string} id - Unique entry info ID
 * @property {string} userId - User ID
 * @property {string} destinationId - Destination ID
 * @property {string} tripId - Trip ID
 * @property {CompletionMetrics} completionMetrics - Completion tracking
 * @property {'incomplete'|'ready'|'submitted'|'superseded'|'expired'|'archived'} status - Entry status
 * @property {string} lastUpdatedAt - Last update timestamp
 * @property {Object} tdacSubmission - TDAC submission data
 * @property {string} createdAt - Creation timestamp
 */

/**
 * @typedef {Object} TDACSubmission
 * @property {string} arrCardNo - Arrival card number
 * @property {string} qrUri - QR code URI
 * @property {string} pdfPath - PDF document path
 * @property {string} submittedAt - Submission timestamp
 * @property {'api'|'webview'|'hybrid'} submissionMethod - Submission method
 * @property {'success'|'failed'} status - Submission status
 * @property {Object} [error] - Error details if failed
 */

/**
 * @typedef {Object} SubmissionHistoryItem
 * @property {string} id - Submission attempt ID
 * @property {number} attemptNumber - Attempt number
 * @property {string} submittedAt - Submission timestamp
 * @property {'api'|'webview'|'hybrid'} submissionMethod - Submission method
 * @property {'success'|'failed'} status - Submission status
 * @property {string} [arrCardNo] - Arrival card number (if successful)
 * @property {string} [qrUri] - QR code URI (if successful)
 * @property {string} [pdfPath] - PDF path (if successful)
 * @property {Object} [error] - Error details (if failed)
 */

/**
 * @typedef {Object} EntryPackDocuments
 * @property {string} qrCodeImage - QR code image path
 * @property {string} pdfDocument - PDF document path
 * @property {string} entryCardImage - Entry card image path
 */

/**
 * @typedef {Object} CategoryStates
 * @property {'complete'|'partial'|'missing'} passport - Passport state
 * @property {'complete'|'partial'|'missing'} personalInfo - Personal info state
 * @property {'complete'|'partial'|'missing'} funds - Funds state
 * @property {'complete'|'partial'|'missing'} travel - Travel state
 */

/**
 * @typedef {Object} DisplayStatus
 * @property {number} completionPercent - Completion percentage (0-100)
 * @property {CategoryStates} categoryStates - Category completion states
 * @property {string} countdownMessage - Countdown message for UI
 * @property {'disabled'|'enabled'|'resubmit'} ctaState - Call-to-action button state
 * @property {boolean} showQR - Whether to show QR code
 * @property {boolean} showGuide - Whether to show immigration guide
 * @property {string} lastUpdated - Last update timestamp
 */

/**
 * @typedef {Object} EntryPack
 * @property {string} id - Unique entry pack ID
 * @property {string} entryInfoId - Associated entry info ID
 * @property {string} userId - User ID
 * @property {string} destinationId - Destination ID
 * @property {string} tripId - Trip ID
 * @property {TDACSubmission} tdacSubmission - TDAC submission data
 * @property {SubmissionHistoryItem[]} submissionHistory - All submission attempts
 * @property {EntryPackDocuments} documents - Associated documents
 * @property {DisplayStatus} displayStatus - UI display status
 * @property {'in_progress'|'submitted'|'superseded'|'completed'|'expired'|'archived'} status - Pack status
 * @property {string} createdAt - Creation timestamp
 * @property {string} updatedAt - Last update timestamp
 * @property {string} [archivedAt] - Archive timestamp
 */

/**
 * @typedef {Object} PhotoManifestItem
 * @property {string} fundItemId - Fund item ID
 * @property {string} originalPath - Original photo path
 * @property {string} snapshotPath - Snapshot photo path
 * @property {string} fileName - Photo file name
 * @property {string} copiedAt - Copy timestamp
 */

/**
 * @typedef {Object} CompletenessIndicator
 * @property {boolean} passport - Passport section complete
 * @property {boolean} personalInfo - Personal info section complete
 * @property {boolean} funds - Funds section complete
 * @property {boolean} travel - Travel section complete
 * @property {number} overall - Overall completion percentage
 */

/**
 * @typedef {Object} SnapshotMetadata
 * @property {string} appVersion - App version when created
 * @property {string} deviceInfo - Device information
 * @property {'auto'|'manual'} creationMethod - How snapshot was created
 * @property {string} snapshotReason - Reason for snapshot creation
 */

/**
 * @typedef {Object} EntryPackSnapshot
 * @property {string} snapshotId - Unique snapshot ID
 * @property {string} entryPackId - Original entry pack ID
 * @property {string} userId - User ID
 * @property {string} destinationId - Destination ID
 * @property {string} tripId - Trip ID
 * @property {'completed'|'cancelled'|'expired'} status - Snapshot status
 * @property {string} createdAt - Creation timestamp
 * @property {string} arrivalDate - Arrival date
 * @property {number} version - Snapshot version
 * @property {SnapshotMetadata} metadata - Snapshot metadata
 * @property {Object} passport - Passport data copy
 * @property {Object} personalInfo - Personal info data copy
 * @property {Object[]} funds - Funds data copy
 * @property {Object} travel - Travel data copy
 * @property {TDACSubmission} tdacSubmission - TDAC submission copy
 * @property {CompletenessIndicator} completenessIndicator - Completeness status
 * @property {PhotoManifestItem[]} photoManifest - Photo references
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {string[]} errors - Array of validation errors
 * @property {string[]} [warnings] - Array of validation warnings
 */

/**
 * @typedef {Object} ValidationStatus
 * @property {ValidationResult} passport - Passport validation
 * @property {ValidationResult} personalInfo - Personal info validation
 * @property {ValidationResult} funds - Funds validation
 * @property {ValidationResult} travel - Travel validation
 * @property {ValidationResult} overall - Overall validation
 */

/**
 * @typedef {Object} ArrivalWindow
 * @property {'no-date'|'pre-window'|'within-window'|'urgent'|'past-deadline'} state - Window state
 * @property {string} message - Localized message
 * @property {number} [timeRemaining] - Time remaining in milliseconds
 * @property {string} [submissionOpensAt] - When submission window opens
 * @property {string} [submissionClosesAt] - When submission window closes
 * @property {boolean} canSubmit - Whether submission is allowed
 * @property {'green'|'yellow'|'red'|'gray'} urgencyColor - UI color hint
 */

/**
 * @typedef {Object} CountdownFormat
 * @property {string} display - Formatted display string
 * @property {number} days - Days remaining
 * @property {number} hours - Hours remaining
 * @property {number} minutes - Minutes remaining
 * @property {'green'|'yellow'|'red'|'gray'} color - Color hint for urgency
 * @property {boolean} isUrgent - Whether countdown is urgent
 */

/**
 * @typedef {Object} FieldConfiguration
 * @property {string} name - Field name
 * @property {string} label - Display label
 * @property {'required'|'optional'} type - Field requirement type
 * @property {string} category - Category (passport, personalInfo, funds, travel)
 * @property {Function} validator - Validation function
 * @property {string} helpText - Help text for users
 */

/**
 * @typedef {Object} CategoryConfiguration
 * @property {string} name - Category name
 * @property {string} label - Display label
 * @property {string} icon - Icon name
 * @property {FieldConfiguration[]} fields - Required fields
 * @property {number} requiredCount - Number of required fields
 * @property {Function} validator - Category validation function
 */

/**
 * @typedef {Object} EntryFieldsConfig
 * @property {CategoryConfiguration} passport - Passport category config
 * @property {CategoryConfiguration} personalInfo - Personal info category config
 * @property {CategoryConfiguration} funds - Funds category config
 * @property {CategoryConfiguration} travel - Travel category config
 */

/**
 * @typedef {Object} NotificationConfig
 * @property {string} type - Notification type
 * @property {string} title - Notification title
 * @property {string} body - Notification body
 * @property {Object} data - Deep link data
 * @property {string} [scheduledFor] - When to send notification
 * @property {boolean} enabled - Whether notification is enabled
 */

/**
 * @typedef {Object} StorageQuota
 * @property {number} activeData - Active data size in bytes
 * @property {number} snapshots - Snapshot data size in bytes
 * @property {number} total - Total usage in bytes
 * @property {number} limit - Storage limit in bytes
 * @property {number} percentage - Usage percentage
 * @property {boolean} isLow - Whether storage is low
 */

/**
 * @typedef {Object} AuditEvent
 * @property {string} timestamp - Event timestamp
 * @property {'created'|'viewed'|'status_changed'|'deleted'|'exported'} eventType - Event type
 * @property {Object} metadata - Event metadata
 * @property {string} userId - User who triggered event
 * @property {string} [snapshotId] - Related snapshot ID
 * @property {string} [entryPackId] - Related entry pack ID
 */

/**
 * @typedef {Object} ExportOptions
 * @property {'json'|'pdf'|'zip'} format - Export format
 * @property {boolean} includePhotos - Whether to include photos
 * @property {boolean} encrypt - Whether to encrypt export
 * @property {string} [password] - Encryption password
 * @property {string[]} [sections] - Sections to include
 */

/**
 * @typedef {Object} ImportResult
 * @property {boolean} success - Whether import succeeded
 * @property {number} imported - Number of items imported
 * @property {number} skipped - Number of items skipped
 * @property {number} failed - Number of items failed
 * @property {string[]} errors - Import errors
 * @property {string[]} warnings - Import warnings
 */

/**
 * @typedef {Object} BackupInfo
 * @property {string} id - Backup ID
 * @property {string} createdAt - Creation timestamp
 * @property {number} size - Backup size in bytes
 * @property {number} entryPackCount - Number of entry packs
 * @property {number} snapshotCount - Number of snapshots
 * @property {string} format - Backup format
 * @property {boolean} encrypted - Whether backup is encrypted
 */

// Export type definitions for use in other modules
export const ProgressiveEntryFlowTypes = {
  // Re-export all typedef names for runtime checking if needed
  CompletionMetric: 'CompletionMetric',
  CompletionMetrics: 'CompletionMetrics',
  EntryInfoRecord: 'EntryInfoRecord',
  TDACSubmission: 'TDACSubmission',
  SubmissionHistoryItem: 'SubmissionHistoryItem',
  EntryPackDocuments: 'EntryPackDocuments',
  CategoryStates: 'CategoryStates',
  DisplayStatus: 'DisplayStatus',
  EntryPack: 'EntryPack',
  PhotoManifestItem: 'PhotoManifestItem',
  CompletenessIndicator: 'CompletenessIndicator',
  SnapshotMetadata: 'SnapshotMetadata',
  EntryPackSnapshot: 'EntryPackSnapshot',
  ValidationResult: 'ValidationResult',
  ValidationStatus: 'ValidationStatus',
  ArrivalWindow: 'ArrivalWindow',
  CountdownFormat: 'CountdownFormat',
  FieldConfiguration: 'FieldConfiguration',
  CategoryConfiguration: 'CategoryConfiguration',
  EntryFieldsConfig: 'EntryFieldsConfig',
  NotificationConfig: 'NotificationConfig',
  StorageQuota: 'StorageQuota',
  AuditEvent: 'AuditEvent',
  ExportOptions: 'ExportOptions',
  ImportResult: 'ImportResult',
  BackupInfo: 'BackupInfo'
};

/**
 * Type validation helpers
 */
export const TypeValidators = {
  /**
   * Validate completion metric structure
   * @param {*} obj - Object to validate
   * @returns {boolean} - Is valid CompletionMetric
   */
  isCompletionMetric(obj) {
    return obj && 
           typeof obj.complete === 'number' &&
           typeof obj.total === 'number' &&
           ['complete', 'partial', 'missing'].includes(obj.state);
  },

  /**
   * Validate completion metrics structure
   * @param {*} obj - Object to validate
   * @returns {boolean} - Is valid CompletionMetrics
   */
  isCompletionMetrics(obj) {
    return obj &&
           this.isCompletionMetric(obj.passport) &&
           this.isCompletionMetric(obj.personalInfo) &&
           this.isCompletionMetric(obj.funds) &&
           this.isCompletionMetric(obj.travel);
  },

  /**
   * Validate TDAC submission structure
   * @param {*} obj - Object to validate
   * @returns {boolean} - Is valid TDACSubmission
   */
  isTDACSubmission(obj) {
    return obj &&
           typeof obj.arrCardNo === 'string' &&
           typeof obj.qrUri === 'string' &&
           typeof obj.submittedAt === 'string' &&
           ['api', 'webview', 'hybrid'].includes(obj.submissionMethod);
  },

  /**
   * Validate entry pack structure
   * @param {*} obj - Object to validate
   * @returns {boolean} - Is valid EntryPack
   */
  isEntryPack(obj) {
    return obj &&
           typeof obj.id === 'string' &&
           typeof obj.entryInfoId === 'string' &&
           typeof obj.userId === 'string' &&
           ['in_progress', 'submitted', 'superseded', 'completed', 'expired', 'archived'].includes(obj.status) &&
           Array.isArray(obj.submissionHistory);
  },

  /**
   * Validate snapshot structure
   * @param {*} obj - Object to validate
   * @returns {boolean} - Is valid EntryPackSnapshot
   */
  isEntryPackSnapshot(obj) {
    return obj &&
           typeof obj.snapshotId === 'string' &&
           typeof obj.entryPackId === 'string' &&
           typeof obj.userId === 'string' &&
           ['completed', 'cancelled', 'expired'].includes(obj.status) &&
           typeof obj.createdAt === 'string' &&
           Array.isArray(obj.photoManifest);
  },

  /**
   * Validate arrival window structure
   * @param {*} obj - Object to validate
   * @returns {boolean} - Is valid ArrivalWindow
   */
  isArrivalWindow(obj) {
    return obj &&
           ['no-date', 'pre-window', 'within-window', 'urgent', 'past-deadline'].includes(obj.state) &&
           typeof obj.message === 'string' &&
           typeof obj.canSubmit === 'boolean';
  }
};

export default ProgressiveEntryFlowTypes;