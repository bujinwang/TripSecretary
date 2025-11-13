/**
 * EntryInfoService - Service for managing EntryInfo records
 * Provides CRUD operations and helper methods for EntryInfo data
 */

import SecureStorageService from './security/SecureStorageService';
import EntryInfo from '../models/EntryInfo';
import type { EntryInfoInit } from '../models/EntryInfo';
import DigitalArrivalCard from '../models/DigitalArrivalCard';
import logger from './LoggingService';
import type { UserId } from '../types/data';

// Type definitions for EntryInfo (to be refined when EntryInfo model is migrated)
type EntryInfoModel = any;
type DigitalArrivalCardModel = any;

interface EntryInfoData {
  id?: string;
  userId: UserId;
  destinationId?: string;
  destinationName?: string;
  travelInfoId?: string;
  completionMetrics?: {
    passport?: { complete?: number; total?: number };
    personalInfo?: { complete?: number; total?: number };
    travel?: { complete?: number; total?: number };
    funds?: { complete?: number; total?: number };
  };
  travel?: {
    arrivalDate?: string;
  };
  lastUpdatedAt?: string;
  [key: string]: any;
}

interface SubmittedEntryPack {
  id: string;
  destinationId: string;
  destinationName: string;
  status: string;
  arrivalDate?: string;
  submittedAt?: string;
  cardType?: string;
  flightNumber?: string;
  departureDate?: string;
  visaNumber?: string;
  hotelName?: string;
}

interface InProgressDestination {
  destinationId: string;
  destinationName: string;
  completionPercent: number;
  isReady: boolean;
  entryInfoId: string;
  arrivalDate?: string;
  flightNumber?: string;
}

interface LeftEntryInfo {
  id: string;
  destinationId: string;
  destinationName: string;
  leftAt: string;
  completionPercent: number;
  arrivalDate?: string | null;
}

interface ArchivedEntryInfo {
  id: string;
  destinationId: string;
  destinationName: string;
  archivedAt: string;
  status: string;
  arrivalDate?: string | null;
}

interface HomeScreenSummary {
  submittedEntryPacks: number;
  inProgressDestinations: number;
  leftEntryInfos: number;
  archivedEntryInfos: number;
  overallCompletionPercent: number;
  hasAnyProgress: boolean;
}

interface HomeScreenData {
  submittedEntryPacks: SubmittedEntryPack[];
  inProgressDestinations: InProgressDestination[];
  leftEntryInfos: LeftEntryInfo[];
  archivedEntryInfos: ArchivedEntryInfo[];
  summary: HomeScreenSummary;
}

class EntryInfoService {
  /**
   * Get all EntryInfo records for a user.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Array<EntryInfo>>} - An array of EntryInfo instances.
   */
  static async getAllEntryInfos(userId: UserId): Promise<EntryInfoModel[]> {
    try {
      logger.debug('EntryInfoService', 'Getting all entry infos', { userId });
      
      // Ensure SecureStorageService is initialized
      await SecureStorageService.initialize(userId);

      // Get all entry infos for a user from SecureStorageService
      const entryInfoData = await SecureStorageService.getAllEntryInfos(userId);
      logger.debug('EntryInfoService', 'Retrieved entry info data from storage', {
        count: entryInfoData.length,
        ids: entryInfoData.map((d: any) => d.id),
        destinationIds: entryInfoData.map((d: any) => d.destinationId),
        statuses: entryInfoData.map((d: any) => d.status)
      });

      if (!entryInfoData || entryInfoData.length === 0) {
        logger.debug('EntryInfoService', 'No entry info data found in storage', { userId });
        return [];
      }

      const entryInfos = [];
      const failedEntries = [];
      
      for (const data of entryInfoData) {
        try {
          const entryInfo = new EntryInfo(data);
          entryInfos.push(entryInfo);
        } catch (error: any) {
          logger.error('EntryInfoService', `Failed to create EntryInfo from data`, {
            entryInfoId: data.id,
            destinationId: data.destinationId,
            error: error.message,
            stack: error.stack
          });
          failedEntries.push({ id: data.id, destinationId: data.destinationId, error: error.message });
          // Continue processing other entries instead of throwing
        }
      }
      
      if (failedEntries.length > 0) {
        logger.warn('EntryInfoService', `Failed to create ${failedEntries.length} EntryInfo instances`, {
          failedEntries,
          successfulCount: entryInfos.length,
          totalCount: entryInfoData.length
        });
      }

      logger.debug('EntryInfoService', 'Created EntryInfo instances', {
        count: entryInfos.length,
        ids: entryInfos.map(ei => ei.id)
      });

      return entryInfos;
    } catch (error: any) {
      logger.error('EntryInfoService', 'Failed to get all EntryInfos', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get a single EntryInfo record by its ID.
   * @param {string} entryInfoId - The ID of the EntryInfo record.
   * @returns {Promise<EntryInfo|null>} - An EntryInfo instance or null if not found.
   */
  static async getEntryInfoById(entryInfoId: string): Promise<EntryInfoModel | null> {
    try {
      const data = await SecureStorageService.getEntryInfo(entryInfoId);
      if (!data) {
        return null;
      }
      return new EntryInfo(data);
    } catch (error: any) {
      logger.error('EntryInfoService', 'Failed to get EntryInfo by ID', { error });
      throw error;
    }
  }

  /**
   * Create a new EntryInfo record.
   * @param {Object} entryInfoData - The data for the new EntryInfo record.
   * @returns {Promise<EntryInfo>} - The created EntryInfo instance.
   */
  static async createEntryInfo(entryInfoData: Partial<EntryInfoData>): Promise<EntryInfoModel> {
    try {
      const entryInfo = new EntryInfo(entryInfoData as EntryInfoInit);
      await entryInfo.save();
      return entryInfo;
    } catch (error: any) {
      logger.error('EntryInfoService', 'Failed to create EntryInfo', { error });
      throw error;
    }
  }

  /**
   * Update an existing EntryInfo record.
   * @param {string} entryInfoId - The ID of the EntryInfo record to update.
   * @param {Object} updateData - The data to update.
   * @returns {Promise<EntryInfo>} - The updated EntryInfo instance.
   */
  static async updateEntryInfo(entryInfoId: string, updateData: Partial<EntryInfoData>): Promise<EntryInfoModel> {
    try {
      const entryInfo = await this.getEntryInfoById(entryInfoId);
      if (!entryInfo) {
        throw new Error(`EntryInfo not found: ${entryInfoId}`);
      }

      // Update the entry info with new data
      Object.assign(entryInfo, updateData);
      await entryInfo.save();
      return entryInfo;
    } catch (error: any) {
      logger.error('EntryInfoService', 'Failed to update EntryInfo', { error });
      throw error;
    }
  }

  /**
   * Delete an EntryInfo record by its ID.
   * @param {string} entryInfoId - The ID of the EntryInfo record to delete.
   * @returns {Promise<boolean>} - True if deleted successfully, false otherwise.
   */
  static async deleteEntryInfo(entryInfoId: string): Promise<void> {
    try {
      // Delete entry info using SecureStorageService
      await SecureStorageService.deleteEntryInfo(entryInfoId);
    } catch (error: any) {
      logger.error('EntryInfoService', 'Failed to delete EntryInfo', { error });
      throw error;
    }
  }

  /**
   * Get the latest successful Digital Arrival Card for a given EntryInfo and card type.
   * @param {string} entryInfoId - The ID of the EntryInfo record.
   * @param {string} cardType - The type of the digital arrival card (e.g., 'TDAC').
   * @returns {Promise<DigitalArrivalCard|null>} - A DigitalArrivalCard instance or null.
   */
  static async getLatestSuccessfulDigitalArrivalCard(entryInfoId: string, cardType: string): Promise<DigitalArrivalCardModel | null> {
    try {
      const dacData = await SecureStorageService.getLatestSuccessfulDigitalArrivalCard(entryInfoId, cardType);
      if (!dacData) {
        return null;
      }
      return new DigitalArrivalCard(dacData);
    } catch (error: any) {
      logger.error('EntryInfoService', 'Failed to get latest successful DigitalArrivalCard', { error });
      throw error;
    }
  }

  /**
   * Get home screen data for multi-destination support.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Object>} - Home screen data object.
   */
  static async getHomeScreenData(userId: UserId): Promise<HomeScreenData> {
    try {
      // Get all entry infos for the user
      const allEntryInfos = await this.getAllEntryInfos(userId);

      logger.debug('EntryInfoService', 'Loaded entry infos for home screen', {
        userId,
        count: allEntryInfos.length,
        entryInfoIds: allEntryInfos.map(ei => ei.id),
        destinationIds: allEntryInfos.map(ei => ei.destinationId),
        statuses: allEntryInfos.map(ei => ei.status)
      });
      
      // Log warning if we expected more entries
      if (allEntryInfos.length < 9) {
        logger.warn('EntryInfoService', `Expected 9 entry infos but only found ${allEntryInfos.length}`, {
          userId,
          foundIds: allEntryInfos.map(ei => ei.id),
          foundDestinations: allEntryInfos.map(ei => ei.destinationId)
        });
      }

      // Helper function to get destination name from destinationId
      const getDestinationName = (destinationId: string | null | undefined): string => {
        if (!destinationId) {
          return 'Unknown';
        }
        try {
          const { getCountryName } = require('../utils/countriesService');
          return getCountryName(destinationId, 'en') || destinationId;
        } catch (error) {
          logger.warn('EntryInfoService', `Failed to get country name for ${destinationId}`, { error });
          return destinationId;
        }
      };

      // Filter and categorize entry infos
      const submittedEntryPacks: SubmittedEntryPack[] = [];
      const inProgressDestinations: InProgressDestination[] = [];
      const leftEntryInfos: LeftEntryInfo[] = [];
      const archivedEntryInfos: ArchivedEntryInfo[] = [];

      for (const entryInfo of allEntryInfos) {
        // Skip entries without destinationId
        if (!entryInfo.destinationId) {
          logger.warn('EntryInfoService', `Entry info ${entryInfo.id} missing destinationId, skipping`, {
            entryInfoId: entryInfo.id
          });
          continue;
        }

        // Derive destination name from destinationId if not present
        const destinationName = entryInfo.destinationName || getDestinationName(entryInfo.destinationId);

        const status: string = entryInfo.status ?? 'incomplete';

        // Load associated travel info if available
        let travelInfo: any = null;
        if (entryInfo.travelInfoId) {
          try {
            const travelData = await SecureStorageService.getTravelInfoById(entryInfo.travelInfoId);
            travelInfo = travelData;
          } catch (error: any) {
            logger.warn('EntryInfoService', `Failed to load travel info ${entryInfo.travelInfoId}`, { error });
          }
        }

        const arrivalDate: string | null =
          travelInfo?.arrivalArrivalDate ?? entryInfo.travel?.arrivalDate ?? null;

        const completionPercent = this.calculateCompletionPercent(entryInfo);

        if (status === 'archived' || status === 'expired') {
          archivedEntryInfos.push({
            id: entryInfo.id,
            destinationId: entryInfo.destinationId,
            destinationName,
            archivedAt: entryInfo.lastUpdatedAt ?? new Date().toISOString(),
            status,
            arrivalDate,
          });
          continue;
        }

        if (status === 'left') {
          leftEntryInfos.push({
            id: entryInfo.id,
            destinationId: entryInfo.destinationId,
            destinationName,
            leftAt: entryInfo.lastUpdatedAt ?? new Date().toISOString(),
            completionPercent,
            arrivalDate,
          });
          continue;
        }

        // Check if entry info has a successful DAC submission
        const latestDAC = await this.getLatestSuccessfulDigitalArrivalCard(entryInfo.id, 'TDAC');
        if (latestDAC) {
          // Has submitted DAC - add to submitted packs
          submittedEntryPacks.push({
            id: entryInfo.id,
            destinationId: entryInfo.destinationId,
            destinationName: destinationName,
            status: 'submitted',
            arrivalDate,
            submittedAt: latestDAC.submittedAt,
            cardType: latestDAC.cardType,
            // Additional travel information
            flightNumber: travelInfo?.arrivalFlightNumber,
            departureDate: travelInfo?.arrivalDepartureDate,
            visaNumber: travelInfo?.visaNumber,
            hotelName: travelInfo?.hotelName
          });
        } else {
          // No successful DAC - add to in-progress destinations
          // Include all entries without submitted DAC, even if 0% complete
          // This ensures user can see destinations they started working on
          inProgressDestinations.push({
            destinationId: entryInfo.destinationId,
            destinationName: destinationName,
            completionPercent: completionPercent,
            isReady: completionPercent >= 80, // Consider ready if 80%+ complete
            entryInfoId: entryInfo.id, // Add ID for navigation
            // Include arrival date for submission countdown
            arrivalDate,
            flightNumber: travelInfo?.arrivalFlightNumber
          });
        }
      }

      logger.debug('EntryInfoService', 'Categorized entry infos', {
        submittedPacks: submittedEntryPacks.length,
        inProgressDestinations: inProgressDestinations.length,
        leftEntryInfos: leftEntryInfos.length,
        archivedEntryInfos: archivedEntryInfos.length
      });

      // Calculate summary statistics
      const summary: HomeScreenSummary = {
        submittedEntryPacks: submittedEntryPacks.length,
        inProgressDestinations: inProgressDestinations.length,
        leftEntryInfos: leftEntryInfos.length,
        archivedEntryInfos: archivedEntryInfos.length,
        overallCompletionPercent: this.calculateOverallCompletion(submittedEntryPacks, inProgressDestinations),
        hasAnyProgress:
          submittedEntryPacks.length > 0 ||
          inProgressDestinations.length > 0 ||
          leftEntryInfos.length > 0 ||
          archivedEntryInfos.length > 0
      };

      return {
        submittedEntryPacks,
        inProgressDestinations,
        leftEntryInfos,
        archivedEntryInfos,
        summary
      };
    } catch (error: any) {
      logger.error('EntryInfoService', 'Failed to get home screen data', { error });
      throw error;
    }
  }

  /**
   * Calculate completion percentage for an entry info.
   * Uses EntryCompletionCalculator as the single source of truth for consistent validation
   * @param {EntryInfo} entryInfo - The entry info to calculate completion for.
   * @returns {number} - Completion percentage (0-100).
   */
  static calculateCompletionPercent(entryInfo: EntryInfoModel): number {
    // Use stored completion metrics if available (preferred path)
    if (entryInfo.completionMetrics) {
      let completedFields = 0;
      let totalFields = 0;

      const metrics = entryInfo.completionMetrics;

      // Sum up completion from stored metrics
      if (metrics.passport) {
        completedFields += metrics.passport.complete || 0;
        totalFields += metrics.passport.total || 5;
      }

      if (metrics.personalInfo) {
        completedFields += metrics.personalInfo.complete || 0;
        totalFields += metrics.personalInfo.total || 6;
      }

      if (metrics.travel) {
        completedFields += metrics.travel.complete || 0;
        totalFields += metrics.travel.total || 5; // Fixed: travel has 5 fields, not 6
      }

      if (metrics.funds) {
        completedFields += metrics.funds.complete || 0;
        totalFields += metrics.funds.total || 1;
      }

      return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    }

    // Fallback: Use EntryCompletionCalculator for consistent validation
    const EntryCompletionCalculator = require('../utils/EntryCompletionCalculator').default;

    const entryInfoForCalculation = {
      passport: entryInfo.passport || {},
      personalInfo: entryInfo.personalInfo || {},
      funds: entryInfo.funds || [],
      travel: entryInfo.travel || {},
      lastUpdatedAt: entryInfo.lastUpdatedAt || new Date().toISOString()
    };

    const summary = EntryCompletionCalculator.getCompletionSummary(entryInfoForCalculation);
    return summary.totalPercent;
  }

  /**
   * Calculate overall completion percentage across all destinations.
   * @param {Array} submittedPacks - Array of submitted entry packs.
   * @param {Array} inProgressDestinations - Array of in-progress destinations.
   * @returns {number} - Overall completion percentage (0-100).
   */
  static calculateOverallCompletion(submittedPacks: SubmittedEntryPack[], inProgressDestinations: InProgressDestination[]): number {
    const totalDestinations = submittedPacks.length + inProgressDestinations.length;
    if (totalDestinations === 0) {
      return 0;
    }

    let totalCompletion = 0;

    // Submitted packs are 100% complete
    totalCompletion += submittedPacks.length * 100;

    // Add completion from in-progress destinations
    for (const dest of inProgressDestinations) {
      totalCompletion += dest.completionPercent;
    }

    return Math.round(totalCompletion / totalDestinations);
  }
}

export default EntryInfoService;

