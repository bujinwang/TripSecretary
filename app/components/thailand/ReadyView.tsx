/**
 * ReadyView Component - Pre-submission confirmation interface
 * Shows when user is 100% ready to submit TDAC
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { designTokens, spacing, borderRadius, shadows, typography } from '../../theme/designTokens';
import { animateValue, createAnimationValue, ANIMATION_DURATION, EASING } from '../../utils/animations';
import ProgressRing from './ProgressRing';
import ActionButton from './ActionButton';
import SubmissionCountdown from '../SubmissionCountdown';

interface ReadyViewProps {
  arrivalDate?: string;
  primaryActionState: { title: string; variant: string; disabled: boolean };
  onPrimaryAction?: () => void;
  onPreviewGuide?: () => void;
  onPreviewEntryCard?: () => void;
  onEditInformation?: () => void;
  language?: string;
}

const ReadyView = ({
  arrivalDate,
  primaryActionState,
  onPrimaryAction,
  onPreviewGuide,
  onPreviewEntryCard,
  onEditInformation,
  language,
}: ReadyViewProps) => {
  // Animation refs
  const fadeAnim = useRef(createAnimationValue(0)).current;
  const slideAnim = useRef(createAnimationValue(30)).current;
  const scaleAnim = useRef(createAnimationValue(0.9)).current;

  // Animate in on mount
  useEffect(() => {
    animateValue(fadeAnim, { to: 1, duration: ANIMATION_DURATION.normal });
    animateValue(slideAnim, { to: 0, duration: ANIMATION_DURATION.normal, easing: EASING.bounce });
    animateValue(scaleAnim, { to: 1, duration: ANIMATION_DURATION.slow, easing: EASING.elastic });
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
      {/* Success Header */}
      <View style={styles.successHeader}>
        <ProgressRing
          progress={100}
          size={120}
          color={designTokens.success}
          animated={true}
          style={{}}
          children={undefined}
        />
        <Text style={styles.successTitle}>
          泰国准备就绪！🌴
        </Text>
        <Text style={styles.successSubtitle}>
          所有信息都已完善，可以提交入境卡了
        </Text>
      </View>

      {/* Countdown Section */}
      {arrivalDate && (
        <Animated.View
          style={[
            styles.countdownSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SubmissionCountdown
            arrivalDate={arrivalDate as string}
            locale={language === 'zh' ? 'zh' : 'en'}
            showIcon={true}
            updateInterval={1000}
            variant="default"
          />
        </Animated.View>
      )}

      {/* Primary Action */}
      <Animated.View
        style={[
          styles.primaryActionSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ActionButton
          title={primaryActionState.title}
          variant={primaryActionState.variant as 'primary' | 'secondary' | 'success' | 'warning'}
          size="large"
          disabled={primaryActionState.disabled}
          onPress={onPrimaryAction}
          gradient={true}
        />
      </Animated.View>

      {/* Secondary Actions Grid */}
      <View style={styles.secondaryActionsGrid}>
        {[0, 1, 2, 3].map((index) => {
          const actions = [
            { title: "预览入境指引 👁️", onPress: onPreviewGuide },
            { title: "查看入境包 📋", onPress: onPreviewEntryCard },
            { title: "编辑信息 ✏️", onPress: onEditInformation },
            { title: "寻求帮助 👥", onPress: () => console.log('Help requested') },
          ];

          return (
            <Animated.View
              key={index}
              style={{
                opacity: fadeAnim,
                transform: [
                  { translateY: Animated.add(slideAnim, index * 10) },
                  { scale: scaleAnim }
                ],
              }}
            >
              <ActionButton
                title={actions[index].title}
                variant="secondary"
                size="medium"
                onPress={actions[index].onPress}
              />
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  successHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  successTitle: {
    ...typography.h2,
    fontWeight: '700',
    color: designTokens.success,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  successSubtitle: {
    ...typography.body1,
    color: designTokens.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  countdownSection: {
    marginBottom: spacing.lg,
    backgroundColor: designTokens.warning,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: designTokens.warning,
    ...shadows.medium,
  },
  primaryActionSection: {
    marginBottom: spacing.lg,
  },
  secondaryActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});

export default ReadyView;