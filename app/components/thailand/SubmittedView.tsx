/**
 * SubmittedView Component - Post-submission success interface
 * Shows when TDAC has been successfully submitted
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { designTokens, spacing, borderRadius, shadows, typography } from '../../theme/designTokens';
import { animateValue, createAnimationValue, ANIMATIONS } from '../../utils/animations';
import ActionButton from './ActionButton';

const SubmittedView = ({
  latestTdacData,
  onViewEntryPack,
  onStartImmigration,
  onEditInformation,
}) => {
  // Animation refs
  const fadeAnim = useRef(createAnimationValue(0)).current;
  const slideAnim = useRef(createAnimationValue(40)).current;
  const scaleAnim = useRef(createAnimationValue(0.8)).current;

  // Animate in on mount
  useEffect(() => {
    animateValue(fadeAnim, { to: 1, duration: ANIMATIONS.duration.normal });
    animateValue(slideAnim, { to: 0, duration: ANIMATIONS.duration.normal, easing: ANIMATIONS.easing.bounce });
    animateValue(scaleAnim, { to: 1, duration: ANIMATIONS.duration.slow, easing: ANIMATIONS.easing.elastic });
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
        },
      ]}
    >
      {/* Success Celebration Header */}
      <View style={styles.celebrationHeader}>
        <Text style={styles.celebrationIcon}>🎉</Text>
        <Text style={styles.celebrationTitle}>
          入境卡已成功提交！
        </Text>
        <Text style={styles.celebrationSubtitle}>
          你的泰国入境准备已经完成，可以查看完整的入境信息
        </Text>
      </View>

      {/* QR Code Display */}
      {latestTdacData?.qrUri && (
        <View style={styles.qrSection}>
          <Text style={styles.qrLabel}>入境卡二维码</Text>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrPlaceholderText}>QR Code</Text>
            <Text style={styles.arrivalCardNumber}>
              {latestTdacData.arrCardNo || 'Arrival Card #'}
            </Text>
          </View>
        </View>
      )}

      {/* Primary Actions */}
      <View style={styles.primaryActions}>
        {/* Start Immigration Process */}
        <TouchableOpacity style={styles.immigrationButton} activeOpacity={0.8}>
          <LinearGradient
            colors={[designTokens.primary, designTokens.primaryDark]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.immigrationGradient}
          >
            <View style={styles.immigrationContent}>
              <Text style={styles.immigrationIcon}>🛂</Text>
              <View style={styles.immigrationText}>
                <Text style={styles.immigrationTitle}>开始入境流程</Text>
                <Text style={styles.immigrationSubtitle}>
                  查看完整的入境指引和注意事项
                </Text>
              </View>
              <Text style={styles.immigrationArrow}>›</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* View Entry Pack */}
        <TouchableOpacity style={styles.entryPackButton} activeOpacity={0.8}>
          <View style={styles.entryPackContent}>
            <View style={styles.entryPackIcon}>
              <Text style={styles.entryPackIconText}>📋</Text>
            </View>
            <View style={styles.entryPackText}>
              <Text style={styles.entryPackTitle}>查看我的入境包</Text>
              <Text style={styles.entryPackSubtitle}>重新查看所有准备资料</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Secondary Actions */}
      <View style={styles.secondaryActions}>
        <ActionButton
          title="编辑旅行信息 ✏️"
          variant="secondary"
          size="medium"
          onPress={onEditInformation}
        />
        <ActionButton
          title="寻求帮助 👥"
          variant="secondary"
          size="medium"
          onPress={() => {
            // Show help dialog
            console.log('Help requested');
          }}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  celebrationHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  celebrationIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  celebrationTitle: {
    ...typography.h2,
    fontWeight: '700',
    color: designTokens.success,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  celebrationSubtitle: {
    ...typography.body1,
    color: designTokens.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  qrLabel: {
    ...typography.body2,
    color: designTokens.textSecondary,
    marginBottom: spacing.sm,
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: designTokens.surface,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: designTokens.border,
    ...shadows.small,
  },
  qrPlaceholderText: {
    ...typography.h3,
    color: designTokens.textSecondary,
    fontWeight: '600',
  },
  arrivalCardNumber: {
    ...typography.caption,
    color: designTokens.primary,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  primaryActions: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  immigrationButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  immigrationGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  immigrationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  immigrationIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  immigrationText: {
    flex: 1,
  },
  immigrationTitle: {
    ...typography.h3,
    fontWeight: '700',
    color: designTokens.background,
    marginBottom: spacing.xs / 2,
  },
  immigrationSubtitle: {
    ...typography.body2,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  immigrationArrow: {
    ...typography.h2,
    color: designTokens.background,
    fontWeight: '700',
    fontSize: 24,
  },
  entryPackButton: {
    backgroundColor: designTokens.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(11, 214, 123, 0.3)',
    ...shadows.medium,
  },
  entryPackContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryPackIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: designTokens.readyState,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  entryPackIconText: {
    fontSize: 24,
  },
  entryPackText: {
    flex: 1,
  },
  entryPackTitle: {
    ...typography.body1,
    fontWeight: '700',
    color: designTokens.text,
    marginBottom: spacing.xs / 2,
  },
  entryPackSubtitle: {
    ...typography.caption,
    color: designTokens.textSecondary,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});

export default SubmittedView;