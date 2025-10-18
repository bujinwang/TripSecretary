/**
 * BackgroundJobService - Handles background tasks for the progressive entry flow
 * 
 * Features:
 * - Automatic entry pack archival
 * - Expired entry pack detection
 * - Periodic cleanup tasks
 * - Notification scheduling for archival events
 * 
 * Requirements: 14.1-14.5, 16.1-16.5
 */

import EntryPackService from '../entryPack/EntryPackService';
import NotificationCoordinator from '../notification/NotificationCoordinator';
import NotificationPreferencesService from '../notification/NotificationPreferencesService';
import PassportDataService from '../data/PassportDataService';

class BackgroundJobService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.checkInterval = 60 * 60 * 1000; // Check every hour
    this.lastCheckTime = null;
    this.stats = {
      totalChecks: 0,
      totalArchived: 0,
      lastArchivedCount: 0,
      errors: []
    };
  }

  /**
   * Start the background job service
   */
  async start() {
    try {
      if (this.isRunning) {
        console.log('BackgroundJobService is already running');
        return;
      }

      console.log('Starting BackgroundJobService...');
      
      // Run initial check
      await this.runArchivalCheck();
      
      // Set up periodic checks
      this.intervalId = setInterval(async () => {
        try {
          await this.runArchivalCheck();
        } catch (error) {
          console.error('Background archival check failed:', error);
          this.stats.errors.push({
            timestamp: new Date().toISOString(),
            error: error.message
          });
          
          // Keep only last 10 errors
          if (this.stats.errors.length > 10) {
            this.stats.errors = this.stats.errors.slice(-10);
          }
        }
      }, this.checkInterval);
      
      this.isRunning = true;
      console.log('BackgroundJobService started successfully');
      
    } catch (error) {
      console.error('Failed to start BackgroundJobService:', error);
      throw error;
    }
  }

  /**
   * Stop the background job service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    console.log('BackgroundJobService stopped');
  }

  /**
   * Run archival check for all users
   */
  async runArchivalCheck() {
    try {
      console.log('Running automatic entry pack archival check...');
      
      const startTime = Date.now();
      this.lastCheckTime = new Date().toISOString();
      this.stats.totalChecks++;
      
      // Get all users with active entry packs
      const users = await this.getAllUsersWithActiveEntryPacks();
      
      let totalArchivedCount = 0;
      
      for (const userId of users) {
        try {
          const archivedCount = await this.checkAndArchiveExpiredPacksForUser(userId);
          totalArchivedCount += archivedCount;
        } catch (error) {
          console.error(`Failed to check expired packs for user ${userId}:`, error);
        }
      }
      
      this.stats.lastArchivedCount = totalArchivedCount;
      this.stats.totalArchived += totalArchivedCount;
      
      const duration = Date.now() - startTime;
      
      console.log('Archival check completed:', {
        usersChecked: users.length,
        packsArchived: totalArchivedCount,
        duration: `${duration}ms`,
        totalChecks: this.stats.totalChecks,
        totalArchived: this.stats.totalArchived
      });
      
    } catch (error) {
      console.error('Failed to run archival check:', error);
      throw error;
    }
  }

  /**
   * Get all users with active entry packs
   * @returns {Promise<Array<string>>} Array of user IDs
   */
  async getAllUsersWithActiveEntryPacks() {
    try {
      // In a real implementation, this would query the database for all users
      // For now, we'll use a placeholder approach
      
      // TODO: Implement proper user enumeration from storage
      // This is a simplified approach for the current implementation
      const knownUsers = ['user_001']; // Default user for demo
      
      return knownUsers;
    } catch (error) {
      console.error('Failed to get users with active entry packs:', error);
      return [];
    }
  }

  /**
   * Check and archive expired entry packs for a specific user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of entry packs archived
   */
  async checkAndArchiveExpiredPacksForUser(userId) {
    try {
      console.log(`Checking expired entry packs for user: ${userId}`);
      
      // Initialize user data service
      await PassportDataService.initialize(userId);
      
      // Get active entry packs for user
      const activeEntryPacks = await EntryPackService.getActivePacksForUser(userId);
      
      if (!activeEntryPacks.length) {
        console.log(`No active entry packs found for user ${userId}`);
        return 0;
      }
      
      let archivedCount = 0;
      const now = new Date();
      
      for (const entryPack of activeEntryPacks) {
        try {
          // Check if entry pack should be archived
          const shouldArchive = await this.shouldArchiveEntryPack(entryPack, now);
          
          if (shouldArchive.archive) {
            console.log(`Archiving expired entry pack: ${entryPack.id}`, {
              reason: shouldArchive.reason,
              arrivalDate: shouldArchive.arrivalDate,
              expiryTime: shouldArchive.expiryTime
            });
            
            // Archive the entry pack
            await EntryPackService.archive(entryPack.id, 'auto', {
              triggeredBy: 'background_job',
              autoArchive: true,
              reason: shouldArchive.reason,
              metadata: {
                arrivalDate: shouldArchive.arrivalDate,
                expiryTime: shouldArchive.expiryTime,
                checkTime: now.toISOString()
              }
            });
            
            // Send archival notification if enabled
            await this.sendArchivalNotification(userId, entryPack, shouldArchive);
            
            archivedCount++;
          }
        } catch (error) {
          console.error(`Failed to process entry pack ${entryPack.id}:`, error);
        }
      }
      
      console.log(`Archived ${archivedCount} entry packs for user ${userId}`);
      return archivedCount;
      
    } catch (error) {
      console.error(`Failed to check expired packs for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Determine if an entry pack should be archived
   * @param {Object} entryPack - Entry pack instance
   * @param {Date} now - Current time
   * @returns {Promise<Object>} Archival decision
   */
  async shouldArchiveEntryPack(entryPack, now) {
    try {
      // Load entry info to get arrival date
      const EntryInfo = require('../../models/EntryInfo').default;
      const entryInfo = await EntryInfo.load(entryPack.entryInfoId);
      
      if (!entryInfo || !entryInfo.arrivalDate) {
        return { archive: false, reason: 'No arrival date set' };
      }
      
      const arrivalDate = new Date(entryInfo.arrivalDate);
      
      // Check if arrival date + 24 hours has passed
      const expiryTime = new Date(arrivalDate.getTime() + (24 * 60 * 60 * 1000));
      
      if (now > expiryTime) {
        return {
          archive: true,
          reason: 'Arrival date + 24h passed',
          arrivalDate: arrivalDate.toISOString(),
          expiryTime: expiryTime.toISOString(),
          hoursOverdue: Math.floor((now.getTime() - expiryTime.getTime()) / (1000 * 60 * 60))
        };
      }
      
      return { 
        archive: false, 
        reason: 'Not yet expired',
        arrivalDate: arrivalDate.toISOString(),
        expiryTime: expiryTime.toISOString(),
        hoursRemaining: Math.floor((expiryTime.getTime() - now.getTime()) / (1000 * 60 * 60))
      };
      
    } catch (error) {
      console.error('Failed to determine if entry pack should be archived:', error);
      return { archive: false, reason: `Error: ${error.message}` };
    }
  }

  /**
   * Send archival notification to user
   * @param {string} userId - User ID
   * @param {Object} entryPack - Entry pack instance
   * @param {Object} archivalInfo - Archival information
   */
  async sendArchivalNotification(userId, entryPack, archivalInfo) {
    try {
      // Check if archival notifications are enabled
      const notificationsEnabled = await NotificationPreferencesService.isNotificationTypeEnabled('archival');
      
      if (!notificationsEnabled) {
        console.log('Archival notifications disabled, skipping notification');
        return;
      }
      
      // Get destination name for notification
      const destinationName = this.getDestinationDisplayName(entryPack.destinationId);
      
      // Schedule archival notification
      await NotificationCoordinator.scheduleArchivalNotification(
        userId,
        entryPack.id,
        destinationName,
        {
          reason: archivalInfo.reason,
          arrivalDate: archivalInfo.arrivalDate,
          hoursOverdue: archivalInfo.hoursOverdue
        }
      );
      
      console.log('Archival notification scheduled:', {
        userId,
        entryPackId: entryPack.id,
        destination: destinationName
      });
      
    } catch (error) {
      console.error('Failed to send archival notification:', error);
      // Don't throw - notification failure shouldn't break archival process
    }
  }

  /**
   * Get display name for destination
   * @param {string} destinationId - Destination ID
   * @returns {string} Display name
   */
  getDestinationDisplayName(destinationId) {
    const displayNames = {
      'th': 'Thailand',
      'jp': 'Japan',
      'sg': 'Singapore',
      'my': 'Malaysia',
      'hk': 'Hong Kong',
      'tw': 'Taiwan',
      'kr': 'South Korea',
      'us': 'United States'
    };
    
    return displayNames[destinationId] || destinationId;
  }

  /**
   * Run manual archival check (for testing or user-triggered)
   * @param {string} userId - User ID (optional)
   * @returns {Promise<Object>} Check results
   */
  async runManualCheck(userId = null) {
    try {
      console.log('Running manual archival check...');
      
      const startTime = Date.now();
      let totalArchivedCount = 0;
      let usersChecked = 0;
      
      if (userId) {
        // Check specific user
        totalArchivedCount = await this.checkAndArchiveExpiredPacksForUser(userId);
        usersChecked = 1;
      } else {
        // Check all users
        const users = await this.getAllUsersWithActiveEntryPacks();
        usersChecked = users.length;
        
        for (const user of users) {
          const archivedCount = await this.checkAndArchiveExpiredPacksForUser(user);
          totalArchivedCount += archivedCount;
        }
      }
      
      const duration = Date.now() - startTime;
      
      const result = {
        success: true,
        usersChecked,
        packsArchived: totalArchivedCount,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      };
      
      console.log('Manual archival check completed:', result);
      return result;
      
    } catch (error) {
      console.error('Manual archival check failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get service statistics
   * @returns {Object} Service statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      lastCheckTime: this.lastCheckTime,
      stats: { ...this.stats },
      nextCheckTime: this.isRunning && this.lastCheckTime 
        ? new Date(new Date(this.lastCheckTime).getTime() + this.checkInterval).toISOString()
        : null
    };
  }

  /**
   * Update check interval
   * @param {number} intervalMs - New interval in milliseconds
   */
  setCheckInterval(intervalMs) {
    if (intervalMs < 60000) { // Minimum 1 minute
      throw new Error('Check interval must be at least 1 minute');
    }
    
    this.checkInterval = intervalMs;
    
    // Restart if currently running
    if (this.isRunning) {
      this.stop();
      this.start();
    }
    
    console.log(`Check interval updated to ${intervalMs}ms`);
  }

  /**
   * Clear statistics
   */
  clearStats() {
    this.stats = {
      totalChecks: 0,
      totalArchived: 0,
      lastArchivedCount: 0,
      errors: []
    };
    
    console.log('Background job statistics cleared');
  }
}

// Export singleton instance
export default new BackgroundJobService();