/**
 * PreparedState Component
 *
 * Displays the main entry flow UI when user has started filling in Thailand entry data.
 * Shows completion status, countdown, and various action buttons.
 *
 * Extracted from ThailandEntryFlowScreen for better maintainability.
 */

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CompletionSummaryCard from '../CompletionSummaryCard';
import SubmissionCountdown from '../SubmissionCountdown';

/**
 * @param {Object} props
 * @param {Object} props.styles - Style object from parent screen
 * @param {Object} props.colors - Theme colors object
 * @param {number} props.completionPercent - Completion percentage (0-100)
 * @param {string} props.completionStatus - Status string ('ready', 'mostly_complete', etc.)
 * @param {string|null} props.arrivalDate - User's arrival date (ISO string)
 * @param {Object} props.userData - User's entry data
 * @param {Object} props.passport - Passport data
 * @param {Object} props.destination - Destination data
 * @param {Function} props.t - Translation function
 * @param {Function} props.onEditInformation - Handler for edit button
 * @param {Function} props.onPreviewEntryCard - Handler for preview button
 * @param {Function} props.onNavigateToGuide - Handler for entry guide navigation
 * @param {Function} props.renderPrimaryAction - Function to render primary action button
 * @returns {JSX.Element}
 */
const PreparedState = ({
  styles,
  colors,
  completionPercent,
  completionStatus,
  arrivalDate,
  userData,
  passport,
  destination,
  t,
  onEditInformation,
  onPreviewEntryCard,
  onNavigateToGuide,
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
              onPress={onEditInformation}
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
          onPress={() => onNavigateToGuide({ passport, destination, completionData: userData })}
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
              onPress={onPreviewEntryCard}
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

export default PreparedState;
