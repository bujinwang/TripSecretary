// @ts-nocheck

// TDAC Entry Pack Preview - InfoAlert Component
// Shows important notices, warnings, or time-sensitive information

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from '../../i18n/LocaleContext';
import { previewTheme } from '../../theme/preview-tokens';
import {
  ANIMATION_EASING,
  ReduceMotionManager,
} from '../../utils/animations/previewAnimations';
import { PreviewHaptics } from '../../utils/haptics';

/**
 * InfoAlert Component
 *
 * Displays important notices with proper color theming and optional dismissal.
 * Use sparingly to avoid alert fatigue.
 *
 * @param {Object} props
 * @param {'info' | 'warning' | 'error' | 'success'} props.variant - Alert variant (default: 'info')
 * @param {string} props.title - Alert title (optional)
 * @param {string} props.message - Alert message
 * @param {boolean} props.dismissible - Whether alert can be dismissed (default: false)
 * @param {Function} props.onDismiss - Callback when dismissed
 * @param {Function} props.onActionPress - Action link callback (optional)
 * @param {string} props.actionLabel - Action link label (optional)
 * @param {React.ReactNode} props.children - Custom content (overrides message)
 * @param {Object} props.style - Additional styles
 *
 * @example
 * <InfoAlert
 *   variant="warning"
 *   title="Submission Deadline"
 *   message="2 days remaining to submit"
 *   dismissible={true}
 *   onDismiss={() => console.log('Dismissed')}
 * />
 */
const InfoAlert = ({
  variant = 'info',
  title,
  message,
  dismissible = false,
  onDismiss,
  onActionPress,
  actionLabel,
  children,
  style,
}) => {
  const { t } = useTranslation();
  const [isDismissed, setIsDismissed] = useState(false);

  // Animation values
  const slideY = useSharedValue(-50);
  const opacity = useSharedValue(0);
  const shakeX = useSharedValue(0);

  // Variant configuration
  const variantConfig = {
    info: {
      icon: 'info',
      bgColor: previewTheme.colors.statusInfoLight,
      borderColor: previewTheme.colors.statusInfo,
      textColor: previewTheme.colors.statusInfo,
      iconColor: previewTheme.colors.statusInfo,
    },
    warning: {
      icon: 'alert-triangle',
      bgColor: previewTheme.colors.statusIncompleteLight,
      borderColor: previewTheme.colors.statusIncomplete,
      textColor: previewTheme.colors.neutral900,
      iconColor: previewTheme.colors.statusIncomplete,
    },
    error: {
      icon: 'x-circle',
      bgColor: previewTheme.colors.statusErrorLight,
      borderColor: previewTheme.colors.statusError,
      textColor: previewTheme.colors.statusError,
      iconColor: previewTheme.colors.statusError,
    },
    success: {
      icon: 'check-circle',
      bgColor: previewTheme.colors.statusCompleteLight,
      borderColor: previewTheme.colors.statusComplete,
      textColor: previewTheme.colors.statusComplete,
      iconColor: previewTheme.colors.statusComplete,
    },
  };

  const config = variantConfig[variant];

  // Entrance animation on mount
  useEffect(() => {
    const isReduceMotion = ReduceMotionManager.isReduceMotionEnabled;

    if (isReduceMotion) {
      // Reduce motion: fade only, faster
      slideY.value = 0;
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      // Normal: slide down + fade in
      slideY.value = withTiming(0, {
        duration: 350,
        easing: ANIMATION_EASING.EASE_OUT_QUINT,
      });
      opacity.value = withTiming(1, { duration: 350 });

      // Shake on error variant
      if (variant === 'error') {
        // Wait for entrance, then shake
        setTimeout(() => {
          shakeX.value = withSequence(
            withTiming(-10, { duration: 80 }),
            withTiming(10, { duration: 80 }),
            withTiming(-5, { duration: 80 }),
            withTiming(5, { duration: 80 }),
            withTiming(0, { duration: 80 })
          );
          PreviewHaptics.error();
        }, 350);
      }
    }
  }, [variant]);

  const handleDismiss = () => {
    PreviewHaptics.buttonPress();

    const isReduceMotion = ReduceMotionManager.isReduceMotionEnabled;

    if (isReduceMotion) {
      // Instant dismiss
      setIsDismissed(true);
      if (onDismiss) {
        onDismiss();
      }
    } else {
      // Animate out: slide up + fade out
      slideY.value = withTiming(-30, {
        duration: 200,
        easing: ANIMATION_EASING.EASE_IN_QUAD,
      });
      opacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) {
          runOnJS(setIsDismissed)(true);
          if (onDismiss) {
            runOnJS(onDismiss)();
          }
        }
      });
    }
  };

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: slideY.value },
      { translateX: shakeX.value },
    ],
    opacity: opacity.value,
  }));

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        },
        animatedContainerStyle,
        style,
      ]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={
        title
          ? `${variant} alert: ${title}`
          : `${variant} alert`
      }
    >
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Feather
          name={config.icon}
          size={previewTheme.iconSizes.medium}
          color={config.iconColor}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        {title && (
          <Text
            style={[styles.title, { color: config.textColor }]}
            accessibilityRole="header"
          >
            {title}
          </Text>
        )}

        {/* Message or custom children */}
        {children ? (
          children
        ) : (
          message && (
            <Text style={[styles.message, { color: config.textColor }]}>
              {message}
            </Text>
          )
        )}

        {/* Action link */}
        {onActionPress && actionLabel && (
          <TouchableOpacity
            style={styles.actionLink}
            onPress={onActionPress}
            accessible={true}
            accessibilityRole="link"
            accessibilityLabel={actionLabel}
          >
            <Text style={[styles.actionLinkText, { color: config.iconColor }]}>
              {actionLabel}
            </Text>
            <Feather
              name="arrow-right"
              size={previewTheme.iconSizes.small}
              color={config.iconColor}
              style={styles.actionLinkIcon}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Dismiss button */}
      {dismissible && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('common.dismiss', { defaultValue: 'Dismiss' })}
        >
          <Feather
            name="x"
            size={previewTheme.iconSizes.medium}
            color={config.iconColor}
          />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: previewTheme.borderRadius.medium,
    borderWidth: 1,
    padding: previewTheme.spacing.sm,
    paddingHorizontal: previewTheme.spacing.md,
  },
  iconContainer: {
    marginRight: previewTheme.spacing.sm,
    paddingTop: 2, // Align with text
  },
  content: {
    flex: 1,
  },
  title: {
    ...previewTheme.typography.bodyBold,
    marginBottom: previewTheme.spacing.xs,
  },
  message: {
    ...previewTheme.typography.body,
    lineHeight: previewTheme.typography.body.lineHeight,
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: previewTheme.spacing.sm,
  },
  actionLinkText: {
    ...previewTheme.typography.bodyBold,
    textDecorationLine: 'underline',
  },
  actionLinkIcon: {
    marginLeft: previewTheme.spacing.xs,
  },
  dismissButton: {
    marginLeft: previewTheme.spacing.sm,
    padding: previewTheme.spacing.xs,
  },
});

export default InfoAlert;
