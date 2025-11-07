// HeroSection.js
// Header section with title, privacy notice, and progress tracking for Malaysia Travel Info Screen
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../../theme';

/**
 * Hero section component showing title, privacy notice, and completion progress
 * @param {Object} props - Component props
 * @param {Function} props.t - Translation function
 * @param {Object} props.completionMetrics - Completion metrics object
 * @param {Function} props.getProgressText - Function to get progress text
 * @param {Function} props.getProgressColor - Function to get progress color
 * @param {Object} props.styles - Custom styles
 * @returns {JSX.Element} Hero section component
 */
const HeroSection = ({
  t,
  completionMetrics,
  getProgressText,
  getProgressColor,
  styles: customStyles,
}) => {
  if (!completionMetrics) {
return null;
}

  const { percent } = completionMetrics;
  const progressColor = getProgressColor(percent);
  const progressText = getProgressText(percent);

  return (
    <>
      <View style={styles.titleSection}>
        <Text style={styles.flag}>🇲🇾</Text>
        <Text style={styles.title}>
          {t('malaysia.travelInfo.title', { defaultValue: 'Malaysia Entry Information / Maklumat Kemasukan Malaysia' })}
        </Text>
        <Text style={styles.subtitle}>
          {t('malaysia.travelInfo.subtitle', { defaultValue: 'Please provide the following information / Sila berikan maklumat berikut' })}
        </Text>
      </View>

      <View style={styles.privacyBox}>
        <Text style={styles.privacyIcon}>💾</Text>
        <Text style={styles.privacyText}>
          {t('malaysia.travelInfo.privacyNotice', { defaultValue: 'All information is stored locally on your device / Semua maklumat disimpan secara tempatan di peranti anda' })}
        </Text>
      </View>

      <View style={styles.progressHeader}>
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressLabel}>完成度</Text>
          <Text style={[styles.progressText, { color: progressColor }]}>{progressText}</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${percent}%`, backgroundColor: progressColor }]} />
          </View>
          <Text style={styles.progressPercent}>{percent}%</Text>
        </View>
        <Text style={styles.progressStats}>
          {completionMetrics.total.filled} / {completionMetrics.total.total} 项已填写
        </Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  titleSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  flag: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 8,
  },
  privacyIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  privacyText: {
    ...typography.body2,
    color: colors.primary,
    flex: 1,
  },
  progressHeader: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  progressText: {
    ...typography.body1,
    fontWeight: '600',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: colors.backgroundLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text,
    minWidth: 40,
    textAlign: 'right',
  },
  progressStats: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

export default HeroSection;
