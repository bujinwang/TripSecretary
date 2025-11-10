// HeroSection.js
// Header section with title, privacy notice, and progress tracking for Malaysia Travel Info Screen
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { colors, typography, spacing } from '../../../theme';

type CompletionMetrics = {
  percent: number;
  total: {
    filled: number;
    total: number;
  };
};

export interface MalaysiaHeroSectionProps {
  t?: (key: string, options?: Record<string, unknown>) => string;
  completionMetrics?: CompletionMetrics;
  getProgressText: (percent: number) => string;
  getProgressColor: (percent: number) => string;
  styles?: Partial<typeof styles> & Record<string, ViewStyle | TextStyle>;
}

const HeroSection: React.FC<MalaysiaHeroSectionProps> = ({
  t,
  completionMetrics,
  getProgressText,
  getProgressColor,
  styles: customStyles,
}) => {
  if (!completionMetrics) {
    return null;
  }

  const sectionStyles = { ...styles, ...customStyles } as typeof styles;
  const { percent } = completionMetrics;
  const progressColor = getProgressColor(percent);
  const progressText = getProgressText(percent);

  const translate = (key: string, defaultValue: string) =>
    (t && t(key, { defaultValue })) || defaultValue;

  return (
    <>
      <View style={sectionStyles.titleSection}>
        <Text style={sectionStyles.flag}>🇲🇾</Text>
        <Text style={sectionStyles.title}>
          {translate(
            'malaysia.travelInfo.title',
            'Malaysia Entry Information / Maklumat Kemasukan Malaysia',
          )}
        </Text>
        <Text style={sectionStyles.subtitle}>
          {translate(
            'malaysia.travelInfo.subtitle',
            'Please provide the following information / Sila berikan maklumat berikut',
          )}
        </Text>
      </View>

      <View style={sectionStyles.privacyBox}>
        <Text style={sectionStyles.privacyIcon}>💾</Text>
        <Text style={sectionStyles.privacyText}>
          {translate(
            'malaysia.travelInfo.privacyNotice',
            'All information is stored locally on your device / Semua maklumat disimpan secara tempatan di peranti anda',
          )}
        </Text>
      </View>

      <View style={sectionStyles.progressHeader}>
        <View style={sectionStyles.progressTextContainer}>
          <Text style={sectionStyles.progressLabel}>完成度</Text>
          <Text style={[sectionStyles.progressText, { color: progressColor }]}>{progressText}</Text>
        </View>
        <View style={sectionStyles.progressBarContainer}>
          <View style={sectionStyles.progressBarBackground}>
            <View
              style={[sectionStyles.progressBarFill, { width: `${percent}%`, backgroundColor: progressColor }]}
            />
          </View>
          <Text style={sectionStyles.progressPercent}>{percent}%</Text>
        </View>
        <Text style={sectionStyles.progressStats}>
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
