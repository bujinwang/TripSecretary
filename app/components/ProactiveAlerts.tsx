// 入境通 - Proactive Alerts Component
// Shows important travel alerts and reminders for busy travelers
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useLocale } from '../i18n/LocaleContext';

const ProactiveAlerts = ({
  passportData,
  activeEntryPacks,
  inProgressDestinations,
  upcomingTrips,
  onAlertPress,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  passportData: any;
  activeEntryPacks: Array<Record<string, unknown>>;
  inProgressDestinations: Array<Record<string, unknown>>;
  upcomingTrips: Array<Record<string, unknown>>;
  onAlertPress?: (action: string, data?: Record<string, unknown>) => void;
}) => {
  const { t } = useLocale();

  // Generate proactive alerts based on user data
  const alerts = useMemo(() => {
    const alertList = [];

    // Passport expiry alerts
    if (passportData?.expiryDate) {
      const expiryDate = new Date(passportData.expiryDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= 180) { // Within 6 months
        const urgency = daysUntilExpiry <= 30 ? 'high' : daysUntilExpiry <= 90 ? 'medium' : 'low';
        alertList.push({
          id: 'passport_expiry',
          type: 'warning',
          urgency,
          icon: '⏰',
          title: t('alerts.passportExpiring', { defaultValue: '护照即将过期' }),
          message: t('alerts.expiresInDays', {
            days: daysUntilExpiry,
            defaultValue: `还有 ${daysUntilExpiry} 天过期，请及时续签`
          }),
          actionText: t('alerts.renewNow', { defaultValue: '立即续签' }),
          onPress: () => onAlertPress?.('passport_renewal'),
        });
      }
    }

    // No passport alert - check if passport data is missing or incomplete
    // More robust detection - check multiple possible property names
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
      alertList.push({
        id: 'no_passport',
        type: 'info',
        urgency: 'high',
        icon: '📸',
        title: t('alerts.noPassport', { defaultValue: '请先扫描护照' }),
        message: t('alerts.scanToContinue', { defaultValue: '扫描护照后即可使用全部功能' }),
        actionText: t('alerts.scanPassport', { defaultValue: '扫描护照' }),
        onPress: () => onAlertPress?.('scan_passport'),
      });
    }

    // Upcoming trip reminders - DISABLED as requested
    // const nextTrip = upcomingTrips.find(trip => trip.daysFromNow <= 7);
    // if (nextTrip && passportData) {
    //   alertList.push({
    //     id: 'upcoming_trip',
    //     type: 'info',
    //     urgency: 'medium',
    //     icon: '✈️',
    //     title: t('alerts.tripReminder', { defaultValue: '旅行即将开始' }),
    //     message: t('alerts.prepareDocuments', {
    //       destination: nextTrip.destination?.name || '目的地',
    //       days: nextTrip.daysFromNow,
    //       defaultValue: `${nextTrip.daysFromNow} 天后前往 ${nextTrip.destination?.name || '目的地'}，请准备相关文件`
    //     }),
    //     actionText: t('alerts.prepareNow', { defaultValue: '立即准备' }),
    //     onPress: () => onAlertPress?.('prepare_trip', nextTrip),
    //   });
    // }

    // Incomplete entry packs
    if (inProgressDestinations.length > 0 && passportData) {
      const incompleteCount = inProgressDestinations.filter(dest => !dest.isReady).length;
      if (incompleteCount > 0) {
        alertList.push({
          id: 'incomplete_forms',
          type: 'action',
          urgency: 'medium',
          icon: '📋',
          title: t('alerts.formsIncomplete', { defaultValue: '有未完成的表格' }),
          message: t('alerts.completeBeforeTravel', {
            count: incompleteCount,
            defaultValue: `${incompleteCount} 个目的地表格需要完成`
          }),
          actionText: t('alerts.completeForms', { defaultValue: '完成表格' }),
          onPress: () => onAlertPress?.('complete_forms'),
        });
      }
    }

    // Submitted packs ready for travel
    if (activeEntryPacks.length > 0 && passportData) {
      const todayPacks = activeEntryPacks.filter(pack => {
        if (!pack.arrivalDate) {
return false;
}
        const arrivalDate = new Date(pack.arrivalDate);
        const today = new Date();
        return arrivalDate.toDateString() === today.toDateString();
      });

      if (todayPacks.length > 0) {
        alertList.push({
          id: 'travel_today',
          type: 'success',
          urgency: 'high',
          icon: '🛂',
          title: t('alerts.travelToday', { defaultValue: '今天出行' }),
          message: t('alerts.readyToTravel', {
            destination: todayPacks[0].destinationName,
            defaultValue: `今日前往 ${todayPacks[0].destinationName}，通关包已准备就绪`
          }),
          actionText: t('alerts.viewPackage', { defaultValue: '查看通关包' }),
          onPress: () => onAlertPress?.('view_entry_pack', todayPacks[0]),
        });
      }
    }

    return alertList.slice(0, 3); // Show max 3 alerts
  }, [passportData, activeEntryPacks, inProgressDestinations, upcomingTrips, t, onAlertPress]);

  if (alerts.length === 0) {
    return null; // Don't render if no alerts
  }

  const getAlertStyles = (urgency) => {
    switch (urgency) {
      case 'high':
        return {
          backgroundColor: 'rgba(245, 108, 108, 0.1)',
          borderColor: colors.error,
          iconColor: colors.error,
        };
      case 'medium':
        return {
          backgroundColor: 'rgba(250, 157, 59, 0.1)',
          borderColor: colors.warning,
          iconColor: colors.warning,
        };
      default:
        return {
          backgroundColor: 'rgba(7, 193, 96, 0.1)',
          borderColor: colors.success,
          iconColor: colors.success,
        };
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {alerts.map((alert) => {
          const alertStyles = getAlertStyles(alert.urgency);
          return (
            <TouchableOpacity
              key={alert.id}
              style={[styles.alertCard, alertStyles]}
              onPress={alert.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.alertHeader}>
                <Text style={[styles.alertIcon, { color: alertStyles.iconColor }]}>
                  {alert.icon}
                </Text>
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: alertStyles.iconColor }]}>
                    {alert.title}
                  </Text>
                  <Text style={styles.alertMessage} numberOfLines={2}>
                    {alert.message}
                  </Text>
                </View>
              </View>
              {alert.actionText && (
                <Text style={[styles.alertAction, { color: alertStyles.iconColor }]}>
                  {alert.actionText} ›
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  scrollContainer: {
    paddingRight: spacing.md,
  },
  alertCard: {
    width: 280,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    ...typography.body2,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertMessage: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  alertAction: {
    ...typography.caption,
    fontWeight: '600',
    marginTop: spacing.xs,
    textAlign: 'right',
  },
});

export default ProactiveAlerts;