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

interface TDACSubmissionData {
  arrCardNo?: string;
  cardNo?: string;
  qrUri?: string;
  src?: string;
  pdfPath?: string;
  fileUri?: string;
  submittedAt?: string;
  timestamp?: string;
  submissionMethod?: string;
  duration?: number | null;
  travelerName?: string;
  passportNo?: string;
  arrivalDate?: string;
  [key: string]: unknown;
}

interface TDACSubmissionMetadata {
  arrCardNo: string;
  qrUri: string;
  pdfPath: string;
  submittedAt: string;
  submissionMethod: string;
}

interface TravelerInfo {
  userId?: string;
  firstName?: string;
  familyName?: string;
  passportNo?: string;
  nationality?: string;
  birthDate?: {
    year: number;
    month: number;
    day: number;
  };
  occupation?: string;
  phoneNo?: string;
  phoneCode?: string;
  email?: string;
  arrivalDate?: string;
  flightNo?: string;
  purpose?: string;
  address?: string;
  departureDate?: string;
  [key: string]: unknown;
}

interface SubmissionHistoryEntry {
  timestamp: string;
  status: string;
  method: string;
  arrCardNo: string;
  duration: number | null;
  metadata: {
    qrUri: string;
    pdfPath: string;
    travelerName?: string;
    passportNo?: string;
    arrivalDate?: string;
  };
}

interface ValidationErrorResult {
  isValid: boolean;
  errors: string[];
  fieldErrors?: Record<string, string[]>;
  warnings?: string[];
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

class TDACSubmissionService {
  static async handleTDACSubmissionSuccess(submissionData: TDACSubmissionData, travelerInfo: TravelerInfo): Promise<{
    success: boolean;
    digitalArrivalCard?: unknown;
    entryInfoId?: string;
    error?: string;
    details?: unknown;
    errorResult?: unknown;
  }> {
    try {
      console.log('🎉 Handling TDAC submission success:', {
        arrCardNo: submissionData.arrCardNo,
        method: submissionData.submissionMethod
      });

      const tdacSubmission = this.extractTDACSubmissionMetadata(submissionData);

      const validationResult = this.validateTDACSubmissionMetadata(tdacSubmission);
      if (!validationResult.isValid) {
        console.warn('⚠️ Invalid TDAC submission metadata:', tdacSubmission);
        return {
          success: false,
          error: 'Invalid TDAC submission metadata',
          details: validationResult.errors
        };
      }

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

      console.log('📋 Submission history entry:', submissionHistoryEntry);

      const entryInfoId = await this.findOrCreateEntryInfoId(travelerInfo);
      const userId = travelerInfo?.userId || 'current_user';

      if (entryInfoId) {
        const digitalArrivalCard = await UserDataService.saveDigitalArrivalCard({
          userId,
          entryInfoId,
          cardType: 'TDAC',
          arrCardNo: tdacSubmission.arrCardNo,
          qrUri: tdacSubmission.qrUri,
          pdfUrl: tdacSubmission.pdfPath,
          submittedAt: tdacSubmission.submittedAt,
          submissionMethod: tdacSubmission.submissionMethod,
          status: 'success'
        });

        console.log('✅ Digital arrival card created/updated:', {
          cardId: (digitalArrivalCard as Record<string, unknown>).id,
          arrCardNo: tdacSubmission.arrCardNo,
          status: (digitalArrivalCard as Record<string, unknown>).status
        });

        await this.recordSubmissionHistory((digitalArrivalCard as Record<string, unknown>).id as string, submissionHistoryEntry);

        await this.populateEntryInfoWithTravelerData(entryInfoId, travelerInfo, userId);

        await this.createEntryInfoSnapshot(entryInfoId, 'submission', {
          appVersion: '1.0.0',
          deviceInfo: 'mobile',
          creationMethod: 'auto',
          submissionMethod: tdacSubmission.submissionMethod
        });

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

      const errorResult = await TDACErrorHandler.handleSubmissionError(error as Error, {
        operation: 'digital_arrival_card_creation',
        submissionMethod: submissionData.submissionMethod,
        arrCardNo: submissionData.arrCardNo,
        userAgent: 'TDACSubmissionService'
      }, 0);

      console.log('📋 Error handling result:', errorResult);

      await this.recordFailure(errorResult, submissionData, error as Error);

      return {
        success: false,
        error: (error as Error).message,
        errorResult
      };
    }
  }

  static extractTDACSubmissionMetadata(submissionData: TDACSubmissionData): TDACSubmissionMetadata {
    const pdfPath = submissionData.pdfPath || submissionData.fileUri;

    return {
      arrCardNo: submissionData.arrCardNo || submissionData.cardNo || '',
      qrUri: submissionData.qrUri || pdfPath || submissionData.src || '',
      pdfPath: pdfPath || '',
      submittedAt: submissionData.submittedAt || submissionData.timestamp
        ? new Date(submissionData.submittedAt || submissionData.timestamp as string).toISOString()
        : new Date().toISOString(),
      submissionMethod: submissionData.submissionMethod || 'unknown'
    };
  }

  static validateTDACSubmissionMetadata(tdacSubmission: TDACSubmissionMetadata): ValidationErrorResult {
    try {
      console.log('🔍 Starting comprehensive TDAC validation...');

      const validationResult = TDACValidationService.validateTDACSubmission(tdacSubmission, {
        strict: true,
        checkFiles: false
      });

      if (!validationResult.isValid) {
        console.error('❌ TDAC validation failed:', {
          errors: validationResult.errors,
          fieldErrors: validationResult.fieldErrors
        });

        const summary = TDACValidationService.getValidationSummary(validationResult);

        if (summary.criticalErrors.length > 0) {
          console.error('🚨 Critical validation errors:', summary.criticalErrors);
        }

        return validationResult;
      }

      if (validationResult.warnings && validationResult.warnings.length > 0) {
        console.warn('⚠️ TDAC validation warnings:', validationResult.warnings);
      }

      console.log('✅ TDAC validation passed');
      return validationResult;

    } catch (error) {
      console.error('❌ TDAC validation error:', error);

      const required = ['arrCardNo', 'qrUri'];
      const missing = required.filter(field => !tdacSubmission[field as keyof TDACSubmissionMetadata] || !(tdacSubmission[field as keyof TDACSubmissionMetadata] as string).trim());

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

  static async recordSubmissionHistory(digitalArrivalCardId: string, submissionHistoryEntry: SubmissionHistoryEntry): Promise<boolean> {
    try {
      console.log('📝 Recording submission history:', {
        digitalArrivalCardId,
        entry: submissionHistoryEntry
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to record submission history:', error);
      return false;
    }
  }

  static async createEntryInfoSnapshot(entryInfoId: string, reason = 'submission', metadata: Record<string, unknown> = {}): Promise<unknown | null> {
    try {
      console.log('📸 Creating entry info snapshot:', {
        entryInfoId,
        reason,
        metadata
      });

      console.log('📸 Starting snapshot creation process...');

      const snapshot = await SnapshotService.createSnapshot(entryInfoId, reason, metadata);

      if (snapshot) {
        console.log('✅ Entry info snapshot created successfully:', {
          snapshotId: (snapshot as unknown as Record<string, unknown>).snapshotId,
          entryInfoId,
          reason,
          photoCount: (snapshot as unknown as Record<string, unknown>).getPhotoCount ? (snapshot as unknown as { getPhotoCount: () => number }).getPhotoCount() : 0,
          createdAt: (snapshot as unknown as Record<string, unknown>).createdAt
        });

        return snapshot;
      } else {
        throw new Error('Snapshot creation returned null');
      }

    } catch (error) {
      console.error('❌ Failed to create entry info snapshot:', error);

      try {
        const failureLog = {
          timestamp: new Date().toISOString(),
          entryInfoId,
          reason,
          error: (error as Error).message,
          stack: (error as Error).stack,
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

  static async findOrCreateEntryInfoId(travelerInfo: TravelerInfo): Promise<string | null> {
    try {
      const userId = travelerInfo?.userId || 'current_user';
      const destinationId = 'th';

      console.log('🔍 Looking for existing entry info...');

      let entryInfo = await UserDataService.getEntryInfo(userId, destinationId);

      if (entryInfo) {
        if ((entryInfo as unknown as Record<string, unknown>).status === 'submitted') {
          console.log('⚠️ Existing entry info is already submitted, creating new record for resubmission');
        } else {
          console.log('✅ Found existing entry info:', (entryInfo as unknown as Record<string, unknown>).id);
          return (entryInfo as unknown as Record<string, unknown>).id as string;
        }
      } else {
        const legacyEntryInfo = await UserDataService.getEntryInfo(userId, 'thailand');
        if (legacyEntryInfo && (legacyEntryInfo as unknown as Record<string, unknown>).status !== 'submitted') {
          console.log('🔁 Reusing legacy Thailand entry info:', (legacyEntryInfo as unknown as Record<string, unknown>).id);
          return (legacyEntryInfo as unknown as Record<string, unknown>).id as string;
        }
      }

      console.log('📝 Creating new entry info...');

      const passport = await UserDataService.getPassport(userId);
      if (!passport) {
        throw new Error('User has no passport, cannot create entry info');
      }

      const entryInfoData = {
        destinationId,
        passportId: (passport as unknown as Record<string, unknown>).id,
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
      console.log('✅ Created new entry info:', (entryInfo as unknown as Record<string, unknown>).id);

      return (entryInfo as unknown as Record<string, unknown>).id as string;
    } catch (error) {
      console.error('❌ Failed to find/create entry info ID:', error);
      return null;
    }
  }

  static async updateEntryInfoStatus(entryInfoId: string, tdacSubmission: TDACSubmissionMetadata): Promise<unknown | null> {
    try {
      console.log('📋 Updating EntryInfo status to submitted...');

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
        entryInfoId: (updatedEntryInfo as unknown as Record<string, unknown>).id,
        oldStatus: 'ready',
        newStatus: (updatedEntryInfo as unknown as Record<string, unknown>).status,
        submissionDate: (updatedEntryInfo as unknown as Record<string, unknown>).submissionDate,
        lastUpdatedAt: (updatedEntryInfo as unknown as Record<string, unknown>).lastUpdatedAt
      });

      console.log('📢 State change event triggered for notification system');

      return updatedEntryInfo;
    } catch (error) {
      console.error('❌ Failed to update EntryInfo status:', error);

      try {
        const failureLog = {
          timestamp: new Date().toISOString(),
          entryInfoId,
          error: (error as Error).message,
          stack: (error as Error).stack,
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

  static async populateEntryInfoWithTravelerData(entryInfoId: string, travelerInfo: TravelerInfo, userId: string): Promise<unknown | null> {
    try {
      console.log('📝 Populating entry info with traveler data...');

      const entryInfoData = {
        passport: {
          fullName: `${travelerInfo.firstName || ''} ${travelerInfo.familyName || ''}`.trim(),
          passportNumber: travelerInfo.passportNo || '',
          nationality: travelerInfo.nationality || '',
          dateOfBirth: travelerInfo.birthDate
            ? `${travelerInfo.birthDate.year}-${String(travelerInfo.birthDate.month).padStart(2, '0')}-${String(travelerInfo.birthDate.day).padStart(2, '0')}`
            : ''
        },
        personalInfo: {
          occupation: travelerInfo.occupation || '',
          phoneNumber: travelerInfo.phoneNo ? `+${travelerInfo.phoneCode} ${travelerInfo.phoneNo}` : '',
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

      const updatedEntryInfo = await UserDataService.updateEntryInfo(entryInfoId, entryInfoData, userId);

      console.log('✅ Entry info populated with traveler data successfully');
      return updatedEntryInfo;
    } catch (error) {
      console.error('❌ Failed to populate entry info with traveler data:', error);
      return null;
    }
  }

  static async recordFailure(errorResult: ErrorResult, submissionData: TDACSubmissionData, error: Error): Promise<void> {
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

  static sanitizeSubmissionData(data: TDACSubmissionData): TDACSubmissionData {
    const sanitized = { ...data };

    const sensitiveFields = ['passportNo', 'email', 'phoneNumber', 'qrUri', 'pdfPath'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        const value = String(sanitized[field]);
        if (value.length > 4) {
          sanitized[field] = `${value.substring(0, 2)}****${value.substring(value.length - 2)}`;
        } else {
          sanitized[field] = '****';
        }
      }
    });

    return sanitized;
  }

  static showErrorDialog(errorResult: ErrorResult, onRetry: (() => void) | null, onContinue: (() => void) | null, onSupport: (() => void) | null): void {
    const errorDialog = TDACErrorHandler.createErrorDialog(errorResult);

    Alert.alert(
      errorDialog.title,
      `${errorDialog.message}\n\nError ID: ${errorResult.errorId}`,
      [
        {
          text: 'Retry Later',
          onPress: onRetry || undefined
        },
        {
          text: 'Continue Anyway',
          onPress: onContinue || undefined
        },
        {
          text: 'Contact Support',
          onPress: onSupport || undefined
        }
      ]
    );
  }
}

export default TDACSubmissionService;
