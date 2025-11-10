// @ts-nocheck

/**
 * ProgressView Component - Main progress tracking interface
 * Shows completion status, category cards, countdown, and actions
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { designTokens, spacing, borderRadius, shadows, typography } from '../../theme/designTokens';
import { animateValue, createAnimationValue, ANIMATIONS } from '../../utils/animations';
import ProgressRing from './ProgressRing';
import StatusCard from './StatusCard';
import ActionButton from './ActionButton';
import SubmissionCountdown from '../SubmissionCountdown';

const ProgressView = ({
  completionPercent,
  categories,
  arrivalDate,
  primaryActionState,
  onCategoryPress,
  onPrimaryAction,
  onPreviewEntryCard,
  onEditInformation,
  language,
}) => {
  // Animation refs
  const fadeAnim = useRef(createAnimationValue(0)).current;
  const slideAnim = useRef(createAnimationValue(20)).current;

  // Animate in on mount
  useEffect(() => {
    animateValue(fadeAnim, { to: 1, duration: ANIMATIONS.duration.normal });
    animateValue(slideAnim, { to: 0, duration: ANIMATIONS.duration.normal, easing: ANIMATIONS.easing.bounce });
  }, []);

  // Get progress message based on completion
  const getProgressMessage = () => {
    if (completionPercent === 100) {
      return '泰国准备就绪！🌴';
    } else if (completionPercent >= 50) {
      return '进展不错！💪';
    } else {
      return '让我们开始吧！🌺';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Progress Section */}
      <View style={styles.progressSection}>
        <ProgressRing
          progress={completionPercent}
          size={120}
          color={designTokens.primary}
          animated={true}
        />
        <Text style={styles.progressMessage}>
          {getProgressMessage()}
        </Text>
      </View>

      {/* Category Grid */}
      <View style={styles.categoryGrid}>
        {categories.map((category, index) => (
          <Animated.View
            key={category.id}
            style={{
              opacity: fadeAnim,
              transform: [{
                translateY: Animated.add(slideAnim, index * 10)
              }],
            }}
          >
            <StatusCard
              title={category.name}
              icon={category.icon}
              status={category.status}
              progress={Math.round((category.completedCount / category.totalCount) * 100)}
              onPress={() => onCategoryPress(category)}
            />
          </Animated.View>
        ))}
      </View>

      {/* Countdown Card - Only show if arrival date is set */}
      {arrivalDate && (
        <Animated.View
          style={[
            styles.countdownCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SubmissionCountdown
            arrivalDate={arrivalDate}
            locale={language === 'zh' ? 'zh' : 'en'}
            showIcon={true}
            updateInterval={1000}
            variant="default"
          />
        </Animated.View>
      )}

      {/* Action Section */}
      <Animated.View
        style={[
          styles.actionSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ActionButton
          title={primaryActionState.title}
          variant={primaryActionState.variant}
          size="large"
          disabled={primaryActionState.disabled}
          onPress={onPrimaryAction}
          gradient={primaryActionState.variant === 'primary'}
        />

        {/* Secondary actions for certain states */}
        {completionPercent >= 60 && (
          <View style={styles.secondaryActions}>
            <ActionButton
              title="预览入境包 👁️"
              variant="secondary"
              size="medium"
              onPress={onPreviewEntryCard}
            />
            <ActionButton
              title="编辑信息 ✏️"
              variant="secondary"
              size="medium"
              onPress={onEditInformation}
            />
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  progressMessage: {
    ...typography.h3,
    fontWeight: '600',
    color: designTokens.text,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  categoryGrid: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  countdownCard: {
    marginBottom: spacing.lg,
    backgroundColor: designTokens.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: designTokens.border,
    ...shadows.small,
  },
  actionSection: {
    gap: spacing.md,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});

export default ProgressView;