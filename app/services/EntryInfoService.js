import SecureStorageService from './security/SecureStorageService';
import EntryInfo from '../models/EntryInfo';
import DigitalArrivalCard from '../models/DigitalArrivalCard';

class EntryInfoService {
  /**
   * Get all EntryInfo records for a user.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Array<EntryInfo>>} - An array of EntryInfo instances.
   */
  static async getAllEntryInfos(userId) {
    try {
      // Ensure SecureStorageService is initialized
      await SecureStorageService.initialize(userId);

      // Get all entry infos for a user from SecureStorageService
      const entryInfoData = await SecureStorageService.getAllEntryInfos(userId);
      return entryInfoData.map(data => new EntryInfo(data));
    } catch (error) {
      console.error('Failed to get all EntryInfos:', error);
      throw error;
    }
  }

  /**
   * Get a single EntryInfo record by its ID.
   * @param {string} entryInfoId - The ID of the EntryInfo record.
   * @returns {Promise<EntryInfo|null>} - An EntryInfo instance or null if not found.
   */
  static async getEntryInfoById(entryInfoId) {
    try {
      const data = await SecureStorageService.getEntryInfo(entryInfoId);
      if (!data) {
        return null;
      }
      return new EntryInfo(data);
    } catch (error) {
      console.error('Failed to get EntryInfo by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new EntryInfo record.
   * @param {Object} entryInfoData - The data for the new EntryInfo record.
   * @returns {Promise<EntryInfo>} - The created EntryInfo instance.
   */
  static async createEntryInfo(entryInfoData) {
    try {
      const entryInfo = new EntryInfo(entryInfoData);
      await entryInfo.save();
      return entryInfo;
    } catch (error) {
      console.error('Failed to create EntryInfo:', error);
      throw error;
    }
  }

  /**
   * Update an existing EntryInfo record.
   * @param {string} entryInfoId - The ID of the EntryInfo record to update.
   * @param {Object} updateData - The data to update.
   * @returns {Promise<EntryInfo>} - The updated EntryInfo instance.
   */
  static async updateEntryInfo(entryInfoId, updateData) {
    try {
      const entryInfo = await this.getEntryInfoById(entryInfoId);
      if (!entryInfo) {
        throw new Error(`EntryInfo not found: ${entryInfoId}`);
      }

      // Update the entry info with new data
      Object.assign(entryInfo, updateData);
      await entryInfo.save();
      return entryInfo;
    } catch (error) {
      console.error('Failed to update EntryInfo:', error);
      throw error;
    }
  }

  /**
   * Delete an EntryInfo record by its ID.
   * @param {string} entryInfoId - The ID of the EntryInfo record to delete.
   * @returns {Promise<boolean>} - True if deleted successfully, false otherwise.
   */
  static async deleteEntryInfo(entryInfoId) {
    try {
      // Delete entry info using SecureStorageService
      return await SecureStorageService.deleteEntryInfo(entryInfoId);
    } catch (error) {
      console.error('Failed to delete EntryInfo:', error);
      throw error;
    }
  }

  /**
   * Get the latest successful Digital Arrival Card for a given EntryInfo and card type.
   * @param {string} entryInfoId - The ID of the EntryInfo record.
   * @param {string} cardType - The type of the digital arrival card (e.g., 'TDAC').
   * @returns {Promise<DigitalArrivalCard|null>} - A DigitalArrivalCard instance or null.
   */
  static async getLatestSuccessfulDigitalArrivalCard(entryInfoId, cardType) {
    try {
      const dacData = await SecureStorageService.getLatestSuccessfulDigitalArrivalCard(entryInfoId, cardType);
      if (!dacData) {
        return null;
      }
      return new DigitalArrivalCard(dacData);
    } catch (error) {
      console.error('Failed to get latest successful DigitalArrivalCard:', error);
      throw error;
    }
  }

  /**
   * Get home screen data for multi-destination support.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Object>} - Home screen data object.
   */
  static async getHomeScreenData(userId) {
    try {
      // Get all entry infos for the user
      const allEntryInfos = await this.getAllEntryInfos(userId);

      // Filter and categorize entry infos
      const submittedEntryPacks = [];
      const inProgressDestinations = [];

      for (const entryInfo of allEntryInfos) {
        // Check if entry info has a successful DAC submission
        const latestDAC = await this.getLatestSuccessfulDigitalArrivalCard(entryInfo.id, 'TDAC');
        if (latestDAC) {
          // Has submitted DAC - add to submitted packs
          submittedEntryPacks.push({
            id: entryInfo.id,
            destinationId: entryInfo.destinationId,
            destinationName: entryInfo.destinationName,
            status: 'submitted',
            arrivalDate: entryInfo.travel?.arrivalDate,
            submittedAt: latestDAC.submittedAt,
            cardType: latestDAC.cardType
          });
        } else {
          // No successful DAC - add to in-progress destinations
          // Calculate completion percentage based on filled fields
          const completionPercent = this.calculateCompletionPercent(entryInfo);
          // Include all entries without submitted DAC, even if 0% complete
          // This ensures user can see destinations they started working on
          inProgressDestinations.push({
            destinationId: entryInfo.destinationId,
            destinationName: entryInfo.destinationName,
            completionPercent: completionPercent,
            isReady: completionPercent >= 80, // Consider ready if 80%+ complete
            entryInfoId: entryInfo.id // Add ID for navigation
          });
        }
      }

      // Calculate summary statistics
      const summary = {
        submittedEntryPacks: submittedEntryPacks.length,
        inProgressDestinations: inProgressDestinations.length,
        overallCompletionPercent: this.calculateOverallCompletion(submittedEntryPacks, inProgressDestinations),
        hasAnyProgress: submittedEntryPacks.length > 0 || inProgressDestinations.length > 0
      };

      return {
        submittedEntryPacks,
        inProgressDestinations,
        summary
      };
    } catch (error) {
      console.error('Failed to get home screen data:', error);
      throw error;
    }
  }

  /**
   * Calculate completion percentage for an entry info.
   * Uses EntryCompletionCalculator as the single source of truth for consistent validation
   * @param {EntryInfo} entryInfo - The entry info to calculate completion for.
   * @returns {number} - Completion percentage (0-100).
   */
  static calculateCompletionPercent(entryInfo) {
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
  static calculateOverallCompletion(submittedPacks, inProgressDestinations) {
    const totalDestinations = submittedPacks.length + inProgressDestinations.length;
    if (totalDestinations === 0) return 0;

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
