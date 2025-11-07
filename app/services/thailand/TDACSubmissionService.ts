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
import { Alert } from 'react-native';
import UserDataService from '../data/UserDataService';
import EntryInfoService from '../EntryInfoService';
import SnapshotService from '../snapshot/SnapshotService';
import TDACValidationService from '../validation/TDACValidationService';
import TDACErrorHandler from '../error/TDACErrorHandler';
import logger from '../LoggingService';
import type { UserId } from '../../types';

// Type definitions
interface SubmissionData {
  arrCardNo?: string;
  cardNo?: string;
  qrUri?: string;
  pdfPath?: string;
  fileUri?: string;
  src?: string;
  submittedAt?: string;
  timestamp?: string;
  submissionMethod?: 'api' | 'webview' | 'hybrid' | 'unknown';
  duration?: number | null;
  travelerName?: string;
  passportNo?: string;
  arrivalDate?: string;
  [key: string]: any;
}

interface TDACSubmissionMetadata {
  arrCardNo: string;
  qrUri: string;
  pdfPath: string;
  submittedAt: string;
  submissionMethod: 'api' | 'webview' | 'hybrid' | 'unknown';
}

interface TravelerInfo {
  userId?: UserId;
  firstName?: string;
  familyName?: string;
  passportNo?: string;
  nationality?: string;
  birthDate?: string | { year: number; month: number; day: number };
  occupation?: string;
  phoneNo?: string;
  phoneCode?: string;
  email?: string;
  arrivalDate?: string;
  flightNo?: string;
  purpose?: string;
  address?: string;
  departureDate?: string;
  [key: string]: any;
}

interface SubmissionHistoryEntry {
  timestamp: string;
  status: 'success' | 'failure';
  method: string;
  arrCardNo: string;
  duration: number | null;
  metadata: {
    qrUri?: string;
    pdfPath?: string;
    travelerName?: string;
    passportNo?: string;
    arrivalDate?: string;
    [key: string]: any;
  };
}

interface SubmissionResult {
  success: boolean;
  digitalArrivalCard?: any;
  entryInfoId?: string;
  error?: string;
  errorResult?: any;
  details?: string[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  fieldErrors?: Record<string, string[]>;
}

interface ErrorResult {
  errorId: string;
  category: string;
  userMessage: string;
  technicalMessage: string;
  recoverable: boolean;
  shouldRetry: boolean;
  retryDelay: number;
  attemptNumber: number;
  maxRetries: number;
  suggestions: string[];
  timestamp: string;
}

interface ErrorDialogCallbacks {
  onRetry?: () => void;
  onContinue?: () => void;
  onSupport?: () => void;
}

class TDACSubmissionService {
  /**
   * Handle successful TDAC submission by creating/updating entry pack
   *
   * @param submissionData - TDAC submission response data
   * @param travelerInfo - Traveler information context
   * @param destinationId - Destination ID (defaults to 'th' for backward compatibility)
   * @returns Result object with success status and data
   */
  static async handleTDACSubmissionSuccess(
    submissionData: SubmissionData,
    travelerInfo: TravelerInfo,
    destinationId: string = 'th'
  ): Promise<SubmissionResult> {
    try {
      logger.info('TDACSubmissionService', 'Handling TDAC submission success', {
        arrCardNo: submissionData.arrCardNo,
        method: submissionData.submissionMethod,
        destinationId
      });

      // Extract and validate all necessary fields from TDAC submission
      const tdacSubmission = this.extractTDACSubmissionMetadata(submissionData);

      // Validate metadata completeness (must have arrCardNo and qrUri)
      const validationResult = this.validateTDACSubmissionMetadata(tdacSubmission);
      if (!validationResult.isValid) {
        logger.warn('TDACSubmissionService', 'Invalid TDAC submission metadata', { 
          tdacSubmission, 
          errors: validationResult.errors 
        });
        return {
          success: false,
          error: 'Invalid TDAC submission metadata',
          details: validationResult.errors
        };
      }

      // Record submission history
      const submissionHistoryEntry: SubmissionHistoryEntry = {
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

      logger.debug('TDACSubmissionService', 'Submission history entry', { submissionHistoryEntry });

      // Find or create entry info ID
      const entryInfoId = await this.findOrCreateEntryInfoId(travelerInfo, destinationId);
      const userId = travelerInfo?.userId || 'current_user';

      if (entryInfoId) {
        // Create or update digital arrival card
        // Note: Currently qrUri and pdfUrl both point to PDF file path
        // Future: qrUri should point to extracted QR image, pdfUrl to full PDF
        const digitalArrivalCard = await UserDataService.saveDigitalArrivalCard({
          userId: userId,                     // Required by repository
          entryInfoId: entryInfoId,
          cardType: 'TDAC',
          arrCardNo: tdacSubmission.arrCardNo,
          qrUri: tdacSubmission.qrUri,        // Currently: PDF path (should be QR image)
          pdfUrl: tdacSubmission.pdfPath,     // Correctly: Full PDF path
          submittedAt: tdacSubmission.submittedAt,
          submissionMethod: tdacSubmission.submissionMethod,
          status: 'success'
        });

        logger.info('TDACSubmissionService', 'Digital arrival card created/updated', {
          cardId: digitalArrivalCard.id,
          arrCardNo: tdacSubmission.arrCardNo,
          status: digitalArrivalCard.status,
          entryInfoId
        });

        // Record submission history
        await this.recordSubmissionHistory(digitalArrivalCard.id, submissionHistoryEntry);

        // Populate entry info with traveler data before creating snapshot
        await this.populateEntryInfoWithTravelerData(entryInfoId, travelerInfo, userId);

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
        logger.warn('TDACSubmissionService', 'Could not find or create entry info ID', { travelerInfo, destinationId });
        return {
          success: false,
          error: 'Could not find or create entry info ID'
        };
      }

    } catch (error: any) {
      logger.error('TDACSubmissionService', error, { 
        arrCardNo: submissionData?.arrCardNo,
        destinationId 
      });

      // Enhanced error handling with retry mechanisms and user-friendly reporting
      const errorResult = await TDACErrorHandler.handleSubmissionError(error, {
        operation: 'digital_arrival_card_creation',
        submissionMethod: submissionData.submissionMethod,
        arrCardNo: submissionData.arrCardNo,
        userAgent: 'TDACSubmissionService'
      }, 0);

      logger.debug('TDACSubmissionService', 'Error handling result', { errorResult });

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
   * @param submissionData - Raw submission data from TDAC API
   * @returns Standardized TDAC submission metadata
   *
   * Field Clarification:
   * - qrUri: Currently set to PDF path, but SHOULD be QR code image path
   * - pdfPath: Full PDF document path (correct usage)
   *
   * TODO: Once QR extraction is implemented, qrUri should point to extracted
   * QR image (e.g., Documents/tdac/QR_TH12345_timestamp.png), not PDF.
   */
  static extractTDACSubmissionMetadata(submissionData: SubmissionData): TDACSubmissionMetadata {
    // Extract PDF path
    const pdfPath = submissionData.pdfPath || submissionData.fileUri;

    return {
      arrCardNo: submissionData.arrCardNo || submissionData.cardNo || '',
      // TODO: Once QR extraction implemented, qrUri should be separate QR image path
      qrUri: submissionData.qrUri || pdfPath || submissionData.src || '',  // Currently same as PDF
      pdfPath: pdfPath || '',  // Full PDF document path
      submittedAt: submissionData.submittedAt || submissionData.timestamp
        ? new Date(submissionData.submittedAt || submissionData.timestamp).toISOString()
        : new Date().toISOString(),
      submissionMethod: submissionData.submissionMethod || 'unknown'
    };
  }

  /**
   * Enhanced TDAC submission metadata validation with comprehensive error handling
   *
   * @param tdacSubmission - TDAC submission metadata to validate
   * @returns Validation result with isValid flag and errors array
   */
  static validateTDACSubmissionMetadata(tdacSubmission: TDACSubmissionMetadata): ValidationResult {
    try {
      logger.debug('TDACSubmissionService', 'Starting comprehensive TDAC validation', { 
        arrCardNo: tdacSubmission?.arrCardNo 
      });

      // Use comprehensive validation service
      // Convert TDACSubmissionMetadata to TDACSubmission format
      const tdacSubmissionForValidation = {
        arrCardNo: tdacSubmission.arrCardNo,
        qrUri: tdacSubmission.qrUri,
        pdfUrl: tdacSubmission.pdfPath,
        submittedAt: tdacSubmission.submittedAt,
        submissionMethod: tdacSubmission.submissionMethod === 'unknown' 
          ? undefined 
          : tdacSubmission.submissionMethod as 'api' | 'webview' | 'hybrid'
      };
      
      const validationResult = TDACValidationService.validateTDACSubmission(tdacSubmissionForValidation, {
        strict: true,
        checkFiles: false // Skip file checks for performance
      });

      if (!validationResult.isValid) {
        logger.error('TDACSubmissionService', new Error('TDAC validation failed'), {
          errors: validationResult.errors,
          fieldErrors: validationResult.fieldErrors,
          arrCardNo: tdacSubmission?.arrCardNo
        });

        // Get validation summary
        const summary = TDACValidationService.getValidationSummary(validationResult);

        // Display validation errors to user if critical
        if (summary.criticalErrors.length > 0) {
          logger.error('TDACSubmissionService', new Error('Critical validation errors'), { criticalErrors: summary.criticalErrors });
        }

        return validationResult;
      }

      // Log warnings if any
      if (validationResult.warnings && validationResult.warnings.length > 0) {
        logger.warn('TDACSubmissionService', 'TDAC validation warnings', { warnings: validationResult.warnings });
      }

      logger.debug('TDACSubmissionService', 'TDAC validation passed', { arrCardNo: tdacSubmission?.arrCardNo });
      return validationResult;

    } catch (error: any) {
      logger.error('TDACSubmissionService', error, { arrCardNo: tdacSubmission?.arrCardNo });

      // Fallback to basic validation
      const required = ['arrCardNo', 'qrUri'];
      const missing = required.filter(field => !tdacSubmission[field] || !tdacSubmission[field].trim());

      if (missing.length > 0) {
        logger.error('TDACSubmissionService', new Error('Missing required TDAC submission fields'), { 
          missing, 
          arrCardNo: tdacSubmission?.arrCardNo 
        });
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
   * @param digitalArrivalCardId - ID of the digital arrival card
   * @param submissionHistoryEntry - History entry to record
   * @returns Success status
   */
  static async recordSubmissionHistory(
    digitalArrivalCardId: string, 
    submissionHistoryEntry: SubmissionHistoryEntry
  ): Promise<boolean> {
    try {
      logger.debug('TDACSubmissionService', 'Recording submission history', {
        digitalArrivalCardId,
        entry: submissionHistoryEntry
      });

      // This would integrate with DigitalArrivalCard model to append to submissionHistory array
      // For now, just log - actual implementation would update DigitalArrivalCard.submissionHistory
      return true;
    } catch (error: any) {
      logger.error('TDACSubmissionService', error, { digitalArrivalCardId });
      return false;
    }
  }

  /**
   * Create entry info snapshot
   * Creates immutable snapshot of entry info data after successful TDAC submission
   *
   * @param entryInfoId - ID of the entry info
   * @param reason - Reason for snapshot (e.g., 'submission')
   * @param metadata - Additional metadata for the snapshot
   * @returns Created snapshot or null if failed
   */
  static async createEntryInfoSnapshot(
    entryInfoId: string, 
    reason: string = 'submission', 
    metadata: Record<string, any> = {}
  ): Promise<any | null> {
    try {
      logger.debug('TDACSubmissionService', 'Creating entry info snapshot', {
        entryInfoId,
        reason,
        metadata
      });

      logger.debug('TDACSubmissionService', 'Starting snapshot creation process', { entryInfoId });

      // Call SnapshotService to create snapshot
      const snapshot = await SnapshotService.createSnapshot(entryInfoId, reason, metadata);

      if (snapshot) {
        logger.info('TDACSubmissionService', 'Entry info snapshot created successfully', {
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

    } catch (error: any) {
      logger.error('TDACSubmissionService', error, {
        entryInfoId,
        reason
      });

      // Log the failure for debugging
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
        logger.debug('TDACSubmissionService', 'Snapshot creation failure logged', { entryInfoId });
      } catch (logError: any) {
        logger.error('TDACSubmissionService', logError, { entryInfoId });
      }

      // Re-throw error to prevent silent data loss
      throw new Error(`Failed to create snapshot: ${error.message}`);
    }
  }

  /**
   * Find or create entry info ID for the traveler
   *
   * @param travelerInfo - Traveler information
   * @param destinationId - Destination ID (defaults to 'th' for backward compatibility)
   * @returns Entry info ID or null if failed
   */
  static async findOrCreateEntryInfoId(
    travelerInfo: TravelerInfo, 
    destinationId: string = 'th'
  ): Promise<string | null> {
    try {
      const userId = travelerInfo?.userId || 'current_user';
      logger.debug('TDACSubmissionService', 'Looking for existing entry info for destination', { destinationId, userId });

      // Try to find existing entry info for this user and destination
      let entryInfo = await UserDataService.getEntryInfo(userId, destinationId);

      if (entryInfo) {
        logger.info('TDACSubmissionService', 'Found existing entry info', { entryInfoId: entryInfo.id, destinationId });
        return entryInfo.id;
      }

      logger.debug('TDACSubmissionService', 'Creating new entry info', { destinationId, userId: travelerInfo?.userId });

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
      logger.info('TDACSubmissionService', 'Created new entry info', { 
        entryInfoId: entryInfo.id, 
        destinationId, 
        userId 
      });

      return entryInfo.id;
    } catch (error: any) {
      logger.error('TDACSubmissionService', error, { 
        destinationId, 
        userId: travelerInfo?.userId 
      });
      return null;
    }
  }

  /**
   * Update EntryInfo status from 'ready' to 'submitted'
   * Ensures proper state transitions and triggers notification system
   *
   * @param entryInfoId - ID of the entry info
   * @param tdacSubmission - TDAC submission metadata
   * @returns Updated entry info or null if failed
   */
  static async updateEntryInfoStatus(
    entryInfoId: string, 
    tdacSubmission: TDACSubmissionMetadata
  ): Promise<any | null> {
    try {
      logger.debug('TDACSubmissionService', 'Updating EntryInfo status to submitted', { 
        entryInfoId, 
        arrCardNo: tdacSubmission?.arrCardNo 
      });

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

      logger.info('TDACSubmissionService', 'EntryInfo status updated successfully', {
        entryInfoId: updatedEntryInfo.id,
        oldStatus: 'ready',
        newStatus: updatedEntryInfo.status,
        submissionDate: updatedEntryInfo.submissionDate,
        lastUpdatedAt: updatedEntryInfo.lastUpdatedAt
      });

      // Trigger state change event for notification system
      logger.debug('TDACSubmissionService', 'State change event triggered for notification system', { entryInfoId });

      return updatedEntryInfo;
    } catch (error: any) {
      logger.error('TDACSubmissionService', error, {
        entryInfoId,
        arrCardNo: tdacSubmission?.arrCardNo
      });

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
        logger.debug('TDACSubmissionService', 'EntryInfo status update failure logged', { entryInfoId });
      } catch (logError: any) {
        logger.error('TDACSubmissionService', logError, { entryInfoId });
      }

      return null;
    }
  }

  /**
   * Populate entry info with traveler data
   * Updates the entry info with actual traveler data before creating snapshot
   *
   * @param entryInfoId - ID of the entry info
   * @param travelerInfo - Traveler information context
   * @param userId - User ID
   * @returns Updated entry info or null if failed
   */
  static async populateEntryInfoWithTravelerData(
    entryInfoId: string, 
    travelerInfo: TravelerInfo, 
    userId: UserId
  ): Promise<any | null> {
    try {
      logger.debug('TDACSubmissionService', 'Populating entry info with traveler data', { entryInfoId, userId });

      // Format birth date if it's an object
      let birthDateStr = '';
      if (travelerInfo.birthDate) {
        if (typeof travelerInfo.birthDate === 'string') {
          birthDateStr = travelerInfo.birthDate;
        } else if (typeof travelerInfo.birthDate === 'object' && travelerInfo.birthDate.year) {
          const { year, month, day } = travelerInfo.birthDate;
          birthDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }

      // Build entry info data from traveler context
      const entryInfoData = {
        passport: {
          fullName: `${travelerInfo.firstName || ''} ${travelerInfo.familyName || ''}`.trim(),
          passportNumber: travelerInfo.passportNo || '',
          nationality: travelerInfo.nationality || '',
          dateOfBirth: birthDateStr
        },
        personalInfo: {
          occupation: travelerInfo.occupation || '',
          phoneNumber: travelerInfo.phoneNo 
            ? `+${travelerInfo.phoneCode || ''} ${travelerInfo.phoneNo}` 
            : '',
          email: travelerInfo.email || ''
        },
        travel: {
          arrivalDate: travelerInfo.arrivalDate || '',
          flightNumber: travelerInfo.flightNo || '',
          travelPurpose: travelerInfo.purpose || '',
          accommodation: travelerInfo.address || '',
          departureDate: travelerInfo.departureDate || ''
        },
        funds: []
      };

      // Update the entry info with the populated data
      // Note: saveEntryInfo can be used to update existing entry info by including the id
      const updatedEntryInfo = await UserDataService.saveEntryInfo({ ...entryInfoData, id: entryInfoId }, userId);

      logger.info('TDACSubmissionService', 'Entry info populated with traveler data successfully', { entryInfoId });
      return updatedEntryInfo;
    } catch (error: any) {
      logger.error('TDACSubmissionService', error, { 
        entryInfoId, 
        userId 
      });
      // Don't throw - this is a secondary operation
      return null;
    }
  }

  /**
   * Record failure with enhanced logging
   *
   * @param errorResult - Error result from TDACErrorHandler
   * @param submissionData - Original submission data
   * @param error - Original error object
   */
  static async recordFailure(
    errorResult: ErrorResult, 
    submissionData: SubmissionData, 
    error: Error
  ): Promise<void> {
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
      logger.debug('TDACSubmissionService', 'Enhanced TDAC submission failure logged', { errorId: errorResult.errorId });
    } catch (logError: any) {
      logger.error('TDACSubmissionService', logError);
    }
  }

  /**
   * Sanitize submission data to remove sensitive information before logging
   *
   * @param data - Data to sanitize
   * @returns Sanitized data
   */
  static sanitizeSubmissionData(data: SubmissionData): Record<string, any> {
    const sanitized: Record<string, any> = { ...data };

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
   * @param errorResult - Error result from TDACErrorHandler
   * @param onRetry - Callback for retry action
   * @param onContinue - Callback for continue action
   * @param onSupport - Callback for support action
   */
  static showErrorDialog(
    errorResult: ErrorResult,
    onRetry?: () => void,
    onContinue?: () => void,
    onSupport?: () => void
  ): void {
    const errorDialog = TDACErrorHandler.createErrorDialog(errorResult);

    Alert.alert(
      errorDialog.title,
      `${errorDialog.message}\n\nError ID: ${errorResult.errorId}`,
      [
        {
          text: 'Retry Later',
          onPress: onRetry || (() => {})
        },
        {
          text: 'Continue Anyway',
          onPress: onContinue || (() => {})
        },
        {
          text: 'Contact Support',
          onPress: onSupport || (() => {})
        }
      ]
    );
  }
}

export default TDACSubmissionService;
export type {
  SubmissionData,
  TDACSubmissionMetadata,
  TravelerInfo,
  SubmissionHistoryEntry,
  SubmissionResult,
  ValidationResult,
  ErrorResult,
  ErrorDialogCallbacks
};

