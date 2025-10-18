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
   updateInterval = 1000 // Update every second for real-time countdown
 }) => {
  const [windowInfo, setWindowInfo] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

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
       const formatted = CountdownFormatter.formatTimeRemaining(window.timeRemaining, locale, { showSeconds: true });
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
    <View style={[styles.container, { 
      backgroundColor: colorScheme.background,
      borderColor: colorScheme.border 
    }]}>
      {/* Status Icon */}
      {showIcon && (
        <View style={styles.iconContainer}>
          <Text style={styles.statusIcon}>{windowInfo.icon}</Text>
        </View>
      )}

      {/* Main Message */}
      <View style={styles.messageContainer}>
        <Text style={[styles.statusMessage, { color: colorScheme.text }]}>
          {windowInfo.message}
        </Text>
      </View>

      {/* Countdown Display */}
      {windowInfo.showCountdown && timeRemaining && (
        <View style={styles.countdownContainer}>
          <Text style={[styles.countdownLabel, { color: colorScheme.text }]}>
            {locale === 'zh' ? '倒计时' : 'Countdown'}
          </Text>
          <Text style={[styles.countdownTime, { color: colorScheme.accent }]}>
            {timeRemaining.display}
          </Text>
          
          {/* Urgency indicator */}
          {timeRemaining.isUrgent && (
            <View style={[styles.urgencyBadge, { backgroundColor: colorScheme.accent }]}>
              <Text style={styles.urgencyText}>
                {locale === 'zh' ? '紧急' : 'URGENT'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Arrival Date Display */}
      <View style={styles.arrivalContainer}>
        <Text style={styles.arrivalLabel}>
          {locale === 'zh' ? '抵达日期' : 'Arrival Date'}
        </Text>
        <Text style={styles.arrivalDate}>
          {DateFormatter.formatLongDate(
            new Date(arrivalDate),
            locale === 'zh' ? 'zh-CN' : locale
          )}
        </Text>
      </View>

      {/* Submission Window Info */}
      {windowInfo.state === 'pre-window' && windowInfo.submissionOpensAt && (
        <View style={styles.windowInfoContainer}>
          <Text style={styles.windowInfoLabel}>
            {locale === 'zh' ? '提交窗口开启时间' : 'Submission Window Opens'}
          </Text>
          <Text style={styles.windowInfoTime}>
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
  statusIcon: {
    fontSize: 32,
  },
  messageContainer: {
    marginBottom: spacing.md,
  },
  statusMessage: {
    ...typography.body1,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  countdownLabel: {
    ...typography.body2,
    marginBottom: spacing.xs,
  },
  countdownTime: {
    ...typography.h2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
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
  arrivalContainer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  arrivalLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  arrivalDate: {
    ...typography.body1,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  windowInfoContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  windowInfoLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  windowInfoTime: {
    ...typography.body2,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
});

export default SubmissionCountdown;