import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * HeroSection Component
 * Enhanced header section with progress tracking and US-specific messaging
 *
 * @param {Object} props
 * @param {Function} props.t - Translation function
 * @param {number} props.completionPercent - Overall completion percentage (0-100)
 * @param {string} props.progressText - Progress description text
 * @param {string} props.progressColor - Color for progress bar
 * @param {Function} props.onViewEntryGuide - Handler for viewing entry guide
 * @param {Object} props.styles - Style object
 */
const HeroSection = ({
  t,
  completionPercent,
  progressText,
  progressColor,
  onViewEntryGuide,
  styles,
}) => {
  return (
    <>
      {/* Enhanced Hero Section */}
      <LinearGradient
        colors={['#1e40af', '#1e3a8a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroSection}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroFlag}>🇺🇸</Text>
          <View style={styles.heroHeading}>
            <Text style={styles.heroTitle}>
              {t('us.travelInfo.hero.title', { defaultValue: '美国入境准备指南' })}
            </Text>
            <Text style={styles.heroSubtitle}>
              {t('us.travelInfo.hero.subtitle', { defaultValue: '准备好资料，轻松入境美国' })}
            </Text>
          </View>

          {/* Value Proposition */}
          <View style={styles.valueProposition}>
            <View style={styles.valueItem}>
              <Text style={styles.valueIcon}>⏱️</Text>
              <Text style={styles.valueText}>
                {t('us.travelInfo.hero.time', { defaultValue: '5分钟完成' })}
              </Text>
            </View>
            <View style={styles.valueItem}>
              <Text style={styles.valueIcon}>🔒</Text>
              <Text style={styles.valueText}>
                {t('us.travelInfo.hero.privacy', { defaultValue: '本地存储' })}
              </Text>
            </View>
            <View style={styles.valueItem}>
              <Text style={styles.valueIcon}>✈️</Text>
              <Text style={styles.valueText}>
                {t('us.travelInfo.hero.ready', { defaultValue: '随时可用' })}
              </Text>
            </View>
          </View>

          {/* Beginner Tip */}
          <View style={styles.beginnerTip}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              {t('us.travelInfo.hero.tip', {
                defaultValue: '整理好入境资料，在飞机上填写海关申报表时会用到！'
              })}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Progress Overview Card */}
      <View style={styles.progressOverviewCard}>
        <Text style={styles.progressTitle}>
          {t('us.travelInfo.progress.title', { defaultValue: '准备进度' })}
        </Text>
        <View style={styles.progressSteps}>
          <View style={[styles.progressStep, completionPercent >= 25 && styles.progressStepActive]}>
            <Text style={styles.stepIcon}>📘</Text>
            <Text style={[styles.stepText, completionPercent >= 25 && styles.stepTextActive]}>
              {t('us.travelInfo.progress.passport', { defaultValue: '护照信息' })} {completionPercent >= 25 ? '✓' : ''}
            </Text>
          </View>
          <View style={[styles.progressStep, completionPercent >= 50 && styles.progressStepActive]}>
            <Text style={styles.stepIcon}>✈️</Text>
            <Text style={[styles.stepText, completionPercent >= 50 && styles.stepTextActive]}>
              {t('us.travelInfo.progress.travel', { defaultValue: '行程信息' })} {completionPercent >= 50 ? '✓' : ''}
            </Text>
          </View>
          <View style={[styles.progressStep, completionPercent >= 75 && styles.progressStepActive]}>
            <Text style={styles.stepIcon}>👤</Text>
            <Text style={[styles.stepText, completionPercent >= 75 && styles.progressStepActive]}>
              {t('us.travelInfo.progress.personal', { defaultValue: '个人信息' })} {completionPercent >= 75 ? '✓' : ''}
            </Text>
          </View>
          <View style={[styles.progressStep, completionPercent >= 100 && styles.progressStepActive]}>
            <Text style={styles.stepIcon}>💰</Text>
            <Text style={[styles.stepText, completionPercent >= 100 && styles.stepTextActive]}>
              {t('us.travelInfo.progress.funds', { defaultValue: '资金证明' })} {completionPercent >= 100 ? '✓' : ''}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarEnhanced}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${completionPercent}%`,
                  backgroundColor: progressColor
                }
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: progressColor }]}>
            {progressText}
          </Text>
        </View>
      </View>

      {/* Primary Action Button */}
      {onViewEntryGuide && (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onViewEntryGuide}
          activeOpacity={0.85}
        >
          <View style={styles.primaryButtonContent}>
            <Text style={styles.primaryButtonIcon}>🧳</Text>
            <View style={styles.primaryButtonTextContainer}>
              <Text style={styles.primaryButtonTitle}>
                {t('us.travelInfo.hero.viewGuide', { defaultValue: '查看准备状态' })}
              </Text>
              <Text style={styles.primaryButtonSubtitle}>
                {completionPercent >= 100
                  ? t('us.travelInfo.hero.viewGuideComplete', { defaultValue: '已完成，查看入境指南' })
                  : t('us.travelInfo.hero.viewGuideIncomplete', { defaultValue: '查看详情和入境指南' })
                }
              </Text>
            </View>
            <Text style={styles.primaryButtonArrow}>›</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Privacy Notice */}
      <View style={styles.privacyBox}>
        <Text style={styles.privacyIcon}>💾</Text>
        <Text style={styles.privacyText}>
          {t('us.travelInfo.privacy', {
            defaultValue: '所有信息仅保存在您的手机本地'
          })}
        </Text>
      </View>
    </>
  );
};

export default HeroSection;
