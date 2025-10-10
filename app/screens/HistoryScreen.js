// 出国啰 - History Screen
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Card from '../components/Card';
import { colors, typography, spacing } from '../theme';

const HistoryScreen = ({ navigation }) => {
  // Mock history data with full details for navigation
  const historyData = [
    {
      id: 1,
      section: '今天',
      items: [
        {
          id: '1-1',
          flag: '🇭🇰',
          destination: '香港入境表格',
          time: '2小时前',
          passport: '中国护照',
          // Full data for navigation
          destinationData: { id: 'hk', name: '香港', flag: '🇭🇰' },
          passportData: {
            type: '中国护照',
            name: '张伟',
            passportNo: 'E12345678',
            expiry: '2030-12-31',
          },
          travelInfoData: {
            flightNumber: 'CX888',
            arrivalDate: new Date().toISOString().split('T')[0],
            hotelName: '香港文华东方酒店',
            hotelAddress: '中环干诺道中5号',
            contactPhone: '+852 2522 0111',
            stayDuration: '3',
            travelPurpose: '旅游',
          },
        },
      ],
    },
    {
      id: 2,
      section: '昨天',
      items: [
        {
          id: '2-1',
          flag: '🇹🇭',
          destination: '泰国入境表格',
          time: '昨天 15:20',
          passport: '中国护照',
          destinationData: { id: 'th', name: '泰国', flag: '🇹🇭' },
          passportData: {
            type: '中国护照',
            name: '张伟',
            passportNo: 'E12345678',
            expiry: '2030-12-31',
          },
          travelInfoData: {
            flightNumber: 'CA981',
            // Changed from +7 days to +2 days to comply with TDAC 72-hour rule
            arrivalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            hotelName: 'Bangkok Grand Hotel',
            hotelAddress: '123 Sukhumvit Road, Bangkok',
            contactPhone: '+66 2 123 4567',
            stayDuration: '7',
            travelPurpose: '旅游',
          },
        },
      ],
    },
  ];

  const handleViewItem = (item) => {
    console.log('History item clicked:', item.destination);
    
    // Navigate to Result screen with the history item's data
    navigation.navigate('Result', {
      passport: item.passportData,
      destination: item.destinationData,
      travelInfo: item.travelInfoData,
      generationId: item.id,
      fromHistory: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>生成历史</Text>
        <TouchableOpacity>
          <Text style={styles.filterButton}>筛选</Text>
        </TouchableOpacity>
      </View>

      {/* History List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {historyData.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>

            {section.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyCard}
                onPress={() => {
                  console.log('TouchableOpacity pressed!', item.destination);
                  handleViewItem(item);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <View style={styles.cardInfo}>
                  <Text style={styles.destination}>{item.destination}</Text>
                  <Text style={styles.time}>生成时间: {item.time}</Text>
                  <Text style={styles.passport}>
                    使用证件: {item.passport}
                  </Text>
                </View>
                <View style={styles.cardAction}>
                  <Text style={styles.actionText}>查看</Text>
                  <Text style={styles.arrow}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Empty State (if no history) */}
        {historyData.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>还没有生成记录</Text>
            <Text style={styles.emptyText}>
              开始扫描证件，生成第一个通关包
            </Text>
          </View>
        )}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  filterButton: {
    ...typography.body1,
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  flag: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  destination: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  time: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  passport: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  cardAction: {
    alignItems: 'center',
  },
  actionText: {
    ...typography.body1,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  arrow: {
    ...typography.h3,
    color: colors.textDisabled,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default HistoryScreen;
