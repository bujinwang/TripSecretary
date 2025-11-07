/**
 * BackgroundJobService - Handles background tasks for the progressive entry flow
 *
 * Features:
 * - Automatic entry info archival
 * - Expired entry info detection
 * - Periodic cleanup tasks
 * - Notification scheduling for archival events
 *
 * Requirements: 14.1-14.5, 16.1-16.5
 */

import NotificationCoordinator from '../notification/NotificationCoordinator';
import NotificationPreferencesService from '../notification/NotificationPreferencesService';
import UserDataService from '../data/UserDataService';
import EntryInfoService from '../EntryInfoService';
import LoggingService from '../LoggingService';
import type { UserId } from '../../types/data';
import type { Logger } from '../../types/services';

const logger: Logger = LoggingService.for('BackgroundJobService');

// Type definitions
interface ServiceStats {
  totalChecks: number;
  totalArchived: number;
  lastArchivedCount: number;
  errors: Array<{
    timestamp: string;
    error: string;
  }>;
}

interface ArchivalDecision {
  archive: boolean;
  reason: string;
  arrivalDate?: string;
  expiryTime?: string;
  hoursOverdue?: number;
  hoursRemaining?: number;
}

interface EntryInfo {
  id: string;
  userId: UserId;
  destinationId?: string;
  arrivalDate?: string;
  displayStatus?: string;
  [key: string]: any;
}

interface CheckResult {
  success: boolean;
  usersChecked?: number;
  packsArchived?: number;
  duration?: string;
  timestamp: string;
  error?: string;
}

interface ServiceStatus {
  isRunning: boolean;
  checkInterval: number;
  lastCheckTime: string | null;
  stats: ServiceStats;
  nextCheckTime: string | null;
}

class BackgroundJobService {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval: number = 60 * 60 * 1000; // Check every hour
  private lastCheckTime: string | null = null;
  private stats: ServiceStats = {
    totalChecks: 0,
    totalArchived: 0,
    lastArchivedCount: 0,
    errors: []
  };

  /**
   * Start the background job service
   */
  async start(): Promise<void> {
    try {
      if (this.isRunning) {
        logger.info('BackgroundJobService is already running');
        return;
      }

      logger.info('Starting BackgroundJobService...');
      
      // Run initial check
      await this.runArchivalCheck();
      
      // Set up periodic checks
      this.intervalId = setInterval(async () => {
        try {
          await this.runArchivalCheck();
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('Background archival check failed', err);
          this.stats.errors.push({
            timestamp: new Date().toISOString(),
            error: err.message
          });
          
          // Keep only last 10 errors
          if (this.stats.errors.length > 10) {
            this.stats.errors = this.stats.errors.slice(-10);
          }
        }
      }, this.checkInterval);
      
      this.isRunning = true;
      logger.info('BackgroundJobService started successfully');
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to start BackgroundJobService', err);
      throw err;
    }
  }

  /**
   * Stop the background job service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    logger.info('BackgroundJobService stopped');
  }

  /**
   * Run archival check for all users
   */
  async runArchivalCheck(): Promise<void> {
    try {
      logger.info('Running automatic entry pack archival check...');
      
      const startTime = Date.now();
      this.lastCheckTime = new Date().toISOString();
      this.stats.totalChecks++;
      
      // Get all users with active entry infos
      const users = await this.getAllUsersWithActiveEntryInfos();
      
      let totalArchivedCount = 0;
      
      for (const userId of users) {
        try {
          const archivedCount = await this.checkAndArchiveExpiredInfosForUser(userId);
          totalArchivedCount += archivedCount;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('Failed to check expired packs for user', err, { userId });
        }
      }
      
      this.stats.lastArchivedCount = totalArchivedCount;
      this.stats.totalArchived += totalArchivedCount;
      
      const duration = Date.now() - startTime;
      
      logger.info('Archival check completed', {
        usersChecked: users.length,
        packsArchived: totalArchivedCount,
        duration: `${duration}ms`,
        totalChecks: this.stats.totalChecks,
        totalArchived: this.stats.totalArchived
      });
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to run archival check', err);
      throw err;
    }
  }

  /**
   * Get all users with active entry infos
   * @returns Promise resolving to array of user IDs
   */
  async getAllUsersWithActiveEntryInfos(): Promise<UserId[]> {
    try {
      // In a real implementation, this would query the database for all users
      // For now, we'll use a placeholder approach

      // TODO: Implement proper user enumeration from storage
      // This is a simplified approach for the current implementation
      const knownUsers: UserId[] = ['user_001']; // Default user for demo

      return knownUsers;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to get users with active entry infos', err);
      return [];
    }
  }

  /**
   * Check and archive expired entry infos for a specific user
   * @param userId - User ID
   * @returns Promise resolving to number of entry infos archived
   */
  async checkAndArchiveExpiredInfosForUser(userId: UserId): Promise<number> {
    try {
      logger.debug('Checking expired entry infos for user', { userId });

      // Initialize user data service and SecureStorageService
      await UserDataService.initialize(userId);

      // Get active entry infos for user
      let activeEntryInfos: EntryInfo[] = [];
      try {
        activeEntryInfos = await EntryInfoService.getAllEntryInfos(userId) as EntryInfo[];
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.warn('Failed to get entry infos for archival check (non-critical)', err, { userId });
        return 0;
      }

      if (!activeEntryInfos.length) {
        logger.debug('No active entry infos found for user', { userId });
        return 0;
      }

      let archivedCount = 0;
      const now = new Date();

      for (const entryInfo of activeEntryInfos) {
        try {
          // Check if entry info should be archived
          const shouldArchive = await this.shouldArchiveEntryInfo(entryInfo, now);

          if (shouldArchive.archive) {
            logger.info('Archiving expired entry info', {
              entryInfoId: entryInfo.id,
              reason: shouldArchive.reason,
              arrivalDate: shouldArchive.arrivalDate,
              expiryTime: shouldArchive.expiryTime
            });

            // Archive the entry info
            await EntryInfoService.updateEntryInfo(entryInfo.id, {
              displayStatus: JSON.stringify({
                archived: true,
                archivedAt: now.toISOString(),
                reason: shouldArchive.reason,
                triggeredBy: 'background_job',
                autoArchive: true,
                metadata: {
                  arrivalDate: shouldArchive.arrivalDate,
                  expiryTime: shouldArchive.expiryTime,
                  checkTime: now.toISOString()
                }
              })
            });

            // Send archival notification if enabled
            await this.sendArchivalNotification(userId, entryInfo, shouldArchive);

            archivedCount++;
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('Failed to process entry info', err, { entryInfoId: entryInfo.id, userId });
        }
      }
      
      logger.info('Archived entry infos for user', { archivedCount, userId });
      return archivedCount;
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to check expired packs for user', err, { userId });
      return 0;
    }
  }

  /**
   * Determine if an entry info should be archived
   * @param entryInfo - Entry info instance
   * @param now - Current time
   * @returns Promise resolving to archival decision
   */
  async shouldArchiveEntryInfo(entryInfo: EntryInfo, now: Date): Promise<ArchivalDecision> {
    try {
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
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to determine if entry info should be archived', err, { entryInfoId: entryInfo?.id });
      return { archive: false, reason: `Error: ${err.message}` };
    }
  }

  /**
   * Send archival notification to user
   * @param userId - User ID
   * @param entryInfo - Entry info instance
   * @param archivalInfo - Archival information
   */
  async sendArchivalNotification(userId: UserId, entryInfo: EntryInfo, archivalInfo: ArchivalDecision): Promise<void> {
    try {
      // Check if archival notifications are enabled
      const notificationsEnabled = await NotificationPreferencesService.isNotificationTypeEnabled('archival');

      if (!notificationsEnabled) {
        logger.debug('Archival notifications disabled, skipping notification', { userId, entryInfoId: entryInfo.id });
        return;
      }

      // Get destination name for notification
      const destinationName = this.getDestinationDisplayName(entryInfo.destinationId);

      // Schedule archival notification
      await NotificationCoordinator.scheduleArchivalNotification(
        userId,
        entryInfo.id,
        destinationName,
        {
          reason: archivalInfo.reason,
          arrivalDate: archivalInfo.arrivalDate,
          hoursOverdue: archivalInfo.hoursOverdue
        }
      );

      logger.info('Archival notification scheduled', {
        userId,
        entryInfoId: entryInfo.id,
        destination: destinationName
      });

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to send archival notification', err, { userId, entryInfoId: entryInfo.id });
      // Don't throw - notification failure shouldn't break archival process
    }
  }

  /**
   * Get display name for destination
   * @param destinationId - Destination ID
   * @returns Display name
   */
  getDestinationDisplayName(destinationId?: string): string {
    const displayNames: Record<string, string> = {
      'th': 'Thailand',
      'jp': 'Japan',
      'sg': 'Singapore',
      'my': 'Malaysia',
      'hk': 'Hong Kong',
      'tw': 'Taiwan',
      'kr': 'South Korea',
      'us': 'United States'
    };
    
    return destinationId ? (displayNames[destinationId] || destinationId) : 'Unknown';
  }

  /**
   * Run manual archival check (for testing or user-triggered)
   * @param userId - User ID (optional)
   * @returns Promise resolving to check results
   */
  async runManualCheck(userId: UserId | null = null): Promise<CheckResult> {
    try {
      logger.info('Running manual archival check...', { userId });
      
      const startTime = Date.now();
      let totalArchivedCount = 0;
      let usersChecked = 0;
      
      if (userId) {
        // Check specific user
        totalArchivedCount = await this.checkAndArchiveExpiredInfosForUser(userId);
        usersChecked = 1;
      } else {
        // Check all users
        const users = await this.getAllUsersWithActiveEntryInfos();
        usersChecked = users.length;
        
        for (const user of users) {
          const archivedCount = await this.checkAndArchiveExpiredInfosForUser(user);
          totalArchivedCount += archivedCount;
        }
      }
      
      const duration = Date.now() - startTime;
      
      const result: CheckResult = {
        success: true,
        usersChecked,
        packsArchived: totalArchivedCount,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      };
      
      logger.info('Manual archival check completed', result);
      return result;
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Manual archival check failed', err, { userId });
      return {
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get service statistics
   * @returns Service statistics
   */
  getStats(): ServiceStatus {
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
   * @param intervalMs - New interval in milliseconds
   */
  setCheckInterval(intervalMs: number): void {
    if (intervalMs < 60000) { // Minimum 1 minute
      throw new Error('Check interval must be at least 1 minute');
    }
    
    this.checkInterval = intervalMs;
    
    // Restart if currently running
    if (this.isRunning) {
      this.stop();
      this.start();
    }
    
    logger.info('Check interval updated', { intervalMs });
  }

  /**
   * Clear statistics
   */
  clearStats(): void {
    this.stats = {
      totalChecks: 0,
      totalArchived: 0,
      lastArchivedCount: 0,
      errors: []
    };
    
    logger.info('Background job statistics cleared');
  }
}

// Export singleton instance
export default new BackgroundJobService();

