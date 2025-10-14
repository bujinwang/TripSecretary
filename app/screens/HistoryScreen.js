// 入境通 - History Screen
import React, { useMemo } from 'react';
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
import { useLocale } from '../i18n/LocaleContext';

const HISTORY_SECTIONS = [
  {
    id: 'today',
    titleKey: 'history.sections.today',
    items: [
      {
        id: 'hk-today',
        flag: '🇭🇰',
        destinationKey: 'history.items.hk.title',
        timeKey: 'history.items.hk.time',
        passportKey: 'history.items.hk.passport',
        destinationData: { id: 'hk', flag: '🇭🇰' },
        travelInfoData: {
          flightNumber: 'CX888',
          arrivalDate: new Date().toISOString().split('T')[0],
          hotelName: 'Mandarin Oriental Hong Kong',
          hotelAddress: '5 Connaught Road Central, Central',
          contactPhone: '+852 2522 0111',
          stayDuration: '3',
          travelPurpose: 'tourism',
        },
      },
    ],
  },
  {
    id: 'yesterday',
    titleKey: 'history.sections.yesterday',
    items: [
      {
        id: 'th-yesterday',
        flag: '🇹🇭',
        destinationKey: 'history.items.th.title',
        timeKey: 'history.items.th.time',
        passportKey: 'history.items.th.passport',
        destinationData: { id: 'th', flag: '🇹🇭' },
        travelInfoData: {
          flightNumber: 'CA981',
          arrivalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          hotelName: 'Bangkok Grand Hotel',
          hotelAddress: '123 Sukhumvit Road, Bangkok',
          contactPhone: '+66 2 123 4567',
          stayDuration: '7',
          travelPurpose: 'tourism',
        },
      },
    ],
  },
];

const HistoryScreen = ({ navigation }) => {
  const { t } = useLocale();

  const historyData = useMemo(() => {
    return HISTORY_SECTIONS.map((section) => ({
      ...section,
      title: t(section.titleKey),
      items: section.items.map((item) => ({
        ...item,
        destinationData: {
          ...item.destinationData,
          name: t(`home.destinationNames.${item.destinationData.id}`),
        },
        passportData: {
          ...item.passportData,
          type: t('home.passport.type'),
        },
        destinationLabel: t(item.destinationKey),
        timeLabel: t(item.timeKey),
        passportLabel: t(item.passportKey),
      })),
    }));
  }, [t]);


  const handleViewItem = (item) => {
    console.log('History item clicked:', item.destinationLabel);

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
        <Text style={styles.headerTitle}>{t('history.headerTitle')}</Text>
        <TouchableOpacity>
          <Text style={styles.filterButton}>{t('history.filterButton')}</Text>
        </TouchableOpacity>
      </View>

      {/* History List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {historyData.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            {section.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyCard}
                onPress={() => {
                  console.log('TouchableOpacity pressed!', item.destinationLabel);
                  handleViewItem(item);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <View style={styles.cardInfo}>
                  <Text style={styles.destination}>{item.destinationLabel}</Text>
                  <Text style={styles.time}>
                    {t('history.timePrefix')} {item.timeLabel}
                  </Text>
                  <Text style={styles.passport}>
                    {t('history.passportPrefix')} {item.passportLabel}
                  </Text>
                </View>
                <View style={styles.cardAction}>
                  <Text style={styles.actionText}>{t('common.view')}</Text>
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
            <Text style={styles.emptyTitle}>{t('history.empty.title')}</Text>
            <Text style={styles.emptyText}>{t('history.empty.subtitle')}</Text>
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
