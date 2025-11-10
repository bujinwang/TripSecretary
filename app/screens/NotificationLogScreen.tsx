import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Share,
  Modal,
  FlatList,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationLogService from '../services/notification/NotificationLogService';
import { colors, typography, spacing } from '../theme';
import type {
  LogEntry,
  Analytics,
  LogFilters,
} from '../services/notification/NotificationLogService';
import type { RootStackScreenProps } from '../types/navigation';

type NotificationLogScreenProps = RootStackScreenProps<'NotificationLog'>;
type NotificationLogTab = 'logs' | 'analytics' | 'performance';

/**
 * NotificationLogScreen - Display and manage notification logs
 * 
 * Features:
 * - View notification logs with filtering
 * - Display analytics and performance metrics
 * - Export logs for debugging
 * - Clear old logs
 * 
 * Requirements: 16.5
 */
const NotificationLogScreen = ({ navigation }: NotificationLogScreenProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<NotificationLogTab>('logs'); // logs, analytics, performance
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<LogFilters>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true);
      const [logsData, analyticsData] = await Promise.all([
        NotificationLogService.getLogs(filters),
        NotificationLogService.getAnalytics()
      ]);
      setLogs(logsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading notification log data:', error);
      Alert.alert('Error', 'Failed to load notification logs');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleExportLogs = async (): Promise<void> => {
    try {
      const exportData = await NotificationLogService.exportLogs(filters);
      const exportString = JSON.stringify(exportData, null, 2);
      
      await Share.share({
        message: exportString,
        title: 'Notification Logs Export',
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      Alert.alert('Error', 'Failed to export logs');
    }
  };

  const handleClearOldLogs = (): void => {
    Alert.alert(
      'Clear Old Logs',
      'This will remove logs older than 30 days. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await NotificationLogService.clearOldLogs(30);
              Alert.alert(
                'Logs Cleared',
                `Removed ${result.logsRemoved} old log entries. ${result.logsRemaining} entries remaining.`
              );
              await loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear old logs');
            }
          }
        }
      ]
    );
  };

  const handleClearAllLogs = (): void => {
    Alert.alert(
      'Clear All Logs',
      'This will permanently delete all notification logs and analytics. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await NotificationLogService.clearAllLogs();
              Alert.alert('Success', 'All notification logs cleared');
              await loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear logs');
            }
          }
        }
      ]
    );
  };

  const applyFilters = async (newFilters: LogFilters): Promise<void> => {
    setFilters(newFilters);
    setFilterModalVisible(false);
    setLoading(true);
    
    try {
      const filteredLogs = await NotificationLogService.getLogs(newFilters);
      setLogs(filteredLogs);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderLogItem = ({ item }: { item: LogEntry }) => (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <Text style={styles.logEventType}>{item.eventType}</Text>
        <Text style={styles.logTimestamp}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
      
      <View style={styles.logContent}>
        <Text style={styles.logTitle}>{item.notification.title}</Text>
        <Text style={styles.logBody} numberOfLines={2}>
          {item.notification.body}
        </Text>
        
        <View style={styles.logMeta}>
          <Text style={styles.logMetaText}>
            Type: {item.notification.type || 'unknown'}
          </Text>
          {item.notification.entryPackId && (
            <Text style={styles.logMetaText}>
              Entry Pack: {item.notification.entryPackId.slice(-8)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderAnalyticsTab = () => {
    if (!analytics) {
return null;
}

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.analyticsSection}>
          <Text style={styles.sectionTitle}>Overall Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{analytics.total.scheduled}</Text>
              <Text style={styles.statLabel}>Scheduled</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{analytics.total.sent}</Text>
              <Text style={styles.statLabel}>Sent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{analytics.total.clicked}</Text>
              <Text style={styles.statLabel}>Clicked</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{analytics.total.clickRate}%</Text>
              <Text style={styles.statLabel}>Click Rate</Text>
            </View>
          </View>
        </View>

        <View style={styles.analyticsSection}>
          <Text style={styles.sectionTitle}>By Notification Type</Text>
          {Object.entries(analytics.byType).map(([type, stats]) => (
            <View key={type} style={styles.typeStats}>
              <Text style={styles.typeTitle}>{type}</Text>
              <View style={styles.typeStatsRow}>
                <Text style={styles.typeStatText}>
                  Sent: {stats.sent} | Clicked: {stats.clicked} | Rate: {stats.clickRate}%
                </Text>
              </View>
            </View>
          ))}
        </View>

        {analytics.timing && (
          <View style={styles.analyticsSection}>
            <Text style={styles.sectionTitle}>Optimal Timing</Text>
            <Text style={styles.timingText}>
              Best Hour: {analytics.timing.bestHour !== null ? `${analytics.timing.bestHour}:00` : 'No data'}
            </Text>
            <Text style={styles.timingText}>
              Best Day: {analytics.timing.bestDay !== null ? 
                ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][analytics.timing.bestDay] : 
                'No data'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderPerformanceTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.performanceSection}>
          <Text style={styles.sectionTitle}>Performance Insights</Text>
          
          <TouchableOpacity 
            style={styles.performanceButton}
            onPress={async () => {
              try {
                const metrics = await NotificationLogService.getPerformanceMetrics();
                Alert.alert(
                  'Performance Metrics',
                  JSON.stringify(metrics.recommendations, null, 2),
                  [{ text: 'OK' }]
                );
              } catch (error) {
                Alert.alert('Error', 'Failed to get performance metrics');
              }
            }}
          >
            <Text style={styles.performanceButtonText}>View Recommendations</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.performanceButton}
            onPress={handleExportLogs}
          >
            <Text style={styles.performanceButtonText}>Export Logs</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.performanceButton, styles.warningButton]}
            onPress={handleClearOldLogs}
          >
            <Text style={styles.performanceButtonText}>Clear Old Logs (30+ days)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.performanceButton, styles.dangerButton]}
            onPress={handleClearAllLogs}
          >
            <Text style={styles.performanceButtonText}>Clear All Logs</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filter Logs</Text>
          <TouchableOpacity onPress={() => applyFilters({})}>
            <Text style={styles.modalApplyButton}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Event Type</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="e.g., scheduled, clicked, interacted"
              value={filters.eventType || ''}
              onChangeText={(text) => setFilters(prev => ({ ...prev, eventType: text }))}
            />
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Notification Type</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="e.g., submissionWindow, urgentReminder"
              value={filters.notificationType || ''}
              onChangeText={(text) => setFilters(prev => ({ ...prev, notificationType: text }))}
            />
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Entry Pack ID</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Entry pack identifier"
              value={filters.entryPackId || ''}
              onChangeText={(text) => setFilters(prev => ({ ...prev, entryPackId: text }))}
            />
          </View>

          <TouchableOpacity 
            style={styles.applyFiltersButton}
            onPress={() => applyFilters(filters)}
          >
            <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notification Logs</Text>
        <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
          <Text style={styles.filterButton}>Filter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'logs' && styles.activeTab]}
          onPress={() => setSelectedTab('logs')}
        >
          <Text style={[styles.tabText, selectedTab === 'logs' && styles.activeTabText]}>
            Logs ({logs.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'analytics' && styles.activeTab]}
          onPress={() => setSelectedTab('analytics')}
        >
          <Text style={[styles.tabText, selectedTab === 'analytics' && styles.activeTabText]}>
            Analytics
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'performance' && styles.activeTab]}
          onPress={() => setSelectedTab('performance')}
        >
          <Text style={[styles.tabText, selectedTab === 'performance' && styles.activeTabText]}>
            Tools
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'logs' && (
        <FlatList
          data={logs}
          renderItem={renderLogItem}
          keyExtractor={(item) => item.id}
          style={styles.logsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No notification logs found</Text>
              <Text style={styles.emptyStateSubtext}>
                Logs will appear here as notifications are sent and interacted with
              </Text>
            </View>
          }
        />
      )}

      {selectedTab === 'analytics' && renderAnalyticsTab()}
      {selectedTab === 'performance' && renderPerformanceTab()}

      {renderFilterModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    fontSize: typography.sizes.md,
    color: colors.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  filterButton: {
    fontSize: typography.sizes.md,
    color: colors.primary,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
  },
  logsList: {
    flex: 1,
  },
  logItem: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  logEventType: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  logTimestamp: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  logContent: {
    marginTop: spacing.xs,
  },
  logTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  logBody: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  logMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logMetaText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  tabContent: {
    flex: 1,
    padding: spacing.md,
  },
  analyticsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  typeStats: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  typeTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  typeStatsRow: {
    flexDirection: 'row',
  },
  typeStatText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  timingText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  performanceSection: {
    flex: 1,
  },
  performanceButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  warningButton: {
    backgroundColor: colors.warning,
  },
  dangerButton: {
    backgroundColor: colors.error,
  },
  performanceButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  modalCancelButton: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  modalApplyButton: {
    fontSize: typography.sizes.md,
    color: colors.primary,
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  applyFiltersButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  applyFiltersButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
});

export default NotificationLogScreen;