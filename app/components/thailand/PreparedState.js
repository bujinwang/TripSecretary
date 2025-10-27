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
import { colors, typography, spacing } from '../../theme';

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

        {/* Additional Action Buttons - Show when completion is high */}
        {completionPercent >= 80 && (
          <View style={styles.additionalActionsContainer}>
            <TouchableOpacity
              style={styles.additionalActionButton}
              onPress={handleEditInformation}
            >
              <Text style={styles.additionalActionIcon}>✏️</Text>
              <Text style={styles.additionalActionText}>再改改</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.additionalActionButton}
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
            >
              <Text style={styles.additionalActionIcon}>👥</Text>
              <Text style={styles.additionalActionText}>找亲友帮忙修改</Text>
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

      {/* Secondary Actions Section */}
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

        {/* Secondary Actions - Redesigned */}
        {completionPercent > 50 && (
          <View style={styles.secondaryActionsContainer}>
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
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Status Section Styles
  statusSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },

  // Integrated Countdown & Submission Section Styles
  countdownSection: {
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Action Section Styles (now only for secondary actions)
  actionSection: {
    marginBottom: spacing.lg,
  },
  primaryActionContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secondaryActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  secondaryActionButton: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(7, 193, 96, 0.15)',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  secondaryActionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontWeight: '600',
  },
  secondaryActionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  secondaryActionArrow: {
    ...typography.body2,
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 18,
    marginLeft: spacing.sm,
  },

  // Entry Guide Button Styles
  entryGuideButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  entryGuideGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  entryGuideIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
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
    fontSize: 16,
  },
  entryGuideSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  entryGuideIcon: {
    fontSize: 24,
  },
  entryGuideChevron: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  entryGuideArrow: {
    ...typography.body1,
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },

  // Additional action buttons styles
  additionalActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  additionalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  additionalActionIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  additionalActionText: {
    ...typography.body2,
    color: colors.text,
    fontWeight: '500',
    fontSize: 13,
  },
});

export default PreparedState;
