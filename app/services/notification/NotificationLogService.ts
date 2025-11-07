import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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

// Type definitions
interface NotificationData {
  identifier?: string;
  title?: string;
  body?: string;
  type?: string;
  entryPackId?: string;
  userId?: string;
  destination?: string;
  request?: {
    identifier?: string;
    content?: {
      title?: string;
      body?: string;
      data?: {
        type?: string;
        entryPackId?: string;
        userId?: string;
        destination?: string;
        [key: string]: any;
      };
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

interface LogEntry {
  id: string;
  eventType: string;
  timestamp: string;
  notification: {
    identifier?: string;
    title?: string;
    body?: string;
    type?: string;
    entryPackId?: string;
    userId?: string;
    destination?: string;
  };
  metadata: {
    actionIdentifier?: string;
    appState?: string;
    screenName?: string;
    appVersion?: string;
    platform?: string;
    deviceInfo?: DeviceInfo;
    [key: string]: any;
  };
}

interface Interaction {
  id: string;
  eventType: string;
  timestamp: string;
  notificationId?: string;
  notificationType?: string;
  entryPackId?: string;
  userId?: string;
  actionIdentifier?: string;
  responseTime: number | null;
  context: {
    appState?: string;
    screenName?: string;
    timeOfDay: number;
    dayOfWeek: number;
  };
}

interface DeviceInfo {
  platform?: string;
  version?: string | number;
  error?: string;
  [key: string]: any;
}

interface TypeAnalytics {
  scheduled: number;
  sent: number;
  received: number;
  clicked: number;
  ignored: number;
  actionClicked: number;
  dismissed: number;
  clickRate: string;
  actionRate: string;
}

interface TimingAnalytics {
  hourly: number[];
  daily: number[];
  bestHour: number | null;
  bestDay: number | null;
}

interface Analytics {
  total: TypeAnalytics;
  byType: Record<string, TypeAnalytics>;
  timing: TimingAnalytics;
  lastUpdated: string;
}

interface LogFilters {
  eventType?: string;
  notificationType?: string;
  userId?: string;
  entryPackId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

interface Recommendation {
  type: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

interface ExportData {
  logs: LogEntry[];
  analytics: Analytics;
  interactions: Interaction[];
  exportedAt: string;
  filters?: LogFilters;
  summary: {
    totalLogs: number;
    dateRange: {
      from: string;
      to: string;
    } | null;
  };
}

class NotificationLogService {
  private logStorageKey: string;
  private interactionStorageKey: string;
  private analyticsStorageKey: string;
  private maxLogEntries: number;
  private maxInteractionEntries: number;

  constructor() {
    this.logStorageKey = 'notificationLogs';
    this.interactionStorageKey = 'notificationInteractions';
    this.analyticsStorageKey = 'notificationAnalytics';
    this.maxLogEntries = 500; // Keep last 500 log entries
    this.maxInteractionEntries = 200; // Keep last 200 interaction entries
  }

  /**
   * Log a notification event
   * @param eventType - Type of event (scheduled, sent, received, clicked, etc.)
   * @param notificationData - Notification data
   * @param metadata - Additional metadata
   */
  async logEvent(eventType: string, notificationData: NotificationData, metadata: Record<string, any> = {}): Promise<void> {
    try {
      const logEntry: LogEntry = {
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
   * @param logEntry - The log entry for the interaction
   */
  private async recordInteraction(logEntry: LogEntry): Promise<void> {
    try {
      const interactionData = await AsyncStorage.getItem(this.interactionStorageKey);
      const interactions: Interaction[] = interactionData ? JSON.parse(interactionData) : [];

      const interaction: Interaction = {
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
   * @param logEntry - The log entry to analyze
   */
  private async updateAnalytics(logEntry: LogEntry): Promise<void> {
    try {
      const analyticsData = await AsyncStorage.getItem(this.analyticsStorageKey);
      const analytics: Analytics = analyticsData ? JSON.parse(analyticsData) : this.getDefaultAnalytics();

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
          clickRate: '0',
          actionRate: '0'
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
        typeAnalytics.clickRate = ((typeAnalytics.clicked / typeAnalytics.sent) * 100).toFixed(2);
        typeAnalytics.actionRate = ((typeAnalytics.actionClicked / typeAnalytics.sent) * 100).toFixed(2);
      }

      if (analytics.total.sent > 0) {
        analytics.total.clickRate = ((analytics.total.clicked / analytics.total.sent) * 100).toFixed(2);
        analytics.total.actionRate = ((analytics.total.actionClicked / analytics.total.sent) * 100).toFixed(2);
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
   * @param analytics - Current analytics object
   * @param logEntry - The log entry
   */
  private updateTimingAnalytics(analytics: Analytics, logEntry: LogEntry): void {
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
   * @param filters - Filter options
   * @returns Filtered log entries
   */
  async getLogs(filters: LogFilters = {}): Promise<LogEntry[]> {
    try {
      const logsData = await AsyncStorage.getItem(this.logStorageKey);
      let logs: LogEntry[] = logsData ? JSON.parse(logsData) : [];

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
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
   * @returns Analytics data
   */
  async getAnalytics(): Promise<Analytics> {
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
   * @param userId - User ID
   * @returns User interaction history
   */
  async getUserInteractions(userId: string): Promise<Interaction[]> {
    try {
      const interactionData = await AsyncStorage.getItem(this.interactionStorageKey);
      const interactions: Interaction[] = interactionData ? JSON.parse(interactionData) : [];

      return interactions
        .filter(interaction => interaction.userId === userId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    } catch (error) {
      console.error('Error getting user interactions:', error);
      return [];
    }
  }

  /**
   * Get notification performance metrics
   * @param notificationType - Type of notification
   * @returns Performance metrics
   */
  async getPerformanceMetrics(notificationType: string | null = null): Promise<{
    type?: string;
    scheduled?: number;
    sent?: number;
    received?: number;
    clicked?: number;
    ignored?: number;
    actionClicked?: number;
    dismissed?: number;
    clickRate?: string;
    actionRate?: string;
    recommendations?: Recommendation[];
    total?: TypeAnalytics;
    byType?: Record<string, TypeAnalytics>;
    timing?: TimingAnalytics;
    error?: string;
  }> {
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
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error getting performance metrics:', err);
      return { error: err.message };
    }
  }

  /**
   * Generate recommendations for notification optimization
   * @param typeAnalytics - Analytics for specific notification type
   * @returns Array of recommendations
   */
  private generateRecommendations(typeAnalytics: TypeAnalytics): Recommendation[] {
    const recommendations: Recommendation[] = [];

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
   * @param analytics - Complete analytics object
   * @returns Array of global recommendations
   */
  private generateGlobalRecommendations(analytics: Analytics): Recommendation[] {
    const recommendations: Recommendation[] = [];

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
   * @param filters - Export filters
   * @returns Export data
   */
  async exportLogs(filters: LogFilters = {}): Promise<ExportData> {
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
   * @param daysToKeep - Number of days to keep logs
   */
  async clearOldLogs(daysToKeep: number = 30): Promise<{ logsRemoved: number; logsRemaining: number }> {
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
        const interactions: Interaction[] = JSON.parse(interactionData);
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
  async clearAllLogs(): Promise<void> {
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
   * @param logEntry - The log entry to store
   */
  private async storeLogEntry(logEntry: LogEntry): Promise<void> {
    const logsData = await AsyncStorage.getItem(this.logStorageKey);
    const logs: LogEntry[] = logsData ? JSON.parse(logsData) : [];

    logs.push(logEntry);

    // Keep only recent logs
    if (logs.length > this.maxLogEntries) {
      logs.splice(0, logs.length - this.maxLogEntries);
    }

    await AsyncStorage.setItem(this.logStorageKey, JSON.stringify(logs));
  }

  /**
   * Check if event type is an interaction event
   * @param eventType - Event type to check
   * @returns Whether it's an interaction event
   */
  private isInteractionEvent(eventType: string): boolean {
    const interactionEvents = [
      'clicked', 'interacted', 'action_clicked', 'ignored', 'dismissed'
    ];
    return interactionEvents.includes(eventType);
  }

  /**
   * Calculate response time for interaction
   * @param logEntry - The log entry
   * @returns Response time in milliseconds
   */
  private calculateResponseTime(logEntry: LogEntry): number | null {
    // This would need to be enhanced to track when notification was sent
    // and when user interacted with it
    return null; // Placeholder for now
  }

  /**
   * Generate unique log ID
   * @returns Unique log ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default analytics structure
   * @returns Default analytics object
   */
  private getDefaultAnalytics(): Analytics {
    return {
      total: {
        scheduled: 0,
        sent: 0,
        received: 0,
        clicked: 0,
        ignored: 0,
        actionClicked: 0,
        dismissed: 0,
        clickRate: '0',
        actionRate: '0'
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
   * @returns App version
   */
  private getAppVersion(): string {
    // This would be imported from app.json or package.json
    return '1.0.0'; // Placeholder
  }

  /**
   * Get platform information
   * @returns Platform name
   */
  private getPlatform(): string {
    return Platform.OS;
  }

  /**
   * Get device information
   * @returns Device information
   */
  private async getDeviceInfo(): Promise<DeviceInfo> {
    try {
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

