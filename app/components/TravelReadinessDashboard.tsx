// 入境通 - Travel Readiness Dashboard Component
// Shows at-a-glance travel status for busy travelers
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useLocale } from '../i18n/LocaleContext';

const TravelReadinessDashboard = ({
  passportData,
  activeEntryPacks,
  inProgressDestinations,
  upcomingTrips,
  onPassportPress,
  onTripPress,
  onActionPress,
}: {
  passportData: Record<string, unknown>;
  activeEntryPacks: Array<Record<string, unknown>>;
  inProgressDestinations: Array<Record<string, unknown>>;
  upcomingTrips: Array<Record<string, unknown>>;
  onPassportPress?: () => void;
  onTripPress?: (trip: Record<string, unknown>) => void;
  onActionPress?: (action: string) => void;
}) => {
  const { t } = useLocale();

  // Calculate overall travel readiness status
  const readinessStatus = useMemo(() => {
    // More robust passport detection
    const hasValidPassport = passportData && (
      passportData.passportNumber ||
      passportData.fullName ||
      passportData.expiryDate ||
      passportData.passportNo ||
      passportData.name ||
      passportData.getSurname || // Method exists
      passportData.getGivenName || // Method exists
      (passportData.personalInfo && passportData.personalInfo.name) // Nested structure
    );
    const hasUpcomingTrips = upcomingTrips.length > 0;
    const hasActivePacks = activeEntryPacks.length > 0;
    const hasInProgress = inProgressDestinations.length > 0;

    if (!hasValidPassport) {
      return {
        status: 'needs_attention',
        color: colors.warning,
        icon: '⚠️',
        title: t('home.readiness.noPassport', { defaultValue: '需要证件' }),
        subtitle: t('home.readiness.scanPassportFirst', { defaultValue: '请先扫描护照' }),
      };
    }

    // Check passport expiry (within 6 months)
    if (passportData.expiryDate) {
      const expiryDate = new Date(passportData.expiryDate as string);
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

      if (expiryDate < sixMonthsFromNow) {
        return {
          status: 'needs_attention',
          color: colors.error,
          icon: '⏰',
          title: t('home.readiness.passportExpiring', { defaultValue: '护照即将过期' }),
          subtitle: t('home.readiness.expiresSoon', { defaultValue: '请及时续签' }),
        };
      }
    }

    if (hasActivePacks || hasInProgress) {
      return {
        status: 'ready',
        color: colors.success,
        icon: '✅',
        title: t('home.readiness.readyToTravel', { defaultValue: '准备就绪' }),
        subtitle: t('home.readiness.activeTrips', { defaultValue: '有进行中的行程' }),
      };
    }

    if (hasUpcomingTrips) {
      return {
        status: 'planning',
        color: colors.primary,
        icon: '📅',
        title: t('home.readiness.planningTrip', { defaultValue: '计划出行' }),
        subtitle: t('home.readiness.upcomingTrips', { defaultValue: '即将开始旅行' }),
      };
    }

    return {
      status: 'ready',
      color: colors.success,
      icon: '🟢',
      title: t('home.readiness.allSet', { defaultValue: '一切就绪' }),
      subtitle: t('home.readiness.readyAnytime', { defaultValue: '随时准备旅行' }),
    };
  }, [passportData, activeEntryPacks, inProgressDestinations, upcomingTrips, t]);

  // Get next important trip
  const nextTrip = useMemo(() => {
    const allTrips = [
      ...activeEntryPacks.map(pack => ({
        type: 'active',
        destination: pack.destinationName || 'Unknown',
        flag: getDestinationFlag(pack.destinationId),
        daysUntil: pack.arrivalDate ? Math.ceil((new Date(pack.arrivalDate as string).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
        status: 'submitted'
      })),
      ...inProgressDestinations.map(dest => ({
        type: 'inProgress' as const,
        destination: dest.destinationName || 'Unknown',
        flag: getDestinationFlag(dest.destinationId),
        daysUntil: null as number | null,
        completion: dest.completionPercent,
        status: 'inProgress'
      })),
      ...upcomingTrips.map(trip => ({
        type: 'upcoming' as const,
        destination: (trip.destination as Record<string, unknown>)?.name as string || 'Unknown',
        flag: trip.flag,
        daysUntil: trip.daysFromNow as number | null,
        status: 'planned'
      }))
    ].filter(trip => (trip as { daysUntil: number | null }).daysUntil !== null && (trip as { daysUntil: number }).daysUntil >= 0);

    return allTrips.sort((a, b) => (a.daysUntil || 0) - (b.daysUntil || 0))[0];
  }, [activeEntryPacks, inProgressDestinations, upcomingTrips]);

  const getDestinationFlag = (destinationId: unknown) => {
    const flagMap: Record<string, string> = {
      'th': '🇹🇭', 'jp': '🇯🇵', 'sg': '🇸🇬', 'my': '🇲🇾',
      'hk': '🇭🇰', 'tw': '🇹🇼', 'kr': '🇰🇷', 'us': '🇺🇸'
    };
    return flagMap[destinationId as string] || '🌍';
  };

  const getActionItems = () => {
    const actions = [];

    // More robust passport detection
    const hasValidPassport = passportData && (
      passportData.passportNumber ||
      passportData.fullName ||
      passportData.expiryDate ||
      passportData.passportNo ||
      passportData.name ||
      passportData.getSurname || // Method exists
      passportData.getGivenName || // Method exists
      (passportData.personalInfo && passportData.personalInfo.name) // Nested structure
    );

    if (!hasValidPassport) {
      actions.push({
        id: 'scan_passport',
        icon: '📸',
        title: t('home.actions.scanPassport', { defaultValue: '扫描护照' }),
        onPress: () => onActionPress?.('scan_passport'),
      });
    }

    if (nextTrip && nextTrip.daysUntil !== null && nextTrip.daysUntil <= 7) {
      actions.push({
        id: 'prepare_trip',
        icon: '🎯',
        title: t('home.actions.prepareTrip', { defaultValue: '准备行程' }),
        onPress: () => onTripPress?.(nextTrip),
      });
    }

    if (inProgressDestinations.length > 0) {
      actions.push({
        id: 'complete_forms',
        icon: '📋',
        title: t('home.actions.completeForms', { defaultValue: '完成表格' }),
        onPress: () => onActionPress?.('complete_forms'),
      });
    }

    return actions.slice(0, 2); // Show max 2 actions
  };

  const actionItems = getActionItems();

  return (
    <View style={styles.container}>
      {/* Overall Status */}
      <TouchableOpacity
        style={[styles.statusCard, { borderLeftColor: readinessStatus.color }]}
        onPress={() => onActionPress?.('status_details')}
        activeOpacity={0.7}
      >
        <View style={styles.statusHeader}>
          <Text style={styles.statusIcon}>{readinessStatus.icon}</Text>
          <View style={styles.statusInfo}>
            <Text style={[styles.statusTitle, { color: readinessStatus.color }]}>
              {readinessStatus.title}
            </Text>
            <Text style={styles.statusSubtitle}>{readinessStatus.subtitle}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Next Trip */}
      {nextTrip && (
        <TouchableOpacity
          style={styles.tripCard}
          onPress={() => onTripPress?.(nextTrip as Record<string, unknown>)}
          activeOpacity={0.7}
        >
          <View style={styles.tripHeader}>
            <Text style={styles.tripFlag}>{nextTrip.flag}</Text>
            <View style={styles.tripInfo}>
              <Text style={styles.tripDestination}>{nextTrip.destination}</Text>
              <Text style={styles.tripStatus}>
                {nextTrip.type === 'active' && t('home.trip.submitted', { defaultValue: '已提交' })}
                {nextTrip.type === 'inProgress' && t('home.trip.inProgress', { defaultValue: '填写中' })}
                {nextTrip.type === 'upcoming' && t('home.trip.upcoming', { defaultValue: '即将出行' })}
              </Text>
            </View>
          </View>
          {nextTrip.daysUntil !== undefined && (
            <Text style={styles.tripDays}>
              {nextTrip.daysUntil === 0
                ? t('home.trip.today', { defaultValue: '今天' })
                : nextTrip.daysUntil === 1
                ? t('home.trip.tomorrow', { defaultValue: '明天' })
                : t('home.trip.inDays', { days: nextTrip.daysUntil as number, defaultValue: `${nextTrip.daysUntil as number}天后` })
              }
            </Text>
          )}
        </TouchableOpacity>
      )}


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    ...typography.body1,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tripCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tripFlag: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  tripInfo: {
    flex: 1,
  },
  tripDestination: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  tripStatus: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tripDays: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'right',
  },
  actionsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  actionsTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  actionsList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionItem: {
    alignItems: 'center',
    padding: spacing.sm,
    minWidth: 80,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  actionTitle: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
  },
  passportCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  passportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passportIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  passportInfo: {
    flex: 1,
  },
  passportTitle: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
  },
  passportExpiry: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  passportArrow: {
    ...typography.body1,
    color: colors.textDisabled,
  },
});

export default TravelReadinessDashboard;