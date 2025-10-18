import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * NotificationLogService - Comprehensive notification logging and analytics
 * 
 * Features:
 * - Record all notification scheduling and sending events
 * - Record user interactions (click, ignore, action)
 * - Provide analytics for notification optimization
 * - Export logs for debugging
 * 
 * Requirements: 16.5
 */
class NotificationLogService {
  constructor() {
    this.logStorageKey = 'notificationLogs';
    this.interactionStorageKey = 'notificationInteractions';
    this.analyticsStorageKey = 'notificationAnalytics';
    this.maxLogEntries = 500; // Keep last 500 log entries
    this.maxInteractionEntries = 200; // Keep last 200 interaction entries
  }

  /**
   * Log a notification event
   * @param {string} eventType - Type of event (scheduled, sent, received, clicked, etc.)
   * @param {Object} notificationData - Notification data
   * @param {Object} metadata - Additional metadata
   */
  async logEvent(eventType, notificationData, metadata = {}) {
    try {
      const logEntry = {
        id: this.generateLogId(),
        eventType,
        timestamp: new Date().toISOString(),
        notification: {
          identifier: notificationData.identifier || notificationData.request?.identifier,
          title: notificationData.request?.content?.title || notificationData.title,
          body: notificationData.request?.content?.body || notificationData.body,
          type: notificationData.request?.content?.data?.type || notificationData.type,
          entryPackId: notificationData.request?.content?.data?.entryPackId || notificationData.entryPackId,
          userId: notificationData.request?.content?.data?.userId || notificationData.userId,
          destination: notificationData.request?.content?.data?.destination || notificationData.destination,
        },
        metadata: {
          ...metadata,
          appVersion: this.getAppVersion(),
          platform: this.getPlatform(),
          deviceInfo: await this.getDeviceInfo()
        }
      };

      // Store the log entry
      await this.storeLogEntry(logEntry);

      // Update analytics if this is an interaction event
      if (this.isInteractionEvent(eventType)) {
        await this.recordInteraction(logEntry);
        await this.updateAnalytics(logEntry);
      }

      console.log(`Notification event logged: ${eventType}`, logEntry.id);

    } catch (error) {
      console.error('Error logging notification event:', error);
    }
  }

  /**
   * Record user interaction with notification
   * @param {Object} logEntry - The log entry for the interaction
   */
  async recordInteraction(logEntry) {
    try {
      const interactionData = await AsyncStorage.getItem(this.interactionStorageKey);
      const interactions = interactionData ? JSON.parse(interactionData) : [];

      const interaction = {
        id: logEntry.id,
        eventType: logEntry.eventType,
        timestamp: logEntry.timestamp,
        notificationId: logEntry.notification.identifier,
        notificationType: logEntry.notification.type,
        entryPackId: logEntry.notification.entryPackId,
        userId: logEntry.notification.userId,
        actionIdentifier: logEntry.metadata.actionIdentifier,
        responseTime: this.calculateResponseTime(logEntry),
        context: {
          appState: logEntry.metadata.appState,
          screenName: logEntry.metadata.screenName,
          timeOfDay: new Date(logEntry.timestamp).getHours(),
          dayOfWeek: new Date(logEntry.timestamp).getDay()
        }
      };

      interactions.push(interaction);

      // Keep only recent interactions
      if (interactions.length > this.maxInteractionEntries) {
        interactions.splice(0, interactions.length - this.maxInteractionEntries);
      }

      await AsyncStorage.setItem(this.interactionStorageKey, JSON.stringify(interactions));

    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  }

  /**
   * Update notification analytics
   * @param {Object} logEntry - The log entry to analyze
   */
  async updateAnalytics(logEntry) {
    try {
      const analyticsData = await AsyncStorage.getItem(this.analyticsStorageKey);
      const analytics = analyticsData ? JSON.parse(analyticsData) : this.getDefaultAnalytics();

      const notificationType = logEntry.notification.type || 'unknown';
      const eventType = logEntry.eventType;

      // Initialize type analytics if not exists
      if (!analytics.byType[notificationType]) {
        analytics.byType[notificationType] = {
          scheduled: 0,
          sent: 0,
          received: 0,
          clicked: 0,
          ignored: 0,
          actionClicked: 0,
          dismissed: 0,
          clickRate: 0,
          actionRate: 0
        };
      }

      // Update counters
      const typeAnalytics = analytics.byType[notificationType];
      
      switch (eventType) {
        case 'scheduled':
          typeAnalytics.scheduled++;
          analytics.total.scheduled++;
          break;
        case 'sent':
          typeAnalytics.sent++;
          analytics.total.sent++;
          break;
        case 'received':
          typeAnalytics.received++;
          analytics.total.received++;
          break;
        case 'clicked':
        case 'interacted':
          typeAnalytics.clicked++;
          analytics.total.clicked++;
          break;
        case 'action_clicked':
          typeAnalytics.actionClicked++;
          analytics.total.actionClicked++;
          break;
        case 'ignored':
          typeAnalytics.ignored++;
          analytics.total.ignored++;
          break;
        case 'dismissed':
          typeAnalytics.dismissed++;
          analytics.total.dismissed++;
          break;
      }

      // Calculate rates
      if (typeAnalytics.sent > 0) {
        typeAnalytics.clickRate = (typeAnalytics.clicked / typeAnalytics.sent * 100).toFixed(2);
        typeAnalytics.actionRate = (typeAnalytics.actionClicked / typeAnalytics.sent * 100).toFixed(2);
      }

      if (analytics.total.sent > 0) {
        analytics.total.clickRate = (analytics.total.clicked / analytics.total.sent * 100).toFixed(2);
        analytics.total.actionRate = (analytics.total.actionClicked / analytics.total.sent * 100).toFixed(2);
      }

      // Update timing analytics
      this.updateTimingAnalytics(analytics, logEntry);

      // Update last updated timestamp
      analytics.lastUpdated = new Date().toISOString();

      await AsyncStorage.setItem(this.analyticsStorageKey, JSON.stringify(analytics));

    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  }

  /**
   * Update timing analytics for optimization
   * @param {Object} analytics - Current analytics object
   * @param {Object} logEntry - The log entry
   */
  updateTimingAnalytics(analytics, logEntry) {
    const hour = new Date(logEntry.timestamp).getHours();
    const dayOfWeek = new Date(logEntry.timestamp).getDay();

    // Initialize timing analytics if not exists
    if (!analytics.timing) {
      analytics.timing = {
        hourly: Array(24).fill(0),
        daily: Array(7).fill(0),
        bestHour: null,
        bestDay: null
      };
    }

    // Update hourly and daily interaction counts
    if (logEntry.eventType === 'clicked' || logEntry.eventType === 'interacted') {
      analytics.timing.hourly[hour]++;
      analytics.timing.daily[dayOfWeek]++;

      // Find best performing hour and day
      analytics.timing.bestHour = analytics.timing.hourly.indexOf(Math.max(...analytics.timing.hourly));
      analytics.timing.bestDay = analytics.timing.daily.indexOf(Math.max(...analytics.timing.daily));
    }
  }

  /**
   * Get notification logs with filtering options
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Filtered log entries
   */
  async getLogs(filters = {}) {
    try {
      const logsData = await AsyncStorage.getItem(this.logStorageKey);
      let logs = logsData ? JSON.parse(logsData) : [];

      // Apply filters
      if (filters.eventType) {
        logs = logs.filter(log => log.eventType === filters.eventType);
      }

      if (filters.notificationType) {
        logs = logs.filter(log => log.notification.type === filters.notificationType);
      }

      if (filters.userId) {
        logs = logs.filter(log => log.notification.userId === filters.userId);
      }

      if (filters.entryPackId) {
        logs = logs.filter(log => log.notification.entryPackId === filters.entryPackId);
      }

      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        logs = logs.filter(log => new Date(log.timestamp) >= fromDate);
      }

      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        logs = logs.filter(log => new Date(log.timestamp) <= toDate);
      }

      // Sort by timestamp (newest first)
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Apply limit
      if (filters.limit) {
        logs = logs.slice(0, filters.limit);
      }

      return logs;

    } catch (error) {
      console.error('Error getting logs:', error);
      return [];
    }
  }

  /**
   * Get notification analytics
   * @returns {Promise<Object>} Analytics data
   */
  async getAnalytics() {
    try {
      const analyticsData = await AsyncStorage.getItem(this.analyticsStorageKey);
      return analyticsData ? JSON.parse(analyticsData) : this.getDefaultAnalytics();
    } catch (error) {
      console.error('Error getting analytics:', error);
      return this.getDefaultAnalytics();
    }
  }

  /**
   * Get user interaction history
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User interaction history
   */
  async getUserInteractions(userId) {
    try {
      const interactionData = await AsyncStorage.getItem(this.interactionStorageKey);
      const interactions = interactionData ? JSON.parse(interactionData) : [];

      return interactions
        .filter(interaction => interaction.userId === userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    } catch (error) {
      console.error('Error getting user interactions:', error);
      return [];
    }
  }

  /**
   * Get notification performance metrics
   * @param {string} notificationType - Type of notification
   * @returns {Promise<Object>} Performance metrics
   */
  async getPerformanceMetrics(notificationType = null) {
    try {
      const analytics = await this.getAnalytics();

      if (notificationType && analytics.byType[notificationType]) {
        return {
          type: notificationType,
          ...analytics.byType[notificationType],
          recommendations: this.generateRecommendations(analytics.byType[notificationType])
        };
      }

      return {
        total: analytics.total,
        byType: analytics.byType,
        timing: analytics.timing,
        recommendations: this.generateGlobalRecommendations(analytics)
      };

    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return { error: error.message };
    }
  }

  /**
   * Generate recommendations for notification optimization
   * @param {Object} typeAnalytics - Analytics for specific notification type
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(typeAnalytics) {
    const recommendations = [];

    // Click rate recommendations
    if (parseFloat(typeAnalytics.clickRate) < 10) {
      recommendations.push({
        type: 'low_engagement',
        message: 'Click rate is below 10%. Consider improving notification content or timing.',
        priority: 'high'
      });
    }

    // Action rate recommendations
    if (parseFloat(typeAnalytics.actionRate) < 5) {
      recommendations.push({
        type: 'low_action_rate',
        message: 'Action button usage is low. Consider simplifying actions or improving button labels.',
        priority: 'medium'
      });
    }

    // Ignore rate recommendations
    const ignoreRate = typeAnalytics.sent > 0 ? (typeAnalytics.ignored / typeAnalytics.sent * 100) : 0;
    if (ignoreRate > 50) {
      recommendations.push({
        type: 'high_ignore_rate',
        message: 'High ignore rate detected. Consider reducing notification frequency.',
        priority: 'high'
      });
    }

    return recommendations;
  }

  /**
   * Generate global recommendations
   * @param {Object} analytics - Complete analytics object
   * @returns {Array} Array of global recommendations
   */
  generateGlobalRecommendations(analytics) {
    const recommendations = [];

    // Best timing recommendations
    if (analytics.timing && analytics.timing.bestHour !== null) {
      recommendations.push({
        type: 'optimal_timing',
        message: `Best engagement time is ${analytics.timing.bestHour}:00. Consider scheduling more notifications at this time.`,
        priority: 'medium'
      });
    }

    // Overall performance
    const totalClickRate = parseFloat(analytics.total.clickRate) || 0;
    if (totalClickRate > 20) {
      recommendations.push({
        type: 'good_performance',
        message: 'Notification performance is good. Current strategy is working well.',
        priority: 'low'
      });
    }

    return recommendations;
  }

  /**
   * Export logs for debugging
   * @param {Object} filters - Export filters
   * @returns {Promise<Object>} Export data
   */
  async exportLogs(filters = {}) {
    try {
      const logs = await this.getLogs(filters);
      const analytics = await this.getAnalytics();
      const interactions = await AsyncStorage.getItem(this.interactionStorageKey);

      return {
        logs,
        analytics,
        interactions: interactions ? JSON.parse(interactions) : [],
        exportedAt: new Date().toISOString(),
        filters,
        summary: {
          totalLogs: logs.length,
          dateRange: logs.length > 0 ? {
            from: logs[logs.length - 1].timestamp,
            to: logs[0].timestamp
          } : null
        }
      };

    } catch (error) {
      console.error('Error exporting logs:', error);
      throw error;
    }
  }

  /**
   * Clear old logs to manage storage
   * @param {number} daysToKeep - Number of days to keep logs
   */
  async clearOldLogs(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Clear old logs
      const logs = await this.getLogs();
      const filteredLogs = logs.filter(log => new Date(log.timestamp) > cutoffDate);
      await AsyncStorage.setItem(this.logStorageKey, JSON.stringify(filteredLogs));

      // Clear old interactions
      const interactionData = await AsyncStorage.getItem(this.interactionStorageKey);
      if (interactionData) {
        const interactions = JSON.parse(interactionData);
        const filteredInteractions = interactions.filter(interaction => 
          new Date(interaction.timestamp) > cutoffDate
        );
        await AsyncStorage.setItem(this.interactionStorageKey, JSON.stringify(filteredInteractions));
      }

      console.log(`Cleared logs older than ${daysToKeep} days`);
      return {
        logsRemoved: logs.length - filteredLogs.length,
        logsRemaining: filteredLogs.length
      };

    } catch (error) {
      console.error('Error clearing old logs:', error);
      throw error;
    }
  }

  /**
   * Clear all logs (for testing or reset)
   */
  async clearAllLogs() {
    try {
      await AsyncStorage.multiRemove([
        this.logStorageKey,
        this.interactionStorageKey,
        this.analyticsStorageKey
      ]);
      console.log('All notification logs cleared');
    } catch (error) {
      console.error('Error clearing all logs:', error);
      throw error;
    }
  }

  // Helper methods

  /**
   * Store a log entry
   * @param {Object} logEntry - The log entry to store
   */
  async storeLogEntry(logEntry) {
    const logsData = await AsyncStorage.getItem(this.logStorageKey);
    const logs = logsData ? JSON.parse(logsData) : [];

    logs.push(logEntry);

    // Keep only recent logs
    if (logs.length > this.maxLogEntries) {
      logs.splice(0, logs.length - this.maxLogEntries);
    }

    await AsyncStorage.setItem(this.logStorageKey, JSON.stringify(logs));
  }

  /**
   * Check if event type is an interaction event
   * @param {string} eventType - Event type to check
   * @returns {boolean} Whether it's an interaction event
   */
  isInteractionEvent(eventType) {
    const interactionEvents = [
      'clicked', 'interacted', 'action_clicked', 'ignored', 'dismissed'
    ];
    return interactionEvents.includes(eventType);
  }

  /**
   * Calculate response time for interaction
   * @param {Object} logEntry - The log entry
   * @returns {number|null} Response time in milliseconds
   */
  calculateResponseTime(logEntry) {
    // This would need to be enhanced to track when notification was sent
    // and when user interacted with it
    return null; // Placeholder for now
  }

  /**
   * Generate unique log ID
   * @returns {string} Unique log ID
   */
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default analytics structure
   * @returns {Object} Default analytics object
   */
  getDefaultAnalytics() {
    return {
      total: {
        scheduled: 0,
        sent: 0,
        received: 0,
        clicked: 0,
        ignored: 0,
        actionClicked: 0,
        dismissed: 0,
        clickRate: 0,
        actionRate: 0
      },
      byType: {},
      timing: {
        hourly: Array(24).fill(0),
        daily: Array(7).fill(0),
        bestHour: null,
        bestDay: null
      },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get app version
   * @returns {string} App version
   */
  getAppVersion() {
    // This would be imported from app.json or package.json
    return '1.0.0'; // Placeholder
  }

  /**
   * Get platform information
   * @returns {string} Platform name
   */
  getPlatform() {
    const { Platform } = require('react-native');
    return Platform.OS;
  }

  /**
   * Get device information
   * @returns {Promise<Object>} Device information
   */
  async getDeviceInfo() {
    try {
      const { Platform } = require('react-native');
      return {
        platform: Platform.OS,
        version: Platform.Version,
        // Add more device info as needed
      };
    } catch (error) {
      return { error: 'Unable to get device info' };
    }
  }
}

// Export singleton instance
export default new NotificationLogService();