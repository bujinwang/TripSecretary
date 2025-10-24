/**
 * @fileoverview DataEventService - Data change event management
 *
 * Handles data change detection and event notifications:
 * - Data change listeners
 * - Resubmission warnings for entry infos
 * - Data diff calculation
 * - Event storage and retrieval
 *
 * @module app/services/data/events/DataEventService
 */

/**
 * @class DataEventService
 * @classdesc Manages data change events and resubmission warnings
 */
class DataEventService {
  /**
   * Data change listeners for detecting modifications
   * @type {Array}
   * @static
   */
  static dataChangeListeners = [];

  /**
   * Resubmission warnings storage
   * @type {Map}
   * @static
   */
  static resubmissionWarnings = new Map();

  /**
   * Add data change listener
   * @param {Function} listener - Listener function
   * @returns {Function} - Unsubscribe function
   */
  static addDataChangeListener(listener) {
    this.dataChangeListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.dataChangeListeners.indexOf(listener);
      if (index > -1) {
        this.dataChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Trigger data change event
   * @param {string} dataType - Type of data that changed
   * @param {string} userId - User ID
   * @param {Object} changeDetails - Details about the change
   */
  static triggerDataChangeEvent(dataType, userId, changeDetails = {}) {
    try {
      const event = {
        type: 'DATA_CHANGED',
        dataType,
        userId,
        timestamp: new Date().toISOString(),
        ...changeDetails
      };

      console.log('Data change event triggered:', event);

      // Notify all listeners
      this.dataChangeListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in data change listener:', error);
        }
      });
    } catch (error) {
      console.error('Failed to trigger data change event:', error);
    }
  }

  /**
   * Handle data changes for active entry infos
   * @param {string} userId - User ID
   * @param {string} dataType - Type of data that changed
   * @param {Object} changeDetails - Details about the change
   * @param {Function} getAllEntryInfosForUser - Callback to get entry infos
   * @param {Function} checkEntryInfoForDataChanges - Callback to check entry info
   */
  static async handleDataChangeForActiveEntryPacks(userId, dataType, changeDetails, getAllEntryInfosForUser, checkEntryInfoForDataChanges) {
    try {
      // Get active entry infos for user
      const activeEntryInfos = await getAllEntryInfosForUser(userId);

      // Filter for submitted entry infos (these need resubmission warnings)
      const submittedInfos = activeEntryInfos.filter(info => info.status === 'submitted');

      if (submittedInfos.length === 0) {
        console.log('No submitted entry infos found, no resubmission warning needed');
        return;
      }

      console.log(`Found ${submittedInfos.length} submitted entry infos, checking for data changes`);

      // Check each submitted entry info for data changes
      for (const entryInfo of submittedInfos) {
        await checkEntryInfoForDataChanges(entryInfo, dataType, changeDetails);
      }
    } catch (error) {
      console.error('Failed to handle data change for active entry infos:', error);
    }
  }

  /**
   * Check entry info for data changes and trigger resubmission warning if needed
   * @param {Object} entryInfo - Entry info to check
   * @param {string} dataType - Type of data that changed
   * @param {Object} changeDetails - Details about the change
   * @param {Function} getAllUserData - Callback to get all user data
   * @param {Function} getTravelInfo - Callback to get travel info
   * @param {Function} getFundItems - Callback to get fund items
   */
  static async checkEntryInfoForDataChanges(entryInfo, dataType, changeDetails, getAllUserData, getTravelInfo, getFundItems) {
    try {
      console.log('Checking entry info for data changes:', {
        entryInfoId: entryInfo.id,
        status: entryInfo.status,
        dataType
      });

      // Get snapshot data for comparison
      const SnapshotService = require('../../snapshot/SnapshotService').default;
      const snapshots = await SnapshotService.list(entryInfo.userId, {
        entryInfoId: entryInfo.id
      });

      if (snapshots.length === 0) {
        console.log('No snapshots found for entry info, cannot compare data changes');
        return;
      }

      // Use the most recent snapshot
      const latestSnapshot = snapshots[0];
      const snapshotData = {
        passport: latestSnapshot.passport,
        personalInfo: latestSnapshot.personalInfo,
        funds: latestSnapshot.funds,
        travel: latestSnapshot.travel
      };

      // Get current user data
      const currentData = await getAllUserData(entryInfo.userId);

      // Get current travel info
      const currentTravel = await getTravelInfo(entryInfo.userId, entryInfo.destinationId);

      // Get current funds
      const currentFunds = await getFundItems(entryInfo.userId);

      const completeCurrentData = {
        passport: currentData.passport,
        personalInfo: currentData.personalInfo,
        funds: currentFunds,
        travel: currentTravel
      };

      // Calculate differences
      const DataDiffCalculator = require('../../../utils/DataDiffCalculator').default;
      const diffResult = DataDiffCalculator.calculateDiff(snapshotData, completeCurrentData);

      if (diffResult.hasChanges) {
        console.log('Data changes detected for entry info:', {
          entryInfoId: entryInfo.id,
          totalChanges: diffResult.summary.totalChanges,
          significantChanges: diffResult.summary.significantChanges
        });

        // Generate change summary
        const changeSummary = DataDiffCalculator.generateChangeSummary(diffResult);

        // Trigger resubmission warning event
        this.triggerResubmissionWarningEvent(entryInfo, diffResult, changeSummary);
      } else {
        console.log('No significant data changes detected for entry info:', entryInfo.id);
      }
    } catch (error) {
      console.error('Failed to check entry info for data changes:', error);
    }
  }

  /**
   * Trigger resubmission warning event
   * @param {Object} entryInfo - Entry info that needs resubmission
   * @param {Object} diffResult - Diff calculation result
   * @param {Object} changeSummary - User-friendly change summary
   */
  static triggerResubmissionWarningEvent(entryInfo, diffResult, changeSummary) {
    try {
      const DataDiffCalculator = require('../../../utils/DataDiffCalculator').default;

      const event = {
        type: 'RESUBMISSION_WARNING',
        entryInfoId: entryInfo.id,
        userId: entryInfo.userId,
        destinationId: entryInfo.destinationId,
        diffResult,
        changeSummary,
        requiresImmediateResubmission: DataDiffCalculator.requiresImmediateResubmission(diffResult),
        timestamp: new Date().toISOString()
      };

      console.log('Resubmission warning event triggered:', {
        entryInfoId: entryInfo.id,
        changesCount: diffResult.summary.totalChanges,
        requiresImmediate: event.requiresImmediateResubmission
      });

      // Store event for UI to pick up
      this.storeResubmissionWarningEvent(event);

      // Notify listeners
      this.dataChangeListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in resubmission warning listener:', error);
        }
      });
    } catch (error) {
      console.error('Failed to trigger resubmission warning event:', error);
    }
  }

  /**
   * Store resubmission warning event for UI consumption
   * @param {Object} event - Resubmission warning event
   */
  static storeResubmissionWarningEvent(event) {
    try {
      // Store by entry info ID for easy retrieval
      this.resubmissionWarnings.set(event.entryInfoId, event);

      // Keep only recent warnings (last 10)
      if (this.resubmissionWarnings.size > 10) {
        const entries = Array.from(this.resubmissionWarnings.entries());
        const oldestEntry = entries.sort((a, b) =>
          new Date(a[1].timestamp) - new Date(b[1].timestamp)
        )[0];
        this.resubmissionWarnings.delete(oldestEntry[0]);
      }

      console.log('Resubmission warning stored:', {
        entryInfoId: event.entryInfoId,
        totalWarnings: this.resubmissionWarnings.size
      });
    } catch (error) {
      console.error('Failed to store resubmission warning event:', error);
    }
  }

  /**
   * Get pending resubmission warnings for user
   * @param {string} userId - User ID
   * @returns {Array} - Array of resubmission warnings
   */
  static getPendingResubmissionWarnings(userId) {
    try {
      const warnings = Array.from(this.resubmissionWarnings.values())
        .filter(warning => warning.userId === userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return warnings;
    } catch (error) {
      console.error('Failed to get pending resubmission warnings:', error);
      return [];
    }
  }

  /**
   * Get resubmission warning for specific entry info
   * @param {string} entryInfoId - Entry info ID
   * @returns {Object|null} - Resubmission warning or null
   */
  static getResubmissionWarning(entryInfoId) {
    try {
      return this.resubmissionWarnings.get(entryInfoId) || null;
    } catch (error) {
      console.error('Failed to get resubmission warning:', error);
      return null;
    }
  }

  /**
   * Clear resubmission warning for entry info
   * @param {string} entryInfoId - Entry info ID
   */
  static clearResubmissionWarning(entryInfoId) {
    try {
      this.resubmissionWarnings.delete(entryInfoId);
      console.log('Resubmission warning cleared:', entryInfoId);
    } catch (error) {
      console.error('Failed to clear resubmission warning:', error);
    }
  }

  /**
   * Mark entry info as superseded due to data changes
   * @param {string} entryInfoId - Entry info ID
   * @param {Object} changeDetails - Details about the changes
   * @returns {Promise<Object>} - Updated entry info
   */
  static async markEntryInfoAsSuperseded(entryInfoId, changeDetails = {}) {
    try {
      console.log('Marking entry info as superseded:', {
        entryInfoId,
        changeDetails
      });

      // Load the entry info
      const EntryInfo = require('../../../models/EntryInfo').default;
      const entryInfo = await EntryInfo.load(entryInfoId);

      if (!entryInfo) {
        throw new Error(`Entry info not found: ${entryInfoId}`);
      }

      // Mark entry info as superseded
      entryInfo.markAsSuperseded();

      // Save the updated entry info
      await entryInfo.save();

      // Clear the resubmission warning since it's been handled
      this.clearResubmissionWarning(entryInfoId);

      console.log('Entry info marked as superseded successfully:', {
        entryInfoId,
        newStatus: entryInfo.status
      });

      return entryInfo;
    } catch (error) {
      console.error('Failed to mark entry info as superseded:', error);
      throw error;
    }
  }
}

export default DataEventService;
