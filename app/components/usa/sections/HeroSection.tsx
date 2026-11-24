import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '../../../theme';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

type HeroSectionStyles = ReturnType<typeof createStyles>;
type HeroSectionStyleKey = keyof HeroSectionStyles;
type StyleOverrides = Partial<Record<HeroSectionStyleKey, ViewStyle | TextStyle>>;

export interface USAHeroSectionProps {
  t: TranslationFn;
  completionPercent?: number;
  progressText: string;
  progressColor: string;
  onViewEntryGuide?: () => void;
  styles?: StyleOverrides;
}

const HeroSection: React.FC<USAHeroSectionProps> = ({
  t,
  completionPercent = 0,
  progressText,
  progressColor,
  onViewEntryGuide,
  styles: styleOverrides,
}) => {
  const clampedPercent = Math.max(0, Math.min(100, completionPercent));
  const sectionStyles = React.useMemo(
    () => (styleOverrides ? ({ ...defaultStyles, ...styleOverrides } as HeroSectionStyles) : defaultStyles),
    [styleOverrides],
  );

  return (
    <>
      {/* Enhanced Hero Section */}
      <LinearGradient
        colors={['#1e40af', '#1e3a8a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={sectionStyles.heroSection}
      >
        <View style={sectionStyles.heroContent}>
          <Text style={sectionStyles.heroFlag}>🇺🇸</Text>
          <View style={sectionStyles.heroHeading}>
            <Text style={sectionStyles.heroTitle}>
              {t('us.travelInfo.hero.title', { defaultValue: '美国入境准备指南' })}
            </Text>
            <Text style={sectionStyles.heroSubtitle}>
              {t('us.travelInfo.hero.subtitle', { defaultValue: '准备好资料，轻松入境美国' })}
            </Text>
          </View>

          {/* Value Proposition */}
          <View style={sectionStyles.valueProposition}>
            <View style={sectionStyles.valueItem}>
              <Text style={sectionStyles.valueIcon}>⏱️</Text>
              <Text style={sectionStyles.valueText}>
                {t('us.travelInfo.hero.time', { defaultValue: '5分钟完成' })}
              </Text>
            </View>
            <View style={sectionStyles.valueItem}>
              <Text style={sectionStyles.valueIcon}>🔒</Text>
              <Text style={sectionStyles.valueText}>
                {t('us.travelInfo.hero.privacy', { defaultValue: '本地存储' })}
              </Text>
            </View>
            <View style={sectionStyles.valueItem}>
              <Text style={sectionStyles.valueIcon}>✈️</Text>
              <Text style={sectionStyles.valueText}>
                {t('us.travelInfo.hero.ready', { defaultValue: '随时可用' })}
              </Text>
            </View>
          </View>

          {/* Beginner Tip */}
          <View style={sectionStyles.beginnerTip}>
            <Text style={sectionStyles.tipIcon}>💡</Text>
            <Text style={sectionStyles.tipText}>
              {t('us.travelInfo.hero.tip', {
                defaultValue: '整理好入境资料，在飞机上填写海关申报表时会用到！'
              })}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Progress Overview Card */}
      <View style={sectionStyles.progressOverviewCard}>
        <Text style={sectionStyles.progressTitle}>
          {t('us.travelInfo.progress.title', { defaultValue: '准备进度' })}
        </Text>
        <View style={sectionStyles.progressSteps}>
          <View style={[sectionStyles.progressStep, clampedPercent >= 25 && sectionStyles.progressStepActive]}>
            <Text style={sectionStyles.stepIcon}>📘</Text>
            <Text style={[sectionStyles.stepText, clampedPercent >= 25 && sectionStyles.stepTextActive]}>
              {t('us.travelInfo.progress.passport', { defaultValue: '护照信息' })} {clampedPercent >= 25 ? '✓' : ''}
            </Text>
          </View>
          <View style={[sectionStyles.progressStep, clampedPercent >= 50 && sectionStyles.progressStepActive]}>
            <Text style={sectionStyles.stepIcon}>✈️</Text>
            <Text style={[sectionStyles.stepText, clampedPercent >= 50 && sectionStyles.stepTextActive]}>
              {t('us.travelInfo.progress.travel', { defaultValue: '行程信息' })} {clampedPercent >= 50 ? '✓' : ''}
            </Text>
          </View>
          <View style={[sectionStyles.progressStep, clampedPercent >= 75 && sectionStyles.progressStepActive]}>
            <Text style={sectionStyles.stepIcon}>👤</Text>
            <Text style={[sectionStyles.stepText, clampedPercent >= 75 && sectionStyles.stepTextActive]}>
              {t('us.travelInfo.progress.personal', { defaultValue: '个人信息' })} {clampedPercent >= 75 ? '✓' : ''}
            </Text>
          </View>
          <View style={[sectionStyles.progressStep, clampedPercent >= 100 && sectionStyles.progressStepActive]}>
            <Text style={sectionStyles.stepIcon}>💰</Text>
            <Text style={[sectionStyles.stepText, clampedPercent >= 100 && sectionStyles.stepTextActive]}>
              {t('us.travelInfo.progress.funds', { defaultValue: '资金证明' })} {clampedPercent >= 100 ? '✓' : ''}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={sectionStyles.progressBarContainer}>
          <View style={sectionStyles.progressBarEnhanced}>
            <View
              style={[
                sectionStyles.progressFill,
                {
                  width: `${clampedPercent}%`,
                  backgroundColor: progressColor
                }
              ]}
            />
          </View>
          <Text style={[sectionStyles.progressText, { color: progressColor }]}>
            {progressText}
          </Text>
        </View>
      </View>

      {/* Primary Action Button */}
      {onViewEntryGuide && (
        <TouchableOpacity
          style={sectionStyles.primaryButton}
          onPress={onViewEntryGuide}
          activeOpacity={0.85}
        >
          <View style={sectionStyles.primaryButtonContent}>
            <Text style={sectionStyles.primaryButtonIcon}>🧳</Text>
            <View style={sectionStyles.primaryButtonTextContainer}>
              <Text style={sectionStyles.primaryButtonTitle}>
                {t('us.travelInfo.hero.viewGuide', { defaultValue: '查看准备状态' })}
              </Text>
              <Text style={sectionStyles.primaryButtonSubtitle}>
                {clampedPercent >= 100
                  ? t('us.travelInfo.hero.viewGuideComplete', { defaultValue: '已完成，查看入境指南' })
                  : t('us.travelInfo.hero.viewGuideIncomplete', { defaultValue: '查看详情和入境指南' })
                }
              </Text>
            </View>
            <Text style={sectionStyles.primaryButtonArrow}>›</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Privacy Notice */}
      <View style={sectionStyles.privacyBox}>
        <Text style={sectionStyles.privacyIcon}>💾</Text>
        <Text style={sectionStyles.privacyText}>
          {t('us.travelInfo.privacy', {
            defaultValue: '所有信息仅保存在您的手机本地'
          })}
        </Text>
      </View>
    </>
  );
};

export default HeroSection;

const createStyles = () =>
  StyleSheet.create({
    heroSection: {
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 20,
      elevation: 8,
    },
    heroContent: {
      gap: spacing.md,
    },
    heroFlag: {
      fontSize: 40,
    },
    heroHeading: {
      gap: spacing.xs,
    },
    heroTitle: {
      ...typography.h2,
      color: colors.white,
    },
    heroSubtitle: {
      ...typography.body1,
      color: '#C7D2FE',
    },
    valueProposition: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    valueItem: {
      flex: 1,
      alignItems: 'center',
    },
    valueIcon: {
      fontSize: 26,
      marginBottom: 4,
    },
    valueText: {
      ...typography.caption,
      color: '#E0E7FF',
      textAlign: 'center',
      fontWeight: '600',
    },
    beginnerTip: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      gap: spacing.xs,
    },
    tipIcon: {
      fontSize: 20,
    },
    tipText: {
      ...typography.caption,
      color: '#E0E7FF',
      flex: 1,
      lineHeight: 18,
    },
    progressOverviewCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginTop: spacing.lg,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
    progressTitle: {
      ...typography.body2,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    progressSteps: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    progressStep: {
      flex: 1,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      gap: 4,
    },
    progressStepActive: {
      backgroundColor: colors.primaryLight,
    },
    stepIcon: {
      fontSize: 18,
    },
    stepText: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      fontSize: 12,
    },
    stepTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    progressBarContainer: {
      gap: spacing.xs,
    },
    progressBarEnhanced: {
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.backgroundLight,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: colors.primary,
    },
    progressText: {
      ...typography.caption,
      fontWeight: '600',
      textAlign: 'right',
      color: colors.primary,
    },
    primaryButton: {
      marginTop: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: colors.card,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      gap: spacing.sm,
    },
    primaryButtonIcon: {
      fontSize: 22,
    },
    primaryButtonTextContainer: {
      flex: 1,
      gap: 2,
    },
    primaryButtonTitle: {
      ...typography.body1,
      fontWeight: '600',
      color: colors.text,
    },
    primaryButtonSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    primaryButtonArrow: {
      fontSize: 22,
      color: colors.textSecondary,
    },
    privacyBox: {
      marginTop: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      padding: spacing.sm,
      borderRadius: borderRadius.sm,
      backgroundColor: 'rgba(255,255,255,0.6)',
    },
    privacyIcon: {
      fontSize: 20,
    },
    privacyText: {
      ...typography.caption,
      color: colors.textSecondary,
      flex: 1,
    },
  });

const defaultStyles = createStyles();
