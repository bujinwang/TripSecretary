// @ts-nocheck

// 入境通 - Submission Countdown Component
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing } from '../theme';
import ArrivalWindowCalculator from '../utils/thailand/ArrivalWindowCalculator';
import CountdownFormatter from '../utils/CountdownFormatter';
import DateFormatter from '../utils/DateFormatter';

const SubmissionCountdown = ({
   arrivalDate,
   locale = 'zh',
   showIcon = true,
   updateInterval = 1000, // Update every second for real-time countdown
   variant = 'default',
   showArrivalDate = true,
 }) => {
  const [windowInfo, setWindowInfo] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const isCompact = variant === 'compact';

  // Update countdown information
  const updateCountdown = () => {
    if (!arrivalDate) {
      setWindowInfo(null);
      setTimeRemaining(null);
      return;
    }

    const window = ArrivalWindowCalculator.getSubmissionWindow(arrivalDate, locale);
    const uiState = ArrivalWindowCalculator.getUIState(window);
    
    setWindowInfo({ ...window, ...uiState });

    if (window.timeRemaining) {
       const formatted = CountdownFormatter.formatTimeRemaining(window.timeRemaining, locale, { showSeconds: true, maxUnit: 'hours' });
       setTimeRemaining(formatted);
     } else {
       setTimeRemaining(null);
     }
  };

  // Set up real-time updates
  useEffect(() => {
    if (!arrivalDate) {
      setWindowInfo(null);
      setTimeRemaining(null);
      return;
    }

    // Initial update
    updateCountdown();

    // Set up interval for periodic updates
    const intervalId = setInterval(updateCountdown, updateInterval);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [arrivalDate, locale, updateInterval]);

  // Handle case when arrival date is not set
  if (!arrivalDate || !windowInfo) {
    return (
      <View style={styles.container}>
        <View style={styles.noDateContainer}>
          {showIcon && <Text style={styles.icon}>📅</Text>}
          <Text style={styles.noDateText}>
            还没告诉我泰国旅行日期呢 📅
          </Text>
          <Text style={styles.noDateSubtext}>
            {locale === 'zh'
              ? '快去旅行信息中告诉我你什么时候到泰国吧！✈️'
              : 'Please tell me when you\'re arriving in Thailand! ✈️'
            }
          </Text>
        </View>
      </View>
    );
  }

  // Get colors based on urgency level
  const getColors = () => {
    switch (windowInfo.urgencyColor) {
      case 'red':
        return {
          background: '#FFF2F2',
          border: colors.error,
          text: colors.error,
          accent: colors.error,
        };
      case 'yellow':
        return {
          background: '#FFF7E6',
          border: colors.warning,
          text: colors.warning,
          accent: colors.warning,
        };
      case 'green':
        return {
          background: '#E8F9F0',
          border: colors.success,
          text: colors.success,
          accent: colors.success,
        };
      case 'gray':
      default:
        return {
          background: colors.backgroundLight,
          border: colors.border,
          text: colors.textSecondary,
          accent: colors.textSecondary,
        };
    }
  };

  const colorScheme = getColors();

  return (
    <View style={[
      styles.container,
      isCompact && styles.compactContainer,
      { 
      backgroundColor: colorScheme.background,
      borderColor: colorScheme.border 
    }]}>
      {/* Status Icon */}
      {showIcon && (
        <View style={[styles.iconContainer, isCompact && styles.iconContainerCompact]}>
          <Text style={[styles.statusIcon, isCompact && styles.statusIconCompact]}>{windowInfo.icon}</Text>
        </View>
      )}

      {/* Main Message */}
      <View style={[styles.messageContainer, isCompact && styles.messageContainerCompact]}>
        <Text style={[
          styles.statusMessage,
          isCompact && styles.statusMessageCompact,
          { color: colorScheme.text }
        ]}>
          {windowInfo.message}
        </Text>
      </View>

      {/* Countdown Display */}
      {windowInfo.showCountdown && timeRemaining && (
        <View style={[styles.countdownContainer, isCompact && styles.countdownContainerCompact]}>
          <Text style={[
            styles.countdownLabel,
            isCompact && styles.countdownLabelCompact,
            { color: colorScheme.text }
          ]}>
            {locale === 'zh' ? '倒计时' : 'Countdown'}
          </Text>
          <Text style={[
            styles.countdownTime,
            isCompact && styles.countdownTimeCompact,
            { color: colorScheme.accent }
          ]}>
            {timeRemaining.display}
          </Text>
          
          {/* Urgency indicator */}
          {timeRemaining.isUrgent && (
            <View style={[
              styles.urgencyBadge,
              isCompact && styles.urgencyBadgeCompact,
              { backgroundColor: colorScheme.accent }
            ]}>
              <Text style={styles.urgencyText}>
                {locale === 'zh' ? '紧急' : 'URGENT'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Arrival Date Display */}
      {showArrivalDate && (
        <View style={[styles.arrivalContainer, isCompact && styles.arrivalContainerCompact]}>
          <Text style={[
            styles.arrivalLabel,
            isCompact && styles.arrivalLabelCompact
          ]}>
            {locale === 'zh' ? '抵达日期' : 'Arrival Date'}
          </Text>
          <Text style={[
            styles.arrivalDate,
            isCompact && styles.arrivalDateCompact
          ]}>
            {(() => {
              // Parse date string correctly to avoid timezone issues
              // "2025-10-31" should be interpreted as local date, not UTC
              const dateStr = typeof arrivalDate === 'string' ? arrivalDate : arrivalDate.toISOString().split('T')[0];
              const [year, month, day] = dateStr.split('-').map(Number);
              const localDate = new Date(year, month - 1, day);
              return DateFormatter.formatLongDate(
                localDate,
                locale === 'zh' ? 'zh-CN' : locale
              );
            })()}
          </Text>
        </View>
      )}

      {/* Submission Window Info */}
      {windowInfo.state === 'pre-window' && windowInfo.submissionOpensAt && (
        <View style={[styles.windowInfoContainer, isCompact && styles.windowInfoContainerCompact]}>
          <Text style={[
            styles.windowInfoLabel,
            isCompact && styles.windowInfoLabelCompact
          ]}>
            {locale === 'zh' ? '提交窗口开启时间' : 'Submission Window Opens'}
          </Text>
          <Text style={[
            styles.windowInfoTime,
            isCompact && styles.windowInfoTimeCompact
          ]}>
            {DateFormatter.formatDateTime(
              windowInfo.submissionOpensAt,
              locale === 'zh' ? 'zh-CN' : locale
            )}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  compactContainer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
  },
  noDateContainer: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  noDateText: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  noDateSubtext: {
    ...typography.body2,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: spacing.sm,
  },
  iconContainerCompact: {
    marginBottom: spacing.xs,
  },
  statusIcon: {
    fontSize: 32,
  },
  statusIconCompact: {
    fontSize: 26,
  },
  messageContainer: {
    marginBottom: spacing.md,
  },
  messageContainerCompact: {
    marginBottom: spacing.sm,
  },
  statusMessage: {
    ...typography.body1,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  statusMessageCompact: {
    ...typography.body2,
    lineHeight: 18,
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  countdownContainerCompact: {
    marginBottom: spacing.sm,
  },
  countdownLabel: {
    ...typography.body2,
    marginBottom: spacing.xs,
  },
  countdownLabelCompact: {
    ...typography.caption,
    marginBottom: spacing.xs / 2,
  },
  countdownTime: {
    ...typography.h2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  countdownTimeCompact: {
    ...typography.h3,
    fontWeight: '700',
    marginBottom: spacing.xs / 2,
  },
  urgencyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    textAlign: 'center',
  },
  urgencyBadgeCompact: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  arrivalContainer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  arrivalContainerCompact: {
    marginBottom: spacing.xs,
  },
  arrivalLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  arrivalLabelCompact: {
    ...typography.caption,
  },
  arrivalDate: {
    ...typography.body1,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  arrivalDateCompact: {
    ...typography.body2,
    fontWeight: '600',
  },
  windowInfoContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  windowInfoContainerCompact: {
    paddingTop: spacing.xs,
  },
  windowInfoLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  windowInfoLabelCompact: {
    ...typography.caption,
  },
  windowInfoTime: {
    ...typography.body2,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  windowInfoTimeCompact: {
    ...typography.body2,
    fontSize: typography.body2.fontSize - 1,
  },
});

export default SubmissionCountdown;
