/**
 * PreparedState Component
 *
 * Displays the prepared state view for Thailand Entry Flow Screen.
 * Shows completion summary, countdown, and action buttons.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CompletionSummaryCard from '../CompletionSummaryCard';
import SubmissionCountdown from '../SubmissionCountdown';
import Button from '../Button';
import { colors, typography, spacing, shadows } from '../../theme';

/**
 * PreparedState component displays entry preparation status and action buttons
 *
 * @param {Object} props - Component props
 * @param {number} props.completionPercent - Overall completion percentage (0-100)
 * @param {string} props.completionStatus - Status: 'ready', 'mostly_complete', 'needs_improvement'
 * @param {string} props.arrivalDate - Arrival date in ISO format
 * @param {Function} props.t - Translation function
 * @param {Object} props.passportParam - Passport parameters for navigation
 * @param {Object} props.destination - Destination parameters
 * @param {Object} props.userData - User data for preview
 * @param {Function} props.handleEditInformation - Handler for edit information action
 * @param {Function} props.handlePreviewEntryCard - Handler for preview entry card action
 * @param {Function} props.navigation - Navigation object
 * @param {Function} props.renderPrimaryAction - Function to render primary action button
 */
const PreparedState = ({
  completionPercent,
  completionStatus,
  arrivalDate,
  t,
  passportParam,
  destination,
  userData,
  handleEditInformation,
  handlePreviewEntryCard,
  navigation,
  renderPrimaryAction,
}) => {
  return (
    <View>
      {/* Status Cards Section */}
      <View style={styles.statusSection}>
        <CompletionSummaryCard
          completionPercent={completionPercent}
          status={completionStatus}
          showProgressBar={true}
        />

        {/* Quick Action Buttons - Vertical Layout for Better Hierarchy */}
        {completionPercent >= 80 && (
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleEditInformation}
              activeOpacity={0.7}
            >
              <View style={styles.quickActionIconWrapper}>
                <Text style={styles.quickActionIcon}>✏️</Text>
              </View>
              <View style={styles.quickActionContent}>
                <Text style={styles.quickActionTitle}>再改改</Text>
                <Text style={styles.quickActionSubtitle}>调整和完善信息</Text>
              </View>
              <Text style={styles.quickActionArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => {
                // Show sharing options
                Alert.alert(
                  '寻求帮助',
                  '您可以截图分享给亲友，让他们帮您检查信息是否正确。',
                  [
                    {
                      text: '截图分享',
                      onPress: () => {
                        // Here you could implement screenshot functionality
                        Alert.alert('提示', '请使用手机截图功能分享给亲友查看');
                      }
                    },
                    { text: '取消', style: 'cancel' }
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <View style={styles.quickActionIconWrapper}>
                <Text style={styles.quickActionIcon}>👥</Text>
              </View>
              <View style={styles.quickActionContent}>
                <Text style={styles.quickActionTitle}>找亲友帮忙修改</Text>
                <Text style={styles.quickActionSubtitle}>分享给亲友帮忙修改</Text>
              </View>
              <Text style={styles.quickActionArrow}>›</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Integrated Countdown & Submission Section */}
      <View style={styles.countdownSection}>
        <Text style={styles.sectionTitle}>
          最佳提交时间 ⏰
        </Text>

        {/* Submission Countdown */}
        <SubmissionCountdown
          arrivalDate={arrivalDate}
          locale={t('locale', { defaultValue: 'zh' })}
          showIcon={true}
          updateInterval={1000} // Update every second for real-time countdown
        />

        {/* Smart Primary Action Button - Integrated with Countdown */}
        <View style={styles.primaryActionContainer}>
          {renderPrimaryAction()}
        </View>
      </View>

      {/* Secondary Actions Section - Vertically Stacked */}
      <View style={styles.actionSection}>
        {/* Entry Guide Button */}
        <TouchableOpacity
          style={styles.entryGuideButton}
          onPress={() => navigation.navigate('ThailandEntryGuide', {
            passport: passportParam,
            destination: destination,
            completionData: userData
          })}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#0BD67B', colors.primary]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.entryGuideGradient}
          >
            <View style={styles.entryGuideIconContainer}>
              <Text style={styles.entryGuideIcon}>🗺️</Text>
            </View>
            <View style={styles.entryGuideContent}>
              <Text style={styles.entryGuideTitle}>
                查看泰国入境指引
              </Text>
              <Text style={styles.entryGuideSubtitle}>
                6步骤完整入境流程指南
              </Text>
            </View>
            <View style={styles.entryGuideChevron}>
              <Text style={styles.entryGuideArrow}>›</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Preview Entry Pack Button */}
        {completionPercent > 50 && (
          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={handlePreviewEntryCard}
            activeOpacity={0.8}
          >
            <View style={styles.secondaryActionIconContainer}>
              <Text style={styles.secondaryActionIcon}>👁️</Text>
            </View>
            <View style={styles.secondaryActionContent}>
              <Text style={styles.secondaryActionTitle}>
                看看我的通关包
              </Text>
              <Text style={styles.secondaryActionSubtitle}>
                {t('progressiveEntryFlow.entryPack.quickPeek', { defaultValue: '快速查看旅途资料' })}
              </Text>
            </View>
            <Text style={styles.secondaryActionArrow}>›</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Status Section Styles
  statusSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: spacing.md,
    letterSpacing: 0.2,
  },

  // Integrated Countdown & Submission Section Styles
  countdownSection: {
    marginBottom: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    ...shadows.card,
  },

  // Action Section Styles - Vertically stacked with better spacing
  actionSection: {
    gap: spacing.md,
  },
  primaryActionContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
    ...shadows.card,
  },
  secondaryActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  secondaryActionIcon: {
    fontSize: 24,
  },
  secondaryActionContent: {
    flex: 1,
  },
  secondaryActionTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.1,
  },
  secondaryActionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },
  secondaryActionArrow: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 20,
    marginLeft: spacing.xs,
  },

  // Entry Guide Button Styles - Premium gradient button
  entryGuideButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.button,
  },
  entryGuideGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 20,
  },
  entryGuideIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  entryGuideContent: {
    flex: 1,
  },
  entryGuideTitle: {
    ...typography.body1,
    color: colors.white,
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.2,
  },
  entryGuideSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.90)',
    marginTop: 4,
    fontSize: 13,
  },
  entryGuideIcon: {
    fontSize: 26,
  },
  entryGuideChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  entryGuideArrow: {
    ...typography.body1,
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },

  // Quick Action Buttons - Vertical layout with enhanced hierarchy
  quickActionsContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  quickActionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  quickActionIcon: {
    fontSize: 24,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    ...typography.body1,
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 13,
  },
  quickActionArrow: {
    ...typography.body1,
    color: colors.primary,
    fontSize: 22,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});

export default PreparedState;
