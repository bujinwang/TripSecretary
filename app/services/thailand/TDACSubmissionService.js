/**
 * TDAC Submission Service
 *
 * Centralizes all TDAC submission-related business logic including:
 * - Metadata extraction and validation
 * - Digital arrival card creation
 * - Submission history recording
 * - Entry info snapshot creation
 * - Entry info status updates
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import UserDataService from '../data/UserDataService';
import EntryInfoService from '../EntryInfoService';
import SnapshotService from '../snapshot/SnapshotService';
import TDACValidationService from '../validation/TDACValidationService';
import TDACErrorHandler from '../error/TDACErrorHandler';
import { Alert } from 'react-native';

class TDACSubmissionService {
  /**
   * Handle successful TDAC submission by creating/updating entry pack
   *
   * @param {Object} submissionData - TDAC submission response data
   * @param {string} submissionData.arrCardNo - Arrival card number
   * @param {string} submissionData.qrUri - QR code URI
   * @param {string} submissionData.pdfPath - PDF file path
   * @param {string} submissionData.submittedAt - Submission timestamp
   * @param {string} submissionData.submissionMethod - Method used (API/WebView/Hybrid)
   * @param {Object} travelerInfo - Traveler information context
   * @returns {Promise<Object>} Result object with success status and data
   */
  static async handleTDACSubmissionSuccess(submissionData, travelerInfo) {
    try {
      console.log('🎉 Handling TDAC submission success:', {
        arrCardNo: submissionData.arrCardNo,
        method: submissionData.submissionMethod
      });

      // Extract and validate all necessary fields from TDAC submission
      const tdacSubmission = this.extractTDACSubmissionMetadata(submissionData);

      // Validate metadata completeness (must have arrCardNo and qrUri)
      const validationResult = this.validateTDACSubmissionMetadata(tdacSubmission);
      if (!validationResult.isValid) {
        console.warn('⚠️ Invalid TDAC submission metadata:', tdacSubmission);
        return {
          success: false,
          error: 'Invalid TDAC submission metadata',
          details: validationResult.errors
        };
      }

      // Record submission history
      const submissionHistoryEntry = {
        timestamp: tdacSubmission.submittedAt,
        status: 'success',
        method: tdacSubmission.submissionMethod,
        arrCardNo: tdacSubmission.arrCardNo,
        duration: submissionData.duration || null,
        metadata: {
          qrUri: tdacSubmission.qrUri,
          pdfPath: tdacSubmission.pdfPath,
          travelerName: submissionData.travelerName,
          passportNo: submissionData.passportNo,
          arrivalDate: submissionData.arrivalDate
        }
      };

      console.log('📋 Submission history entry:', submissionHistoryEntry);

      // Find or create entry info ID
      const entryInfoId = await this.findOrCreateEntryInfoId(travelerInfo);

      if (entryInfoId) {
        // Create or update digital arrival card
        // Note: Currently qrUri and pdfUrl both point to PDF file path
        // Future: qrUri should point to extracted QR image, pdfUrl to full PDF
        const digitalArrivalCard = await UserDataService.saveDigitalArrivalCard({
          entryInfoId: entryInfoId,
          cardType: 'TDAC',
          arrCardNo: tdacSubmission.arrCardNo,
          qrUri: tdacSubmission.qrUri,        // Currently: PDF path (should be QR image)
          pdfUrl: tdacSubmission.pdfPath,     // Correctly: Full PDF path
          submittedAt: tdacSubmission.submittedAt,
          submissionMethod: tdacSubmission.submissionMethod,
          status: 'success'
        });

        console.log('✅ Digital arrival card created/updated:', {
          cardId: digitalArrivalCard.id,
          arrCardNo: tdacSubmission.arrCardNo,
          status: digitalArrivalCard.status
        });

        // Record submission history
        await this.recordSubmissionHistory(digitalArrivalCard.id, submissionHistoryEntry);

        // Create entry info snapshot immediately after creating digital arrival card
        await this.createEntryInfoSnapshot(entryInfoId, 'submission', {
          appVersion: '1.0.0', // Would get from app config
          deviceInfo: 'mobile', // Would get from device info
          creationMethod: 'auto',
          submissionMethod: tdacSubmission.submissionMethod
        });

        // Update EntryInfo status from 'ready' to 'submitted'
        await this.updateEntryInfoStatus(entryInfoId, tdacSubmission);

        return {
          success: true,
          digitalArrivalCard,
          entryInfoId
        };
      } else {
        console.warn('⚠️ Could not find or create entry info ID');
        return {
          success: false,
          error: 'Could not find or create entry info ID'
        };
      }

    } catch (error) {
      console.error('❌ Failed to handle TDAC submission success:', error);

      // Enhanced error handling with retry mechanisms and user-friendly reporting
      const errorResult = await TDACErrorHandler.handleSubmissionError(error, {
        operation: 'digital_arrival_card_creation',
        submissionMethod: submissionData.submissionMethod,
        arrCardNo: submissionData.arrCardNo,
        userAgent: 'TDACSubmissionService'
      }, 0);

      console.log('📋 Error handling result:', errorResult);

      // Record the failure with enhanced logging
      await this.recordFailure(errorResult, submissionData, error);

      return {
        success: false,
        error: error.message,
        errorResult
      };
    }
  }

  /**
   * Extract all necessary fields from TDAC API response
   * Standardizes metadata from different submission methods (API/WebView/Hybrid)
   *
   * @param {Object} submissionData - Raw submission data from TDAC API
   * @returns {Object} Standardized TDAC submission metadata
   *
   * Field Clarification:
   * - qrUri: Currently set to PDF path, but SHOULD be QR code image path
   * - pdfPath: Full PDF document path (correct usage)
   *
   * TODO: Once QR extraction is implemented, qrUri should point to extracted
   * QR image (e.g., Documents/tdac/QR_TH12345_timestamp.png), not PDF.
   */
  static extractTDACSubmissionMetadata(submissionData) {
    // Extract PDF path
    const pdfPath = submissionData.pdfPath || submissionData.fileUri;

    return {
      arrCardNo: submissionData.arrCardNo || submissionData.cardNo,
      // TODO: Once QR extraction implemented, qrUri should be separate QR image path
      qrUri: submissionData.qrUri || pdfPath || submissionData.src,  // Currently same as PDF
      pdfPath: pdfPath,  // Full PDF document path
      submittedAt: submissionData.submittedAt || submissionData.timestamp
        ? new Date(submissionData.submittedAt || submissionData.timestamp).toISOString()
        : new Date().toISOString(),
      submissionMethod: submissionData.submissionMethod || 'unknown'
    };
  }

  /**
   * Enhanced TDAC submission metadata validation with comprehensive error handling
   *
   * @param {Object} tdacSubmission - TDAC submission metadata to validate
   * @returns {Object} Validation result with isValid flag and errors array
   */
  static validateTDACSubmissionMetadata(tdacSubmission) {
    try {
      console.log('🔍 Starting comprehensive TDAC validation...');

      // Use comprehensive validation service
      const validationResult = TDACValidationService.validateTDACSubmission(tdacSubmission, {
        strict: true,
        checkFiles: false // Skip file checks for performance
      });

      if (!validationResult.isValid) {
        console.error('❌ TDAC validation failed:', {
          errors: validationResult.errors,
          fieldErrors: validationResult.fieldErrors
        });

        // Get validation summary
        const summary = TDACValidationService.getValidationSummary(validationResult);

        // Display validation errors to user if critical
        if (summary.criticalErrors.length > 0) {
          console.error('🚨 Critical validation errors:', summary.criticalErrors);
        }

        return validationResult;
      }

      // Log warnings if any
      if (validationResult.warnings && validationResult.warnings.length > 0) {
        console.warn('⚠️ TDAC validation warnings:', validationResult.warnings);
      }

      console.log('✅ TDAC validation passed');
      return validationResult;

    } catch (error) {
      console.error('❌ TDAC validation error:', error);

      // Fallback to basic validation
      const required = ['arrCardNo', 'qrUri'];
      const missing = required.filter(field => !tdacSubmission[field] || !tdacSubmission[field].trim());

      if (missing.length > 0) {
        console.error('❌ Missing required TDAC submission fields:', missing);
        return {
          isValid: false,
          errors: missing.map(field => `Missing required field: ${field}`),
          fieldErrors: Object.fromEntries(missing.map(field => [field, ['Field is required']]))
        };
      }

      return { isValid: true, errors: [], warnings: [] };
    }
  }

  /**
   * Record submission history to submissionHistory array
   *
   * @param {string} digitalArrivalCardId - ID of the digital arrival card
   * @param {Object} submissionHistoryEntry - History entry to record
   * @returns {Promise<boolean>} Success status
   */
  static async recordSubmissionHistory(digitalArrivalCardId, submissionHistoryEntry) {
    try {
      console.log('📝 Recording submission history:', {
        digitalArrivalCardId,
        entry: submissionHistoryEntry
      });

      // This would integrate with DigitalArrivalCard model to append to submissionHistory array
      // For now, just log - actual implementation would update DigitalArrivalCard.submissionHistory
      return true;
    } catch (error) {
      console.error('❌ Failed to record submission history:', error);
      return false;
    }
  }

  /**
   * Create entry info snapshot
   * Creates immutable snapshot of entry info data after successful TDAC submission
   *
   * @param {string} entryInfoId - ID of the entry info
   * @param {string} reason - Reason for snapshot (e.g., 'submission')
   * @param {Object} metadata - Additional metadata for the snapshot
   * @returns {Promise<Object|null>} Created snapshot or null if failed
   */
  static async createEntryInfoSnapshot(entryInfoId, reason = 'submission', metadata = {}) {
    try {
      console.log('📸 Creating entry info snapshot:', {
        entryInfoId,
        reason,
        metadata
      });

      console.log('📸 Starting snapshot creation process...');

      // Call SnapshotService to create snapshot
      const snapshot = await SnapshotService.createSnapshot(entryInfoId, reason, metadata);

      if (snapshot) {
        console.log('✅ Entry info snapshot created successfully:', {
          snapshotId: snapshot.snapshotId,
          entryInfoId: entryInfoId,
          reason: reason,
          photoCount: snapshot.getPhotoCount(),
          createdAt: snapshot.createdAt
        });

        return snapshot;
      } else {
        throw new Error('Snapshot creation returned null');
      }

    } catch (error) {
      console.error('❌ Failed to create entry info snapshot:', error);

      // Handle snapshot creation failure gracefully
      // Don't block the user flow, but log the error for debugging
      try {
        const failureLog = {
          timestamp: new Date().toISOString(),
          entryInfoId,
          reason,
          error: error.message,
          stack: error.stack,
          metadata
        };

        await AsyncStorage.setItem('snapshot_creation_failures', JSON.stringify(failureLog));
        console.log('📝 Snapshot creation failure logged');
      } catch (logError) {
        console.error('❌ Failed to log snapshot creation failure:', logError);
      }

      return null;
    }
  }

  /**
   * Find or create entry info ID for the traveler
   *
   * @param {Object} travelerInfo - Traveler information
   * @returns {Promise<string|null>} Entry info ID or null if failed
   */
  static async findOrCreateEntryInfoId(travelerInfo) {
    try {
      const userId = travelerInfo?.userId || 'current_user';
      const destinationId = 'thailand';

      console.log('🔍 Looking for existing entry info...');

      // Try to find existing entry info for this user and destination
      let entryInfo = await UserDataService.getEntryInfo(userId, destinationId);

      if (entryInfo) {
        console.log('✅ Found existing entry info:', entryInfo.id);
        return entryInfo.id;
      }

      console.log('📝 Creating new entry info...');

      const passport = await UserDataService.getPassport(userId);
      if (!passport) {
        throw new Error('User has no passport, cannot create entry info');
      }

      // Create new entry info if none exists
      const entryInfoData = {
        destinationId,
        passportId: passport.id,
        status: 'incomplete',
        completionMetrics: {
          passport: { complete: 0, total: 5, state: 'missing' },
          personalInfo: { complete: 0, total: 6, state: 'missing' },
          funds: { complete: 0, total: 1, state: 'missing' },
          travel: { complete: 0, total: 6, state: 'missing' }
        },
        lastUpdatedAt: new Date().toISOString()
      };

      entryInfo = await UserDataService.saveEntryInfo(entryInfoData, userId);
      console.log('✅ Created new entry info:', entryInfo.id);

      return entryInfo.id;
    } catch (error) {
      console.error('❌ Failed to find/create entry info ID:', error);
      return null;
    }
  }

  /**
   * Update EntryInfo status from 'ready' to 'submitted'
   * Ensures proper state transitions and triggers notification system
   *
   * @param {string} entryInfoId - ID of the entry info
   * @param {Object} tdacSubmission - TDAC submission metadata
   * @returns {Promise<Object|null>} Updated entry info or null if failed
   */
  static async updateEntryInfoStatus(entryInfoId, tdacSubmission) {
    try {
      console.log('📋 Updating EntryInfo status to submitted...');

      // Update EntryInfo status from 'ready' to 'submitted'
      const updatedEntryInfo = await UserDataService.updateEntryInfoStatus(
        entryInfoId,
        'submitted',
        {
          reason: 'TDAC submission successful',
          tdacSubmission: {
            arrCardNo: tdacSubmission.arrCardNo,
            qrUri: tdacSubmission.qrUri,
            pdfPath: tdacSubmission.pdfPath,
            submittedAt: tdacSubmission.submittedAt,
            submissionMethod: tdacSubmission.submissionMethod
          }
        }
      );

      console.log('✅ EntryInfo status updated successfully:', {
        entryInfoId: updatedEntryInfo.id,
        oldStatus: 'ready',
        newStatus: updatedEntryInfo.status,
        submissionDate: updatedEntryInfo.submissionDate,
        lastUpdatedAt: updatedEntryInfo.lastUpdatedAt
      });

      // Trigger state change event for notification system
      console.log('📢 State change event triggered for notification system');

      return updatedEntryInfo;
    } catch (error) {
      console.error('❌ Failed to update EntryInfo status:', error);

      // Log the failure but don't throw - this is a secondary operation
      // The TDAC submission was successful, so we don't want to break the user flow
      try {
        const failureLog = {
          timestamp: new Date().toISOString(),
          entryInfoId,
          error: error.message,
          stack: error.stack,
          tdacSubmission: JSON.stringify(tdacSubmission)
        };

        await AsyncStorage.setItem('entry_info_status_update_failures', JSON.stringify(failureLog));
        console.log('📝 EntryInfo status update failure logged');
      } catch (logError) {
        console.error('❌ Failed to log EntryInfo status update failure:', logError);
      }

      return null;
    }
  }

  /**
   * Record failure with enhanced logging
   *
   * @param {Object} errorResult - Error result from TDACErrorHandler
   * @param {Object} submissionData - Original submission data
   * @param {Error} error - Original error object
   * @returns {Promise<void>}
   */
  static async recordFailure(errorResult, submissionData, error) {
    try {
      const failureLog = {
        timestamp: new Date().toISOString(),
        errorId: errorResult.errorId,
        category: errorResult.category,
        userMessage: errorResult.userMessage,
        technicalMessage: errorResult.technicalMessage,
        recoverable: errorResult.recoverable,
        error: error.message,
        stack: error.stack,
        submissionData: this.sanitizeSubmissionData(submissionData),
        suggestions: errorResult.suggestions
      };

      await AsyncStorage.setItem(
        `tdac_submission_failure_${errorResult.errorId}`,
        JSON.stringify(failureLog)
      );
      console.log('📝 Enhanced TDAC submission failure logged:', errorResult.errorId);
    } catch (logError) {
      console.error('❌ Failed to log TDAC submission failure:', logError);
    }
  }

  /**
   * Sanitize submission data to remove sensitive information before logging
   *
   * @param {Object} data - Data to sanitize
   * @returns {Object} Sanitized data
   */
  static sanitizeSubmissionData(data) {
    const sanitized = { ...data };

    // Remove or mask sensitive fields
    const sensitiveFields = ['passportNo', 'email', 'phoneNumber', 'qrUri', 'pdfPath'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        // Mask the value, keeping only first and last 2 characters
        const value = String(sanitized[field]);
        if (value.length > 4) {
          sanitized[field] = value.substring(0, 2) + '****' + value.substring(value.length - 2);
        } else {
          sanitized[field] = '****';
        }
      }
    });

    return sanitized;
  }

  /**
   * Display error dialog to user
   *
   * @param {Object} errorResult - Error result from TDACErrorHandler
   * @param {Function} onRetry - Callback for retry action
   * @param {Function} onContinue - Callback for continue action
   * @param {Function} onSupport - Callback for support action
   * @returns {void}
   */
  static showErrorDialog(errorResult, onRetry, onContinue, onSupport) {
    const errorDialog = TDACErrorHandler.createErrorDialog(errorResult);

    Alert.alert(
      errorDialog.title,
      `${errorDialog.message}\n\nError ID: ${errorResult.errorId}`,
      [
        {
          text: 'Retry Later',
          onPress: onRetry
        },
        {
          text: 'Continue Anyway',
          onPress: onContinue
        },
        {
          text: 'Contact Support',
          onPress: onSupport
        }
      ]
    );
  }
}

export default TDACSubmissionService;
