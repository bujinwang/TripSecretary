/**
 * EmptyStateView Component - Welcome screen for new users
 * Displays when user has no entry data yet
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { designTokens, spacing, borderRadius, typography } from '../../theme/designTokens';
import { animateValue, createAnimationValue, ANIMATION_DURATION, EASING } from '../../utils/animations';
import ActionButton from './ActionButton';

const EmptyStateView = ({ onStartPreparation }: { onStartPreparation: () => void }) => {
  // Animation refs
  const fadeAnim = useRef(createAnimationValue(0)).current;
  const scaleAnim = useRef(createAnimationValue(0.8)).current;
  const slideAnim = useRef(createAnimationValue(30)).current;

  // Animate in on mount
  useEffect(() => {
    animateValue(fadeAnim, { to: 1, duration: ANIMATION_DURATION.normal });
    animateValue(scaleAnim, { to: 1, duration: ANIMATION_DURATION.normal, easing: EASING.bounce });
    animateValue(slideAnim, { to: 0, duration: ANIMATION_DURATION.normal, easing: EASING.bounce });
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ],
        },
      ]}
    >
      {/* Main Icon */}
      <Animated.Text
        style={[
          styles.mainIcon,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        📝
      </Animated.Text>

      {/* Title */}
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        准备开始泰国之旅吧！🌴
      </Animated.Text>

      {/* Description */}
      <Animated.Text
        style={[
          styles.description,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        你还没有填写泰国入境信息，别担心，我们会一步步帮你准备好所有需要的资料，让你轻松入境泰国！
      </Animated.Text>

      {/* Information Hints */}
      <Animated.View
        style={[
          styles.hintsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.hintsTitle}>
          泰国入境需要准备这些信息 🌺
        </Text>
        <View style={styles.hintsList}>
          <Text style={styles.hint}>• 📘 护照信息 - 让泰国认识你</Text>
          <Text style={styles.hint}>• 📞 联系方式 - 泰国怎么找到你</Text>
          <Text style={styles.hint}>• 💰 资金证明 - 证明你能好好玩</Text>
          <Text style={styles.hint}>• ✈️ 航班和住宿 - 你的旅行计划</Text>
        </View>
      </Animated.View>

      {/* Call-to-Action Button */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <ActionButton
          title="开始我的泰国准备之旅！🇹🇭"
          onPress={onStartPreparation}
          variant="primary"
          size="large"
          gradient={true}
          style={styles.ctaButton as Record<string, unknown>}
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  mainIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: designTokens.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '600' as const,
  },
  description: {
    ...typography.body1,
    color: designTokens.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: spacing.lg,
    fontWeight: '400' as const,
  },
  hintsContainer: {
    backgroundColor: designTokens.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    width: '100%',
  },
  hintsTitle: {
    ...typography.body1,
    color: designTokens.primary,
    fontWeight: '600' as const,
    marginBottom: spacing.sm,
  },
  hintsList: {
    gap: spacing.xs,
  },
  hint: {
    ...typography.body2,
    color: designTokens.primary,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  ctaButton: {
    minWidth: 200,
  },
});

export default EmptyStateView;